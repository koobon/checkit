import { DatabaseService } from './database'

export class NotificationService {
  private static worker: ServiceWorker | null = null

  static async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications')
      return false
    }

    if (Notification.permission === 'granted') {
      return true
    }

    if (Notification.permission === 'denied') {
      return false
    }

    const permission = await Notification.requestPermission()
    return permission === 'granted'
  }

  static async scheduleDeadlineNotifications(): Promise<void> {
    const settings = await DatabaseService.getSettings()
    if (!settings.notificationsEnabled) {
      return
    }

    const hasPermission = await this.requestPermission()
    if (!hasPermission) {
      return
    }

    try {
      // Get today's routines with deadlines
      const instances = await DatabaseService.getTodayInstances()
      const routines = await DatabaseService.getRoutines()
      
      const routineMap = routines.reduce((acc, routine) => {
        acc[routine.id!] = routine
        return acc
      }, {} as Record<number, Routine>)

      const now = new Date()
      const today = now.toISOString().split('T')[0]

      // Schedule notifications for incomplete routines with deadlines
      instances
        .filter(instance => {
          const routine = routineMap[instance.routineId]
          return (
            !instance.completed &&
            routine &&
            routine.deadline
          )
        })
        .forEach(instance => {
          const routine = routineMap[instance.routineId]
          const deadlineTime = new Date(`${today}T${routine.deadline}:00`)
          const notificationTime = new Date(deadlineTime.getTime() - 30 * 60 * 1000) // 30 minutes before

          if (notificationTime > now) {
            const timeUntilNotification = notificationTime.getTime() - now.getTime()
            
            setTimeout(() => {
              this.showNotification(routine.name, `${routine.deadline} 마감까지 30분 남았습니다!`)
            }, timeUntilNotification)
          }
        })

    } catch (error) {
      console.error('Failed to schedule notifications:', error)
    }
  }

  static showNotification(title: string, body: string, options?: NotificationOptions): void {
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification(`CheckKit: ${title}`, {
        body,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        tag: 'checkkit-deadline',
        requireInteraction: true,
        ...options
      })

      notification.onclick = function() {
        window.focus()
        notification.close()
      }

      // Auto close after 10 seconds
      setTimeout(() => notification.close(), 10000)
    }
  }

  static async initializeServiceWorker(): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js')
        console.log('ServiceWorker registration successful:', registration)
        
        this.worker = registration.active
        
        // Schedule notifications when service worker is ready
        if (registration.active) {
          this.scheduleDeadlineNotifications()
        }
      } catch (error) {
        console.log('ServiceWorker registration failed:', error)
      }
    }
  }

  // Check for missed notifications when app opens
  static async checkMissedNotifications(): Promise<void> {
    const settings = await DatabaseService.getSettings()
    if (!settings.notificationsEnabled) {
      return
    }

    try {
      const instances = await DatabaseService.getTodayInstances()
      const routines = await DatabaseService.getRoutines()
      
      const routineMap = routines.reduce((acc, routine) => {
        acc[routine.id!] = routine
        return acc
      }, {} as Record<number, Routine>)

      const now = new Date()
      const today = now.toISOString().split('T')[0]

      // Find overdue routines
      const overdueRoutines = instances
        .filter(instance => {
          const routine = routineMap[instance.routineId]
          if (!routine || !routine.deadline || instance.completed) {
            return false
          }

          const deadlineTime = new Date(`${today}T${routine.deadline}:00`)
          return deadlineTime < now
        })

      if (overdueRoutines.length > 0) {
        this.showNotification(
          '미완료 루틴',
          `${overdueRoutines.length}개의 루틴이 마감되었습니다.`,
          { tag: 'overdue-routines' }
        )
      }

    } catch (error) {
      console.error('Failed to check missed notifications:', error)
    }
  }
}