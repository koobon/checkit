'use client'

import { useEffect } from 'react'
import { NotificationService } from '@/lib/notifications'

export function useNotifications() {
  useEffect(() => {
    // Initialize notifications when app starts
    NotificationService.initializeServiceWorker()
    NotificationService.checkMissedNotifications()

    // Schedule notifications every hour
    const intervalId = setInterval(() => {
      NotificationService.scheduleDeadlineNotifications()
    }, 60 * 60 * 1000) // 1 hour

    // Schedule immediately
    NotificationService.scheduleDeadlineNotifications()

    // Cleanup
    return () => {
      clearInterval(intervalId)
    }
  }, [])

  // Re-schedule notifications when the app becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        NotificationService.scheduleDeadlineNotifications()
        NotificationService.checkMissedNotifications()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])
}