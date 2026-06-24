interface Props {
  firstName: string
  bio: string
}

export function BioPreviewPanel({ firstName, bio }: Props) {
  if (!bio) return null

  const initials = firstName.slice(0, 1).toUpperCase()

  return (
    <aside className="hidden lg:block w-[280px] shrink-0">
      <div className="bg-bordeaux rounded-2xl p-6 text-creme">
        <p className="font-manrope text-[10px] font-semibold tracking-[0.16em] uppercase text-creme/50 mb-5 flex items-center gap-2">
          <span className="w-4 h-px bg-dore/40" />
          Aperçu Wedmatch
        </p>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-full bg-accent/80 flex items-center justify-center font-cormorant text-lg font-bold text-creme shrink-0">
            {initials}
          </div>
          <div>
            <p className="font-manrope text-sm font-semibold text-creme leading-tight">{firstName}</p>
            <p className="font-manrope text-[10px] tracking-[0.12em] uppercase text-creme/50 mt-0.5">
              Prestataire
            </p>
          </div>
        </div>

        <p className="font-cormorant text-2xl text-dore/70 mb-2 leading-none">&ldquo;</p>
        <p className="font-manrope text-sm text-creme/80 leading-relaxed">{bio}</p>

        <p className="font-manrope text-[10px] tracking-[0.12em] uppercase text-creme/25 mt-6">
          Aperçu uniquement
        </p>
      </div>
    </aside>
  )
}
