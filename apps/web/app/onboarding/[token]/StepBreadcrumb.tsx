'use client'
import React from 'react'
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
  const currentStep = steps.find(s => s.stepKey === currentStepKey)

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', padding: '0 20px' }}>
        {steps.map((step, i) => {
          const isCompleted = step.status === 'completed'
          const isCurrent   = step.stepKey === currentStepKey
          const isPending   = step.status === 'pending'

          return (
            <React.Fragment key={step.stepKey}>
              <button
                type="button"
                aria-label={`Étape ${step.order} — ${step.label}`}
                disabled={isPending}
                onClick={() => { if (!isPending && !isCurrent) onNavigate(step.stepKey) }}
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
                  boxShadow: isCurrent ? 'rgba(157,79,30,0.12) 0px 0px 0px 4px' : 'none',
                  transform: 'scale(1)',
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
