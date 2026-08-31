interface CoupleZonePlaceholderProps {
  title: string
  description: string
  followUpTicket: string
}

/**
 * Empty zone shell — real content lands in US-6.5 / US-6.6 / US-6.7 tickets.
 */
export default function CoupleZonePlaceholder({
  title,
  description,
  followUpTicket,
}: CoupleZonePlaceholderProps) {
  return (
    <section
      className="rounded-2xl border border-bordeaux/10 bg-white px-6 py-10 text-center md:px-10 md:py-14"
      aria-labelledby="couple-zone-placeholder-title"
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-accent">{followUpTicket}</p>
      <h2
        id="couple-zone-placeholder-title"
        className="mt-3 font-cormorant text-2xl font-medium text-bordeaux md:text-[32px]"
      >
        {title}
      </h2>
      <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-gris">{description}</p>
    </section>
  )
}
