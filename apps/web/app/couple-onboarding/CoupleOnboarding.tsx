'use client'

import { ChevronLeft, ChevronRight, Eye, EyeOff } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import OnboardingHeader from './OnboardingHeader'

/**
 * Same wordmark VendorNav uses on its light topbar — a transparent SVG that
 * already carries the right ink color for the crème background of screen 8,
 * unlike the square badge PNGs in /public or the fixed-fill logo.svg.
 */
const LOGO_ON_CREME = 'https://res.cloudinary.com/dadvrspox/image/upload/v1781796191/logo_dark_bbyd6m.svg'
import { canGoToPreviousMonth, isSelectableWeddingDate, selectableWeddingYears, setCalendarMonth, startOfDay } from './calendar'
import { COUPLE_ONBOARDING_STEPS, canContinue, getContinueAction, previousScreen, type CoupleOnboardingContinueAction, type CoupleOnboardingScreen } from './navigation'
import {
  BUDGET_RANGES,
  COUPLE_ONBOARDING_STORAGE_KEY,
  budgetIndexForCents,
  budgetRangeForCents,
  type CoupleOnboardingData,
  DEFAULT_BUDGET_CENTS,
  DEFAULT_GUEST_COUNT,
  GUEST_COUNT_MAX,
  GUEST_COUNT_MIN,
  GUEST_COUNT_STEP,
  type PlanningStage,
  applySensitiveDataConsent,
  MAX_BUDGET_CENTS,
  weddingBudgetCents,
  withExactBudget,
  loadCoupleOnboarding,
  saveCoupleOnboarding,
  withSliderDefaults,
} from '@/lib/couple-onboarding-store'
import { buildCoupleSpaceEntryUrl } from '@/lib/couple-space'
import { browserStorage } from '@/lib/wedream-pending-actions'
import { flushPendingActions } from '@/lib/wedream-pending-flush'
import {
  buildRegistrationPayload,
  credentialsError,
  EMAIL_ALREADY_USED,
  MIN_PASSWORD_LENGTH,
  registerCouple,
  type CoupleCredentials,
} from '@/lib/couple-registration'

/**
 * Played once on the welcome screen. Each burst is a fixed origin point;
 * FIREWORK_PARTICLE_COUNT particles per burst radiate at evenly-spaced
 * angles, their (--dx, --dy) computed below rather than stored, so the CSS
 * side only needs one keyframe (globals.css) to animate every particle.
 */
const FIREWORK_COLORS = ['#9D4F1E', '#E35704', '#E8A87C', '#4E1A32']
const FIREWORK_BURSTS = [
  { top: '18%', left: '20%', delay: 0, radius: 70 },
  { top: '14%', left: '78%', delay: 0.18, radius: 60 },
  { top: '32%', left: '50%', delay: 0.36, radius: 85 },
]
const FIREWORK_PARTICLE_COUNT = 10

/**
 * La sortie « je me connecte » de l'écran 9.
 *
 * `redirect` est explicite bien que `/mon-espace` soit déjà la destination par
 * défaut d'un couple : `LoginForm` lit le même paramètre pour choisir entre
 * l'habillage couple et l'habillage prestataire, et l'omettre enverrait le
 * couple sur un écran titré « Espace prestataire ».
 *
 * `flush` signale qu'il faudra vider la file de gestes en attente une fois la
 * connexion réussie. Personne ne le lit encore — c'est PR3 qui le consomme.
 */
const COUPLE_LOGIN_WITH_QUEUE_FLUSH = '/login?redirect=/mon-espace&flush=pending-actions'

/**
 * Le calque décoratif de l'écran 8. Sorti du corps de l'écran pour que la
 * coquille partagée ci-dessous n'ait pas à le connaître : célébrer un compte qui
 * vient de naître n'a de sens que là.
 */
function FireworkLayer() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {FIREWORK_BURSTS.map((burst, burstIndex) => (
        <div key={burstIndex} className="absolute" style={{ top: burst.top, left: burst.left }}>
          {Array.from({ length: FIREWORK_PARTICLE_COUNT }, (_, particleIndex) => {
            const angle = (particleIndex / FIREWORK_PARTICLE_COUNT) * 2 * Math.PI
            const dx = Math.round(Math.cos(angle) * burst.radius)
            const dy = Math.round(Math.sin(angle) * burst.radius)
            return (
              <span
                key={particleIndex}
                className="firework-particle"
                style={{
                  backgroundColor: FIREWORK_COLORS[(burstIndex + particleIndex) % FIREWORK_COLORS.length],
                  animationDelay: `${burst.delay}s`,
                  '--dx': `${dx}px`,
                  '--dy': `${dy}px`,
                } as React.CSSProperties}
              />
            )
          })}
        </div>
      ))}
    </div>
  )
}

