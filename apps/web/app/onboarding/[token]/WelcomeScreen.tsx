'use client'

export default function WelcomeScreen({
  firstname,
  onContinue,
}: {
  firstname: string
  onContinue: () => void
}) {
  return (
    <div className="min-h-screen bg-creme grid place-items-center px-6">
      <div className="flex flex-col items-center gap-10 w-full max-w-lg">
        {/* Logo */}
        <img src="/logo.png" alt="Wedly" className="h-28 w-auto block mx-auto" />

        {/* Icône anneaux */}
        <div
          className="w-24 h-24 rounded-full border border-gray-200 flex items-center justify-center"
          style={{ animation: 'float 3.2s ease-in-out infinite' }}
        >
          <svg width="72" height="44" viewBox="0 0 72 44" fill="none" aria-hidden="true">
            <circle cx="24" cy="22" r="19" stroke="var(--color-bordeaux)" strokeWidth="3" fill="none" />
            <circle cx="48" cy="22" r="19" stroke="var(--color-highlight)" strokeWidth="3" fill="var(--color-creme)" />
            <path d="M43 11 A19 19 0 0 1 43 33" stroke="var(--color-bordeaux)" strokeWidth="3" fill="none" strokeLinecap="round" />
          </svg>
        </div>

        {/* Titre */}
        <h1 className="font-cormorant text-5xl text-bordeaux text-center whitespace-nowrap">
          <span>{firstname}, </span>
          <span className="italic">votre profil vous attend.</span>
        </h1>

        {/* Sous-titre */}
        <p
          style={{ fontFamily: 'var(--font-cormorant)', color: 'var(--color-gris)', fontSize: 'var(--text-xl)' }}
          className="text-center whitespace-nowrap leading-relaxed"
        >
          Nos équipes ont fait le travail, il ne reste qu&apos;à mettre votre touche finale.
        </p>

        {/* CTA */}
        <button
          onClick={onContinue}
          className="w-full max-w-md bg-bordeaux text-white uppercase tracking-widest text-sm rounded-lg py-4"
        >
          JE DÉCOUVRE MON PROFIL →
        </button>
      </div>
    </div>
  )
}
