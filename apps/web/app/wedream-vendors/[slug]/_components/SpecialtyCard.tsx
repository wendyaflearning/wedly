import Image from 'next/image'
import type { PublicTagValue } from '@/lib/specialties'

// Dégradés de repli repris de la maquette : utilisés tant qu'une TagValue
// n'a pas de vignette assignée (vignetteUrl reste null au lancement).
const TONES = [
  'linear-gradient(160deg,#5E2039 0%,#4E1A32 55%,#3A1325 100%)',
  'linear-gradient(160deg,#E7BC9E 0%,#D9A382 55%,#C68F5F 100%)',
  'linear-gradient(160deg,#B15F2A 0%,#9D4F1E 55%,#7E3D15 100%)',
]

// next.config.ts n'autorise que res.cloudinary.com : une URL hors Cloudinary
// ferait planter next/image. On retombe alors proprement sur le dégradé.
function isCloudinaryUrl(url: string): boolean {
  try {
    return new URL(url).hostname === 'res.cloudinary.com'
  } catch {
    return false
  }
}

type SpecialtyCardProps = {
  tagValue: PublicTagValue
  index: number
  href: string
}

export default function SpecialtyCard({ tagValue, index, href }: SpecialtyCardProps) {
  return (
    <a
      href={href}
      className="group relative block aspect-[4/5] overflow-hidden rounded-[5px] text-inherit shadow-[0_10px_24px_rgba(41,26,16,0.16)]"
      style={{ background: TONES[index % TONES.length] }}
    >
      {tagValue.vignetteUrl && isCloudinaryUrl(tagValue.vignetteUrl) && (
        <Image
          src={tagValue.vignetteUrl}
          alt={tagValue.label}
          fill
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          sizes="(min-width: 768px) 33vw, 50vw"
        />
      )}

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[44%] bg-gradient-to-t from-[rgba(41,26,16,0.7)] via-[rgba(41,26,16,0.34)] to-transparent" />

      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-2.5 p-4 md:p-[22px]">
        <h3
          className="font-cormorant m-0 text-[22px] font-light leading-[1.08] tracking-[-0.02em] text-creme md:text-[28px]"
        >
          {tagValue.label}
        </h3>

        <div className="flex h-[34px] w-[34px] flex-shrink-0 items-center justify-center rounded-full border border-creme/40 transition-colors duration-200 group-hover:bg-creme/15">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M5 12H19M19 12L13 6M19 12L13 18"
              stroke="#FFF6ED"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
    </a>
  )
}
