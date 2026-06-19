import { redirect } from 'next/navigation'
import { VendorNav } from '@/components/vendor/VendorNav'
import { fetchVendorDashboard } from '@/lib/vendor'

export default async function VendorLayout({ children }: { children: React.ReactNode }) {
  const dashboard = await fetchVendorDashboard()
  if (!dashboard) redirect('/login')

  const vendorStatus = dashboard.steps.published ? 'EN LIGNE' : 'EN PRÉPARATION'

  return (
    <div className="min-h-screen bg-creme">
      <VendorNav
        vendorFirstName={dashboard.firstName}
        vendorLastName={dashboard.lastName ?? ''}
        vendorEmail={dashboard.email}
        vendorStatus={vendorStatus}
      />
      <main className="pb-20 md:pb-0">{children}</main>
    </div>
  )
}
