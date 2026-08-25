'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import {
  Bell,
  CalendarDays,
  Camera,
  Check,
  Coins,
  Flower2,
  MapPin,
  UtensilsCrossed,
  Users,
} from 'lucide-react'
import {
  WedreamJourneyPreview,
  type JourneyPhase,
} from '@/components/wedream/WedreamJourneyPreview'
import {
  GALLERY_CELL_COUNT,
  JOURNEY_PLACEHOLDER_BG,
  JOURNEY_TRADE_CIRCLE_BG,
  resolveVendorTrade,
  type VendorTrade,
} from '@/lib/wedream-journey'

// Bump v2 : le guide passe de Wedmatch à WedDream, les prestataires déjà
// onboardés doivent revoir le nouveau contenu une fois (WED-122, CA5).
const GUIDE_KEY = 'wedly_guide_seen_v2'

const GuideCtx = createContext<{ open: () => void } | null>(null)

/** Données réelles injectées depuis le dashboard, disponibles pour chaque étape. */
type GuideStepContext = {
  vendorServices: string[]
}

interface StepConfig {
  eyebrow: string
  titleBefore: string
  titleItalic: string
  body: string
  cta: string
  /** Rendu sous le corps de texte, avant l'illustration desktop. */
  afterBody?: ReactNode
  renderIllustration: (ctx: GuideStepContext) => ReactNode
}

/* ────────────────────────────────────────────────────────────────────────────
   Étape 1 — « Pourquoi WedDream » : illustration statique
   ──────────────────────────────────────────────────────────────────────────── */

function HeartGlyph({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 26 26" fill="none" aria-hidden="true">
      <path
        d="M13 21.5s-9-5.6-9-12.2C4 5.9 6.4 4 9 4c1.8 0 3.3 1 4 2.4C13.7 5 15.2 4 17 4c2.6 0 5 1.9 5 5.3 0 6.6-9 12.2-9 12.2z"
        fill="var(--color-accent)"
      />
    </svg>
  )
}

function SpotlightIllustration() {
  return (
    <div className="relative w-[120px] h-[120px]">
      <span className="absolute inset-0 rounded-full border border-bordeaux opacity-35" />
      <span className="absolute inset-5 rounded-full border border-bordeaux opacity-60" />
      <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <HeartGlyph size={26} />
      </span>
    </div>
  )
}

/* ────────────────────────────────────────────────────────────────────────────
   Étape 2 — « Comment ça marche » : le parcours d'un couple, 5 phases
   ──────────────────────────────────────────────────────────────────────────── */

/**
 * Voisins génériques de la bulle métier. Le prestataire connecté occupe toujours
 * la bulle du milieu ; on retire son propre métier de ce vivier pour ne pas
 * afficher deux fois la même catégorie.
 */
const NEIGHBOUR_TRADES: VendorTrade[] = [
  { label: 'Traiteur', icon: UtensilsCrossed },
  { label: 'Fleuriste', icon: Flower2 },
  { label: 'Photographe', icon: Camera },
]

/** Bulle mise en avant quand `resolveVendorTrade` ne reconnaît aucun service. */
const DEFAULT_SELECTED_TRADE = NEIGHBOUR_TRADES[2]

/**
 * Dégradés et libellés repris de la maquette Claude Design « Guide prestataire -
 * WedDream » (.spec-card.grad-*). Les trois libellés sont de vraies valeurs de la
 * taxonomie de tags (SeedPortfolioTagTaxonomyCommand.php, « Univers »).
 */
const SPECIALTY_CARDS = [
  { label: 'Champêtre', gradient: 'linear-gradient(135deg,#5C2038,#3A1425)' },
  { label: 'Bohème', gradient: 'linear-gradient(135deg,#E7BC9E,#C68F5F)' },
  { label: 'Intimiste', gradient: 'linear-gradient(135deg,#B5652E,#8A3E16)' },
]

const SELECTED_SPECIALTY_INDEX = 1

/** Les quatre détails de mariage transmis avec la demande. */
const WEDDING_DETAILS = [
  { label: 'Date', icon: CalendarDays },
  { label: 'Invités', icon: Users },
  { label: 'Budget', icon: Coins },
  { label: 'Lieu', icon: MapPin },
]

/** Case de la galerie qui reçoit le cœur — la 2e, comme en mode `personalized`. */
const GALLERY_HIGHLIGHT_INDEX = 1

function Caption({ children }: { children: ReactNode }) {
  return <strong className="font-semibold text-accent">{children}</strong>
}

