import Dexie, { Table } from 'dexie'
import CryptoJS from 'crypto-js'

// Types
export interface Routine {
  id?: number
  name: string
  description?: string
  repeatPattern: 'daily' | 'weekly' | 'monthly'
  repeatDays?: number[] // for weekly: [0,1,2,3,4,5,6], for monthly: [1-31]
  deadline?: string // HH:MM format
  itemType: 'boolean' | 'number' | 'text' | 'photo'
  isActive: number // 0 = false, 1 = true (for IndexedDB compatibility)
  createdAt: Date
  updatedAt: Date
}

export interface RoutineInstance {
  id?: number
  routineId: number
  date: string // YYYY-MM-DD
  completed: boolean
  value?: string | number | boolean
  photos?: string[] // base64 encoded encrypted photos
  notes?: string
  completedAt?: Date
  createdAt: Date
}

export interface AppSettings {
  id?: number
  pinEnabled: boolean
  pinHash?: string
  biometricEnabled: boolean
  notificationsEnabled: boolean
  encryptionKey: string
  lastBackup?: Date
  version: string
}

// Database
class CheckKitDB extends Dexie {
  routines!: Table<Routine>
  routineInstances!: Table<RoutineInstance>
  settings!: Table<AppSettings>

  constructor() {
    super('CheckKitDB')
    
    this.version(1).stores({
      routines: '++id, name, repeatPattern, isActive, createdAt',
      routineInstances: '++id, routineId, date, completed, createdAt',
      settings: '++id, version'
    })
  }
}

export const db = new CheckKitDB()

// Encryption utilities
export class EncryptionService {
  static getKey(): string {
    // Get or generate encryption key
    if (typeof window === 'undefined') {
      return 'server-side-key'
    }
    
    let key = localStorage.getItem('checkkit_key')
    if (!key) {
      key = CryptoJS.lib.WordArray.random(256/8).toString()
      localStorage.setItem('checkkit_key', key)
    }
    return key
  }

  static encrypt(text: string): string {
    const key = this.getKey()
    return CryptoJS.AES.encrypt(text, key).toString()
  }

  static decrypt(cipherText: string): string {
    const key = this.getKey()
    const bytes = CryptoJS.AES.decrypt(cipherText, key)
    return bytes.toString(CryptoJS.enc.Utf8)
  }

  static encryptObject<T>(obj: T): string {
    return this.encrypt(JSON.stringify(obj))
  }

  static decryptObject<T>(cipherText: string): T {
    const decrypted = this.decrypt(cipherText)
    return JSON.parse(decrypted)
  }
}

// Database service
export class DatabaseService {
  // Routines
  static async createRoutine(routine: Omit<Routine, 'id' | 'createdAt' | 'updatedAt'>): Promise<number> {
    const now = new Date()
    
    // Check for duplicate routine created within last 2 seconds (StrictMode double-render protection)
    const recentRoutines = await db.routines
      .where('name').equals(routine.name)
      .and(r => r.isActive === 1)
      .toArray()
    
    const twoSecondsAgo = new Date(now.getTime() - 2000)
    const recentDuplicate = recentRoutines.find(r => 
      r.createdAt && new Date(r.createdAt) > twoSecondsAgo
    )
    
    if (recentDuplicate) {
      return recentDuplicate.id!
    }
    
    return db.routines.add({
      ...routine,
      createdAt: now,
      updatedAt: now
    })
  }

  static async getRoutines(): Promise<Routine[]> {
    return db.routines.where('isActive').equals(1).toArray()
  }

  static async updateRoutine(id: number, updates: Partial<Routine>): Promise<void> {
    await db.routines.update(id, {
      ...updates,
      updatedAt: new Date()
    })
  }

  static async deleteRoutine(id: number): Promise<void> {
    await db.routines.update(id, { isActive: 0, updatedAt: new Date() })
  }

