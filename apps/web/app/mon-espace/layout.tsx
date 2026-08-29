import { redirect } from 'next/navigation'
import { CoupleNav } from '@/components/couple/CoupleNav'
import { CoupleSpaceTabs } from '@/components/couple/CoupleSpaceTabs'
import { fetchCoupleSession } from '@/lib/couple'

export default async function CoupleSpaceLayout({ children }: { children: React.ReactNode }) {
  const session = await fetchCoupleSession()
  if (!session) redirect('/login?redirect=/mon-espace')

  return (
    <div className="min-h-screen bg-creme font-manrope text-texte">
      <CoupleNav session={session} />

      <div className="mx-auto w-full max-w-[1120px] px-5 md:px-10">
        <header className="pt-8 pb-6 md:pt-11 md:pb-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">Mon espace Wedly</p>
          <h1 className="mt-3.5 font-cormorant text-[34px] font-medium tracking-tight text-texte md:text-[46px]">
            Bonjour
            {session.firstName ? (
              <>
                , <em className="font-normal italic text-dore">{session.firstName}</em>
              </>
            ) : null}
            .
          </h1>
        </header>

        <CoupleSpaceTabs />

        <main className="pt-8 pb-20 md:pt-10 md:pb-12">{children}</main>
      </div>
    </div>
  )
}
