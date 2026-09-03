import Link from 'next/link'

/**
 * État erreur de la zone « Demandes de contact » : la lecture de
 * `GET /api/v1/couples/me/provider-leads` a échoué (réseau ou API). Distinct de
 * l'état vide, qui lui est un succès sans demande.
 */
export function ContactRequestsError() {
  return (
    <section className="rounded-2xl border border-danger-border bg-danger-soft px-6 py-12 text-center md:px-10 md:py-16">
      <h2 className="font-cormorant text-2xl font-medium text-danger md:text-[30px]">
        Vos demandes de contact n’ont pas pu être chargées
      </h2>
      <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-texte/70">
        Un problème temporaire nous empêche d’afficher vos demandes. Réessayez dans un instant.
      </p>
      <Link
        href="/mon-espace/demandes"
        className="mt-6 inline-flex items-center rounded-full border border-danger/40 px-5 py-2 text-[12px] font-semibold uppercase tracking-[0.12em] text-danger no-underline transition-colors hover:bg-danger/5"
      >
        Réessayer
      </Link>
    </section>
  )
}
