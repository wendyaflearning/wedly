import Image from 'next/image'
import Link from 'next/link'

export default function ComingSoonPage() {
  return (
    <div className="min-h-screen bg-creme flex flex-col items-center justify-center gap-10 px-6 py-12">
      <Image
        src="https://res.cloudinary.com/dadvrspox/image/upload/v1781796191/logo_dark_bbyd6m.svg"
        alt="Wedly"
        width={0}
        height={0}
        sizes="300px"
        style={{ height: '52px', width: 'auto' }}
        priority
      />

      <div className="flex flex-col items-center text-center w-full max-w-sm">
        <div className="flex items-center gap-2 mb-6">
          <div className="h-px w-14 bg-bordeaux/25" />
          <div className="h-1 w-1 rounded-full bg-bordeaux/40" />
          <div className="h-1.5 w-1.5 rounded-full bg-bordeaux/50" />
          <div className="h-1 w-1 rounded-full bg-bordeaux/40" />
          <div className="h-px w-14 bg-bordeaux/25" />
        </div>

        <h1 className="font-cormorant italic text-bordeaux text-2xl mb-4">
          Cette page se prépare pour vous.
        </h1>

        <p className="font-manrope text-gris text-sm leading-relaxed mb-8">
          Comme les plus beaux préparatifs, certaines choses demandent du soin.
          Cette section de votre espace Wedly sera bientôt prête à vous accueillir.
        </p>

        <Link
          href="/"
          className="w-full bg-accent text-white font-manrope text-xs font-semibold uppercase tracking-widest rounded py-4 text-center hover:brightness-110 transition-all"
        >
          Retourner à l&apos;accueil
        </Link>
      </div>
    </div>
  )
}
