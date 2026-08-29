interface ProgressIndicatorProps {
  currentStep: number
  totalSteps?: number
  dark?: boolean
}

export default function ProgressIndicator({ currentStep, totalSteps = 7, dark = false }: ProgressIndicatorProps) {
  return (
    <div className={`flex items-center gap-3 text-xs font-semibold ${dark ? 'text-creme/70' : 'text-texte'}`} aria-label={`Étape ${currentStep} sur ${totalSteps}`}>
      <span>{currentStep}/{totalSteps}</span>
      <div className="flex gap-1.5" aria-hidden="true">
        {Array.from({ length: totalSteps }, (_, index) => {
          const isActive = index + 1 === currentStep
          const activeColor = dark ? 'bg-highlight' : 'bg-accent'
          const inactiveColor = dark ? 'bg-creme/20' : 'bg-bordeaux/20'
          return (
            <span
              className={`h-1.5 w-1.5 rounded-full ${isActive ? `w-5 ${activeColor}` : inactiveColor}`}
              key={index}
            />
          )
        })}
      </div>
    </div>
  )
}