/**
 * La chrome des écrans de sortie du parcours : l'écran 8 quand le compte vient
 * d'être créé, l'écran 9 quand il existait déjà (WED-162).
 *
 * Ce qu'elle porte, c'est l'invariant commun aux deux : on est sorti du tunnel,
 * donc pas d'`OnboardingHeader` et pas de stepper — seulement le logo, qui ramène
 * à l'accueil. Un composant nommé le dit ; deux copies du même JSX le laisseraient
 * au hasard du copier-coller, et le prochain écran de sortie repartirait d'une
 * troisième copie.
 *
 * `decoration` est rendu dans le `main` et non dans la `section` : le calque des
 * feux d'artifice est positionné en absolu sur toute la page, pas dans le
 * contenu centré.
 */
function OnboardingExitScreen({ decoration, children }: { decoration?: React.ReactNode; children: React.ReactNode }) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-creme px-6 py-8 text-texte sm:px-12 lg:px-20">
      {decoration}

      <header className="relative">
        <Link href="/" aria-label="Retour à l'accueil Wedly">
          <Image src={LOGO_ON_CREME} alt="Wedly" width={0} height={0} sizes="160px" style={{ height: '40px', width: 'auto' }} priority />
        </Link>
      </header>

      <div className="relative grid min-h-[calc(100vh-8rem)] place-items-center">
        <section className="w-full max-w-2xl text-center">
          {children}
        </section>
      </div>
    </main>
  )
}

const PLANNING_STAGES: Array<{ value: PlanningStage; label: string }> = [
  { value: 'just_started', label: 'On vient de commencer' },
  { value: 'in_progress', label: 'On est en plein dedans' },
  { value: 'almost_ready', label: 'On est presque prêts' },
]

const CONFESSIONS = [
  ['aucune-specialite-religieuse', 'Aucune spécialité religieuse'], ['laic', 'Laïc'], ['catholique', 'Catholique'], ['musulman', 'Musulman'], ['juif', 'Juif'],
  ['protestant', 'Protestant'], ['orthodoxe', 'Orthodoxe'], ['bouddhiste', 'Bouddhiste'], ['hindou', 'Hindou'], ['mixte', 'Mixte'],
] as const

const CULTURES = [
  ['europe', 'Europe'], ['afrique', 'Afrique'], ['asie', 'Asie'], ['amerique', 'Amériques'], ['moyen-orient', 'Moyen-Orient'], ['oceanie', 'Océanie'], ['maghreb', 'Maghreb'], ['aucune-specialite-culturelle', 'Aucune spécialité culturelle'],
] as const

/**
 * Screens 1-2 stay crème; from the consent screen onward, only the
 * sensitive-preference screens (3-5) switch to bordeaux — the design's
 * validated alternation for this flow.
 */
const SCREEN_THEME: Record<CoupleOnboardingScreen, 'creme' | 'bordeaux'> = {
  1: 'creme',
  2: 'creme',
  3: 'bordeaux',
  4: 'bordeaux',
  5: 'bordeaux',
  6: 'creme',
  7: 'creme',
  8: 'creme',
  // Jamais lue : les deux écrans de sortie rendent leur propre `main` avant que
  // le thème ne soit consulté. Le Record exige l'entrée, pas l'inverse.
  9: 'creme',
}

const formatter = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
const monthOptionsFormatter = new Intl.DateTimeFormat('fr-FR', { month: 'long' })
const weekdayLabels = ['L', 'M', 'M', 'J', 'V', 'S', 'D']
const monthOptions = Array.from({ length: 12 }, (_, month) => ({
  value: month,
  label: monthOptionsFormatter.format(new Date(2026, month, 1)),
}))

