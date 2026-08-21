interface ProgressIndicatorProps {
  currentStep: number
  totalSteps?: number
}

export default function ProgressIndicator({ currentStep, totalSteps = 7 }: ProgressIndicatorProps) {
  return (
    <div className="flex items-center gap-3 text-xs font-semibold text-texte" aria-label={`Étape ${currentStep} sur ${totalSteps}`}>
      <span>{currentStep}/{totalSteps}</span>
      <div className="flex gap-1.5" aria-hidden="true">
        {Array.from({ length: totalSteps }, (_, index) => (
          <span
            className={`h-1.5 w-1.5 rounded-full ${index + 1 === currentStep ? 'w-5 bg-accent' : 'bg-bordeaux/20'}`}
            key={index}
          />
        ))}
      </div>
    </div>
  )
}
