'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'

const GUIDE_KEY = 'wedly_guide_seen'

const GuideCtx = createContext<{ open: () => void } | null>(null)

interface StepConfig {
  eyebrow: string
  titleBefore: string
  titleItalic: string
  body: string
  cta: string
}

const STEPS: StepConfig[] = [
  {
    eyebrow: 'Bienvenue',
    titleBefore: 'On vous a posé ',
    titleItalic: 'beaucoup de questions...',
    body: "Votre style, vos tarifs, vos expériences passées... On sait, c'était long. Mais c'était pour une bonne raison : chaque couple qui apparaît dans votre Wedmatch a déjà été filtré pour correspondre à qui vous êtes. Pas de volume, que des contacts qui vous ressemblent.",
    cta: 'Suivant',
  },
  {
    eyebrow: 'Comment ça marche',
    titleBefore: 'Cinq couples par jour, ',
    titleItalic: 'choisis pour vous.',
    body: "Chaque matin, votre Wedmatch s'enrichit de cinq nouveaux couples qui correspondent à votre style, votre zone et vos tarifs. À vous de décider lesquels vous intéressent — un like, un passe, en quelques secondes. C'est vous qui choisissez en premier.",
    cta: 'Suivant',
  },
  {
    eyebrow: 'Le match',
    titleBefore: 'Quand le couple vous like en retour, ',
    titleItalic: "c'est un match.",
    body: "La messagerie s'ouvre instantanément des deux côtés. Pas d'attente, pas d'enchères, pas de rappels commerciaux : juste une conversation qui démarre entre vous et un couple qui a déjà envie de vous parler.",
    cta: 'Suivant',
  },
  {
    eyebrow: 'À vous',
    titleBefore: 'Plus que ',
    titleItalic: 'quelques étapes.',
    body: "Disponibilités, photos, bio, vérification : quatre gestes simples pour que votre profil apparaisse en Wedmatch. On vous les présente juste après — vous pouvez tout faire en moins de quinze minutes.",
    cta: 'Commencer',
  },
]

function IllustrationStep1() {
  return (
    <div className="relative" style={{ width: 170, height: 110 }}>
      <div className="absolute left-0 w-[110px] h-[110px] rounded-full border border-bordeaux/[0.22] bg-bordeaux/[0.03]" />
      <div className="absolute right-0 w-[110px] h-[110px] rounded-full border border-bordeaux/[0.18] bg-bordeaux/[0.05]" />
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-accent z-10" />
    </div>
  )
}

function IllustrationStep2() {
  return (
    <div className="flex items-end gap-1.5 md:gap-2">
      {[0, 1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className={`w-[44px] md:w-[54px] h-[66px] md:h-[82px] rounded-sm border flex items-center justify-center ${
            i === 2
              ? 'border-accent/40 bg-accent/[0.04]'
              : 'border-bordeaux/[0.18] bg-transparent'
          }`}
        >
          {i === 2 && (
            <span className="font-cormorant italic font-light text-[34px] md:text-[44px] leading-none text-accent">
              5
            </span>
          )}
        </div>
      ))}
    </div>
  )
}

