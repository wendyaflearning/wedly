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
        <img src="/logo.png" alt="Wedly logo" className="h-20 md:h-28  w-auto block mx-auto" />

        {/* Titre */}
        <h1 className="font-cormorant text-3xl md:text-5xl text-bordeaux text-center">
          <span>{firstname}, </span>
          <span className="italic">votre profil vous attend.</span>
        </h1>

        {/* Sous-titre */}
        <p
          style={{ fontFamily: 'var(--font-cormorant)', color: 'var(--color-gris)', fontSize: 'var(--text-xl)' }}
          className="text-center leading-relaxed max-w-sm text-center "
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
