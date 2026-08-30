'use client'

import { ChevronLeft } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import ProgressIndicator from './ProgressIndicator'
import type { CoupleOnboardingScreen } from './navigation'

/**
 * Same wordmarks VendorNav uses for its light/dark topbars — transparent SVGs
 * that already carry the right ink color for each background, so the logo stays
 * readable whether the current screen is crème or bordeaux (SCREEN_THEME).
 */
const LOGO_ON_CREME = 'https://res.cloudinary.com/dadvrspox/image/upload/v1781796191/logo_dark_bbyd6m.svg'
const LOGO_ON_BORDEAUX = 'https://res.cloudinary.com/dadvrspox/image/upload/v1781796191/logo_light_kcub6h.svg'

interface OnboardingHeaderProps {
  currentStep: CoupleOnboardingScreen
  totalSteps: number
  isDark: boolean
  visitedSteps: Set<number>
  onStepClick: (step: number) => void
  onBack: () => void
}

/**
 * Chrome de marque des écrans 1-7 (WED-125, variante A — bande unique) : logo,
 * progression et « Retour » partagent une seule bande sticky de 72 px (60 px en
 * mobile), pour que le couple garde en vue où il en est et sur quel site il est.
 *
 * Sticky comme `VendorNav`, et volontairement pas la `Navbar` marketing : ses
 * ancres et son CTA « Se connecter » ouvriraient des sorties en plein tunnel de
 * conversion. L'écran 8 n'a pas de header — le parcours est terminé.
 *
 * Le logo mène à l'accueil, et « Retour » à l'écran 1 y mène aussi (même
 * destination) : le chrome ne change pas de forme d'un écran à l'autre.
 */
export default function OnboardingHeader({
  currentStep,
  totalSteps,
  isDark,
  visitedSteps,
  onStepClick,
  onBack,
}: OnboardingHeaderProps) {
  return (
    <header
      className={`sticky top-0 z-50 border-b transition-colors ${isDark ? 'border-creme/10 bg-bordeaux' : 'border-bordeaux/10 bg-creme'}`}
    >
      <div className="mx-auto flex h-15 max-w-6xl items-center gap-3 px-6 sm:gap-6 sm:px-12 md:h-18 lg:px-20">
        <div className="flex flex-1 justify-start">
          <Link
            href="/"
            aria-label="Wedly, revenir à l'accueil"
            className="shrink-0 rounded-sm transition-opacity hover:opacity-65 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-current"
          >
            <Image
              src={isDark ? LOGO_ON_BORDEAUX : LOGO_ON_CREME}
              alt="Wedly"
              width={0}
              height={0}
              sizes="120px"
              style={{ height: '28px', width: 'auto' }}
              priority
            />
          </Link>
        </div>

        <div className="flex flex-1 justify-center">
          <ProgressIndicator
            currentStep={currentStep}
            totalSteps={totalSteps}
            dark={isDark}
            visitedSteps={visitedSteps}
            onStepClick={onStepClick}
          />
        </div>

        <div className="flex flex-1 justify-end">
          <button
            type="button"
            onClick={onBack}
            className={`inline-flex items-center gap-1 text-xs underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-current md:text-sm ${isDark ? 'text-dore' : 'text-accent'}`}
          >
            <ChevronLeft size={16} aria-hidden="true" />
            Retour
          </button>
        </div>
      </div>
    </header>
  )
}
