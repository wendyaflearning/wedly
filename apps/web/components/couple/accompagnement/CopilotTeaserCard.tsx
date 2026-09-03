import { FileText, Heart, Lock, Wallet } from 'lucide-react'
import type { CopilotIconKey, CopilotTeaser } from '@/lib/couple-accompagnement'

const ICONS: Record<CopilotIconKey, typeof FileText> = {
  plan: FileText,
  wallet: Wallet,
  match: Heart,
}

/**
 * Un teaser du futur copilote (WedPlan / WedWallet / WedMatch). Purement
 * informatif : pas de lien, pas de bouton, pas d'action — le cadenas signale
 * que le module relève de la formule payante, encore indisponible.
 */
export function CopilotTeaserCard({ teaser }: { teaser: CopilotTeaser }) {
  const Icon = ICONS[teaser.icon]

  return (
    <article className="flex flex-col gap-4 px-6 py-6 md:px-7 md:py-7">
      <div className="flex items-start justify-between">
        <Icon
          className="h-6 w-6 text-bordeaux/45"
          strokeWidth={1.5}
          aria-hidden="true"
        />
        <Lock
          className="h-4 w-4 text-gris/70"
          strokeWidth={1.5}
          aria-label="Réservé à la formule payante"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <h3 className="font-cormorant text-[22px] font-medium leading-tight text-bordeaux/80">
          {teaser.name}
        </h3>
        <p className="text-[13px] leading-relaxed text-gris">{teaser.description}</p>
      </div>
    </article>
  )
}
