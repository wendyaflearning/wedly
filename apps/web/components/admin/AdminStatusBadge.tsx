import type { AdminVendorStatus } from '@/lib/admin-types'

const STATUS_STYLES: Record<AdminVendorStatus, string> = {
  pending: 'border-dore/35 bg-dore/10 text-accent',
  under_review: 'border-dore/45 bg-dore/15 text-accent',
  active: 'border-bordeaux/15 bg-bordeaux/5 text-bordeaux',
  rejected: 'border-highlight/25 bg-highlight/10 text-highlight',
}

export function AdminStatusBadge({
  status,
  label,
}: {
  status: AdminVendorStatus
  label: string
}) {
  return (
    <span className={`inline-flex h-7 items-center rounded-md border px-2.5 text-xs font-semibold ${STATUS_STYLES[status]}`}>
      {label}
    </span>
  )
}
