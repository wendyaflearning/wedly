'use client'

import { useState, useTransition } from 'react'

const MAX = 300
const MIN = 50

const SUGGESTIONS = [
  { num: '01', text: 'Décrivez votre style' },
  { num: '02', text: 'Parlez du type de mariage qui vous fait vibrer' },
  { num: '03', text: 'Ce qui vous rend unique dans votre métier' },
]

const RADIUS = 22
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

function getSuggestion(chars: number) {
  if (chars === 0) return null
  if (chars <= 100) return { index: 0, label: '1 / 3' }
  if (chars <= 200) return { index: 1, label: '2 / 3' }
  return { index: 2, label: chars >= 250 ? '3 / 3 · presque terminé' : '3 / 3' }
}

interface Props {
  initialBio?: string | null
  onBioChange?: (bio: string) => void
}

export function BioSection({ initialBio, onBioChange }: Props) {
  const [bio, setBio] = useState(initialBio ?? '')
  const [isPending, startTransition] = useTransition()
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const chars = bio.length
  const suggestion = getSuggestion(chars)
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

  function showToast(type: 'success' | 'error', message: string) {
    setToast({ type, message })
    setTimeout(() => setToast(null), 5000)
  }

  function handleSubmit() {
    startTransition(async () => {
      try {
        const res = await fetch('/api/vendors/me/bio', {
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

  return (
    <div className="flex-1 min-w-0">
      {/* Toast */}
      {toast && (
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
      )}

      {/* Suggestion label */}
      {suggestion ? (
        <p className="font-manrope text-sm text-gris mb-4">
          Suggestion {suggestion.label}
        </p>
      ) : (
        <p className="font-cormorant italic text-xl text-bordeaux/40 mb-4">
          Commencez à écrire...
        </p>
      )}

      {/* Card */}
      <div className="bg-white rounded-2xl border border-bordeaux/[0.08] p-6 shadow-sm">

        {/* Empty state header */}
        {!suggestion && (
          <div className="relative mb-5 overflow-hidden">
            <p className="font-manrope text-[10px] font-semibold tracking-[0.16em] uppercase text-accent/70 mb-3">
              Champ libre · 300 caractères
            </p>
            <p className="font-cormorant text-3xl text-bordeaux leading-tight">
              Votre voix,{' '}
              <span className="italic text-accent">au fil des mots.</span>
            </p>
            <p className="font-manrope text-sm text-gris mt-2 leading-relaxed">
              Trois suggestions progressives apparaîtront pendant votre saisie.
              Aucune contrainte, juste un fil conducteur.
            </p>
            {/* Decorative "300" watermark */}
            <span
              className="absolute right-0 top-0 font-cormorant text-[88px] font-bold leading-none text-bordeaux/[0.04] select-none pointer-events-none"
              aria-hidden
            >
              300
            </span>
          </div>
        )}

        {/* Active suggestion chip */}
        {suggestion && (
          <div className="mb-4">
            <span className="inline-flex items-center gap-2 bg-bordeaux text-creme rounded-full px-4 py-2">
              <span className="font-manrope text-[10px] font-semibold tracking-[0.1em]">
                {SUGGESTIONS[suggestion.index].num}
              </span>
              <span className="font-manrope text-xs">
                {SUGGESTIONS[suggestion.index].text}
              </span>
            </span>
          </div>
        )}

        {/* Textarea */}
        <textarea
          value={bio}
          onChange={handleChange}
          rows={suggestion ? 8 : 4}
          className="w-full resize-none font-manrope text-sm text-texte placeholder:text-gris/40 border border-bordeaux/10 rounded-xl p-4 focus:outline-none focus:border-bordeaux/25 transition-colors leading-relaxed bg-transparent"
          placeholder={suggestion ? '' : ''}
        />

        {/* Intro chips — empty state only */}
        {!suggestion && (
          <div className="flex flex-wrap gap-2 mt-4">
            {SUGGESTIONS.map((s) => (
              <span
                key={s.num}
                className="inline-flex items-center gap-1.5 border border-bordeaux/15 rounded-full px-3 py-1.5 font-manrope text-xs text-bordeaux/60"
              >
                <span className="text-[10px] text-gris">{s.num}</span>
                {s.text}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Bottom row: circular counter + CTA */}
      <div className="flex items-center gap-3 mt-5">
        {/* Circular SVG counter */}
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

        {/* CTA */}
        <button
          onClick={handleSubmit}
          disabled={isDisabled}
          className="ml-auto bg-bordeaux text-creme font-manrope text-[11px] font-semibold tracking-[0.14em] uppercase px-7 py-3.5 rounded-full disabled:opacity-40 disabled:cursor-not-allowed hover:bg-bordeaux/90 active:scale-[0.98] transition-all flex items-center gap-2 whitespace-nowrap"
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
    </div>
  )
}
