import Link from 'next/link'
import { redirect } from 'next/navigation'
import { fetchAdminSession } from '@/lib/admin'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const isAdmin = await fetchAdminSession()
  if (!isAdmin) redirect('/login')

  return (
    <div className="min-h-screen bg-[#f7f3ee] text-texte">
      <header className="sticky top-0 z-40 border-b border-[#e7ded4] bg-[#f7f3ee]/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <Link href="/admin/prestataires" className="font-cormorant text-2xl font-semibold text-bordeaux no-underline">
            Wedly Admin
          </Link>
          <nav className="flex items-center gap-2 text-sm font-semibold text-texte/70">
            <Link
              href="/admin/prestataires"
              className="rounded-md px-3 py-2 no-underline transition-colors hover:bg-white hover:text-texte"
            >
              Prestataires
            </Link>
            <a
              href="/api/auth/logout"
              className="rounded-md px-3 py-2 no-underline transition-colors hover:bg-white hover:text-highlight"
            >
              Déconnexion
            </a>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-5 py-6 md:py-8">{children}</main>
    </div>
  )
}
