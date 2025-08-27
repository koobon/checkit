'use client'

import { useNotifications } from '@/hooks/useNotifications'

export default function ClientNotificationProvider({ children }: { children: React.ReactNode }) {
  useNotifications()
  
  return <>{children}</>
}