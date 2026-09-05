'use client'

import Navbar from '../_components/Navbar'
import ProgressIndicator from './ProgressIndicator'
import type { CoupleOnboardingScreen } from './navigation'

interface OnboardingHeaderProps {
  currentStep: CoupleOnboardingScreen
  totalSteps: number
  isDark: boolean
  visitedSteps: Set<number>
  onStepClick: (step: number) => void
}

/**
 * Chrome des écrans 1-7 : la vraie navbar du site (logo, liens, Connexion/
 * Inscription) en tête, et la progression du stepper sur une rangée dédiée
 * juste en dessous — décision produit du 2026-09-05 : reprendre le contenu
 * de la navbar marketing ici plutôt que le chrome minimal d'avant (WED-125),
 * qui évitait volontairement les sorties en plein tunnel. Le retour à
 * l'étape précédente se fait via les points déjà visités de la progression,
 * plus de bouton « Retour » dédié.
 */
export default function OnboardingHeader({
  currentStep,
  totalSteps,
  isDark,
  visitedSteps,
  onStepClick,
}: OnboardingHeaderProps) {
  return (
    <div className="sticky top-0 z-50">
      <Navbar forceState={isDark ? 'dark' : 'light'} sticky={false} />

      <div
        className="border-b transition-colors"
        style={{
          backgroundColor: isDark ? 'rgba(78,26,50,0.94)' : 'rgba(255,246,237,0.6)',
          backdropFilter: isDark ? 'none' : 'blur(24px)',
          WebkitBackdropFilter: isDark ? 'none' : 'blur(24px)',
          borderBottomColor: isDark ? 'rgba(255,246,237,0.18)' : 'rgba(78,26,50,0.10)',
        }}
      >
        <div className="mx-auto flex h-12 max-w-6xl items-center justify-center px-6 sm:px-12 lg:px-20">
          <ProgressIndicator
            currentStep={currentStep}
            totalSteps={totalSteps}
            dark={isDark}
            visitedSteps={visitedSteps}
            onStepClick={onStepClick}
          />
        </div>
      </div>
    </div>
  )
}