function toDateInputValue(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function dateFromValue(value?: string) {
  return value ? new Date(`${value}T12:00:00`) : undefined
}

function Calendar({
  value,
  onChange,
  today,
}: {
  value?: string
  onChange: (value: string) => void
  today: Date
}) {
  const selectedDate = dateFromValue(value)
  const [visibleMonth, setVisibleMonth] = useState(() => selectedDate ?? today)
  const days = useMemo(() => {
    const year = visibleMonth.getFullYear()
    const month = visibleMonth.getMonth()
    const firstDay = new Date(year, month, 1).getDay() || 7
    const dayCount = new Date(year, month + 1, 0).getDate()
    return Array.from({ length: firstDay - 1 + dayCount }, (_, index) => index < firstDay - 1 ? null : index - firstDay + 2)
  }, [visibleMonth])
  const years = useMemo(() => selectableWeddingYears(today), [today])

  function updateVisibleMonth(month: number) {
    setVisibleMonth((current) => setCalendarMonth(current.getFullYear(), month))
  }

  function updateVisibleYear(year: number) {
    setVisibleMonth((current) => setCalendarMonth(year, current.getMonth()))
  }

  return (
    <section aria-label="Date du mariage" className="w-full max-w-sm">
      <div className="mb-3 flex items-center justify-between">
        <button type="button" disabled={!canGoToPreviousMonth(visibleMonth, today)} className="rounded-full p-1 text-bordeaux hover:bg-bordeaux/10 disabled:cursor-not-allowed disabled:text-gris disabled:hover:bg-transparent" aria-label="Mois précédent" onClick={() => setVisibleMonth((month) => new Date(month.getFullYear(), month.getMonth() - 1, 1))}>
          <ChevronLeft size={17} />
        </button>
        <div className="flex items-center gap-1">
          <label className="sr-only" htmlFor="wedding-month">Mois du mariage</label>
          <select id="wedding-month" aria-label="Mois du mariage" value={visibleMonth.getMonth()} onChange={(event) => updateVisibleMonth(Number(event.target.value))} className="cursor-pointer rounded-md bg-transparent px-1 py-1 text-xs font-bold uppercase tracking-[0.12em] text-bordeaux outline-none focus-visible:ring-2 focus-visible:ring-bordeaux">
            {monthOptions.map((month) => <option key={month.value} value={month.value}>{month.label}</option>)}
          </select>
          <label className="sr-only" htmlFor="wedding-year">Année du mariage</label>
          <select id="wedding-year" aria-label="Année du mariage" value={visibleMonth.getFullYear()} onChange={(event) => updateVisibleYear(Number(event.target.value))} className="cursor-pointer rounded-md bg-transparent px-1 py-1 text-xs font-bold uppercase tracking-[0.12em] text-bordeaux outline-none focus-visible:ring-2 focus-visible:ring-bordeaux">
            {years.map((year) => <option key={year} value={year}>{year}</option>)}
          </select>
        </div>
        <button type="button" className="rounded-full p-1 text-bordeaux hover:bg-bordeaux/10" aria-label="Mois suivant" onClick={() => setVisibleMonth((month) => new Date(month.getFullYear(), month.getMonth() + 1, 1))}>
          <ChevronRight size={17} />
        </button>
      </div>
      <div className="grid grid-cols-7 text-center text-xs text-texte">
        {weekdayLabels.map((label, index) => <span className="pb-2 font-semibold text-gris" key={`${label}-${index}`}>{label}</span>)}
        {days.map((day, index) => {
          if (!day) return <span key={`empty-${index}`} />
          const date = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), day)
          const dateValue = toDateInputValue(date)
          const isSelected = value === dateValue
          const isSelectable = isSelectableWeddingDate(date, today)
          return (
            <button key={dateValue} type="button" disabled={!isSelectable} aria-pressed={isSelected} onClick={() => onChange(dateValue)} className={`mx-auto mb-1 grid h-8 w-8 place-items-center rounded-full transition ${isSelected ? 'bg-bordeaux font-semibold text-creme' : isSelectable ? 'hover:bg-bordeaux/10' : 'cursor-not-allowed text-gris/50'}`}>
              {day}
            </button>
          )
        })}
      </div>
    </section>
  )
}

/**
 * Every action but `complete_onboarding`, which never moves the couple to a
 * screen: the account creation of screen 7 owns that transition itself.
 */
const SCREEN_FOR_ACTION = {
  show_wedding_profile: 2,
  show_sensitive_data_consent: 3,
  show_confessions: 4,
  show_cultures: 5,
  show_budget: 6,
  show_account_creation: 7,
  complete_onboarding: 7,
} as const satisfies Record<CoupleOnboardingContinueAction['type'], CoupleOnboardingScreen>

const NAME_PLACEHOLDER = 'votre prénom'

/**
 * The first name is typed straight inside the headline, so the field has to grow
 * with what is typed. A hidden twin carries the exact same typography and gives
 * the width to copy — which keeps the input aligned at every responsive size.
 */
function NameField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const sizer = useRef<HTMLSpanElement>(null)
  const [width, setWidth] = useState<number>()

  useEffect(() => {
    if (sizer.current) setWidth(sizer.current.offsetWidth + 12)
  }, [value])

  return (
    <span className="relative inline-block">
      <span aria-hidden="true" ref={sizer} className="invisible absolute left-0 top-0 whitespace-pre font-semibold italic">
        {value || NAME_PLACEHOLDER}
      </span>
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={NAME_PLACEHOLDER}
        aria-label="Votre prénom"
        style={{ width }}
        className="max-w-full border-b-2 border-bordeaux/20 bg-transparent text-center font-semibold italic text-accent outline-none transition-colors placeholder:font-normal placeholder:text-gris/60 focus:border-highlight"
      />
    </span>
  )
}

/**
 * Confessions and cultures only ever appear on the two sensitive-preference
 * screens, which are always bordeaux (SCREEN_THEME) — so the chips are styled
 * for that theme directly rather than threaded through a light/dark prop.
 */
