import { cookies } from 'next/headers'
import Image from 'next/image'
import Link from 'next/link'

export default async function NotFound() {
  const cookieStore = await cookies()
  const isAuthenticated = cookieStore.has('jwt_token')

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
        <span className="font-cormorant italic text-bordeaux text-[112px] leading-none tracking-tight">
          404
        </span>

        <div className="flex items-center gap-2 my-5">
          <div className="h-px w-14 bg-bordeaux/25" />
          <div className="h-1 w-1 rounded-full bg-bordeaux/40" />
          <div className="h-1.5 w-1.5 rounded-full bg-bordeaux/50" />
          <div className="h-1 w-1 rounded-full bg-bordeaux/40" />
          <div className="h-px w-14 bg-bordeaux/25" />
        </div>

        <h1 className="font-cormorant italic text-bordeaux text-2xl mb-4">
          Cette page s&apos;est envolée...
        </h1>

        <p className="font-manrope text-gris text-sm leading-relaxed mb-8">
          Le lien est cassé, l&apos;URL invalide ou la page supprimée — mais votre histoire, elle, continue.
          Revenons à quelque chose de plus beau.
        </p>

        <Link
          href={isAuthenticated ? '/dashboard' : '/'}
          className="w-full bg-accent text-white font-manrope text-xs font-semibold uppercase tracking-widest rounded py-4 text-center hover:brightness-110 transition-all"
        >
          {isAuthenticated ? 'Retourner à mon tableau de bord' : "Retourner à l'accueil"}
        </Link>

        <a
          href="mailto:support@wedly.fr"
          className="mt-5 font-cormorant italic text-accent text-base underline underline-offset-2"
        >
          Contacter le support
        </a>
      </div>
    </div>
  )
}
