'use client'

import { useState, useEffect } from 'react'
import { Bell } from 'lucide-react'
import { Toast, ToastType } from './toast-notification'

interface Notification {
  id: string
  message: string
  type: ToastType
  timestamp: number
  read: boolean
}

interface NotificationCenterProps {
  notifications: Notification[]
  onClose: (id: string) => void
  onMarkAsRead: (id: string) => void
}

export function NotificationCenter({ notifications, onClose, onMarkAsRead }: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false)
  const unreadCount = notifications.filter(n => !n.read).length

  useEffect(() => {
    // Auto-open when new notification arrives
    if (notifications.length > 0 && !notifications[notifications.length - 1].read) {
      setIsOpen(true)
      // Auto-close after 35 seconds
      const timer = setTimeout(() => {
        setIsOpen(false)
      }, 35000)
      return () => clearTimeout(timer)
    }
  }, [notifications])

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-gradient-to-r hover:from-violet-50 hover:to-indigo-50 dark:hover:from-violet-900/20 dark:hover:to-indigo-900/20 hover:text-violet-600 dark:hover:text-violet-400 transition-all duration-200 hover:scale-105 active:scale-95"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center animate-pulse shadow-lg">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200 dark:border-slate-700 rounded-lg shadow-2xl z-50">
            <div className="p-4 border-b border-slate-200/50 dark:border-slate-700/50">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {unreadCount} unread
                  </span>
                )}
              </div>
            </div>

            <div className="divide-y divide-slate-200/50 dark:divide-slate-700/50">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <Bell className="h-12 w-12 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No notifications yet</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-3 transition-colors hover:bg-slate-100/50 dark:hover:bg-slate-800/50 ${!notification.read ? 'bg-blue-50/70 dark:bg-blue-900/20' : ''}`}
                    onClick={() => {
                      if (!notification.read) {
                        onMarkAsRead(notification.id)
                      }
                    }}
                  >
                    <Toast
                      id={notification.id}
                      message={notification.message}
                      type={notification.type}
                      duration={Infinity}
                      onClose={onClose}
                    />
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