  // Routine Instances
  static async generateDailyInstances(date: string): Promise<void> {
    const routines = await this.getRoutines()
    const existingInstances = await db.routineInstances.where('date').equals(date).toArray()
    
    for (const routine of routines) {
      // Check if instance already exists for this routine on this date
      const exists = existingInstances.some(i => i.routineId === routine.id)
      if (!exists && this.shouldCreateInstance(routine, date)) {
        // Double-check to prevent race conditions
        const recheck = await db.routineInstances
          .where('date').equals(date)
          .and(i => i.routineId === routine.id)
          .first()
        
        if (!recheck) {
          await db.routineInstances.add({
            routineId: routine.id!,
            date,
            completed: false,
            createdAt: new Date()
          })
        }
      }
    }
  }

  private static shouldCreateInstance(routine: Routine, date: string): boolean {
    const dateObj = new Date(date)
    const dayOfWeek = dateObj.getDay()
    const dayOfMonth = dateObj.getDate()

    switch (routine.repeatPattern) {
      case 'daily':
        return true
      case 'weekly':
        return routine.repeatDays?.includes(dayOfWeek) ?? false
      case 'monthly':
        return routine.repeatDays?.includes(dayOfMonth) ?? false
      default:
        return false
    }
  }

  static async getTodayInstances(): Promise<RoutineInstance[]> {
    const today = new Date().toISOString().split('T')[0]
    await this.generateDailyInstances(today)
    
    // Clean up any duplicates that might exist
    const instances = await db.routineInstances.where('date').equals(today).toArray()
    const seen = new Map<number, RoutineInstance>()
    const toDelete: number[] = []
    
    for (const instance of instances) {
      if (seen.has(instance.routineId)) {
        // Keep the first one, delete duplicates
        toDelete.push(instance.id!)
      } else {
        seen.set(instance.routineId, instance)
      }
    }
    
    // Delete duplicates if any found
    if (toDelete.length > 0) {
      await Promise.all(toDelete.map(id => db.routineInstances.delete(id)))
      return Array.from(seen.values())
    }
    
    return instances
  }

  static async updateInstance(id: number, updates: Partial<RoutineInstance>): Promise<void> {
    await db.routineInstances.update(id, updates)
  }

  static async getInstancesForDateRange(startDate: string, endDate: string): Promise<RoutineInstance[]> {
    return db.routineInstances
      .where('date')
      .between(startDate, endDate, true, true)
      .toArray()
  }

  // Settings
  static async getSettings(): Promise<AppSettings> {
    let settings = await db.settings.toCollection().first()
    if (!settings) {
      settings = {
        pinEnabled: false,
        biometricEnabled: false,
        notificationsEnabled: true,
        encryptionKey: EncryptionService.getKey(),
        version: '1.0.0'
      }
      await db.settings.add(settings)
    }
    return settings
  }

  static async updateSettings(updates: Partial<AppSettings>): Promise<void> {
    const settings = await this.getSettings()
    await db.settings.update(settings.id!, updates)
  }

  // Clear all data
  static async clearAllData(): Promise<void> {
    await db.routines.clear()
    await db.routineInstances.clear()
    // Keep settings but reset some values
    const settings = await this.getSettings()
    await db.settings.update(settings.id!, {
      lastBackup: undefined
    })
  }

  // Backup & Restore
  static async exportData(): Promise<string> {
    const routines = await db.routines.toArray()
    const instances = await db.routineInstances.toArray()
    const settings = await db.settings.toArray()
    
    const data = {
      routines,
      instances,
      settings,
      exportedAt: new Date().toISOString(),
      version: '1.0.0'
    }

    return EncryptionService.encryptObject(data)
  }

  static async importData(encryptedData: string): Promise<void> {
    try {
      const data = EncryptionService.decryptObject<{routines: any[], routineInstances: any[], settings: any[]}>(encryptedData)
      
      // Clear existing data
      await db.routines.clear()
      await db.routineInstances.clear()
      await db.settings.clear()
      
      // Import data
      await db.routines.bulkAdd(data.routines)
      await db.routineInstances.bulkAdd(data.instances)
      await db.settings.bulkAdd(data.settings)
      
    } catch (error) {
      throw new Error('Invalid backup file or wrong password')
    }
  }
}