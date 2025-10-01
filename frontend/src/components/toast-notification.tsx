'use client'

import { useEffect, useState, useRef } from 'react'
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

interface ToastProps {
  id: string
  message: string
  type: ToastType
  duration?: number
  onClose: (id: string) => void
}

export function Toast({ id, message, type, duration = 35000, onClose }: ToastProps) {
  const [isHovered, setIsHovered] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (duration === Infinity) return

    if (!isHovered) {
      timerRef.current = setTimeout(() => {
        onClose(id)
      }, duration)
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [id, duration, onClose, isHovered])

  const icons = {
    success: <CheckCircle className="h-5 w-5" />,
    error: <AlertCircle className="h-5 w-5" />,
    info: <Info className="h-5 w-5" />,
    warning: <AlertTriangle className="h-5 w-5" />
  }

  const styles = {
    success: isHovered
      ? 'bg-gradient-to-r from-slate-300 to-slate-400 dark:from-slate-700 dark:to-slate-600 border-emerald-600 dark:border-emerald-700 shadow-xl'
      : 'bg-emerald-500 dark:bg-emerald-600 border-emerald-600 dark:border-emerald-700 shadow-xl',
    error: isHovered
      ? 'bg-gradient-to-r from-slate-300 to-slate-400 dark:from-slate-700 dark:to-slate-600 border-red-600 dark:border-red-700 shadow-xl'
      : 'bg-red-500 dark:bg-red-600 border-red-600 dark:border-red-700 shadow-xl',
    info: isHovered
      ? 'bg-gradient-to-r from-slate-300 to-slate-400 dark:from-slate-700 dark:to-slate-600 border-blue-600 dark:border-blue-700 shadow-xl'
      : 'bg-blue-500 dark:bg-blue-600 border-blue-600 dark:border-blue-700 shadow-xl',
    warning: isHovered
      ? 'bg-gradient-to-r from-slate-300 to-slate-400 dark:from-slate-700 dark:to-slate-600 border-amber-600 dark:border-amber-700 shadow-xl'
      : 'bg-amber-500 dark:bg-amber-600 border-amber-600 dark:border-amber-700 shadow-xl'
  }

  const textColor = isHovered ? 'text-slate-900 dark:text-slate-200' : 'text-white'

  return (
    <div
      className={`flex items-start gap-3 p-4 rounded-lg border-l-4 shadow-2xl backdrop-blur-sm animate-in slide-in-from-right-full duration-300 transition-all cursor-pointer ${styles[type]} ${isHovered ? 'scale-105' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={`flex-shrink-0 mt-0.5 ${textColor}`}>{icons[type]}</div>
      <p className={`flex-1 text-sm font-semibold ${textColor}`}>{message}</p>
      <button
        onClick={() => onClose(id)}
        className={`flex-shrink-0 ${textColor} opacity-90 hover:opacity-100 transition-opacity`}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
