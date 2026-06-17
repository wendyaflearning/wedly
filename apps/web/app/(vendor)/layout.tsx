import { redirect } from 'next/navigation'
import { VendorNav } from '@/components/vendor/VendorNav'
import { fetchVendorDashboard } from '@/lib/vendor'

export default async function VendorLayout({ children }: { children: React.ReactNode }) {
  const dashboard = await fetchVendorDashboard()
  if (!dashboard) redirect('/login')

  return (
    <div className="min-h-screen bg-creme">
      <VendorNav vendorFirstName={dashboard.firstName} vendorLastName="" />
      <main className="pb-20 md:pb-0">{children}</main>
    </div>
  )
}
