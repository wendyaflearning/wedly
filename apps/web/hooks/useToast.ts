import { useState } from 'react'
import type { ToastData } from '@/components/ui/Toast'

export function useToast(duration = 5000) {
  const [toast, setToast] = useState<ToastData | null>(null)

  function showToast(type: 'success' | 'error', message: string) {
    setToast({ type, message })
    setTimeout(() => setToast(null), duration)
  }

  return { toast, showToast }
}
