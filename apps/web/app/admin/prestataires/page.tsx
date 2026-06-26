import Link from 'next/link'
import { AlertCircle, ClipboardList, Plus } from 'lucide-react'
import { fetchAdminVendorDrafts, fetchAdminVendorInvitations, fetchAdminVendors } from '@/lib/admin'
import type {
  AdminVendorFilter,
  AdminVendorInvitationScope,
  AdminVendorListItem,
} from '@/lib/admin-types'

import { AdminRetryButton } from '@/components/admin/AdminRetryButton'
import { AdminToast } from '@/components/admin/AdminToast'
import { AdminVendorInvitationTable } from '@/components/admin/AdminVendorInvitationTable'
import { AdminVendorTable } from '@/components/admin/AdminVendorTable'

const FILTERS: Array<{ value: AdminVendorFilter; label: string }> = [
  { value: 'under_review', label: 'En attente' },
  { value: 'active', label: 'Validés' },
  { value: 'rejected', label: 'Refusés' },
  { value: 'all', label: 'Tous' },
]

type StatusCounts = Record<AdminVendorFilter, number>

function resolveFilter(value?: string): AdminVendorFilter {
  if (value === 'active' || value === 'rejected' || value === 'all') return value
  return 'under_review'
}

function getFilterHref(filter: AdminVendorFilter): string {
  return filter === 'under_review' ? '/admin/prestataires' : `/admin/prestataires?status=${filter}`
}

function resolveView(value?: string): 'profiles' | 'drafts' | 'invitations' {
  if (value === 'drafts') return 'drafts'
  return value === 'invitations' ? 'invitations' : 'profiles'
}

function resolveInvitationScope(value?: string): AdminVendorInvitationScope {
  return value === 'expired' ? 'expired' : 'active'
}

function getStatusCounts(items: AdminVendorListItem[], totalAll: number): StatusCounts {
  const counts: StatusCounts = {
    under_review: 0,
    active: 0,
    rejected: 0,
    all: totalAll,
  }

  for (const item of items) {
    if (item.status === 'under_review' || item.status === 'active' || item.status === 'rejected') {
      counts[item.status] += 1
    }
  }

  return counts
}

function EmptyState({ filter, totalAll }: { filter: AdminVendorFilter; totalAll: number }) {
  const isBaseEmpty = totalAll === 0
  const title = isBaseEmpty
    ? 'Aucun prestataire inscrit pour le moment'
    : filter === 'under_review'
      ? 'Tout est à jour ✅'
      : 'Aucun profil pour ce filtre'
  const subtitle = isBaseEmpty
    ? "Les demandes apparaîtront ici dès qu'un prestataire aura complété son inscription."
    : filter === 'under_review'
      ? 'Aucun profil en attente de validation. Reviens plus tard pour la suite.'
      : 'Change de filtre pour consulter les autres profils.'

  return (
    <div className="flex min-h-[520px] flex-col items-center justify-center rounded-lg border border-bordeaux/10 bg-white px-6 py-16 text-center shadow-sm">
      <ClipboardList size={78} strokeWidth={1.6} className="text-bordeaux/22" aria-hidden="true" />
      <h2 className="mt-9 font-cormorant text-[28px] font-semibold leading-tight text-bordeaux/75 md:text-[32px]">
        {title}
      </h2>
      <p className="mt-4 max-w-[520px] text-[16px] leading-7 text-gris">{subtitle}</p>
    </div>
  )
}

function ErrorState() {
  return (
    <div className="flex min-h-[420px] flex-col items-center justify-center rounded-lg border border-bordeaux/10 bg-white px-6 py-14 text-center shadow-sm">
      <AlertCircle size={56} strokeWidth={1.7} className="text-highlight" aria-hidden="true" />
      <h2 className="mt-6 font-cormorant text-[30px] font-semibold leading-tight text-bordeaux">
        Chargement impossible
      </h2>
      <p className="mt-3 max-w-[520px] text-sm leading-6 text-gris">
        La liste des profils prestataires n&apos;a pas pu être chargée.
      </p>
      <div className="mt-7">
        <AdminRetryButton />
      </div>
    </div>
  )
}

function EmptyInvitationState({ scope }: { scope: AdminVendorInvitationScope }) {
  return (
    <div className="flex min-h-[420px] flex-col items-center justify-center rounded-lg border border-bordeaux/10 bg-white px-6 py-14 text-center shadow-sm">
      <ClipboardList size={64} strokeWidth={1.6} className="text-bordeaux/22" aria-hidden="true" />
      <h2 className="mt-7 font-cormorant text-[30px] font-semibold leading-tight text-bordeaux/75">
        {scope === 'expired' ? 'Aucune invitation expirée' : 'Aucune invitation active'}
      </h2>
      <p className="mt-3 max-w-[520px] text-sm leading-6 text-gris">
        {scope === 'expired'
          ? 'Les invitations expirées apparaîtront ici pour consultation.'
          : 'Les nouvelles invitations en attente apparaîtront ici après création.'}
      </p>
    </div>
  )
}

function EmptyDraftState() {
  return (
    <div className="flex min-h-[420px] flex-col items-center justify-center rounded-lg border border-bordeaux/10 bg-white px-6 py-14 text-center shadow-sm">
      <ClipboardList size={64} strokeWidth={1.6} className="text-bordeaux/22" aria-hidden="true" />
      <h2 className="mt-7 font-cormorant text-[30px] font-semibold leading-tight text-bordeaux/75">
        Aucun brouillon pour l&apos;instant
      </h2>
      <p className="mt-3 max-w-[520px] text-sm leading-6 text-gris">
        Les profils enregistrés avant envoi d’invitation apparaîtront ici.
      </p>
    </div>
  )
}

