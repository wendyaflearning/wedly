import {
  ACCOMPAGNEMENT_EYEBROW,
  ACCOMPAGNEMENT_TITLE_EMPHASIS,
  ACCOMPAGNEMENT_TITLE_LEAD,
  COPILOT_AVAILABILITY_BADGE,
  COPILOT_PLAN_BADGE,
  COPILOT_TEASERS,
} from '@/lib/couple-accompagnement'
import { CopilotTeaserCard } from './CopilotTeaserCard'

/**
 * Zone « Accompagnement » de Mon espace Wedly (WED-136 / US-6.7).
 *
 * Contenu 100 % statique : aperçu du futur copilote payant (WedPlan / WedWallet
 * / WedMatch) sous un badge « Bientôt disponible » + « Formule payante ». Aucun
 * CTA ni lien de paiement — la phase pilote reste gratuite jusqu'à la création
 * de la société en octobre. Server Component : rien à charger, rien à cliquer.
 */
export function AccompagnementZone() {
  return (
    <section className="flex flex-col gap-6" aria-labelledby="accompagnement-title">
      <div className="flex flex-col gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">
          {ACCOMPAGNEMENT_EYEBROW}
        </p>
        <h2
          id="accompagnement-title"
          className="font-cormorant text-[26px] font-medium leading-tight text-texte md:text-[32px]"
        >
          {ACCOMPAGNEMENT_TITLE_LEAD}{' '}
          <em className="font-normal italic text-dore">{ACCOMPAGNEMENT_TITLE_EMPHASIS}</em>.
        </h2>
      </div>

      <div className="overflow-hidden rounded-2xl border border-bordeaux/10 bg-white">
        <div className="flex flex-wrap items-center gap-3 border-b border-bordeaux/10 bg-muted/40 px-6 py-3">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-gris">
            <span className="h-1.5 w-1.5 rounded-full bg-gris" aria-hidden="true" />
            {COPILOT_AVAILABILITY_BADGE}
          </span>
          <span className="rounded-full border border-bordeaux/15 bg-bordeaux/5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-bordeaux/70">
            {COPILOT_PLAN_BADGE}
          </span>
        </div>

        <div className="grid divide-y divide-bordeaux/10 md:grid-cols-3 md:divide-x md:divide-y-0">
          {COPILOT_TEASERS.map((teaser) => (
            <CopilotTeaserCard key={teaser.key} teaser={teaser} />
          ))}
        </div>
      </div>
    </section>
  )
}
