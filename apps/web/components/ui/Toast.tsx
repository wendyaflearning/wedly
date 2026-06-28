'use client'

export type ToastData = { type: 'success' | 'error'; message: string }

export function Toast({ toast }: { toast: ToastData | null }) {
  if (!toast) return null

  return (
    <div
      className={[
        'fixed top-4 right-4 z-50 max-w-sm px-5 py-4 rounded-xl shadow-lg font-manrope text-sm text-creme',
        toast.type === 'success' ? 'bg-accent' : 'bg-highlight',
      ].join(' ')}
      style={{ animation: 'toast-in 0.3s cubic-bezier(0.22,1,0.36,1) both' }}
      role="status"
      aria-live="polite"
    >
      {toast.message}
    </div>
  )
}
