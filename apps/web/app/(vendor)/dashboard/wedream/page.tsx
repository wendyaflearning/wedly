import { redirect } from 'next/navigation'
import { fetchVendorDashboard } from '@/lib/vendor'
import { WedreamVisibilityClient } from './_components/WedreamVisibilityClient'

export default async function WedreamPage() {
  const data = await fetchVendorDashboard()
  if (!data) redirect('/login')

  return <WedreamVisibilityClient wedreamEnabled={data.wedream_enabled} />
}
