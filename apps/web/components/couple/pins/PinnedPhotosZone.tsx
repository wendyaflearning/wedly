import { formatPinnedAt, pinnedCountLabel, type CouplePin } from '@/lib/couple-pins'

const SectionLabel = () => (
  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">Épinglés</p>
)

function EmptyZone() {
  return (
    <section className="rounded-2xl border border-bordeaux/10 bg-white px-6 py-12 text-center md:px-10 md:py-16">
      <h2 className="font-cormorant text-2xl font-medium text-bordeaux md:text-[30px]">
        Aucune photo épinglée pour l’instant
      </h2>
      <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-gris">
        Dès que vous épinglez une photo coup de cœur depuis la galerie WedDream, elle vous attend
        ici. C’est gratuit et sans limite de nombre.
      </p>
    </section>
  )
}

function PinnedPhoto({ pin }: { pin: CouplePin }) {
  const pinnedAt = formatPinnedAt(pin.pinnedAt)

  return (
    // `figure` et non `a`/`button` : la grille est délibérément non cliquable,
    // aucun geste ne doit mener vers un profil prestataire (US-6.6). Dépingler
    // est hors scope de ce ticket.
    <figure className="relative aspect-square overflow-hidden rounded-2xl border border-bordeaux/10 bg-bordeaux/5">
      {/* eslint-disable-next-line @next/next/no-img-element -- ratio inconnu, next/image imposerait des dimensions absentes ici (cf. galerie WedDream). */}
      <img src={pin.photoUrl} alt="Photo épinglée" className="h-full w-full object-cover" />

      {pinnedAt && (
        <>
          <div
            className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-texte/80 to-transparent"
            aria-hidden="true"
          />
          <figcaption className="absolute inset-x-0 bottom-0 p-3 text-[11px] text-white/80">
            {pinnedAt}
          </figcaption>
        </>
      )}
    </figure>
  )
}

/**
 * Zone « Épinglés » de Mon espace Wedly (US-6.6 / WED-135) : la grille des
 * photos épinglées depuis la galerie WedDream, gratuite et illimitée.
 *
 * Composant serveur — aucun état local, aucun filtre : la liste arrive déjà
 * triée « plus récent d'abord » par l'API (COUPLE-PIN-003).
 */
export function PinnedPhotosZone({ pins }: { pins: CouplePin[] }) {
  if (pins.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <SectionLabel />
        <EmptyZone />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <SectionLabel />
        <p className="text-[12px] text-gris">{pinnedCountLabel(pins.length)}</p>
      </div>

      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {pins.map((pin) => (
          <li key={pin.id}>
            <PinnedPhoto pin={pin} />
          </li>
        ))}
      </ul>
    </div>
  )
}
