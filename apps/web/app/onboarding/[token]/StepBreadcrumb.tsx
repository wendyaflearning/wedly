'use client'
import React, { useState } from 'react'
import type { OnboardingStep } from './types'

export default function StepBreadcrumb({
  steps,
  currentStepKey,
  onNavigate,
}: {
  steps: OnboardingStep[]
  currentStepKey: string
  onNavigate: (stepKey: string) => void
}) {
  const [hoveredKey, setHoveredKey] = useState<string | null>(null)
  const currentStep = steps.find(s => s.stepKey === currentStepKey)

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', padding: '0 20px' }}>
        {steps.map((step, i) => {
          const isCompleted = step.status === 'completed'
          const isCurrent   = step.stepKey === currentStepKey
          const isPending   = step.status === 'pending'
          const isHovered   = hoveredKey === step.stepKey

          return (
            <React.Fragment key={step.stepKey}>
              <button
                type="button"
                aria-label={`Étape ${step.order} — ${step.label}`}
                disabled={isPending}
                onClick={() => { if (!isPending && !isCurrent) onNavigate(step.stepKey) }}
                onMouseEnter={() => setHoveredKey(step.stepKey)}
                onMouseLeave={() => setHoveredKey(null)}
                style={{
                  flex: '0 0 auto',
                  width: 34,
                  height: 46,
                  padding: 0,
                  background: 'transparent',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: isPending ? 'not-allowed' : 'pointer',
                  position: 'relative',
                }}
              >
                {/* Tooltip */}
                <span style={{
                  position: 'absolute',
                  bottom: 'calc(100% + 6px)',
                  left: '50%',
                  transform: `translateX(-50%) translateY(${isHovered ? 0 : 4}px)`,
                  opacity: isHovered ? 1 : 0,
                  pointerEvents: 'none',
                  transition: 'opacity 0.15s ease, transform 0.15s ease',
                  whiteSpace: 'nowrap',
                  background: 'var(--color-creme)',
                  border: '1px solid rgba(78,26,50,0.15)',
                  borderRadius: 6,
                  padding: '5px 9px',
                  boxShadow: '0 2px 8px rgba(41,26,16,0.10)',
                  zIndex: 10,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 1,
                }}>
                  <span style={{
                    fontFamily: 'var(--font-manrope-var, Manrope, system-ui, sans-serif)',
                    fontSize: 11,
                    fontWeight: 600,
                    lineHeight: 1.3,
                    color: isPending
                      ? 'rgba(41,26,16,0.35)'
                      : isCurrent
                        ? 'var(--color-accent)'
                        : 'var(--color-bordeaux)',
                  }}>
                    {step.label}
                  </span>
                  <span style={{
                    fontFamily: 'var(--font-manrope-var, Manrope, system-ui, sans-serif)',
                    fontSize: 9.5,
                    fontWeight: 500,
                    lineHeight: 1,
                    color: isPending
                      ? 'rgba(41,26,16,0.25)'
                      : isCurrent
                        ? 'rgba(157,79,30,0.7)'
                        : 'rgba(78,26,50,0.5)',
                    letterSpacing: '0.02em',
                    textTransform: 'uppercase',
                  }}>
                    {isCompleted ? 'Complété' : isCurrent ? 'En cours' : 'À venir'}
                  </span>
                  {/* Arrow */}
                  <span style={{
                    position: 'absolute',
                    top: '100%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: 0,
                    height: 0,
                    borderLeft: '5px solid transparent',
                    borderRight: '5px solid transparent',
                    borderTop: '5px solid var(--color-creme)',
                    filter: 'drop-shadow(0 1px 0 rgba(78,26,50,0.12))',
                  }} />
                </span>

                <span style={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: isCompleted
                    ? 'var(--color-bordeaux)'
                    : isCurrent
                      ? 'var(--color-accent)'
                      : 'transparent',
                  border: isPending ? '1.5px solid rgba(41,26,16,0.3)' : 'none',
                  boxShadow: isCurrent
                    ? 'rgba(157,79,30,0.12) 0px 0px 0px 4px'
                    : isHovered && !isPending
                      ? 'rgba(41,26,16,0.10) 0px 0px 0px 4px'
                      : 'none',
                  transform: isHovered && !isPending ? 'scale(1.12)' : 'scale(1)',
                  transition: 'transform 0.15s, box-shadow 0.2s',
                }}>
                  {isCompleted ? (
                    <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                      <path d="M2 5.6l2.3 2.3L9 3" stroke="#FFF6ED" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : (
                    <span style={{
                      fontFamily: 'var(--font-manrope-var, Manrope, system-ui, sans-serif)',
                      fontSize: 11,
                      fontWeight: 600,
                      lineHeight: 1,
                      color: isCurrent ? 'var(--color-creme)' : 'rgba(41,26,16,0.3)',
                    }}>
                      {step.order}
                    </span>
                  )}
                </span>
              </button>
              {i < steps.length - 1 && (
                <span style={{
                  flex: '1 1 auto',
                  height: 2,
                  borderRadius: 2,
                  background: isCompleted ? 'var(--color-bordeaux)' : 'rgba(41,26,16,0.13)',
                  transition: 'background 0.3s',
                }} />
              )}
            </React.Fragment>
          )
        })}
      </div>
      <div style={{ textAlign: 'center', marginTop: 11, minHeight: 30 }}>
        {currentStep && (
          <div style={{
            fontFamily: 'var(--font-manrope-var, Manrope, system-ui, sans-serif)',
            fontSize: 12,
            fontWeight: 500,
            color: 'rgb(41,26,16)',
            letterSpacing: '0.01em',
            transition: 'color 0.15s',
          }}>
            Étape {currentStep.order} — {currentStep.label}
          </div>
        )}
      </div>
    </>
  )
}
