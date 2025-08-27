'use client'

import { useState, useEffect } from 'react'
import { DatabaseService, Routine, RoutineInstance } from '@/lib/database'
import { format, subDays, subWeeks, subMonths, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns'
import { ko } from 'date-fns/locale'
import { FileText, Download, Calendar, TrendingUp, Target, Award } from 'lucide-react'
import jsPDF from 'jspdf'

interface ReportData {
  period: string
  totalRoutines: number
  completedRoutines: number
  completionRate: number
  routineStats: {
    routine: Routine
    total: number
    completed: number
    rate: number
  }[]
  dailyStats: {
    date: string
    total: number
    completed: number
    rate: number
  }[]
}

export default function ReportsScreen() {
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(false)
  const [reportType, setReportType] = useState<'week' | 'month'>('week')

  useEffect(() => {
    generateReport()
  }, [reportType])

  const generateReport = async () => {
    try {
      setLoading(true)
      
      const endDate = new Date()
      const startDate = reportType === 'week' 
        ? startOfWeek(subDays(endDate, 6), { weekStartsOn: 0 })
        : startOfMonth(subMonths(endDate, 0))
      
      const actualEndDate = reportType === 'week'
        ? endOfWeek(endDate, { weekStartsOn: 0 })
        : endOfMonth(endDate)

      const startDateStr = format(startDate, 'yyyy-MM-dd')
      const endDateStr = format(actualEndDate, 'yyyy-MM-dd')

      // Load data
      const instances = await DatabaseService.getInstancesForDateRange(startDateStr, endDateStr)
      const routines = await DatabaseService.getRoutines()

      // Create routine map
      const routineMap = routines.reduce((acc, routine) => {
        acc[routine.id!] = routine
        return acc
      }, {} as Record<number, Routine>)

      // Calculate stats
      const totalRoutines = instances.length
      const completedRoutines = instances.filter(i => i.completed).length
      const completionRate = totalRoutines > 0 ? Math.round((completedRoutines / totalRoutines) * 100) : 0

      // Routine stats
      const routineStatsMap: { [routineId: number]: { total: number; completed: number } } = {}
      instances.forEach(instance => {
        if (!routineStatsMap[instance.routineId]) {
          routineStatsMap[instance.routineId] = { total: 0, completed: 0 }
        }
        routineStatsMap[instance.routineId].total++
        if (instance.completed) {
          routineStatsMap[instance.routineId].completed++
        }
      })

      const routineStats = Object.entries(routineStatsMap)
        .map(([routineId, stats]) => {
          const routine = routineMap[parseInt(routineId)]
          return {
            routine,
            total: stats.total,
            completed: stats.completed,
            rate: Math.round((stats.completed / stats.total) * 100)
          }
        })
        .filter(stat => stat.routine)
        .sort((a, b) => b.rate - a.rate)

      // Daily stats
      const dailyStatsMap: { [date: string]: { total: number; completed: number } } = {}
      instances.forEach(instance => {
        if (!dailyStatsMap[instance.date]) {
          dailyStatsMap[instance.date] = { total: 0, completed: 0 }
        }
        dailyStatsMap[instance.date].total++
        if (instance.completed) {
          dailyStatsMap[instance.date].completed++
        }
      })

      const dailyStats = Object.entries(dailyStatsMap)
        .map(([date, stats]) => ({
          date,
          total: stats.total,
          completed: stats.completed,
          rate: Math.round((stats.completed / stats.total) * 100)
        }))
        .sort((a, b) => a.date.localeCompare(b.date))

      setReportData({
        period: reportType === 'week' 
          ? `${format(startDate, 'M월 d일', { locale: ko })} - ${format(actualEndDate, 'M월 d일', { locale: ko })}`
          : format(startDate, 'yyyy년 M월', { locale: ko }),
        totalRoutines,
        completedRoutines,
        completionRate,
        routineStats,
        dailyStats
      })

    } catch (error) {
      console.error('Failed to generate report:', error)
    } finally {
      setLoading(false)
    }
  }

  const downloadPDF = async () => {
    if (!reportData) return

    try {
      const pdf = new jsPDF()
      
      // Korean font setup (you would need to add Korean font file)
      pdf.setFont('helvetica')
      pdf.setFontSize(16)

      // Title
      pdf.text(`CheckKit ${reportType === 'week' ? 'Weekly' : 'Monthly'} Report`, 20, 30)
      pdf.setFontSize(12)
      pdf.text(`Period: ${reportData.period}`, 20, 45)

      // Summary
      let yPos = 65
      pdf.setFontSize(14)
      pdf.text('Summary', 20, yPos)
      yPos += 10

      pdf.setFontSize(10)
      pdf.text(`Total Routines: ${reportData.totalRoutines}`, 25, yPos)
      yPos += 8
      pdf.text(`Completed: ${reportData.completedRoutines}`, 25, yPos)
      yPos += 8
      pdf.text(`Completion Rate: ${reportData.completionRate}%`, 25, yPos)
      yPos += 20

      // Routine Stats
      if (reportData.routineStats.length > 0) {
        pdf.setFontSize(14)
        pdf.text('Routine Performance', 20, yPos)
        yPos += 10

        pdf.setFontSize(10)
        reportData.routineStats.forEach((stat, index) => {
          if (yPos > 270) {
            pdf.addPage()
            yPos = 30
          }
          
          pdf.text(
            `${stat.routine.name}: ${stat.completed}/${stat.total} (${stat.rate}%)`,
            25,
            yPos
          )
          yPos += 8
        })
        yPos += 10
      }

      // Daily Stats
      if (reportData.dailyStats.length > 0) {
        pdf.setFontSize(14)
        pdf.text('Daily Performance', 20, yPos)
        yPos += 10

        pdf.setFontSize(10)
        reportData.dailyStats.forEach((stat, index) => {
          if (yPos > 270) {
            pdf.addPage()
            yPos = 30
          }
          
          const dateFormatted = format(new Date(stat.date), 'M/d (EEE)', { locale: ko })
          pdf.text(
            `${dateFormatted}: ${stat.completed}/${stat.total} (${stat.rate}%)`,
            25,
            yPos
          )
          yPos += 8
        })
      }

      // Download
      const filename = `checkkit-report-${reportType}-${format(new Date(), 'yyyy-MM-dd')}.pdf`
      pdf.save(filename)

    } catch (error) {
      console.error('Failed to generate PDF:', error)
      alert('PDF 생성에 실패했습니다.')
    }
  }

  if (loading) {
    return (
      <div className="p-4 animate-pulse">
        <div className="h-8 bg-gray-200 rounded mb-4"></div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">보고서</h1>
        {reportData && (
          <button
            onClick={downloadPDF}
            className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            <Download className="w-4 h-4 mr-1" />
            PDF
          </button>
        )}
      </div>

      {/* Report Type Toggle */}
      <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
        <button
          onClick={() => setReportType('week')}
          className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
            reportType === 'week' 
              ? 'bg-white text-blue-600 shadow-sm' 
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          주간 보고서
        </button>
        <button
          onClick={() => setReportType('month')}
          className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
            reportType === 'month' 
              ? 'bg-white text-blue-600 shadow-sm' 
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          월간 보고서
        </button>
      </div>

      {!reportData ? (
        <div className="bg-white rounded-lg p-6 shadow-sm border text-center">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">보고서를 생성하고 있습니다...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Period */}
          <div className="bg-white rounded-lg p-4 shadow-sm border">
            <div className="flex items-center mb-2">
              <Calendar className="w-5 h-5 text-blue-600 mr-2" />
              <h2 className="font-semibold text-gray-900">기간</h2>
            </div>
            <p className="text-lg font-medium text-blue-600">{reportData.period}</p>
          </div>

          {/* Overall Stats */}
          <div className="bg-white rounded-lg p-4 shadow-sm border">
            <div className="flex items-center mb-4">
              <TrendingUp className="w-5 h-5 text-green-600 mr-2" />
              <h2 className="font-semibold text-gray-900">전체 성취율</h2>
            </div>
            
            <div className="text-center mb-4">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {reportData.completionRate}%
              </div>
              <div className="text-sm text-gray-600">
                {reportData.completedRoutines} / {reportData.totalRoutines} 완료
              </div>
            </div>

            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-green-500 h-3 rounded-full transition-all duration-300"
                style={{ width: `${reportData.completionRate}%` }}
              />
            </div>
          </div>

          {/* Routine Performance */}
          {reportData.routineStats.length > 0 && (
            <div className="bg-white rounded-lg p-4 shadow-sm border">
              <div className="flex items-center mb-4">
                <Target className="w-5 h-5 text-purple-600 mr-2" />
                <h2 className="font-semibold text-gray-900">루틴별 성과</h2>
              </div>
              
              <div className="space-y-3">
                {reportData.routineStats.map((stat, index) => (
                  <div key={stat.routine.id} className="border-l-4 border-blue-500 pl-3">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-medium text-gray-900">{stat.routine.name}</h3>
                      <span className={`text-sm font-medium ${
                        stat.rate >= 80 ? 'text-green-600' :
                        stat.rate >= 60 ? 'text-blue-600' :
                        stat.rate >= 40 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {stat.rate}%
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                      <span>{stat.completed} / {stat.total} 완료</span>
                      {index === 0 && stat.rate === Math.max(...reportData.routineStats.map(s => s.rate)) && (
                        <Award className="w-4 h-4 text-yellow-500" />
                      )}
                    </div>
                    
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          stat.rate >= 80 ? 'bg-green-500' :
                          stat.rate >= 60 ? 'bg-blue-500' :
                          stat.rate >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${stat.rate}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Daily Performance */}
          {reportData.dailyStats.length > 0 && (
            <div className="bg-white rounded-lg p-4 shadow-sm border">
              <div className="flex items-center mb-4">
                <Calendar className="w-5 h-5 text-blue-600 mr-2" />
                <h2 className="font-semibold text-gray-900">일별 성과</h2>
              </div>
              
              <div className="space-y-2">
                {reportData.dailyStats.map((stat) => {
                  const dateObj = new Date(stat.date)
                  const isToday = stat.date === format(new Date(), 'yyyy-MM-dd')
                  
                  return (
                    <div key={stat.date} className="flex items-center justify-between py-2">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${
                          stat.rate >= 80 ? 'bg-green-500' :
                          stat.rate >= 60 ? 'bg-blue-500' :
                          stat.rate >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                        }`} />
                        <span className={`text-sm ${isToday ? 'font-medium text-blue-600' : 'text-gray-900'}`}>
                          {format(dateObj, 'M월 d일 (EEE)', { locale: ko })}
                          {isToday && <span className="ml-1 text-xs bg-blue-100 px-1 rounded">오늘</span>}
                        </span>
                      </div>
                      
                      <div className="text-right">
                        <div className={`text-sm font-medium ${
                          stat.rate >= 80 ? 'text-green-600' :
                          stat.rate >= 60 ? 'text-blue-600' :
                          stat.rate >= 40 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {stat.rate}%
                        </div>
                        <div className="text-xs text-gray-500">
                          {stat.completed}/{stat.total}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {reportData.totalRoutines === 0 && (
            <div className="bg-white rounded-lg p-6 shadow-sm border text-center">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">이 기간에는 데이터가 없습니다</p>
              <p className="text-sm text-gray-400 mt-1">루틴을 추가하고 활동을 시작해보세요!</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}