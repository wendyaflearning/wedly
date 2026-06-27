'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    setIsAuthenticated(document.cookie.includes('jwt_token'))
  }, [])

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

      <div className="h-44 w-44 rounded-full overflow-hidden bg-bordeaux/5">
        <Image
          src="https://res.cloudinary.com/dadvrspox/image/upload/v1781796293/illustration_yaswvk.png"
          alt=""
          width={176}
          height={176}
          className="object-cover w-full h-full"
        />
      </div>

      <div className="flex flex-col items-center text-center w-full max-w-sm">
        <span className="font-cormorant italic text-bordeaux text-[112px] leading-none tracking-tight">
          500
        </span>

        <div className="flex items-center gap-2 my-5">
          <div className="h-px w-14 bg-bordeaux/25" />
          <div className="h-1 w-1 rounded-full bg-bordeaux/40" />
          <div className="h-1.5 w-1.5 rounded-full bg-bordeaux/50" />
          <div className="h-1 w-1 rounded-full bg-bordeaux/40" />
          <div className="h-px w-14 bg-bordeaux/25" />
        </div>

        <h1 className="font-cormorant italic text-bordeaux text-2xl mb-4">
          Une turbulence de notre côté...
        </h1>

        <p className="font-manrope text-gris text-sm leading-relaxed mb-8">
          C&apos;est de notre côté — nos équipes sont déjà sur le coup.
          Votre projet est sauf, revenez dans quelques instants.
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
