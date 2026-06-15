import { VendorNav } from '@/components/vendor/VendorNav'

export default function VendorLayout({ children }: { children: React.ReactNode }) {
  // TODO: remplacer par getServerSession() ou équivalent quand l'auth est en place
  const vendorFirstName = 'Claire'
  const vendorLastName = 'Laurent'

  return (
    <div className="min-h-screen bg-creme">
      <VendorNav vendorFirstName={vendorFirstName} vendorLastName={vendorLastName} />
      <main className="pb-20 md:pb-0">{children}</main>
    </div>
  )
}
