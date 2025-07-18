"use client"

import { useState, useCallback, useEffect } from "react"
import { X, CheckCircle, XCircle } from "lucide-react"

export interface Toast {
  id: string
  type: "success" | "error"
  title: string
  message: string
  duration?: number
}

interface ToastContextType {
  toasts: Toast[]
  showSuccess: (title: string, message: string, duration?: number) => void
  showError: (title: string, message: string, duration?: number) => void
  removeToast: (id: string) => void
}

export function useToast(): ToastContextType {
  const [toasts, setToasts] = useState<Toast[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const showSuccess = useCallback(
    (title: string, message: string, duration = 5000) => {
      const id = Math.random().toString(36).substr(2, 9)
      const toast: Toast = { id, type: "success", title, message, duration }

      setToasts((prev) => [...prev, toast])

      if (duration > 0) {
        setTimeout(() => removeToast(id), duration)
      }
    },
    [removeToast],
  )

  const showError = useCallback(
    (title: string, message: string, duration = 5000) => {
      const id = Math.random().toString(36).substr(2, 9)
      const toast: Toast = { id, type: "error", title, message, duration }

      setToasts((prev) => [...prev, toast])

      if (duration > 0) {
        setTimeout(() => removeToast(id), duration)
      }
    },
    [removeToast],
  )

  return { toasts, showSuccess, showError, removeToast }
}

interface ToastItemProps {
  toast: Toast
  onRemove: (id: string) => void
}

function ToastItem({ toast, onRemove }: ToastItemProps) {
  useEffect(() => {
    if (toast.duration && toast.duration > 0) {
      const timer = setTimeout(() => {
        onRemove(toast.id)
      }, toast.duration)

      return () => clearTimeout(timer)
    }
  }, [toast.id, toast.duration, onRemove])

  return (
    <div
      className={`flex items-start gap-3 p-4 rounded-xl shadow-lg border backdrop-blur-sm transition-all duration-300 ${
        toast.type === "success"
          ? "bg-green-50/90 dark:bg-green-900/20 border-green-200 dark:border-green-800"
          : "bg-red-50/90 dark:bg-red-900/20 border-red-200 dark:border-red-800"
      }`}
    >
      {toast.type === "success" ? (
        <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
      ) : (
        <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
      )}

      <div className="flex-1 min-w-0">
        <h4
          className={`text-sm font-medium ${
            toast.type === "success" ? "text-green-800 dark:text-green-400" : "text-red-800 dark:text-red-400"
          }`}
        >
          {toast.title}
        </h4>
        <p
          className={`text-sm mt-1 ${
            toast.type === "success" ? "text-green-700 dark:text-green-300" : "text-red-700 dark:text-red-300"
          }`}
        >
          {toast.message}
        </p>
      </div>

      <button
        onClick={() => onRemove(toast.id)}
        className={`flex-shrink-0 p-1 rounded-lg transition-colors ${
          toast.type === "success"
            ? "hover:bg-green-100 dark:hover:bg-green-800/50 text-green-600 dark:text-green-400"
            : "hover:bg-red-100 dark:hover:bg-red-800/50 text-red-600 dark:text-red-400"
        }`}
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

interface ToastContainerProps {
  toasts: Toast[]
  onRemove: (id: string) => void
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  )
}
