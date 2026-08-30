interface ProgressIndicatorProps {
  currentStep: number
  totalSteps?: number
  dark?: boolean
  visitedSteps?: Set<number>
  onStepClick?: (step: number) => void
}

export default function ProgressIndicator({
  currentStep,
  totalSteps = 7,
  dark = false,
  visitedSteps,
  onStepClick,
}: ProgressIndicatorProps) {
  return (
    <div className={`flex items-center gap-3 text-xs font-semibold ${dark ? 'text-creme/70' : 'text-texte'}`} aria-label={`Étape ${currentStep} sur ${totalSteps}`}>
      <span>{currentStep}/{totalSteps}</span>
      <div className="flex gap-1.5">
        {Array.from({ length: totalSteps }, (_, index) => {
          const step = index + 1
          const isActive = step === currentStep
          const isClickable = !isActive && Boolean(onStepClick) && (visitedSteps?.has(step) ?? false)
          const activeColor = dark ? 'bg-highlight' : 'bg-accent'
          // Visited-and-clickable dots carry the same solid hue as "active" —
          // a translucent tint against a saturated background (bordeaux) was
          // nearly indistinguishable from the plain gray of a never-visited
          // dot. Full opacity plus a scale-up on hover is unambiguous.
          const visitedColor = `${activeColor} group-hover:scale-125`
          const inactiveColor = dark ? 'bg-creme/20' : 'bg-bordeaux/20'
          const dotColor = isActive ? activeColor : isClickable ? visitedColor : inactiveColor
          const dot = <span className={`block h-1.5 w-1.5 rounded-full transition-all ${isActive ? `w-5 ${dotColor}` : dotColor}`} />

          if (!isClickable) {
            return <span aria-hidden="true" key={index}>{dot}</span>
          }

          return (
            <button
              key={index}
              type="button"
              onClick={() => onStepClick?.(step)}
              aria-label={`Aller à l'étape ${step}`}
              className="group -m-1.5 flex cursor-pointer items-center justify-center p-1.5"
            >
              {dot}
            </button>
          )
        })}
      </div>
    </div>
  )
}
