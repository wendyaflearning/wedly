import { redirect } from 'next/navigation'
import { fetchVendorDashboard } from '@/lib/vendor'
import AccountInfoForm from './_components/AccountInfoForm'
import LogoutButton from './_components/LogoutButton'
import PasswordForm from './_components/PasswordForm'

export default async function ParametresPage() {
  const dashboard = await fetchVendorDashboard()
  if (!dashboard) redirect('/login')

  return (
    <div className="max-w-[900px] mx-auto px-6 md:px-12 pt-10 md:pt-14 pb-24 font-manrope">

      {/* ── Page header ────────────────────────────────────────────────── */}
      <div className="mb-10 md:mb-14">
        <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-highlight mb-3">
          Espace prestataire
        </p>
        <h1 className="font-cormorant italic text-[48px] md:text-[60px] leading-none text-texte">
          Paramètres
        </h1>
      </div>

      {/* ── COMPTE ─────────────────────────────────────────────────────── */}
      <section className="mb-12 md:mb-14">
        <p className="text-[11px] font-semibold tracking-[0.15em] uppercase text-accent mb-4">
          Compte
        </p>
        <AccountInfoForm
          initialFirstName={dashboard.firstName}
          initialLastName={dashboard.lastName ?? ''}
          initialEmail={dashboard.email ?? ''}
        />
      </section>

      <hr className="border-0 h-px bg-bordeaux/10 mb-12 md:mb-14" />

      {/* ── SÉCURITÉ ───────────────────────────────────────────────────── */}
      <section className="mb-12 md:mb-14">
        <p className="text-[11px] font-semibold tracking-[0.15em] uppercase text-accent mb-4">
          Sécurité
        </p>
        <h2 className="font-cormorant text-[28px] md:text-[32px] text-texte leading-none mb-6">
          Mot de passe et accès
        </h2>

        <div className="border-t border-bordeaux/10">
          <PasswordForm />
        </div>
      </section>

      <hr className="border-0 h-px bg-bordeaux/10 mb-6" />

      {/* ── Se déconnecter ─────────────────────────────────────────────── */}
      <LogoutButton />

    </div>
  )
}

