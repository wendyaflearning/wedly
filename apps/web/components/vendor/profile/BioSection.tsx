'use client'

import { useState, useTransition } from 'react'
import { getSuggestionsForVendorServices } from '@/lib/bio-suggestions'
import { Toast } from '@/components/ui/Toast'
import { useToast } from '@/hooks/useToast'

const MAX = 300
const MIN = 50

const BADGE_LABELS = [
  { num: '01', text: 'Décrivez votre style' },
  { num: '02', text: 'Parlez du mariage qui vous fait vibrer' },
  { num: '03', text: 'Ce qui vous rend unique' },
]

const RADIUS = 22
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

interface Props {
  vendorId: string
  initialBio?: string | null
  vendorServices: string[]
  onBioChange?: (bio: string) => void
}

export function BioSection({ vendorId, initialBio, vendorServices, onBioChange }: Props) {
  const [bio, setBio] = useState(initialBio ?? '')
  const [usedBadges, setUsedBadges] = useState<Set<number>>(new Set())
  const [isPending, startTransition] = useTransition()
  const { toast, showToast } = useToast()

  const suggestions = getSuggestionsForVendorServices(vendorServices)
  const suggestionTexts = [suggestions.style, suggestions.mariage, suggestions.unique]

  const chars = bio.length
  const isOverLimit = chars > MAX
  const isNearLimit = chars >= 250 && !isOverLimit
  const isDisabled = chars < MIN || isOverLimit || isPending

  const progress = Math.min(chars / MAX, 1)
  const dashOffset = CIRCUMFERENCE * (1 - progress)

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const value = e.target.value
    setBio(value)
    onBioChange?.(value)
  }

  function handleBadgeClick(index: number) {
    if (usedBadges.has(index)) return
    const text = suggestionTexts[index]
    const newBio = bio ? bio + ' ' + text : text
    setBio(newBio)
    onBioChange?.(newBio)
    setUsedBadges((prev) => new Set([...prev, index]))
  }

  function handleSubmit() {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/vendors/${vendorId}/bio`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bio }),
        })
        if (res.ok) {
          showToast('success', 'Bio enregistrée ✓')
        } else {
          const data = await res.json()
          const msg =
            data?.violations?.[0]?.title ??
            data?.detail ??
            data?.error ??
            'Une erreur est survenue.'
          showToast('error', msg)
        }
      } catch {
        showToast('error', 'Une erreur est survenue.')
      }
    })
  }

  const usedCount = usedBadges.size

  return (
    <div className="flex-1 min-w-0">
      <Toast toast={toast} />

      {/* Suggestion counter */}
      <p className="font-manrope text-sm text-gris mb-4">
        {usedCount} / 3 suggestion{usedCount !== 1 ? 's' : ''} utilisée{usedCount !== 1 ? 's' : ''}
      </p>

      {/* Card — transparent on mobile, white on desktop */}
      <div className="md:bg-white md:rounded-2xl md:border md:border-bordeaux/[0.08] md:p-6 md:shadow-sm space-y-2 md:space-y-0">

        {/* Badge 01 — prominent */}
        <button
          onClick={() => handleBadgeClick(0)}
          disabled={usedBadges.has(0)}
          className={[
            'w-full flex items-center justify-between rounded-full px-4 py-2.5 md:mb-2 transition-all',
            usedBadges.has(0)
              ? 'bg-bordeaux/[0.08] cursor-not-allowed'
              : 'bg-bordeaux hover:bg-bordeaux/90 cursor-pointer active:scale-[0.99]',
          ].join(' ')}
        >
          <span className="flex items-center gap-2">
            <span
              className={[
                'font-manrope text-[10px] font-semibold tracking-[0.1em]',
                usedBadges.has(0) ? 'text-gris' : 'text-creme/60',
              ].join(' ')}
            >
              {BADGE_LABELS[0].num}
            </span>
            {/* Séparateur mobile uniquement */}
            <span
              className={[
                'md:hidden text-xs',
                usedBadges.has(0) ? 'text-gris/40' : 'text-creme/30',
              ].join(' ')}
              aria-hidden
            >
              |
            </span>
            <span
              className={[
                'font-manrope text-xs',
                usedBadges.has(0) ? 'text-gris' : 'text-creme',
              ].join(' ')}
            >
              {BADGE_LABELS[0].text}
            </span>
          </span>
          {usedBadges.has(0) ? (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
              <path d="M2 7L5.5 10.5L12 3.5" stroke="#9E8E85" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
              <path d="M5 3l4 4-4 4" stroke="rgba(255,246,237,0.6)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </button>

        {/* Badges 02 & 03 */}
        {/* Mobile: rectangular cards avec numéro en haut */}
        {/* Desktop: pills inline */}
        <div className="flex gap-2 md:mb-5">
          {[1, 2].map((idx) => (
            <button
              key={idx}
              onClick={() => handleBadgeClick(idx)}
              disabled={usedBadges.has(idx)}
              className={[
                'flex-1 transition-all text-left',
                // Mobile: rectangular card, numéro en haut
                'flex flex-col gap-1 rounded-xl p-3',
                // Desktop: pill inline
                'md:inline-flex md:flex-row md:items-center md:justify-between md:gap-1.5 md:rounded-full md:px-3 md:py-1.5',
                usedBadges.has(idx)
                  ? 'bg-bordeaux/[0.04] border border-bordeaux/[0.08] text-gris cursor-not-allowed'
                  : 'border border-bordeaux/15 text-bordeaux/60 hover:border-bordeaux/30 cursor-pointer',
              ].join(' ')}
            >
              <span className="font-manrope text-[10px] text-gris shrink-0">{BADGE_LABELS[idx].num}</span>
              <span className="font-manrope text-xs leading-snug">{BADGE_LABELS[idx].text}</span>
              {usedBadges.has(idx) && (
                <svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden className="shrink-0 md:ml-auto">
                  <path d="M2 7L5.5 10.5L12 3.5" stroke="#9E8E85" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>
          ))}
        </div>

        {/* Textarea — fond propre sur mobile */}
        <textarea
          value={bio}
          onChange={handleChange}
          rows={8}
          className="w-full resize-none font-manrope text-sm text-texte placeholder:text-gris/40 rounded-xl p-4 focus:outline-none transition-colors leading-relaxed bg-white border border-bordeaux/[0.06] focus:border-bordeaux/20 md:bg-transparent md:border-bordeaux/10 md:focus:border-bordeaux/25"
          placeholder="Votre plume, votre voix..."
        />
      </div>

      {/* Compteur */}
      <div className="flex items-center gap-3 mt-5">
        <div className="relative flex items-center justify-center shrink-0">
          <svg width="54" height="54" viewBox="0 0 54 54" aria-hidden>
            <circle
              cx="27" cy="27" r={RADIUS}
              fill="none"
              stroke="currentColor"
              strokeOpacity="0.1"
              strokeWidth="2.5"
              className="text-bordeaux"
            />
            <circle
              cx="27" cy="27" r={RADIUS}
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={dashOffset}
              transform="rotate(-90 27 27)"
              style={{ transition: 'stroke-dashoffset 0.15s ease, color 0.15s ease' }}
              className={isOverLimit ? 'text-highlight' : isNearLimit ? 'text-accent' : 'text-accent'}
            />
          </svg>
          <span
            className={[
              'absolute font-manrope text-xs font-semibold tabular-nums',
              isOverLimit ? 'text-highlight' : 'text-bordeaux',
            ].join(' ')}
          >
            {chars}
          </span>
        </div>
        <span className="font-manrope text-sm text-gris">/ {MAX} caractères</span>

        {/* CTA desktop — inline */}
        <button
          onClick={handleSubmit}
          disabled={isDisabled}
          className="hidden md:flex ml-auto bg-bordeaux text-creme font-manrope text-[11px] font-semibold tracking-[0.14em] uppercase px-7 py-3.5 rounded-full disabled:opacity-40 disabled:cursor-not-allowed hover:bg-bordeaux/90 active:scale-[0.98] transition-all items-center gap-2 whitespace-nowrap"
        >
          {isPending ? (
            <>
              <span className="w-3.5 h-3.5 border-2 border-creme/40 border-t-creme rounded-full animate-spin" />
              Enregistrement...
            </>
          ) : (
            'Terminer ma bio →'
          )}
        </button>
      </div>

      {/* CTA mobile — pleine largeur dans le flux */}
      <button
        onClick={handleSubmit}
        disabled={isDisabled}
        className="md:hidden w-full mt-4 bg-bordeaux text-creme font-manrope text-[11px] font-semibold tracking-[0.14em] uppercase py-4 rounded-full disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.99] transition-all flex items-center justify-center gap-2"
      >
        {isPending ? (
          <>
            <span className="w-3.5 h-3.5 border-2 border-creme/40 border-t-creme rounded-full animate-spin" />
            Enregistrement...
          </>
        ) : (
          'Terminer ma bio →'
        )}
      </button>
    </div>
  )
}