function MultiSelect({ options, selected, onChange, legend }: {
  options: readonly (readonly [string, string])[]
  selected: string[]
  onChange: (values: string[]) => void
  legend: string
}) {
  function toggle(value: string) {
    onChange(selected.includes(value) ? selected.filter((item) => item !== value) : [...selected, value])
  }

  return (
    <fieldset className="mx-auto mt-8 flex max-w-2xl flex-wrap justify-center gap-3" aria-label={legend}>
      <legend className="sr-only">{legend}</legend>
      {options.map(([value, label]) => {
        const isSelected = selected.includes(value)
        return <button key={value} type="button" aria-pressed={isSelected} onClick={() => toggle(value)} className={`rounded-full border px-5 py-3 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-creme ${isSelected ? 'border-highlight bg-highlight text-creme' : 'border-creme/25 text-creme hover:border-creme/60'}`}>{label}</button>
      })}
    </fieldset>
  )
}

interface CoupleOnboardingProps {
  /**
   * Screens 6 and 7 belong to Stage C (WED-108) and Stage D (WED-109). This
   * component only emits in-memory data, so nothing is persisted before the
   * final account step.
   */
  onStageComplete?: (data: CoupleOnboardingData) => void
}

function emitOnboardingComplete(data: CoupleOnboardingData) {
  window.dispatchEvent(new CustomEvent('wedly:couple-onboarding-complete', { detail: data }))
}

