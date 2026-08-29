'use client'

import { useRef, useState } from 'react'
import { Ban, MoreVertical, Pencil, RotateCcw } from 'lucide-react'
import { ConfirmDeactivatePopover } from './ConfirmDeactivatePopover'

const POPOVER_MARGIN = 8
const ESTIMATED_POPOVER_HEIGHT = 220

export function KebabMenu({
  isActive,
  onModify,
  onDeactivate,
  onActivate,
  canDeactivate = true,
  confirmLabel,
  pronoun,
}: {
  isActive: boolean
  onModify: () => void
  onDeactivate: () => Promise<void>
  onActivate: () => Promise<void>
  canDeactivate?: boolean
  confirmLabel: string
  pronoun?: string
}) {
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [step, setStep] = useState<'closed' | 'menu' | 'confirm'>('closed')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [position, setPosition] = useState<{ top?: number; bottom?: number; right: number } | null>(null)

  function openMenu() {
    const rect = buttonRef.current?.getBoundingClientRect()
    if (rect) {
      const spaceBelow = window.innerHeight - rect.bottom
      const openUpward = spaceBelow < ESTIMATED_POPOVER_HEIGHT
      setPosition({
        right: window.innerWidth - rect.right,
        ...(openUpward
          ? { bottom: window.innerHeight - rect.top + POPOVER_MARGIN }
          : { top: rect.bottom + POPOVER_MARGIN }),
      })
    }
    setStep('menu')
  }

  function closeMenu() {
    setStep('closed')
    setPosition(null)
  }

  async function handleConfirmDeactivate() {
    setPending(true)
    setError(null)
    try {
      await onDeactivate()
      closeMenu()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue.')
    } finally {
      setPending(false)
    }
  }

  async function handleActivate() {
    setPending(true)
    setError(null)
    try {
      await onActivate()
      closeMenu()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue.')
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="relative inline-flex">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => (step === 'closed' ? openMenu() : closeMenu())}
        aria-label="Actions"
        className={`flex h-7 w-7 items-center justify-center rounded-md text-texte/40 transition-colors hover:bg-texte/8 hover:text-texte ${
          step !== 'closed' ? 'bg-texte/8 text-texte' : ''
        }`}
      >
        <MoreVertical size={16} aria-hidden="true" />
      </button>

      {step !== 'closed' && position && (
        <>
          <div className="fixed inset-0 z-40" onClick={closeMenu} />
          <div
            className="fixed z-50"
            style={{ top: position.top, bottom: position.bottom, right: position.right }}
          >
            {step === 'menu' ? (
              <div className="min-w-[168px] rounded-lg border border-bordeaux/10 bg-white p-1.5 shadow-lg">
                <button
                  type="button"
                  onClick={() => {
                    closeMenu()
                    onModify()
                  }}
                  className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm font-medium text-texte hover:bg-texte/6"
                >
                  <Pencil size={14} aria-hidden="true" />
                  Modifier
                </button>
                {isActive ? (
                  canDeactivate && (
                    <button
                      type="button"
                      onClick={() => setStep('confirm')}
                      className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm font-medium text-danger hover:bg-danger/8"
                    >
                      <Ban size={14} aria-hidden="true" />
                      Désactiver
                    </button>
                  )
                ) : (
                  <button
                    type="button"
                    onClick={handleActivate}
                    disabled={pending}
                    className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm font-medium text-texte hover:bg-texte/6 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <RotateCcw size={14} aria-hidden="true" />
                    {pending ? 'Réactivation...' : 'Réactiver'}
                  </button>
                )}
                {!isActive && error && (
                  <p className="px-2.5 pb-1 pt-1.5 text-xs font-semibold text-danger">{error}</p>
                )}
              </div>
            ) : (
              <ConfirmDeactivatePopover
                label={confirmLabel}
                pronoun={pronoun}
                pending={pending}
                error={error}
                onCancel={closeMenu}
                onConfirm={handleConfirmDeactivate}
              />
            )}
          </div>
        </>
      )}
    </div>
  )
}
