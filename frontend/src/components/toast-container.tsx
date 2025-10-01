'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { ToastType } from './toast-notification'
import { NotificationCenter } from './notification-center'

interface Notification {
  id: string
  message: string
  type: ToastType
  timestamp: number
  read: boolean
}

interface ToastContextType {
  showToast: (message: string, type: ToastType, duration?: number) => void
  notifications: Notification[]
  removeNotification: (id: string) => void
  markAsRead: (id: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([])

  const showToast = useCallback((message: string, type: ToastType, duration = 35000) => {
    const id = Date.now().toString()
    const newNotification: Notification = {
      id,
      message,
      type,
      timestamp: Date.now(),
      read: false
    }
    setNotifications(prev => [...prev, newNotification])
  }, [])

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id))
  }, [])

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev =>
      prev.map(notif => notif.id === id ? { ...notif, read: true } : notif)
    )
  }, [])

  return (
    <ToastContext.Provider value={{ showToast, notifications, removeNotification, markAsRead }}>
      {children}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within ToastProvider')
  }
  return context
}

export function useNotifications() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useNotifications must be used within ToastProvider')
  }

  const NotificationBell = () => (
    <NotificationCenter
      notifications={context.notifications}
      onClose={context.removeNotification}
      onMarkAsRead={context.markAsRead}
    />
  )

  return { NotificationBell, ...context }
}
