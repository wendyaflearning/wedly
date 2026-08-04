import Link from 'next/link'

interface Props {
  href: string
}

export default function IncompleteBadge({ href }: Props) {
  return (
    <Link
      href={href}
      className="inline-flex items-center bg-accent/10 text-accent font-manrope text-[10px] tracking-[0.12em] uppercase px-2.5 py-1 rounded-full hover:bg-accent/20 transition-colors whitespace-nowrap"
    >
      À compléter
    </Link>
  )
}