export default async function AdminVendorsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; toast?: string; view?: string; scope?: string }>
}) {
  const params = await searchParams
  const view = resolveView(params.view)
  const filter = resolveFilter(params.status)
  const invitationScope = resolveInvitationScope(params.scope)
  const [result, allResult] = await Promise.all([
    fetchAdminVendors(filter),
    fetchAdminVendors('all'),
  ])
  const invitationsResult = view === 'invitations' ? await fetchAdminVendorInvitations(invitationScope) : null
  const draftsResult = view === 'drafts' ? await fetchAdminVendorDrafts() : null

  const allItems = allResult.ok ? allResult.data.items : result.ok ? result.data.items : []
  const totalAll = allResult.ok ? allResult.data.totalAll : result.ok ? result.data.totalAll : 0
  const counts = getStatusCounts(allItems, totalAll)

  return (
    <div className="flex flex-col gap-9">
      <AdminToast toast={params.toast} />

      <div className="flex flex-col gap-9">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:gap-5">
            <h1 className="font-cormorant text-[42px] font-semibold leading-none text-bordeaux md:text-[48px]">
              Prestataires
            </h1>
            <p className="pb-1 text-[17px] font-semibold text-gris">
              {totalAll} {totalAll > 1 ? 'profils' : 'profil'} au total
            </p>
          </div>
          <Link
            href="/admin/vendors/new"
            className="inline-flex h-11 items-center gap-2 rounded-md bg-highlight px-4 text-sm font-bold text-creme no-underline transition-opacity hover:opacity-90"
          >
            <Plus size={17} aria-hidden="true" />
            Ajouter
          </Link>
        </div>

        <div className="flex flex-col gap-5 border-b border-bordeaux/10">
          <nav className="flex gap-3 overflow-x-auto" aria-label="Vues admin prestataires">
            {[
              { value: 'profiles', label: 'Profils', href: getFilterHref(filter) },
              { value: 'drafts', label: 'Brouillons', href: '/admin/prestataires?view=drafts' },
              { value: 'invitations', label: 'Invitations en attente', href: '/admin/prestataires?view=invitations' },
            ].map((item) => {
              const active = item.value === view

              return (
                <Link
                  key={item.value}
                  href={item.href}
                  className={[
                    'flex h-[46px] shrink-0 items-center border-b-2 px-3 text-[15px] font-bold no-underline transition-colors md:px-5',
                    active
                      ? 'border-highlight text-bordeaux'
                      : 'border-transparent text-gris hover:text-bordeaux',
                  ].join(' ')}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>

          {view === 'profiles' ? (
            <nav className="flex max-w-[650px] gap-3 overflow-x-auto md:gap-6" aria-label="Filtres prestataires">
              {FILTERS.map((item) => {
                const active = item.value === filter

                return (
                  <Link
                    key={item.value}
                    href={getFilterHref(item.value)}
                    className={[
                      'flex h-[56px] shrink-0 items-center gap-2 border-b-2 px-3 text-[16px] font-semibold no-underline transition-colors md:min-w-[120px] md:px-6',
                      active
                        ? 'border-highlight text-bordeaux'
                        : 'border-transparent text-gris hover:text-bordeaux',
                    ].join(' ')}
                  >
                    <span>{item.label}</span>
                    <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-bordeaux/7 px-2 text-sm font-bold text-gris">
                      {counts[item.value]}
                    </span>
                  </Link>
                )
              })}
            </nav>
          ) : view === 'invitations' ? (
            <nav className="flex max-w-[420px] gap-3 overflow-x-auto md:gap-6" aria-label="Filtres invitations">
              {[
                { value: 'active', label: 'Actives', href: '/admin/prestataires?view=invitations' },
                { value: 'expired', label: 'Expirées', href: '/admin/prestataires?view=invitations&scope=expired' },
              ].map((item) => {
                const active = item.value === invitationScope

                return (
                  <Link
                    key={item.value}
                    href={item.href}
                    className={[
                      'flex h-[56px] shrink-0 items-center border-b-2 px-3 text-[16px] font-semibold no-underline transition-colors md:min-w-[120px] md:px-6',
                      active
                        ? 'border-highlight text-bordeaux'
                        : 'border-transparent text-gris hover:text-bordeaux',
                    ].join(' ')}
                  >
                    {item.label}
                  </Link>
                )
              })}
            </nav>
          ) : null}
        </div>
      </div>

      {view === 'drafts' ? (
        !draftsResult?.ok ? (
          <ErrorState />
        ) : draftsResult.data.items.length === 0 ? (
          <EmptyDraftState />
        ) : (
          <AdminVendorTable items={draftsResult.data.items} hrefForItem={(item) => `/admin/vendors/${item.id}/edit`} />
        )
      ) : view === 'invitations' ? (
        !invitationsResult?.ok ? (
          <ErrorState />
        ) : invitationsResult.data.items.length === 0 ? (
          <EmptyInvitationState scope={invitationScope} />
        ) : (
          <AdminVendorInvitationTable items={invitationsResult.data.items} />
        )
      ) : !result.ok ? (
        <ErrorState />
      ) : result.data.items.length === 0 ? (
        <EmptyState filter={filter} totalAll={totalAll} />
      ) : (
        <AdminVendorTable items={result.data.items} />
      )}
    </div>
  )
}
