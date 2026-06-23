import Link from 'next/link'
import { redirect } from 'next/navigation'
import { LogOut, User } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { fetchAdminVendors, fetchCurrentAdmin } from '@/lib/admin'

type SidebarItem = {
  label: string
  icon: LucideIcon
  href?: string
  active?: boolean
  count?: number
}

const PRIMARY_ITEMS: SidebarItem[] = [
  { label: 'Prestataires', icon: User, href: '/admin/prestataires', active: true },
]

function getInitials(firstName: string, lastName: string | null): string {
  const names = [firstName, lastName].filter(Boolean) as string[]
  return names.map((name) => name[0]).join('').slice(0, 2).toUpperCase()
}

function SidebarNavItem({ item }: { item: SidebarItem }) {
  const Icon = item.icon
  const className = [
    'flex h-[50px] items-center gap-4 px-6 text-[15px] font-semibold no-underline transition-colors',
    item.active
      ? 'bg-creme/12 text-creme'
      : 'text-creme/55 hover:bg-creme/8 hover:text-creme',
  ].join(' ')

  const content = (
    <>
      <Icon size={19} strokeWidth={2} aria-hidden="true" />
      <span className="min-w-0 flex-1 truncate">{item.label}</span>
      {typeof item.count === 'number' && item.count > 0 ? (
        <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-highlight px-2 text-xs font-bold text-creme">
          {item.count}
        </span>
      ) : null}
    </>
  )

  if (item.href) {
    return (
      <Link href={item.href} className={className}>
        {content}
      </Link>
    )
  }

  return (
    <div className={className} aria-disabled="true">
      {content}
    </div>
  )
}

function SidebarSection({ title, items }: { title: string; items: SidebarItem[] }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="px-6 text-xs font-bold uppercase text-creme/35">{title}</h2>
      <nav className="flex flex-col">
        {items.map((item) => (
          <SidebarNavItem key={item.label} item={item} />
        ))}
      </nav>
    </section>
  )
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await fetchCurrentAdmin()
  if (!admin) redirect('/login')

  const pendingVendors = await fetchAdminVendors('under_review')
  const pendingCount = pendingVendors.ok ? pendingVendors.data.totalFiltered : 0
  const displayName = [admin.firstName, admin.lastName].filter(Boolean).join(' ')

  const primaryItems = PRIMARY_ITEMS.map((item) =>
    item.href === '/admin/prestataires' ? { ...item, count: pendingCount } : item
  )

  return (
    <div className="min-h-screen bg-creme text-texte lg:grid lg:grid-cols-[280px_1fr]">
      <aside className="hidden min-h-screen bg-bordeaux text-creme lg:fixed lg:inset-y-0 lg:left-0 lg:flex lg:w-[280px] lg:flex-col">
        <div className="flex h-[116px] flex-col justify-center border-b border-creme/10 px-6">
          <Link href="/admin/prestataires" className="w-fit font-cormorant text-[30px] font-semibold leading-none text-creme no-underline">
            Wedly
          </Link>
          <span className="mt-2 text-xs font-bold uppercase text-creme/45">Admin</span>
        </div>

        <div className="flex flex-1 flex-col gap-10 py-12">
          <SidebarSection title="Principal" items={primaryItems} />
        </div>

        <a
          href="/api/auth/logout"
          className="group flex min-h-[86px] items-center gap-4 border-t border-creme/10 px-6 text-creme no-underline transition-colors hover:bg-creme/8"
          aria-label="Se déconnecter"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-creme/18 text-sm font-bold text-creme">
            {getInitials(admin.firstName, admin.lastName)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-creme">{displayName}</p>
            <p className="mt-0.5 text-xs text-creme/45 transition-colors group-hover:text-creme/70">Se déconnecter</p>
          </div>
          <LogOut size={17} strokeWidth={2} className="text-creme/35 transition-colors group-hover:text-creme/75" aria-hidden="true" />
        </a>
      </aside>

      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-bordeaux/10 bg-bordeaux px-5 text-creme lg:hidden">
        <Link href="/admin/prestataires" className="font-cormorant text-2xl font-semibold text-creme no-underline">
          Wedly Admin
        </Link>
        <Link href="/admin/prestataires" className="text-sm font-semibold text-creme no-underline">
          Prestataires
        </Link>
      </header>

      <main className="min-h-screen px-5 py-8 lg:col-start-2 lg:px-16 lg:py-14 xl:px-20">
        {children}
      </main>
    </div>
  )
}
