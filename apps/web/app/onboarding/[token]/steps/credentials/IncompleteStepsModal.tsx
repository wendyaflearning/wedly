'use client'
import { useState } from 'react'
import type { OnboardingStep } from '../../types'

function WarningIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 18 18" fill="none">
      <path d="M9 2.4l6.4 11.2a1 1 0 0 1-.87 1.5H3.47a1 1 0 0 1-.87-1.5L9 2.4z" stroke="#E35704" strokeWidth="1.4" strokeLinejoin="round" fill="none" />
      <path d="M9 7.2v3.1" stroke="#E35704" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="9" cy="12.4" r="0.95" fill="#E35704" />
    </svg>
  )
}

function ChevronRight() {
  return (
    <svg width="9" height="15" viewBox="0 0 9 15" fill="none">
      <path d="M1.5 1.5L7 7.5l-5.5 6" stroke="#9D4F1E" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function IncompleteStepsModal({
  steps,
  onNavigate,
  onClose,
}: {
  steps: OnboardingStep[]
  onNavigate: (stepKey: string) => void
  onClose: () => void
}) {
  const [dragStartY, setDragStartY] = useState<number | null>(null)

  return (
    <div
      className="fixed inset-0 bg-bordeaux/45 flex items-end sm:items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="modal-enter w-full sm:w-[480px] sm:max-w-[92vw] bg-creme rounded-t-[26px] sm:rounded-3xl"
        style={{ boxShadow: 'rgba(38,18,28,0.36) 0px 30px 80px' }}
        onClick={e => e.stopPropagation()}
        onTouchStart={e => setDragStartY(e.touches[0].clientY)}
        onTouchEnd={e => {
          if (dragStartY !== null && e.changedTouches[0].clientY - dragStartY > 60) onClose()
          setDragStartY(null)
        }}
      >
        {/* Drag handle (mobile only) */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-[42px] h-[5px] rounded-full" style={{ background: 'rgb(226,213,203)' }} />
        </div>

        <div className="px-[26px] pt-[14px] pb-[30px] sm:px-[38px] sm:pt-9 sm:pb-[34px]">
          <h2
            className="font-cormorant text-bordeaux leading-[1.22] mb-[10px]"
            style={{ fontSize: 'clamp(27px, 4vw, 30px)', letterSpacing: '0.005em', fontWeight: 400 }}
          >
            Votre profil est <em>presque prêt.</em>
          </h2>

          <p
            className="text-texte/[0.58] leading-relaxed mb-6"
            style={{ fontFamily: 'var(--font-manrope-var)', fontSize: 14 }}
          >
            Il reste quelques informations à compléter avant de finaliser votre inscription.
          </p>

          <div className="flex flex-col gap-[10px] mb-[26px]">
            {steps.map((step) => (
              <button
                key={step.stepKey}
                onClick={() => onNavigate(step.stepKey)}
                className="flex items-center gap-[14px] w-full text-left rounded-[14px] bg-white transition-[box-shadow,transform,border-color] duration-[180ms] hover:shadow-md hover:-translate-y-px"
                style={{
                  padding: '14px 16px',
                  border: '1.5px solid rgb(226,213,203)',
                  boxShadow: 'rgba(78,26,50,0.02) 0px 1px 0px',
                }}
              >
                <span className="w-[34px] h-[34px] rounded-full flex-shrink-0 flex items-center justify-center bg-highlight/20">
                  <WarningIcon />
                </span>
                <span
                  className="flex-1 text-texte font-medium"
                  style={{ fontFamily: 'var(--font-manrope-var)', fontSize: 15, lineHeight: 1.3 }}
                >
                  {step.label}
                </span>
                <ChevronRight />
              </button>
            ))}
          </div>

          <button
            disabled
            aria-disabled="true"
            className="w-full font-josefin uppercase cursor-not-allowed text-texte/[0.34]"
            style={{
              padding: '17px 28px',
              background: 'rgb(235,224,214)',
              borderRadius: 12,
              border: 'none',
              fontSize: 13,
              letterSpacing: '0.1em',
            }}
          >
            Créer mon profil →
          </button>
        </div>
      </div>
    </div>
  )
}
