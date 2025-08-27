'use client'

import TodayScreen from '@/components/screens/TodayScreen'
import Navigation from '@/components/Navigation'
import { useNotifications } from '@/hooks/useNotifications'

export default function Home() {
  useNotifications()
  
  return (
    <div className="min-h-screen pb-20">
      <TodayScreen />
      <Navigation />
    </div>
  )
}
