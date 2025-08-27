'use client'

import { useState, useEffect } from 'react'
import { DatabaseService, Routine } from '@/lib/database'
import { Plus, Edit, Trash2, RotateCcw, Calendar, Clock } from 'lucide-react'

const REPEAT_PATTERNS = {
  daily: '매일',
  weekly: '주간',
  monthly: '월간'
}

const ITEM_TYPES = {
  boolean: '체크만',
  number: '숫자 입력',
  text: '텍스트 입력',
  photo: '사진 증빙'
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

export default function RoutinesScreen() {
  const [routines, setRoutines] = useState<Routine[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingRoutine, setEditingRoutine] = useState<Routine | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    repeatPattern: 'daily' as 'daily' | 'weekly' | 'monthly',
    repeatDays: [] as number[],
    deadline: '',
    itemType: 'boolean' as 'boolean' | 'number' | 'text' | 'photo'
  })

  useEffect(() => {
    loadRoutines()
  }, [])

  const loadRoutines = async () => {
    try {
      const data = await DatabaseService.getRoutines()
      setRoutines(data)
    } catch (error) {
      console.error('Failed to load routines:', error)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      repeatPattern: 'daily',
      repeatDays: [],
      deadline: '',
      itemType: 'boolean'
    })
    setEditingRoutine(null)
    setShowForm(false)
  }

  const handleSave = async () => {
    if (!formData.name.trim()) return
    
    try {
      const routineData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        repeatPattern: formData.repeatPattern,
        repeatDays: formData.repeatPattern !== 'daily' ? formData.repeatDays : undefined,
        deadline: formData.deadline || undefined,
        itemType: formData.itemType,
        isActive: 1
      }

      if (editingRoutine) {
        await DatabaseService.updateRoutine(editingRoutine.id!, routineData)
      } else {
        await DatabaseService.createRoutine(routineData)
      }

      await loadRoutines()
      resetForm()
    } catch (error) {
      console.error('Failed to save routine:', error)
    }
  }

  const handleEdit = (routine: Routine) => {
    setFormData({
      name: routine.name,
      description: routine.description || '',
      repeatPattern: routine.repeatPattern,
      repeatDays: routine.repeatDays || [],
      deadline: routine.deadline || '',
      itemType: routine.itemType
    })
    setEditingRoutine(routine)
    setShowForm(true)
  }

  const handleDelete = async (id: number) => {
    if (confirm('이 루틴을 삭제하시겠습니까?')) {
      try {
        await DatabaseService.deleteRoutine(id)
        await loadRoutines()
      } catch (error) {
        console.error('Failed to delete routine:', error)
      }
    }
  }

  const handleRepeatDaysChange = (day: number) => {
    const newDays = formData.repeatDays.includes(day)
      ? formData.repeatDays.filter(d => d !== day)
      : [...formData.repeatDays, day].sort()
    
    setFormData({ ...formData, repeatDays: newDays })
  }

  const getRepeatDescription = (routine: Routine) => {
    if (routine.repeatPattern === 'daily') return '매일'
    if (routine.repeatPattern === 'weekly' && routine.repeatDays?.length) {
      return `주간 (${routine.repeatDays.map(d => WEEKDAYS[d]).join(', ')})`
    }
    if (routine.repeatPattern === 'monthly' && routine.repeatDays?.length) {
      return `월간 (${routine.repeatDays.join(', ')}일)`
    }
    return REPEAT_PATTERNS[routine.repeatPattern]
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

  return (
    <div className="p-4 max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">루틴 관리</h1>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-1" />
          추가
        </button>
      </div>

      {/* Routines List */}
      {routines.length === 0 ? (
        <div className="bg-white rounded-lg p-6 shadow-sm border text-center">
          <RotateCcw className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 mb-2">아직 루틴이 없습니다</p>
          <p className="text-sm text-gray-400">첫 번째 루틴을 만들어보세요!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {routines.map((routine) => (
            <div key={routine.id} className="bg-white rounded-lg p-4 shadow-sm border">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 mb-1">{routine.name}</h3>
                  {routine.description && (
                    <p className="text-sm text-gray-600 mb-2">{routine.description}</p>
                  )}
                  
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <div className="flex items-center">
                      <Calendar className="w-3 h-3 mr-1" />
                      {getRepeatDescription(routine)}
                    </div>
                    
                    {routine.deadline && (
                      <div className="flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {routine.deadline}
                      </div>
                    )}
                    
                    <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                      {ITEM_TYPES[routine.itemType]}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-2 ml-3">
                  <button
                    onClick={() => handleEdit(routine)}
                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(routine.id!)}
                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold">
                {editingRoutine ? '루틴 수정' : '새 루틴 추가'}
              </h2>
            </div>
            
            <div className="p-4 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  루틴 이름 *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="예: 성경 읽기, 운동"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  설명
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="루틴에 대한 간단한 설명"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md resize-none"
                  rows={2}
                />
              </div>

              {/* Repeat Pattern */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  반복 주기 *
                </label>
                <select
                  value={formData.repeatPattern}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    repeatPattern: e.target.value as 'daily' | 'weekly' | 'monthly',
                    repeatDays: [] 
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="daily">매일</option>
                  <option value="weekly">주간</option>
                  <option value="monthly">월간</option>
                </select>
              </div>

              {/* Repeat Days */}
              {formData.repeatPattern === 'weekly' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    요일 선택 *
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {WEEKDAYS.map((day, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => handleRepeatDaysChange(index)}
                        className={`px-3 py-1 rounded text-sm ${
                          formData.repeatDays.includes(index)
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {formData.repeatPattern === 'monthly' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    날짜 선택 * (쉼표로 구분)
                  </label>
                  <input
                    type="text"
                    value={formData.repeatDays.join(', ')}
                    onChange={(e) => {
                      const days = e.target.value
                        .split(',')
                        .map(s => parseInt(s.trim()))
                        .filter(n => !isNaN(n) && n >= 1 && n <= 31)
                        .sort()
                      setFormData({ ...formData, repeatDays: days })
                    }}
                    placeholder="1, 15"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              )}

              {/* Deadline */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  마감 시간
                </label>
                <input
                  type="time"
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              {/* Item Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  입력 타입 *
                </label>
                <select
                  value={formData.itemType}
                  onChange={(e) => setFormData({ ...formData, itemType: e.target.value as 'boolean' | 'number' | 'text' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="boolean">체크만</option>
                  <option value="number">숫자 입력</option>
                  <option value="text">텍스트 입력</option>
                  <option value="photo">사진 증빙</option>
                </select>
              </div>
            </div>

            <div className="p-4 border-t flex space-x-3">
              <button
                onClick={resetForm}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={handleSave}
                disabled={!formData.name}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {editingRoutine ? '수정' : '추가'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}