function TradeBubble({ trade, selected }: { trade: VendorTrade; selected: boolean }) {
  const TradeIcon = trade.icon

  return (
    <div
      className={`flex flex-col items-center gap-2 transition-transform duration-300 ${
        selected ? '-translate-y-1' : ''
      }`}
    >
      <span
        className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 ${
          selected
            ? 'scale-[1.08] shadow-[0_0_0_2px_var(--color-accent),0_0_0_10px_color-mix(in_srgb,var(--color-accent)_10%,transparent)]'
            : ''
        }`}
        style={{ background: JOURNEY_TRADE_CIRCLE_BG }}
      >
        <TradeIcon
          size={22}
          strokeWidth={1.5}
          className={selected ? 'text-accent' : 'text-bordeaux/45'}
          aria-hidden="true"
        />
      </span>
      <span className="font-cormorant italic text-[13px] text-bordeaux">{trade.label}</span>
    </div>
  )
}

/** Phase 1 — le métier réel du prestataire, entouré de deux catégories voisines. */
function TradeBubblesSlide({ trade }: { trade: VendorTrade }) {
  const neighbours = NEIGHBOUR_TRADES.filter((n) => n.label !== trade.label).slice(0, 2)

  return (
    <div className="flex gap-7">
      <TradeBubble trade={neighbours[0]} selected={false} />
      <TradeBubble trade={trade} selected />
      <TradeBubble trade={neighbours[1]} selected={false} />
    </div>
  )
}

/** Phase 2 — les cartes spécialité, référence visuelle SpecialtyCard.tsx. */
function SpecialtyCardsSlide() {
  return (
    <div className="flex gap-5 items-end">
      {SPECIALTY_CARDS.map((card, index) => (
        <div
          key={card.label}
          className={`w-16 h-20 rounded-[5px] flex items-end justify-center pb-2 transition-all duration-300 ${
            index === SELECTED_SPECIALTY_INDEX
              ? '-translate-y-1 shadow-[0_0_0_2px_color-mix(in_srgb,var(--color-accent)_50%,transparent),0_10px_22px_rgba(78,26,50,0.22)]'
              : 'shadow-[0_6px_14px_rgba(78,26,50,0.14)]'
          }`}
          style={{ background: card.gradient }}
        >
          <span className="font-cormorant font-light text-[10.5px] text-white">{card.label}</span>
        </div>
      ))}
    </div>
  )
}

/** Phase 3 — la galerie générique : aucune photo réelle dans le guide. */
function GallerySlide() {
  return (
    <div className="grid grid-cols-4 gap-1.5">
      {Array.from({ length: GALLERY_CELL_COUNT }, (_, index) => {
        const highlighted = index === GALLERY_HIGHLIGHT_INDEX

        return (
          <div
            key={index}
            className={`relative w-[52px] h-[39px] rounded-[5px] transition-transform duration-300 ${
              highlighted ? 'scale-[1.08] shadow-[0_6px_16px_rgba(78,26,50,0.22)]' : ''
            }`}
            style={{ background: JOURNEY_PLACEHOLDER_BG }}
          >
            {highlighted && (
              <span className="wedream-heart-pop absolute top-1/2 left-1/2">
                <HeartGlyph size={20} />
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}

/** Phase 4 — les détails du mariage joints à la demande. */
function WeddingDetailsSlide() {
  return (
    <div className="flex gap-6">
      {WEDDING_DETAILS.map((detail) => {
        const DetailIcon = detail.icon

        return (
          <div key={detail.label} className="flex flex-col items-center gap-2">
            <span className="w-11 h-11 rounded-full bg-white border border-bordeaux/[0.18] flex items-center justify-center">
              <DetailIcon size={20} strokeWidth={1.4} className="text-accent" aria-hidden="true" />
            </span>
            <span className="text-[10.5px] font-semibold text-bordeaux">{detail.label}</span>
          </div>
        )
      })}
    </div>
  )
}

/** Phase 5 — la notification côté prestataire. */
function RequestNotificationSlide() {
  return (
    <div className="flex items-center gap-3.5 bg-white rounded-xl shadow-[0_8px_20px_rgba(41,26,16,0.12)] px-[22px] py-3.5">
      <span className="relative w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
        <Bell size={18} strokeWidth={1.5} className="text-accent" aria-hidden="true" />
        <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-highlight border-2 border-white" />
      </span>
      <div>
        <p className="text-[13px] font-bold text-texte">Nouvelle demande</p>
        <p className="text-[11.5px] text-texte/55 mt-0.5">via WedDream</p>
      </div>
    </div>
  )
}

function CoupleJourneyIllustration({ vendorServices }: { vendorServices: string[] }) {
  const phases = useMemo<JourneyPhase[]>(() => {
    // `vendorServices` est garanti rempli dès le statut `active` (Professions est
    // la step 1 de l'onboarding) : le repli sur la bulle générique de la maquette
    // n'existe que pour satisfaire TypeScript.
    const trade = resolveVendorTrade(vendorServices) ?? DEFAULT_SELECTED_TRADE

    return [
      {
        key: 'trade',
        content: <TradeBubblesSlide trade={trade} />,
        legend: <Caption>Il choisit votre métier</Caption>,
      },
      {
        key: 'specialty',
        content: <SpecialtyCardsSlide />,
        legend: <Caption>Il affine son style</Caption>,
      },
      {
        key: 'gallery',
        content: <GallerySlide />,
        legend: <Caption>Il craque pour votre univers</Caption>,
      },
      {
        key: 'details',
        content: <WeddingDetailsSlide />,
        legend: <Caption>Il partage les détails de son mariage</Caption>,
      },
      {
        key: 'notification',
        content: <RequestNotificationSlide />,
        legend: <Caption>Vous recevez la demande aussitôt</Caption>,
      },
    ]
  }, [vendorServices])

  return (
    <WedreamJourneyPreview
      phases={phases}
      title="Comment un couple vous découvre"
      className="w-full"
    />
  )
}

/* ────────────────────────────────────────────────────────────────────────────
   Étape 3 — « Le tagging » : de la pastille orange à la galerie, 6 phases
   ──────────────────────────────────────────────────────────────────────────── */

const TONE_BG = {
  rose: '#E9C9B3',
  plum: '#7A3A55',
  sand: '#D9C2A6',
  rust: '#C97448',
}

const VIGNETTE_TONES = [TONE_BG.rose, TONE_BG.plum, TONE_BG.sand]

/** Vignette qui porte la pastille dans les phases 1 et 4. */
const TAGGED_VIGNETTE_INDEX = 1

const STYLE_CHIPS = ['Champêtre', 'Classique', 'Moderne', 'Bohème']
const SELECTED_STYLE_CHIP_INDEX = 1

const EXTRA_CHIPS = ['Golden hour', 'Extérieur', 'Complices', 'Détails', 'Noir & blanc']
const SELECTED_EXTRA_CHIP_INDEXES = [0, 2]

function PortfolioRowSlide({ tagged }: { tagged: boolean }) {
  return (
    <div className="flex gap-2 items-start justify-center">
      <div className="w-16 h-16 rounded-lg" style={{ background: TONE_BG.plum }} />

      {VIGNETTE_TONES.map((tone, index) => (
        <div
          key={tone}
          className="relative w-10 h-10 rounded-lg self-end"
          style={{ background: tone }}
        >
          {index === TAGGED_VIGNETTE_INDEX && (
            <span
              className={`absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center ${
                tagged ? 'bg-bordeaux' : 'bg-highlight animate-pulse'
              }`}
            >
              {tagged && <Check size={10} strokeWidth={2.4} className="text-white" aria-hidden="true" />}
            </span>
          )}
        </div>
      ))}
    </div>
  )
}

function TagChip({ label, selected, small }: { label: string; selected: boolean; small?: boolean }) {
  return (
    <span
      className={`rounded-full border text-[11px] font-semibold ${
        small ? 'px-3 py-[5px] text-[10px]' : 'px-3.5 py-[7px]'
      } ${
        selected
          ? 'bg-bordeaux text-creme border-bordeaux'
          : 'bg-white text-bordeaux border-[#eaded2]'
      }`}
    >
      {label}
    </span>
  )
}

function TagModalSlide({
  eyebrow,
  question,
  children,
}: {
  eyebrow: string
  question?: string
  children: ReactNode
}) {
  return (
    <div className="bg-white rounded-xl shadow-[0_8px_20px_rgba(41,26,16,0.12)] px-5 py-4 w-[260px] max-w-full">
      <p className="text-[9.5px] font-bold tracking-[0.14em] uppercase text-accent mb-2">
        {eyebrow}
      </p>
      {question && (
        <p className="font-cormorant italic text-[16px] text-bordeaux mb-3">{question}</p>
      )}
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  )
}

/**
 * Miniature du panneau d'activation réel (WedreamVisibilityClient.tsx) : titre,
 * accroche raccourcie et toggle **éteint**. Un prestataire qui découvre le guide
 * n'a encore rien activé — c'est « Activer WedDream » qu'il verra en arrivant sur
 * l'écran, pas l'inverse.
 */
function WedreamActivationSlide() {
  return (
    <div className="w-[250px] max-w-full bg-white rounded-[10px] shadow-[0_8px_20px_rgba(41,26,16,0.12)] px-4 py-3.5 flex flex-col items-center text-center gap-2">
      <p className="font-cormorant font-medium text-[15px] tracking-[-0.01em] leading-tight text-bordeaux">
        Partagez votre univers dans WedDream
      </p>

      <p className="font-manrope text-[10px] leading-snug text-bordeaux/60">
        Vos photos taguées sont prêtes à être découvertes.
      </p>

      <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border-[1.5px] border-accent bg-transparent">
        {/* État éteint : piste `bordeaux/[0.18]` et rond à gauche, comme L363-376 du vrai écran. */}
        <span className="relative w-[26px] h-[15px] rounded-full bg-bordeaux/[0.18] shrink-0">
          <span className="absolute top-[2px] left-[2px] w-[11px] h-[11px] rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.2)]" />
        </span>
        <span className="text-[10px] font-bold tracking-[0.02em] text-accent">Activer WedDream</span>
      </span>
    </div>
  )
}

function PublicGallerySlide() {
  return (
    <div className="w-[250px] rounded-[10px] overflow-hidden shadow-[0_8px_20px_rgba(41,26,16,0.12)] bg-white">
      <div className="h-[22px] bg-[#F5EBE0] flex items-center gap-[5px] px-2.5">
        {[0, 1, 2].map((dot) => (
          <span key={dot} className="w-1.5 h-1.5 rounded-full bg-bordeaux/[0.18]" />
        ))}
      </div>
      <div className="grid grid-cols-[2fr_1fr] grid-rows-[38px_38px] gap-[5px] p-2.5">
        <div className="row-span-2 rounded-md" style={{ background: TONE_BG.plum }} />
        <div className="rounded-md" style={{ background: TONE_BG.sand }} />
        <div className="rounded-md" style={{ background: TONE_BG.rust }} />
      </div>
    </div>
  )
}

const TAGGING_PHASES: JourneyPhase[] = [
  {
    key: 'pending',
    content: <PortfolioRowSlide tagged={false} />,
    legend: <Caption>Une pastille orange signale une photo à taguer</Caption>,
  },
  {
    key: 'primary-tag',
    content: (
      <TagModalSlide eyebrow="Tag obligatoire" question="Quel style pour cette photo ?">
        {STYLE_CHIPS.map((chip, index) => (
          <TagChip key={chip} label={chip} selected={index === SELECTED_STYLE_CHIP_INDEX} />
        ))}
      </TagModalSlide>
    ),
    legend: <Caption>Un clic, et vous choisissez son style</Caption>,
  },
  {
    key: 'optional-tags',
    content: (
      <TagModalSlide eyebrow="Tags optionnels">
        {EXTRA_CHIPS.map((chip, index) => (
          <TagChip
            key={chip}
            label={chip}
            selected={SELECTED_EXTRA_CHIP_INDEXES.includes(index)}
            small
          />
        ))}
      </TagModalSlide>
    ),
    legend: <Caption>Des tags en plus, pour préciser</Caption>,
  },
  {
    key: 'tagged',
    content: <PortfolioRowSlide tagged />,
    legend: <Caption>La pastille devient une coche : la photo est prête</Caption>,
  },
  {
    key: 'activation',
    content: <WedreamActivationSlide />,
    legend: <Caption>Direction WedDream pour activer</Caption>,
  },
  {
    key: 'public-gallery',
    content: <PublicGallerySlide />,
    legend: <Caption>Vos photos, visibles dans la galerie</Caption>,
  },
]

function TaggingIllustration() {
  return (
    <WedreamJourneyPreview
      phases={TAGGING_PHASES}
      title="Taguer une photo, pas à pas"
      className="w-full"
    />
  )
}

/* ────────────────────────────────────────────────────────────────────────────
   Étape 4 — « À vous » : les quatre gestes restants
   ──────────────────────────────────────────────────────────────────────────── */

function NumberedStepsIllustration() {
  return (
    <div className="relative flex items-center gap-9">
      <span className="absolute left-[17px] right-[17px] top-1/2 h-px bg-accent opacity-35" />
      {[1, 2, 3, 4].map((n) => (
        <div
          key={n}
          className="relative z-10 w-[34px] h-[34px] rounded-full border border-accent bg-creme flex items-center justify-center"
        >
          <span className="font-cormorant italic font-light text-[15px] leading-none text-accent">
            {n}
          </span>
        </div>
      ))}
    </div>
  )
}

/* ────────────────────────────────────────────────────────────────────────────
   Parcours
   ──────────────────────────────────────────────────────────────────────────── */

const STEPS: StepConfig[] = [
  {
    eyebrow: 'Pourquoi WedDream',
    titleBefore: 'Le rêve, ',
    titleItalic: "avant qu'il n'existe.",
    body: "Bien avant les premiers rendez-vous, il y a ce moment où un couple ferme les yeux et imagine déjà la lumière du soir, une robe qui virevolte, un premier regard échangé. Ce jour-là, on ne le vit qu'une fois. Alors on commence par en rêver, bien avant de savoir avec qui le construire. Un formulaire ne fait pas rêver. Une image, si.",
    cta: 'Suivant',
    afterBody: (
      <>
        <p className="mt-4 font-manrope text-[13px] md:text-[13.5px] leading-relaxed text-bordeaux/65 max-w-[520px]">
          C&apos;est de ce constat qu&apos;est née WedDream.
        </p>
        <p className="mt-5 font-cormorant italic text-[15px] md:text-[17px] leading-snug text-accent text-center">
          «&nbsp;De l&apos;inspiration à la réalité en un clic&nbsp;»
        </p>
      </>
    ),
    renderIllustration: () => <SpotlightIllustration />,
  },
  {
    eyebrow: 'Comment ça marche',
    titleBefore: 'Du rêve, ',
    titleItalic: 'à la rencontre.',
    body: "Le couple choisit d'abord son métier, puis affine le style qui lui ressemble. Vient ensuite la galerie, celle où il se perd avec plaisir, où vos photos attendent d'être découvertes. Un coup de cœur, quelques détails sur son mariage (date, invités, budget, lieu), et la demande vous arrive aussitôt. Une rencontre qui commence par une émotion, pas par un formulaire à remplir avant même de vous connaître.",
    cta: 'Suivant',
    renderIllustration: ({ vendorServices }) => (
      <CoupleJourneyIllustration vendorServices={vendorServices} />
    ),
  },
  {
    eyebrow: 'Le tagging',
    titleBefore: 'Un geste, ',
    titleItalic: 'pour rejoindre WedDream.',
    body: "Une photo peut être magnifique et rester invisible si elle n'est pas rangée au bon endroit. C'est justement le rôle du tagging : il classe chaque photo dans votre catégorie, château pour un lieu, cocktail pour un traiteur, reportage pour un photographe, afin qu'un couple qui cherche précisément ça tombe dessus. Une pastille orange sert à signaler qu'une photo n'est pas taguée. Un clic ouvre la modal, vous choisissez le tag principal. Vous pouvez ensuite ajouter d'autres tags : ils donnent plus de détails aux couples, pour les aider à savoir si vous êtes fait pour eux. Une fois toutes les pastilles passées au bordeaux, vos photos sont prêtes à apparaître dans la galerie. Direction WedDream pour activer votre profil.",
    cta: 'Suivant',
    renderIllustration: () => <TaggingIllustration />,
  },
  {
    eyebrow: 'À vous',
    titleBefore: 'Plus que ',
    titleItalic: 'quelques étapes.',
    body: "Disponibilités, photos, bio, vérification : quatre gestes simples suffisent pour que votre univers rejoigne WedDream, et que ce rêve devienne accessible aux couples qui vous cherchent déjà. Comptez quinze minutes, pas plus.",
    cta: 'Commencer',
    renderIllustration: () => <NumberedStepsIllustration />,
  },
]

/* ────────────────────────────────────────────────────────────────────────────
   TODO(WED-122) : étapes Wedmatch désactivées — dette consciente, réactivables.
   Wedmatch est manuel au lancement du 6 septembre : le guide met WedDream en
   avant, ce parcours n'est plus rendu. Contenu et illustrations conservés tels
   quels ; à réinjecter dans STEPS quand le matching automatique sera livré.
   ──────────────────────────────────────────────────────────────────────────── */

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
        <span className="font-cormorant italic text-sm font-light text-bordeaux/60">eux</span>
      </div>
      <div className="absolute left-[50%] -translate-x-[50%] w-9 h-9 rounded-full bg-accent flex items-center justify-center z-10">
        <svg width="14" height="10" viewBox="0 0 14 10" fill="none">
          <path d="M1.5 5L5.5 9L12.5 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  )
}

// Volontairement non rendu : ce tableau existe pour garder le contenu Wedmatch et
// ses illustrations vivants dans le fichier (et hors de portée d'un nettoyage de
// code mort) jusqu'à leur réactivation.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const WEDMATCH_STEPS_DISABLED: StepConfig[] = [
  {
    eyebrow: 'Bienvenue',
    titleBefore: 'On vous a posé ',
    titleItalic: 'beaucoup de questions...',
    body: "Votre style, vos tarifs, vos expériences passées... On sait, c'était long. Mais c'était pour une bonne raison : chaque couple qui apparaît dans votre Wedmatch a déjà été filtré pour correspondre à qui vous êtes. Pas de volume, que des contacts qui vous ressemblent.",
    cta: 'Suivant',
    renderIllustration: () => <IllustrationStep1 />,
  },
  {
    eyebrow: 'Comment ça marche',
    titleBefore: 'Cinq couples par jour, ',
    titleItalic: 'choisis pour vous.',
    body: "Chaque matin, votre Wedmatch s'enrichit de cinq nouveaux couples qui correspondent à votre style, votre zone et vos tarifs. À vous de décider lesquels vous intéressent — un like, un passe, en quelques secondes. C'est vous qui choisissez en premier.",
    cta: 'Suivant',
    renderIllustration: () => <IllustrationStep2 />,
  },
  {
    eyebrow: 'Le match',
    titleBefore: 'Quand le couple vous like en retour, ',
    titleItalic: "c'est un match.",
    body: "La messagerie s'ouvre instantanément des deux côtés. Pas d'attente, pas d'enchères, pas de rappels commerciaux : juste une conversation qui démarre entre vous et un couple qui a déjà envie de vous parler.",
    cta: 'Suivant',
    renderIllustration: () => <IllustrationStep3 />,
  },
]


/* ──────────────────────────────────────────────────────────────────────────── */

function GuideModal({
  onClose,
  vendorServices,
}: {
  onClose: () => void
  vendorServices?: string[]
}) {
  const [step, setStep] = useState(0)
  const current = STEPS[step]
  const isLast = step === STEPS.length - 1
  const illustration = current.renderIllustration({ vendorServices: vendorServices ?? [] })

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
          <div className="md:hidden flex justify-center mb-8">{illustration}</div>

          {/* Titre */}
          <h2 className="font-cormorant font-light text-[26px] md:text-[40px] leading-[1.1] tracking-[-0.015em] text-bordeaux">
            {current.titleBefore}
            <em className="text-accent">{current.titleItalic}</em>
          </h2>

          {/* Corps */}
          <p className="mt-4 md:mt-5 font-manrope text-[13px] md:text-[14px] leading-relaxed text-bordeaux/65 max-w-[580px]">
            {current.body}
          </p>

          {current.afterBody}

          {/* Illustration desktop (après le texte) */}
          <div className="hidden md:flex mt-9 mb-1 justify-center">{illustration}</div>
        </div>

        {/* Footer crème */}
        <div className="bg-creme border-t border-bordeaux/[0.08] shrink-0 px-6 md:px-10 py-4 md:py-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {STEPS.map((_, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                aria-label={`Étape ${i + 1}`}
                className={`rounded-full transition-all duration-300 cursor-pointer ${
                  i === step ? 'w-8 h-[3px] bg-bordeaux' : 'w-[6px] h-[6px] bg-bordeaux/20 hover:bg-bordeaux/40'
                }`}
                style={{ border: 'none', padding: 0 }}
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

export function GuideProvider({
  children,
  vendorServices,
}: {
  children: ReactNode
  vendorServices?: string[]
}) {
  const [isOpen, setIsOpen] = useState(false)

  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => {
    localStorage.setItem(GUIDE_KEY, '1')
    setIsOpen(false)
  }, [])

  useEffect(() => {
    if (localStorage.getItem(GUIDE_KEY)) return
    const frame = requestAnimationFrame(() => setIsOpen(true))
    return () => cancelAnimationFrame(frame)
  }, [])

  return (
    <GuideCtx.Provider value={{ open }}>
      {children}
      {isOpen && <GuideModal onClose={close} vendorServices={vendorServices} />}
    </GuideCtx.Provider>
  )
}