export default function CoupleOnboarding({ onStageComplete = emitOnboardingComplete }: CoupleOnboardingProps) {
  const router = useRouter()
  const [screen, setScreen] = useState<CoupleOnboardingScreen>(1)
  const [data, setData] = useState<CoupleOnboardingData>({})
  const [hydrated, setHydrated] = useState(false)
  // What the couple is currently typing on the budget screen, untouched until it
  // leaves the field. `null` means the field simply mirrors the stored amount.
  const [budgetDraft, setBudgetDraft] = useState<string | null>(null)
  const [today] = useState(() => startOfDay(new Date()))
  const [credentials, setCredentials] = useState<CoupleCredentials>({ email: '', password: '', passwordConfirmation: '', phone: '' })
  const [pwdVisible, setPwdVisible] = useState(false)
  const [confirmPwdVisible, setConfirmPwdVisible] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  // Holds what the server refused — a duplicate email above all, which no
  // browser-side check can anticipate.
  const [submitError, setSubmitError] = useState<string | null>(null)
  // Ce que le rejeu de la file a rattaché au compte qui vient de naître. Porté
  // en état parce que l'écran 8 s'affiche entre le rejeu et la navigation vers
  // l'espace, et que c'est cette navigation qui transporte le compte.
  const [flushedCount, setFlushedCount] = useState(0)
  // Which screens the couple has actually been shown, not just "before the
  // current one": screens 4-5 never happen at all on the refused-consent
  // path, and a step of the progress bar has no business being clickable if
  // it was skipped rather than filled in.
  const [visitedScreens, setVisitedScreens] = useState<Set<CoupleOnboardingScreen>>(() => new Set([1]))

  useLayoutEffect(() => {
    queueMicrotask(() => {
      setData(withSliderDefaults(loadCoupleOnboarding(sessionStorage)))
      setHydrated(true)
    })
  }, [])

  useEffect(() => {
    if (hydrated) saveCoupleOnboarding(sessionStorage, data)
  }, [data, hydrated])

  useEffect(() => {
    queueMicrotask(() => {
      setVisitedScreens((current) => (current.has(screen) ? current : new Set(current).add(screen)))
    })
  }, [screen])

  /**
   * The "Continuer" button keeps focus across the screen swap. Left alone,
   * the browser scrolls to follow it — which shoves the new screen's title
   * above the fold whenever the next screen is taller than the one just left.
   */
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [screen])

  function update<K extends keyof CoupleOnboardingData>(key: K, value: CoupleOnboardingData[K]) {
    setData((current) => ({ ...current, [key]: value }))
  }

  /**
   * Credentials never join the onboarding state: that state is persisted to
   * sessionStorage on every change, and a password has no business being there.
   */
  function updateCredentials<K extends keyof CoupleCredentials>(key: K, value: string) {
    setSubmitError(null)
    setCredentials((current) => ({ ...current, [key]: value }))
  }

  /**
   * « Ce n'est pas moi » : seul l'email est faux, tout le reste a été saisi par
   * la bonne personne. On revient donc à l'écran 7 en ne vidant que ce champ —
   * mot de passe, confirmation et parcours restent en l'état, le composant n'a
   * jamais été démonté.
   *
   * Passe par `updateCredentials` et non par `setCredentials` : c'est lui qui
   * remet `submitError` à zéro, et le formulaire doit se retrouver vierge de
   * toute erreur.
   */
  function restartWithAnotherEmail() {
    updateCredentials('email', '')
    setScreen(7)
  }

  function continueOnboarding(nextData = withSliderDefaults(data)) {
    const action = getContinueAction(screen, nextData)

    if (action.type === 'complete_onboarding') {
      onStageComplete(action.data)
      return
    }

    setScreen(SCREEN_FOR_ACTION[action.type])
  }

  /**
   * The budget being typed is only turned into an amount here, so leaving the
   * screen never loses an entry the couple never blurred out of.
   */
  function commitBudget(current = data): CoupleOnboardingData {
    const next = budgetDraft === null ? current : withExactBudget(current, budgetDraft)

    if (budgetDraft !== null) {
      setData(next)
      setBudgetDraft(null)
    }

    return next
  }

  function continueFromScreen() {
    if (screen === 3) return decideSensitiveData(true)
    if (screen === 6) return continueOnboarding(withSliderDefaults(commitBudget()))
    if (screen === 7) return createAccount()

    return continueOnboarding()
  }

  /**
   * The only write of the whole journey: everything collected since screen 1 is
   * submitted at once (COUPLE-ONBOARDING-001). The stored state is dropped only
   * once the account exists — a failed attempt must leave the couple able to
   * retry without retyping six screens.
   */
  async function createAccount() {
    const invalid = credentialsError(credentials)

    if (invalid) {
      setSubmitError(invalid)
      return
    }

    setSubmitting(true)
    setSubmitError(null)

    const result = await registerCouple(buildRegistrationPayload(withSliderDefaults(data), credentials))

    if (!result.success) {
      setSubmitting(false)

      // Le seul échec qui n'appelle pas une correction sur place : ce couple a
      // déjà un compte, la suite est de s'y connecter (WED-162). Volontairement
      // imbriqué dans la branche d'échec — le `sessionStorage` n'est purgé que
      // par le chemin de succès, et le parcours doit rester entier pour un
      // retour par « ce n'est pas moi ».
      if (result.code === EMAIL_ALREADY_USED) {
        setScreen(9)
        return
      }

      setSubmitError(result.error)
      return
    }

    sessionStorage.removeItem(COUPLE_ONBOARDING_STORAGE_KEY)

    // Les gestes posés avant l'inscription rejoignent le compte qui vient de
    // naître (WED-162 / US8). Le payload d'inscription ne portait qu'une seule
    // demande de contact : sans ce rejeu, un couple qui a épinglé cinq photos en
    // perdait quatre sans un mot.
    //
    // Attendu, et `submitting` maintenu jusque-là : l'écran 8 mène à l'espace
    // personnel, et une navigation partie avant la fin annulerait les requêtes
    // en vol — soit exactement la perte que ce rejeu répare. C'est aussi ce qui
    // empêche un second clic sur « créer mon compte » pendant le rejeu.
    const { done } = await flushPendingActions(browserStorage('local'))

    setFlushedCount(done)
    setSubmitting(false)
    onStageComplete(data)
    setScreen(8)
  }

  function decideSensitiveData(granted: boolean) {
    const nextData = applySensitiveDataConsent(data, granted)
    setData(nextData)
    continueOnboarding(nextData)
  }

  function goBack() {
    // The brand header keeps the same shape on every screen (WED-125): « Retour »
    // never disappears, so screen 1 — which has no previous step — leads out of
    // the journey, the same destination as the logo.
    if (screen === 1) {
      router.push('/')
      return
    }

    setScreen(previousScreen(screen, commitBudget()))
  }

  /**
   * Reached only from a progress-bar dot, which the couple can only click on
   * an already-visited screen — so, unlike goBack, there is no skipped-screen
   * case to resolve here.
   */
  function goToScreen(target: number) {
    commitBudget()
    setScreen(target as CoupleOnboardingScreen)
  }

  const name = data.firstName?.trim()
  const canGoOn = canContinue(screen, data) && !submitting
  const budgetCents = data.budgetCents ?? DEFAULT_BUDGET_CENTS
  const exactBudgetEuros = budgetDraft ?? String(weddingBudgetCents(data) / 100)
  const guestCount = data.guestCount ?? DEFAULT_GUEST_COUNT
  const dateLabel = data.weddingDate ? formatter.format(dateFromValue(data.weddingDate)!) : 'Choisissez une date'

  if (screen === 8) {
    return (
      <OnboardingExitScreen decoration={<FireworkLayer />}>
        <h1 className="font-cormorant text-4xl font-medium tracking-tight sm:text-5xl lg:text-6xl">
          Bienvenue chez Wedly{name ? <>, <em className="font-semibold text-accent not-italic">{name}</em></> : null}.
        </h1>
        <p className="mt-8 text-base leading-7 text-gris">Votre compte est prêt. Vous allez maintenant découvrir vos premiers prestataires.</p>
        {/* L'espace personnel directement (WED-187) : l'inscription vient de
            poser le cookie de session, il n'y a rien à reconnecter — l'ancienne
            sortie vers `/login` faisait retaper à un couple déjà authentifié le
            mot de passe créé deux écrans plus tôt.

            Un bouton et non un `Link` : `window.location` force une navigation
            pleine page, seule façon de garantir que le layout de l'espace — un
            Server Component qui lit le cookie — reparte du cookie tout juste
            posé. Même geste que `LoginForm` après connexion. */}
        <button
          type="button"
          onClick={() => { window.location.href = buildCoupleSpaceEntryUrl(flushedCount) }}
          className="mt-10 inline-flex items-center gap-2 rounded-full bg-highlight px-9 py-4 text-sm font-bold tracking-[0.13em] text-creme shadow-lg transition hover:bg-accent"
        >
          DÉCOUVRIR MON ESPACE <ChevronRight size={18} aria-hidden="true" />
        </button>
      </OnboardingExitScreen>
    )
  }

  /**
   * L'email saisi porte déjà un compte (WED-162). Un écran à part et non le
   * message inline de l'écran 7 : rien n'est à corriger dans le formulaire, la
   * suite du parcours est ailleurs — se connecter.
   *
   * Le CTA emporte `redirect=/mon-espace` alors que c'est déjà la destination par
   * défaut d'un couple : `LoginForm` s'en sert aussi pour choisir son habillage,
   * et sans lui il annoncerait « Espace prestataire ». `flush=pending-actions`
   * n'est lu par personne pour l'instant — c'est PR3 qui le consommera.
   */
  if (screen === 9) {
    return (
      <OnboardingExitScreen>
        <h1 className="font-cormorant text-4xl font-medium tracking-tight sm:text-5xl lg:text-6xl">
          Vous avez déjà un compte avec cet email
        </h1>
        <p className="mt-8 text-base leading-7 text-gris">
          Connectez-vous pour retrouver votre espace : vos coups de cœur en attente y seront ajoutés.
        </p>
        <Link
          href={COUPLE_LOGIN_WITH_QUEUE_FLUSH}
          className="mt-10 inline-flex items-center gap-2 rounded-full bg-highlight px-9 py-4 text-sm font-bold tracking-[0.13em] text-creme shadow-lg transition hover:bg-accent"
        >
          SE CONNECTER <ChevronRight size={18} aria-hidden="true" />
        </Link>
        <div className="mt-8">
          <button
            type="button"
            onClick={restartWithAnotherEmail}
            className="text-sm text-bordeaux underline underline-offset-4 hover:text-accent"
          >
            Ce n&apos;est pas moi, utiliser un autre email
          </button>
        </div>
      </OnboardingExitScreen>
    )
  }

  const isDark = SCREEN_THEME[screen] === 'bordeaux'
  const heading = isDark ? 'text-creme' : 'text-texte'

  return (
    <main className={`flex min-h-screen flex-col transition-colors ${isDark ? 'bg-bordeaux' : 'bg-creme'}`}>
      <OnboardingHeader
        currentStep={screen}
        totalSteps={COUPLE_ONBOARDING_STEPS}
        isDark={isDark}
        visitedSteps={visitedScreens}
        onStepClick={goToScreen}
        onBack={goBack}
      />
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-6xl flex-col px-6 py-8 sm:px-12 lg:px-20">

        {screen === 1 ? (
          <section className="m-auto w-full text-center">
            <h1 className={`font-cormorant text-4xl font-medium tracking-tight sm:text-5xl lg:text-6xl ${heading}`}>
              Bonjour <NameField value={data.firstName ?? ''} onChange={(value) => update('firstName', value)} />, vous en êtes où&nbsp;?
            </h1>
            <div className="mx-auto mt-12 flex max-w-3xl flex-col justify-center gap-3 sm:flex-row" role="radiogroup" aria-label="Avancement de l’organisation">
              {PLANNING_STAGES.map((stage) => {
                const isSelected = data.planningStage === stage.value
                return <button key={stage.value} type="button" role="radio" aria-checked={isSelected} onClick={() => update('planningStage', stage.value)} className={`rounded-full border px-7 py-4 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bordeaux ${isSelected ? 'border-bordeaux bg-bordeaux text-creme' : 'border-bordeaux/20 bg-creme text-texte hover:border-bordeaux'}`}>{stage.label}</button>
              })}
            </div>
          </section>
        ) : screen === 2 ? (
          <section className="m-auto w-full">
            <h1 className={`text-center font-cormorant text-4xl font-medium tracking-tight sm:text-5xl lg:text-6xl ${heading}`}>
              {name ? <>Alors {name}, c&apos;est <em className="font-semibold text-accent">pour quand&nbsp;?</em></> : <>Alors, c&apos;est <em className="font-semibold text-accent">pour quand&nbsp;?</em></>}
            </h1>
            <div className="mx-auto mt-8 flex max-w-md flex-col items-center">
              <Calendar value={data.weddingDate} onChange={(value) => update('weddingDate', value)} today={today} />
              <p className="mt-2 font-cormorant text-xl italic text-accent">{dateLabel}</p>
            </div>
            <div className="mx-auto mt-9 grid max-w-4xl gap-8 sm:grid-cols-3 sm:gap-0 sm:divide-x sm:divide-bordeaux/15">
              <label className="flex flex-col gap-3 text-sm font-medium sm:pr-8">
                Où souhaitez-vous vous marier&nbsp;?
                <input value={data.location ?? ''} onChange={(event) => update('location', event.target.value)} placeholder="Lyon" className="rounded-xl border border-bordeaux/20 bg-transparent px-4 py-3 text-base outline-none placeholder:text-gris focus:border-bordeaux" />
              </label>
              <div className="sm:px-8">
                <label htmlFor="budget" className="text-sm font-medium">Quel budget imaginez-vous pour l&apos;ensemble du mariage&nbsp;?</label>
                <p className="mt-4 font-cormorant text-xl font-semibold text-accent">{budgetRangeForCents(budgetCents)}</p>
                <input id="budget" type="range" min="0" max={BUDGET_RANGES.length - 1} step="1" value={budgetIndexForCents(budgetCents)} onChange={(event) => update('budgetCents', BUDGET_RANGES[Number(event.target.value)].cents)} className="mt-3 w-full accent-accent" aria-label="Fourchette de budget" aria-valuetext={budgetRangeForCents(budgetCents)} />
                <p className="mt-3 text-xs italic text-gris">Pas encore sûrs ? Vous pourrez ajuster plus tard.</p>
              </div>
              <div className="sm:pl-8">
                <label htmlFor="guests" className="text-sm font-medium">Environ combien d&apos;invités&nbsp;?</label>
                <p className="mt-4 font-cormorant text-xl font-semibold text-accent">{guestCount} invités</p>
                <input id="guests" type="range" min={GUEST_COUNT_MIN} max={GUEST_COUNT_MAX} step={GUEST_COUNT_STEP} value={guestCount} onChange={(event) => update('guestCount', Number(event.target.value))} className="mt-3 w-full accent-accent" aria-label="Nombre d’invités" />
              </div>
            </div>
          </section>
        ) : screen === 3 ? (
          <section className="m-auto w-full max-w-3xl text-center">
            <h1 className={`font-cormorant text-4xl font-medium tracking-tight sm:text-5xl ${heading}`}>
              Un mot sur <em className="font-semibold text-dore">vos données.</em>
            </h1>
            <p className="mt-8 text-base leading-7 text-creme/70">Pour vous mettre en relation avec des prestataires qui vous ressemblent, on peut tenir compte de vos traditions culturelles ou confessionnelles. On ne vous pose la question qu&apos;avec votre accord, et vous pourrez changer d&apos;avis à tout moment depuis votre espace. Si vous préférez ne pas répondre, ça ne change rien à votre accès à Wedly — seul le matching sur ce critère ne sera pas activé.</p>
          </section>
        ) : screen === 4 || screen === 5 ? (
          <section className="m-auto w-full max-w-2xl text-center">
            <h1 className={`font-cormorant text-4xl font-medium tracking-tight sm:text-5xl ${heading}`}>
              Ce qui vous <em className="font-semibold text-dore">ressemble.</em>
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-creme/60">Sélectionnez ce qui vous ressemble, plusieurs choix possibles.</p>
            <p className="mt-10 font-cormorant text-xl font-medium text-creme">
              {screen === 4 ? 'Une cérémonie religieuse à intégrer à votre mariage ?' : 'Des origines ou un univers culturel à célébrer ?'}
            </p>
            <MultiSelect options={screen === 4 ? CONFESSIONS : CULTURES} selected={screen === 4 ? data.confessionSlugs ?? [] : data.cultureSlugs ?? []} onChange={(values) => update(screen === 4 ? 'confessionSlugs' : 'cultureSlugs', values)} legend={screen === 4 ? 'Cérémonie religieuse' : 'Origines ou univers culturel'} />
          </section>
        ) : screen === 6 ? (
          <section className="m-auto w-full max-w-2xl text-center">
            <h1 className={`font-cormorant text-4xl font-medium tracking-tight sm:text-5xl ${heading}`}>Votre budget, <em className="font-semibold text-accent">plus précisément&nbsp;?</em></h1>
            <p className="mx-auto mt-6 max-w-xl text-sm leading-6 text-gris">Vous avez indiqué {budgetRangeForCents(budgetCents).toLocaleLowerCase('fr-FR')} pour l&apos;ensemble du mariage. Affinez le montant si vous le souhaitez : il aide les prestataires à vous répondre avec des propositions réalistes.</p>
            <div className="mx-auto mt-10 flex max-w-xs items-center gap-2 border-b border-bordeaux/30 pb-3 font-cormorant text-3xl font-semibold text-accent focus-within:border-bordeaux">
              <input id="exact-budget" type="number" min="0" max={MAX_BUDGET_CENTS / 100} value={exactBudgetEuros} onChange={(event) => setBudgetDraft(event.target.value)} onBlur={() => commitBudget()} className="w-full bg-transparent text-right outline-none" aria-label="Budget total du mariage en euros" />
              <span aria-hidden="true">€</span>
            </div>
            <p className="mt-4 text-xs italic text-gris">Vous pourrez l&apos;ajuster à tout moment depuis votre espace.</p>
          </section>
        ) : screen === 7 ? (
          <section className="m-auto w-full max-w-md">
            <h1 className={`text-center font-cormorant text-4xl font-medium tracking-tight sm:text-5xl ${heading}`}>
              {name ? <>{name}, créez <em className="font-semibold text-accent">votre espace</em></> : <>Créez <em className="font-semibold text-accent">votre espace</em></>}
            </h1>
            <p className="mt-4 text-center text-sm leading-6 text-gris">Vous retrouverez à tout moment votre mariage et vos prestataires dans l&apos;espace du couple.</p>
            <div className="mt-10 flex flex-col gap-5">
              <label className="flex flex-col gap-2 text-sm font-medium" htmlFor="couple-email">
                Votre adresse email
                <input id="couple-email" type="email" autoComplete="email" value={credentials.email} onChange={(event) => updateCredentials('email', event.target.value)} placeholder="camille@exemple.fr" className="rounded-xl border border-bordeaux/20 bg-transparent px-4 py-3 text-base outline-none placeholder:text-gris focus:border-bordeaux" />
              </label>
              {/* Facultatif, et dit comme tel : c'est ce que le prestataire lira si
                  le couple accepte une mise en relation, pas une donnée exigée
                  pour créer le compte (COUPLE-ONBOARDING-010). */}
              <label className="flex flex-col gap-2 text-sm font-medium" htmlFor="couple-phone">
                Votre numéro de téléphone <span className="font-normal text-gris">(facultatif)</span>
                <input id="couple-phone" type="tel" autoComplete="tel" inputMode="tel" value={credentials.phone} onChange={(event) => updateCredentials('phone', event.target.value)} placeholder="06 12 34 56 78" aria-describedby="couple-phone-hint" className="rounded-xl border border-bordeaux/20 bg-transparent px-4 py-3 text-base outline-none placeholder:text-gris focus:border-bordeaux" />
                <span id="couple-phone-hint" className="text-xs font-normal text-gris">Transmis à un prestataire uniquement s&apos;il accepte votre demande de mise en relation.</span>
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium" htmlFor="couple-password">
                Votre mot de passe
                <span className="relative flex items-center">
                  <input id="couple-password" type={pwdVisible ? 'text' : 'password'} autoComplete="new-password" value={credentials.password} onChange={(event) => updateCredentials('password', event.target.value)} aria-describedby="couple-password-hint" className="w-full rounded-xl border border-bordeaux/20 bg-transparent px-4 py-3 pr-11 text-base outline-none focus:border-bordeaux" />
                  <button type="button" onClick={() => setPwdVisible((visible) => !visible)} aria-label={pwdVisible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'} className="absolute right-3 text-gris hover:text-bordeaux">
                    {pwdVisible ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </span>
                <span id="couple-password-hint" className="text-xs font-normal text-gris">{MIN_PASSWORD_LENGTH} caractères minimum.</span>
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium" htmlFor="couple-password-confirmation">
                Confirmez votre mot de passe
                <span className="relative flex items-center">
                  <input id="couple-password-confirmation" type={confirmPwdVisible ? 'text' : 'password'} autoComplete="new-password" value={credentials.passwordConfirmation} onChange={(event) => updateCredentials('passwordConfirmation', event.target.value)} className="w-full rounded-xl border border-bordeaux/20 bg-transparent px-4 py-3 pr-11 text-base outline-none focus:border-bordeaux" />
                  <button type="button" onClick={() => setConfirmPwdVisible((visible) => !visible)} aria-label={confirmPwdVisible ? 'Masquer la confirmation du mot de passe' : 'Afficher la confirmation du mot de passe'} className="absolute right-3 text-gris hover:text-bordeaux">
                    {confirmPwdVisible ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </span>
              </label>
              {submitError && <p role="alert" className="text-sm font-medium text-highlight">{submitError}</p>}
            </div>
          </section>
        ) : null}

        <footer className="mt-10 flex justify-center pb-2">
          <button type="button" disabled={!canGoOn} onClick={continueFromScreen} className={`inline-flex items-center gap-2 rounded-full bg-highlight px-9 py-4 text-sm font-bold tracking-[0.13em] text-creme shadow-lg transition hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-4 disabled:cursor-not-allowed disabled:opacity-[0.32] disabled:shadow-none disabled:hover:bg-highlight ${isDark ? 'focus-visible:outline-creme' : 'focus-visible:outline-bordeaux'}`}>
            {screen === 7 ? (submitting ? 'CRÉATION…' : 'CRÉER MON COMPTE') : 'CONTINUER'} <ChevronRight size={18} aria-hidden="true" />
          </button>
        </footer>
        {screen === 3 && <button type="button" onClick={() => decideSensitiveData(false)} className={`mx-auto pb-6 text-sm underline underline-offset-4 ${isDark ? 'text-creme/70 hover:text-creme' : 'text-bordeaux hover:text-accent'}`}>Je préfère passer cette étape</button>}
      </div>
    </main>
  )
}
