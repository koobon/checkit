'use client'

import { useState, useEffect } from 'react'
import { DatabaseService, AppSettings } from '@/lib/database'
import { 
  Bell, 
  Lock, 
  Fingerprint, 
  Download, 
  Upload, 
  Shield,
  Smartphone,
  HelpCircle,
  ChevronRight,
  Trash2
} from 'lucide-react'

export default function SettingsScreen() {
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [showPinSetup, setShowPinSetup] = useState(false)
  const [pinInput, setPinInput] = useState('')
  const [confirmPinInput, setConfirmPinInput] = useState('')

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const data = await DatabaseService.getSettings()
      setSettings(data)
    } catch (error) {
      console.error('Failed to load settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateSetting = async (updates: Partial<AppSettings>) => {
    try {
      await DatabaseService.updateSettings(updates)
      await loadSettings()
    } catch (error) {
      console.error('Failed to update settings:', error)
    }
  }

  const handleExport = async () => {
    try {
      const data = await DatabaseService.exportData()
      const blob = new Blob([data], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `checkkit-backup-${new Date().toISOString().split('T')[0]}.checkkit`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      await updateSetting({ lastBackup: new Date() })
    } catch (error) {
      console.error('Failed to export data:', error)
      alert('내보내기에 실패했습니다.')
    }
  }

  const handleImport = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.checkkit'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        try {
          const text = await file.text()
          await DatabaseService.importData(text)
          alert('데이터를 성공적으로 가져왔습니다.')
          await loadSettings()
          window.location.reload()
        } catch (error) {
          console.error('Failed to import data:', error)
          alert('파일을 읽을 수 없습니다. 올바른 백업 파일인지 확인해주세요.')
        }
      }
    }
    input.click()
  }

  const handleClearData = async () => {
    if (confirm('모든 루틴과 기록이 삭제됩니다. 계속하시겠습니까?')) {
      if (confirm('정말로 모든 데이터를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
        try {
          await DatabaseService.clearAllData()
          alert('모든 데이터가 삭제되었습니다.')
          window.location.reload()
        } catch (error) {
          console.error('Failed to clear data:', error)
          alert('데이터 삭제에 실패했습니다.')
        }
      }
    }
  }

  const handlePinSetup = async () => {
    if (pinInput.length !== 4) {
      alert('4자리 숫자를 입력해주세요.')
      return
    }
    
    if (pinInput !== confirmPinInput) {
      alert('PIN이 일치하지 않습니다.')
      return
    }

    try {
      // Simple hash for demo - in production use proper hashing
      const pinHash = btoa(pinInput)
      await updateSetting({ 
        pinEnabled: true, 
        pinHash 
      })
      setShowPinSetup(false)
      setPinInput('')
      setConfirmPinInput('')
    } catch (error) {
      console.error('Failed to setup PIN:', error)
    }
  }

  const handleBiometricToggle = async () => {
    if (!settings?.biometricEnabled && 'credentials' in navigator) {
      try {
        // Check if biometric is available
        const available = await (navigator as typeof navigator & { credentials: any }).credentials.create({
          publicKey: {
            challenge: new Uint8Array(32),
            rp: { name: 'CheckKit' },
            user: {
              id: new Uint8Array(16),
              name: 'user',
              displayName: 'User'
            },
            pubKeyCredParams: [{ alg: -7, type: 'public-key' }],
            authenticatorSelection: {
              authenticatorAttachment: 'platform',
              userVerification: 'required'
            }
          }
        })
        
        if (available) {
          await updateSetting({ biometricEnabled: true })
        }
      } catch (error) {
        alert('생체인식을 사용할 수 없습니다.')
      }
    } else {
      await updateSetting({ biometricEnabled: !settings?.biometricEnabled })
    }
  }

  if (loading) {
    return (
      <div className="p-4 animate-pulse">
        <div className="h-8 bg-gray-200 rounded mb-4"></div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    )
  }

  if (!settings) return null

  return (
    <div className="p-4 max-w-md mx-auto">
      {/* Header */}
      <h1 className="text-2xl font-bold text-gray-900 mb-6">설정</h1>

      {/* Security Section */}
      <div className="bg-white rounded-lg shadow-sm border mb-4">
        <div className="p-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900 flex items-center">
            <Shield className="w-5 h-5 mr-2 text-blue-600" />
            보안
          </h2>
        </div>
        
        <div className="divide-y divide-gray-100">
          {/* PIN Lock */}
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center">
              <Lock className="w-5 h-5 text-gray-600 mr-3" />
              <div>
                <p className="font-medium text-gray-900">PIN 잠금</p>
                <p className="text-sm text-gray-500">4자리 숫자로 앱 보호</p>
              </div>
            </div>
            <button
              onClick={() => settings.pinEnabled ? updateSetting({ pinEnabled: false, pinHash: undefined }) : setShowPinSetup(true)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.pinEnabled ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.pinEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Biometric */}
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center">
              <Fingerprint className="w-5 h-5 text-gray-600 mr-3" />
              <div>
                <p className="font-medium text-gray-900">생체인식</p>
                <p className="text-sm text-gray-500">지문/얼굴 인식으로 잠금해제</p>
              </div>
            </div>
            <button
              onClick={handleBiometricToggle}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.biometricEnabled ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.biometricEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Notifications Section */}
      <div className="bg-white rounded-lg shadow-sm border mb-4">
        <div className="p-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900 flex items-center">
            <Bell className="w-5 h-5 mr-2 text-blue-600" />
            알림
          </h2>
        </div>
        
        <div className="p-4 flex items-center justify-between">
          <div>
            <p className="font-medium text-gray-900">마감 알림</p>
            <p className="text-sm text-gray-500">마감 30분 전 알림</p>
          </div>
          <button
            onClick={() => updateSetting({ notificationsEnabled: !settings.notificationsEnabled })}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              settings.notificationsEnabled ? 'bg-blue-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.notificationsEnabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Data Section */}
      <div className="bg-white rounded-lg shadow-sm border mb-4">
        <div className="p-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900 flex items-center">
            <Smartphone className="w-5 h-5 mr-2 text-blue-600" />
            데이터
          </h2>
        </div>
        
        <div className="divide-y divide-gray-100">
          <button
            onClick={handleExport}
            className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center">
              <Download className="w-5 h-5 text-gray-600 mr-3" />
              <div className="text-left">
                <p className="font-medium text-gray-900">데이터 내보내기</p>
                <p className="text-sm text-gray-500">
                  암호화된 백업 파일 생성
                  {settings.lastBackup && (
                    <span className="block">마지막: {new Date(settings.lastBackup).toLocaleDateString()}</span>
                  )}
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>

          <button
            onClick={handleImport}
            className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center">
              <Upload className="w-5 h-5 text-gray-600 mr-3" />
              <div className="text-left">
                <p className="font-medium text-gray-900">데이터 가져오기</p>
                <p className="text-sm text-gray-500">백업 파일에서 데이터 복원</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>

          <button
            onClick={handleClearData}
            className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors text-red-600"
          >
            <div className="flex items-center">
              <Trash2 className="w-5 h-5 mr-3" />
              <div className="text-left">
                <p className="font-medium">데이터 초기화</p>
                <p className="text-sm text-gray-500">모든 루틴과 기록 삭제</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>
        </div>
      </div>

      {/* About Section */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900 flex items-center">
            <HelpCircle className="w-5 h-5 mr-2 text-blue-600" />
            정보
          </h2>
        </div>
        
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-gray-600">버전</span>
            <span className="font-medium">{settings.version}</span>
          </div>
          
          <div className="text-sm text-gray-500 space-y-2">
            <p>• 모든 데이터는 기기에 안전하게 저장됩니다</p>
            <p>• 서버에 어떤 정보도 전송되지 않습니다</p>
            <p>• 데이터는 AES-256으로 암호화됩니다</p>
          </div>
        </div>
      </div>

      {/* PIN Setup Modal */}
      {showPinSetup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-sm">
            <div className="p-4 border-b">
              <h3 className="text-lg font-semibold">PIN 설정</h3>
            </div>
            
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  4자리 PIN 입력
                </label>
                <input
                  type="password"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value.slice(0, 4))}
                  placeholder="0000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-center text-lg font-mono"
                  maxLength={4}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  PIN 확인
                </label>
                <input
                  type="password"
                  value={confirmPinInput}
                  onChange={(e) => setConfirmPinInput(e.target.value.slice(0, 4))}
                  placeholder="0000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-center text-lg font-mono"
                  maxLength={4}
                />
              </div>
            </div>

            <div className="p-4 border-t flex space-x-3">
              <button
                onClick={() => {
                  setShowPinSetup(false)
                  setPinInput('')
                  setConfirmPinInput('')
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={handlePinSetup}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                설정
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}