'use client'
import type { OnboardingOverviewData, OnboardingStep } from './types'

function StepDot({ status }: { status: OnboardingStep['status'] }) {
  if (status === 'completed') {
    return (
      <div className="w-5 h-5 rounded-full bg-bordeaux flex items-center justify-center shrink-0">
        <svg width="10" height="8" viewBox="0 0 10 8" fill="none" aria-hidden="true">
          <path d="M1 4l2.5 2.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    )
  }
  if (status === 'current') {
    return <div className="w-5 h-5 rounded-full bg-highlight shrink-0" />
  }
  return <div className="w-5 h-5 rounded-full border border-gris shrink-0" />
}

function ProgressBar({ steps }: { steps: OnboardingStep[] }) {
  return (
    <div className="flex items-center w-full">
      {steps.map((step, i) => (
        <div key={step.stepKey} className="flex items-center flex-1 last:flex-none">
          <StepDot status={step.status} />
          {i < steps.length - 1 && <div className="flex-1 h-px bg-gris mx-1" />}
        </div>
      ))}
    </div>
  )
}

function CompletedCard({ step }: { step: OnboardingStep }) {
  return (
    <div className="flex items-center justify-between px-5 py-4 rounded-xl bg-creme border border-bordeaux/25 cursor-pointer transition-[background-color,border-color] duration-200 hover:bg-bordeaux/5 hover:border-bordeaux/50 group">
      <div className="flex items-center gap-3">
        <div className="w-5 flex items-center justify-center shrink-0">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <circle cx="8" cy="8" r="7" fill="#4E1A32" />
            <path d="M4.5 8l2.5 2.5 4.5-5" stroke="#FFF6ED" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <span className="font-cormorant text-bordeaux font-light tracking-[0.01em]" style={{ fontSize: 'clamp(14px, 1.6vw, 17px)' }}>
          Étape {step.order} — {step.label}
        </span>
        {step.isPreFilled && (
          <span className="font-josefin text-[10px] uppercase tracking-[0.07em] text-highlight border border-highlight rounded px-[7px] py-[2px]">
            Pré-rempli
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <span className="flex items-center gap-1 font-josefin text-[10px] uppercase tracking-[0.06em] text-bordeaux/44 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <path d="M8.5 1.5l2 2-6 6H2.5v-2l6-6z" stroke="#4E1A32" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Modifier
        </span>
        <span className="font-josefin text-[10px] uppercase tracking-[0.08em] text-bordeaux">
          Complète
        </span>
      </div>
    </div>
  )
}

function CurrentCard({ step }: { step: OnboardingStep }) {
  return (
    <div className="flex items-center justify-between px-5 py-4 rounded-xl bg-creme border border-bordeaux/25 cursor-pointer transition-[background-color,border-color] duration-200 hover:bg-bordeaux/5 hover:border-bordeaux/50">
      <div className="flex items-center gap-3">
        <div className="w-5 flex items-center justify-center shrink-0">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <circle cx="8" cy="8" r="7" stroke="#4E1A32" strokeWidth="1.2" />
            <path d="M8 4.5V8l2 2" stroke="#E35704" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <span className="font-cormorant text-bordeaux font-light tracking-[0.01em]" style={{ fontSize: 'clamp(14px, 1.6vw, 17px)' }}>
          Étape {step.order} — {step.label}
        </span>
      </div>
      <span className="font-josefin text-[10px] uppercase tracking-[0.08em] text-highlight shrink-0">
        À compléter
      </span>
    </div>
  )
}

function PendingCard({ step }: { step: OnboardingStep }) {
  return (
    <div className="flex items-center justify-between px-5 py-4 rounded-xl bg-creme border border-bordeaux/25 opacity-50">
      <div className="flex items-center gap-3">
        <div className="w-5 flex items-center justify-center shrink-0">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <circle cx="8" cy="8" r="7" stroke="#9E8E85" strokeWidth="1.2" />
          </svg>
        </div>
        <span className="font-cormorant text-bordeaux font-light tracking-[0.01em]" style={{ fontSize: 'clamp(14px, 1.6vw, 17px)' }}>
          Étape {step.order} — {step.label}
        </span>
      </div>
      <span className="font-josefin text-[10px] text-gris shrink-0">—</span>
    </div>
  )
}

function StepCard({ step }: { step: OnboardingStep }) {
  if (step.status === 'completed') return <CompletedCard step={step} />
  if (step.status === 'current') return <CurrentCard step={step} />
  return <PendingCard step={step} />
}

export default function OnboardingOverview({
  data,
  token,
}: {
  data: OnboardingOverviewData
  token: string
}) {
  const completedCount = data.steps.filter(s => s.status === 'completed').length
  const remainingCount = data.steps.filter(s => s.status !== 'completed').length

  return (
    <div className="min-h-screen bg-creme px-6 py-12">
      <div className="max-w-lg mx-auto flex flex-col gap-8">
        <img src="/logo.png" alt="Wedly" className="h-16 w-auto mx-auto" />

        <h1 className="font-cormorant text-4xl text-bordeaux text-center">
          <span>{data.firstname}, </span>
          <span className="italic">votre profil vous attend.</span>
        </h1>

        <p className="font-manrope text-gris text-center text-sm">
          Nos équipes ont préparé {completedCount} étapes — il ne vous en reste que {remainingCount}.
        </p>

        <ProgressBar steps={data.steps} />

        <div className="flex flex-col gap-3">
          {data.steps.map(step => (
            <StepCard key={step.stepKey} step={step} />
          ))}
        </div>

        {/* TODO: implémenter la navigation vers l'étape courante */}
        <button
          disabled
          className="w-full bg-bordeaux text-creme font-josefin uppercase tracking-widest text-sm rounded-lg py-4 opacity-50 cursor-not-allowed"
        >
          COMPLÉTER MON PROFIL →
        </button>
      </div>
    </div>
  )
}
