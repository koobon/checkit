'use client'

import { useState, useEffect } from 'react'
import { DatabaseService, Routine, RoutineInstance } from '@/lib/database'
import { format, subDays, startOfWeek, endOfWeek } from 'date-fns'
import { ko } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Calendar, CheckCircle2, Circle } from 'lucide-react'

interface HistoryData {
  date: string
  instances: (RoutineInstance & { routine: Routine })[]
  completionRate: number
}

export default function HistoryScreen() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week')
  const [historyData, setHistoryData] = useState<HistoryData[]>([])
  const [routines, setRoutines] = useState<Routine[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [currentDate, viewMode])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Load all routines
      const allRoutines = await DatabaseService.getRoutines()
      setRoutines(allRoutines)
      
      // Determine date range
      const startDate = viewMode === 'week' 
        ? startOfWeek(currentDate, { weekStartsOn: 0 })
        : new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
        
      const endDate = viewMode === 'week'
        ? endOfWeek(currentDate, { weekStartsOn: 0 })
        : new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)

      const startDateStr = format(startDate, 'yyyy-MM-dd')
      const endDateStr = format(endDate, 'yyyy-MM-dd')

      // Load instances for date range
      const instances = await DatabaseService.getInstancesForDateRange(startDateStr, endDateStr)
      
      // Create routine map
      const routineMap = allRoutines.reduce((acc, routine) => {
        acc[routine.id!] = routine
        return acc
      }, {} as Record<number, Routine>)

      // Group by date
      const dataByDate: { [date: string]: HistoryData } = {}
      
      // Initialize all dates in range
      let current = new Date(startDate)
      while (current <= endDate) {
        const dateStr = format(current, 'yyyy-MM-dd')
        dataByDate[dateStr] = {
          date: dateStr,
          instances: [],
          completionRate: 0
        }
        current = new Date(current.getTime() + 24 * 60 * 60 * 1000)
      }

      // Add instances with routine data
      instances.forEach(instance => {
        const routine = routineMap[instance.routineId]
        if (routine && dataByDate[instance.date]) {
          dataByDate[instance.date].instances.push({
            ...instance,
            routine
          })
        }
      })

      // Calculate completion rates
      Object.values(dataByDate).forEach(dayData => {
        const total = dayData.instances.length
        const completed = dayData.instances.filter(i => i.completed).length
        dayData.completionRate = total > 0 ? Math.round((completed / total) * 100) : 0
      })

      setHistoryData(Object.values(dataByDate).sort((a, b) => a.date.localeCompare(b.date)))
      
    } catch (error) {
      console.error('Failed to load history:', error)
    } finally {
      setLoading(false)
    }
  }

  const navigatePrevious = () => {
    if (viewMode === 'week') {
      setCurrentDate(subDays(currentDate, 7))
    } else {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
    }
  }

  const navigateNext = () => {
    if (viewMode === 'week') {
      setCurrentDate(new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000))
    } else {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
    }
  }

  const getDateRangeTitle = () => {
    if (viewMode === 'week') {
      const start = startOfWeek(currentDate, { weekStartsOn: 0 })
      const end = endOfWeek(currentDate, { weekStartsOn: 0 })
      return `${format(start, 'M월 d일', { locale: ko })} - ${format(end, 'M월 d일', { locale: ko })}`
    } else {
      return format(currentDate, 'yyyy년 M월', { locale: ko })
    }
  }

  const getCompletionColor = (rate: number) => {
    if (rate >= 80) return 'bg-green-500'
    if (rate >= 60) return 'bg-blue-500'
    if (rate >= 40) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  if (loading) {
    return (
      <div className="p-4 animate-pulse">
        <div className="h-8 bg-gray-200 rounded mb-4"></div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 max-w-md mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">이력</h1>
        
        {/* View Mode Toggle */}
        <div className="flex bg-gray-100 rounded-lg p-1 mb-4">
          <button
            onClick={() => setViewMode('week')}
            className={`flex-1 px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'week' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            주간
          </button>
          <button
            onClick={() => setViewMode('month')}
            className={`flex-1 px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'month' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            월간
          </button>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between bg-white rounded-lg p-3 shadow-sm border">
          <button
            onClick={navigatePrevious}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          
          <h2 className="font-semibold text-gray-900">{getDateRangeTitle()}</h2>
          
          <button
            onClick={navigateNext}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* History List */}
      {historyData.length === 0 ? (
        <div className="bg-white rounded-lg p-6 shadow-sm border text-center">
          <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">이 기간에는 기록이 없습니다</p>
        </div>
      ) : (
        <div className="space-y-3">
          {historyData.map((dayData) => {
            const isToday = dayData.date === format(new Date(), 'yyyy-MM-dd')
            
            return (
              <div key={dayData.date} className="bg-white rounded-lg p-4 shadow-sm border">
                {/* Date Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <h3 className={`font-medium ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
                      {format(new Date(dayData.date), 'M월 d일 EEEE', { locale: ko })}
                      {isToday && <span className="ml-2 text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">오늘</span>}
                    </h3>
                  </div>
                  
                  {dayData.instances.length > 0 && (
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${getCompletionColor(dayData.completionRate)}`} />
                      <span className="text-sm font-medium text-gray-600">
                        {dayData.completionRate}%
                      </span>
                    </div>
                  )}
                </div>

                {/* Instances */}
                {dayData.instances.length === 0 ? (
                  <p className="text-sm text-gray-400">루틴이 없습니다</p>
                ) : (
                  <div className="space-y-2">
                    {dayData.instances.map((instance) => (
                      <div key={instance.id} className="flex items-center space-x-3 py-2">
                        {instance.completed ? (
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                        ) : (
                          <Circle className="w-4 h-4 text-gray-400" />
                        )}
                        
                        <div className="flex-1">
                          <span className={`text-sm ${instance.completed ? 'text-gray-600' : 'text-gray-900'}`}>
                            {instance.routine.name}
                          </span>
                          
                          {instance.value && (
                            <span className="ml-2 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                              {instance.routine.itemType === 'number' ? `${instance.value}` : instance.value}
                            </span>
                          )}
                          
                          {instance.notes && (
                            <p className="text-xs text-gray-500 mt-1">{instance.notes}</p>
                          )}
                        </div>

                        {instance.completedAt && (
                          <span className="text-xs text-gray-500">
                            {format(instance.completedAt, 'HH:mm')}
                          </span>
                        )}
                      </div>
                    ))}
                    
                    <div className="pt-2 border-t border-gray-100 text-xs text-gray-500">
                      {dayData.instances.filter(i => i.completed).length} / {dayData.instances.length} 완료
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}