function IllustrationStep3() {
  return (
    <div className="relative flex items-center" style={{ width: 196, height: 96 }}>
      <div className="absolute left-0 w-[96px] h-[96px] rounded-full border border-bordeaux/[0.22] flex items-center justify-center">
        <span className="font-cormorant italic text-sm font-light text-bordeaux/60">vous</span>
      </div>
      <div className="absolute right-0 w-[96px] h-[96px] rounded-full border border-bordeaux/[0.22] flex items-center justify-center">
        <span className="font-cormorant italic text-sm font-light text-bordeaux/60">elles</span>
      </div>
      <div className="absolute left-[50%] -translate-x-[50%] w-9 h-9 rounded-full bg-accent flex items-center justify-center z-10">
        <svg width="14" height="10" viewBox="0 0 14 10" fill="none">
          <path d="M1.5 5L5.5 9L12.5 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  )
}

function IllustrationStep4() {
  return (
    <div className="flex items-center gap-3">
      {[1, 2, 3, 4].map((n) => (
        <div
          key={n}
          className="w-[48px] h-[48px] md:w-[54px] md:h-[54px] rounded-full border border-accent/50 flex items-center justify-center"
        >
          <span className="font-cormorant italic font-light text-[18px] md:text-[20px] leading-none text-accent">
            {n}
          </span>
        </div>
      ))}
    </div>
  )
}

const ILLUSTRATIONS = [IllustrationStep1, IllustrationStep2, IllustrationStep3, IllustrationStep4]

function GuideModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0)
  const current = STEPS[step]
  const Illustration = ILLUSTRATIONS[step]
  const isLast = step === STEPS.length - 1

  // Swipe-to-close
  const [dragY, setDragY] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const touchStartY = useRef(0)
  const dragActive = useRef(false)
  const modalPanelRef = useRef<HTMLDivElement>(null)

  const handleNext = () => {
    if (isLast) {
      onClose()
    } else {
      setStep((s) => s + 1)
    }
  }

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  function onTouchStart(e: React.TouchEvent) {
    const touch = e.touches[0]
    touchStartY.current = touch.clientY
    // Activer le drag uniquement si le toucher démarre dans les 64px supérieurs du panel
    if (modalPanelRef.current) {
      const rect = modalPanelRef.current.getBoundingClientRect()
      dragActive.current = touch.clientY - rect.top < 64
    }
  }

  function onTouchMove(e: React.TouchEvent) {
    if (!dragActive.current) return
    const delta = e.touches[0].clientY - touchStartY.current
    if (delta > 0) {
      setIsDragging(true)
      setDragY(delta)
    }
  }

  function onTouchEnd() {
    if (!dragActive.current) return
    dragActive.current = false
    setIsDragging(false)
    if (dragY > 80) {
      onClose()
    } else {
      setDragY(0)
    }
  }

  return (
    <div className="fixed inset-0 z-[60] bg-black/50 md:flex md:items-center md:justify-center">
      <div className="absolute inset-0" onClick={onClose} />

      <div
        ref={modalPanelRef}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        className="modal-enter z-10 fixed inset-x-0 bottom-0 md:relative md:inset-auto md:max-w-[700px] md:w-full md:mx-4 rounded-t-2xl md:rounded-xl overflow-hidden flex flex-col"
        style={{
          maxHeight: '92vh',
          transform: `translateY(${dragY}px)`,
          transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.32,0.72,0,1)',
        }}
      >
        {/* Drag handle — mobile only */}
        <div className="md:hidden bg-creme pt-3 pb-0 flex justify-center cursor-grab active:cursor-grabbing">
          <div className="w-9 h-1 rounded-full bg-bordeaux/20" />
        </div>

        {/* Contenu (fond crème) */}
        <div className="bg-creme relative flex-1 overflow-y-auto px-6 pt-5 pb-8 md:px-14 md:pt-11 md:pb-10">
          {/* Arcs décoratifs */}
          <div className="absolute -bottom-24 -left-24 w-[300px] h-[300px] md:w-[380px] md:h-[380px] rounded-full border border-bordeaux/[0.07] pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-[160px] h-[160px] md:w-[210px] md:h-[210px] rounded-full border border-bordeaux/[0.05] pointer-events-none" />

          {/* En-tête mobile : eyebrow + croix */}
          <div className="md:hidden flex items-center justify-between mb-7">
            <p className="font-manrope text-[10px] font-medium tracking-[0.22em] uppercase text-bordeaux/50">
              {current.eyebrow} · {step + 1} / {STEPS.length}
            </p>
            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center text-bordeaux/40 hover:text-bordeaux transition-colors text-xl leading-none"
              aria-label="Fermer"
            >
              ×
            </button>
          </div>

          {/* Eyebrow desktop */}
          <p className="hidden md:block font-manrope text-[11px] font-medium tracking-[0.22em] uppercase text-bordeaux/50 mb-9">
            {current.eyebrow} · {step + 1} / {STEPS.length}
          </p>

          {/* Croix desktop */}
          <button
            onClick={onClose}
            className="hidden md:flex absolute top-7 right-8 w-8 h-8 items-center justify-center text-bordeaux/40 hover:text-bordeaux transition-colors text-xl leading-none"
            aria-label="Fermer"
          >
            ×
          </button>

          {/* Illustration mobile (avant le texte) */}
          <div className="md:hidden flex justify-center mb-8">
            <Illustration />
          </div>

          {/* Titre */}
          <h2 className="font-cormorant font-light text-[26px] md:text-[40px] leading-[1.1] tracking-[-0.015em] text-bordeaux">
            {current.titleBefore}
            <em className="text-accent">{current.titleItalic}</em>
          </h2>

          {/* Corps */}
          <p className="mt-4 md:mt-5 font-manrope text-[13px] md:text-[14px] leading-relaxed text-bordeaux/65 max-w-[580px]">
            {current.body}
          </p>

          {/* Illustration desktop (après le texte) */}
          <div className="hidden md:flex mt-9 mb-1">
            <Illustration />
          </div>
        </div>

        {/* Footer crème */}
        <div className="bg-creme border-t border-bordeaux/[0.08] shrink-0 px-6 md:px-10 py-4 md:py-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`rounded-full transition-all duration-300 ${
                  i === step ? 'w-8 h-[3px] bg-bordeaux' : 'w-[6px] h-[6px] bg-bordeaux/20'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-5 md:gap-7">
            <button
              onClick={onClose}
              className="font-manrope text-[10px] md:text-[11px] font-medium tracking-[0.16em] uppercase text-bordeaux/40 hover:text-bordeaux transition-colors"
            >
              Passer
            </button>
            <button
              onClick={handleNext}
              className="inline-flex items-center gap-2 px-5 md:px-6 py-2.5 md:py-3 rounded-full bg-accent text-creme font-manrope text-[10px] md:text-[11px] font-semibold tracking-[0.14em] uppercase hover:bg-accent/90 transition-colors"
            >
              {current.cta}
              {!isLast && <span aria-hidden>→</span>}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export function GuideTrigger({ children, className }: { children?: ReactNode; className?: string }) {
  const ctx = useContext(GuideCtx)
  return (
    <button onClick={ctx?.open} className={className}>
      {children}
    </button>
  )
}

export function GuideProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)

  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => {
    localStorage.setItem(GUIDE_KEY, '1')
    setIsOpen(false)
  }, [])

  useEffect(() => {
    if (!localStorage.getItem(GUIDE_KEY)) setIsOpen(true)
  }, [])

  return (
    <GuideCtx.Provider value={{ open }}>
      {children}
      {isOpen && <GuideModal onClose={close} />}
    </GuideCtx.Provider>
  )
}
