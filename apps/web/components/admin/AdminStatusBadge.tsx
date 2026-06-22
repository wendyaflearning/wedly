import type { AdminVendorStatus } from '@/lib/admin-types'

const STATUS_STYLES: Record<AdminVendorStatus, string> = {
  under_review: 'border-[#d9b16f] bg-[#fff5df] text-[#7a5317]',
  active: 'border-[#8dc9aa] bg-[#edf9f2] text-[#286342]',
  rejected: 'border-[#df9b9b] bg-[#fff0f0] text-[#8a2f2f]',
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
