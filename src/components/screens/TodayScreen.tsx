'use client'

import { useState, useEffect } from 'react'
import { DatabaseService, Routine, RoutineInstance } from '@/lib/database'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { 
  CheckCircle2, 
  Circle, 
  Camera, 
  MessageSquare,
  Clock,
  AlertTriangle 
} from 'lucide-react'

interface TodayRoutineData {
  routine: Routine
  instance: RoutineInstance
}

export default function TodayScreen() {
  const [routines, setRoutines] = useState<TodayRoutineData[]>([])
  const [loading, setLoading] = useState(true)
  const [completionRate, setCompletionRate] = useState(0)

  useEffect(() => {
    loadTodayRoutines()
  }, [])

  // Prevent duplicate loads
  useEffect(() => {
    const handleFocus = () => {
      loadTodayRoutines()
    }
    
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [])

  const loadTodayRoutines = async () => {
    try {
      const instances = await DatabaseService.getTodayInstances()
      const allRoutines = await DatabaseService.getRoutines()
      
      const routineMap = allRoutines.reduce((acc, routine) => {
        acc[routine.id!] = routine
        return acc
      }, {} as Record<number, Routine>)

      // Remove duplicates - keep only the first instance for each routine
      const seen = new Set<number>()
      const todayData = instances
        .filter(instance => {
          if (!routineMap[instance.routineId]) return false
          if (seen.has(instance.routineId)) return false
          seen.add(instance.routineId)
          return true
        })
        .map(instance => ({
          routine: routineMap[instance.routineId],
          instance
        }))

      setRoutines(todayData)
      
      // Calculate completion rate
      const completed = todayData.filter(item => item.instance.completed).length
      const total = todayData.length
      setCompletionRate(total > 0 ? Math.round((completed / total) * 100) : 0)
      
    } catch (error) {
      console.error('Failed to load today routines:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleComplete = async (instanceId: number, completed: boolean) => {
    try {
      await DatabaseService.updateInstance(instanceId, { 
        completed: !completed,
        completedAt: !completed ? new Date() : undefined
      })
      await loadTodayRoutines()
    } catch (error) {
      console.error('Failed to update routine:', error)
    }
  }

  const handleUpdateValue = async (instanceId: number, value: string | number) => {
    try {
      await DatabaseService.updateInstance(instanceId, { value })
      await loadTodayRoutines()
    } catch (error) {
      console.error('Failed to update value:', error)
    }
  }

  const handleUpdateNotes = async (instanceId: number, notes: string) => {
    try {
      await DatabaseService.updateInstance(instanceId, { notes })
      await loadTodayRoutines()
    } catch (error) {
      console.error('Failed to update notes:', error)
    }
  }

  const getProgressColor = (rate: number) => {
    if (rate >= 80) return 'text-green-600 bg-green-100'
    if (rate >= 60) return 'text-blue-600 bg-blue-100'
    if (rate >= 40) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  const isDeadlineSoon = (deadline?: string) => {
    if (!deadline) return false
    const now = new Date()
    const today = format(now, 'yyyy-MM-dd')
    const deadlineTime = new Date(`${today}T${deadline}:00`)
    const diffMinutes = (deadlineTime.getTime() - now.getTime()) / (1000 * 60)
    return diffMinutes > 0 && diffMinutes <= 30
  }

  if (loading) {
    return (
      <div className="p-4 animate-pulse">
        <div className="h-8 bg-gray-200 rounded mb-4"></div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    )
  }

  const today = format(new Date(), 'M월 d일 EEEE', { locale: ko })

  return (
    <div className="p-4 max-w-md mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">오늘의 루틴</h1>
        <p className="text-gray-600 text-sm mb-4">{today}</p>
        
        {/* Progress */}
        <div className="bg-white rounded-lg p-4 shadow-sm border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">진행률</span>
            <span className={`text-sm font-bold px-2 py-1 rounded-full ${getProgressColor(completionRate)}`}>
              {completionRate}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${completionRate}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {routines.filter(r => r.instance.completed).length} / {routines.length} 완료
          </p>
        </div>
      </div>

      {/* Routines */}
      {routines.length === 0 ? (
        <div className="bg-white rounded-lg p-6 shadow-sm border text-center">
          <Circle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">오늘 할 루틴이 없습니다.</p>
          <p className="text-sm text-gray-400 mt-1">루틴을 추가해보세요!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {routines.map(({ routine, instance }) => (
            <div 
              key={instance.id} 
              className="bg-white rounded-lg p-4 shadow-sm border"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start space-x-3 flex-1">
                  <button
                    onClick={() => handleToggleComplete(instance.id!, instance.completed)}
                    className="mt-0.5"
                  >
                    {instance.completed ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    ) : (
                      <Circle className="w-5 h-5 text-gray-400 hover:text-blue-600" />
                    )}
                  </button>
                  
                  <div className="flex-1">
                    <h3 className={`font-medium ${instance.completed ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                      {routine.name}
                    </h3>
                    {routine.description && (
                      <p className="text-sm text-gray-500 mt-1">{routine.description}</p>
                    )}
                  </div>
                </div>

                {/* Deadline warning */}
                {routine.deadline && isDeadlineSoon(routine.deadline) && !instance.completed && (
                  <div className="flex items-center text-amber-600 text-xs bg-amber-50 px-2 py-1 rounded">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    <span>{routine.deadline}</span>
                  </div>
                )}
                
                {routine.deadline && !isDeadlineSoon(routine.deadline) && (
                  <div className="flex items-center text-gray-500 text-xs">
                    <Clock className="w-3 h-3 mr-1" />
                    <span>{routine.deadline}</span>
                  </div>
                )}
              </div>

              {/* Input based on type */}
              {!instance.completed && (
                <div className="mt-3 space-y-2">
                  {routine.itemType === 'number' && (
                    <input
                      type="number"
                      placeholder="숫자 입력..."
                      value={instance.value as number || ''}
                      onChange={(e) => handleUpdateValue(instance.id!, parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                  )}
                  
                  {routine.itemType === 'text' && (
                    <textarea
                      placeholder="메모 입력..."
                      value={instance.value as string || ''}
                      onChange={(e) => handleUpdateValue(instance.id!, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm resize-none"
                      rows={2}
                    />
                  )}
                  
                  {routine.itemType === 'photo' && (
                    <div className="flex items-center space-x-2">
                      <button className="flex items-center px-3 py-2 bg-blue-50 text-blue-600 rounded-md text-sm hover:bg-blue-100 transition-colors">
                        <Camera className="w-4 h-4 mr-1" />
                        사진 추가
                      </button>
                      {(instance.photos?.length || 0) > 0 && (
                        <span className="text-xs text-gray-500">
                          {instance.photos?.length}개 사진
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Notes */}
              <div className="mt-3">
                <div className="flex items-center space-x-2">
                  <MessageSquare className="w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="메모 추가..."
                    value={instance.notes || ''}
                    onChange={(e) => handleUpdateNotes(instance.id!, e.target.value)}
                    className="flex-1 px-2 py-1 text-sm border-0 border-b border-gray-200 focus:border-blue-500 focus:outline-none bg-transparent"
                  />
                </div>
              </div>

              {/* Completion info */}
              {instance.completed && instance.completedAt && (
                <div className="mt-3 text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                  {format(instance.completedAt, 'HH:mm')}에 완료
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}