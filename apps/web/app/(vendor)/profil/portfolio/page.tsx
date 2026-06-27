import { redirect } from 'next/navigation'
import { fetchVendorDashboard, fetchVendorPortfolio } from '@/lib/vendor'
import PortfolioPageClient from './_components/PortfolioPageClient'

const STEPS = [
  { n: '01', label: 'Identité',       done: true,  active: false },
  { n: '02', label: 'Présentation',   done: true,  active: false },
  { n: '03', label: 'Disponibilités', done: true,  active: false },
  { n: '04', label: 'Portfolio',      done: false, active: true  },
  { n: '05', label: 'Tarifs',         done: false, active: false },
  { n: '06', label: 'Vérification',   done: false, active: false },
]

export default async function PortfolioPage() {
  const dashboard = await fetchVendorDashboard()
  if (!dashboard) redirect('/login')

  const photos = await fetchVendorPortfolio(dashboard.id)

  return (
    <div>
      {/* ── Bandeau bordeaux ────────────────────────────────────────────── */}
      <div className="bg-bordeaux" style={{ padding: '36px 0 44px' }}>
        <div className="max-w-5xl mx-auto px-5 md:px-6">

          {/* Desktop : sidebar labels + titre */}
          <div className="hidden md:grid" style={{ gridTemplateColumns: '200px 1fr', gap: '0 48px' }}>
            <div style={{ paddingTop: 2 }}>
              <p className="font-josefin uppercase" style={{ fontSize: 10, letterSpacing: '0.12em', color: 'rgba(255,246,237,0.5)', marginBottom: 10 }}>
                MON PROFIL
              </p>
              <p style={{ fontFamily: 'var(--font-manrope-var, Manrope, system-ui, sans-serif)', fontSize: 13, color: 'rgba(255,246,237,0.55)' }}>
                Étape <strong style={{ color: '#FFF6ED' }}>02</strong> / 06
              </p>
            </div>
            <div>
              <p className="font-josefin uppercase" style={{ fontSize: 10, letterSpacing: '0.12em', color: 'rgba(255,246,237,0.45)', marginBottom: 12 }}>
                ÉTAPE 02 · MON PROFIL
              </p>
              <h1 className="font-cormorant font-light text-creme" style={{ fontSize: 'clamp(28px, 3.5vw, 44px)', lineHeight: 1.2, marginBottom: 14 }}>
                Ajoutez vos <em style={{ color: 'var(--color-accent)' }}>photos de portfolio.</em>
              </h1>
              <p style={{ fontFamily: 'var(--font-manrope-var, Manrope, system-ui, sans-serif)', fontSize: 14, color: 'rgba(255,246,237,0.62)', lineHeight: 1.7, maxWidth: 520 }}>
                Les couples décident souvent en images — choisissez celles qui racontent le mieux votre univers.
                Cinq photos suffisent, désignez votre préférée comme couverture : c&apos;est la première qu&apos;on verra de vous.
              </p>
            </div>
          </div>

          {/* Mobile : titre seul */}
          <div className="md:hidden">
            <p className="font-josefin uppercase" style={{ fontSize: 10, letterSpacing: '0.12em', color: 'rgba(255,246,237,0.45)', marginBottom: 10 }}>
              ÉTAPE 02 · MON PROFIL
            </p>
            <h1 className="font-cormorant font-light text-creme" style={{ fontSize: 'clamp(24px, 8vw, 34px)', lineHeight: 1.2, marginBottom: 12 }}>
              Ajoutez vos <em style={{ color: 'var(--color-accent)' }}>photos.</em>
            </h1>
            <p style={{ fontFamily: 'var(--font-manrope-var, Manrope, system-ui, sans-serif)', fontSize: 13, color: 'rgba(255,246,237,0.62)', lineHeight: 1.65 }}>
              Cinq photos qui racontent votre univers. Désignez votre préférée comme couverture.
            </p>
          </div>

        </div>
      </div>

      {/* ── Tab bar mobile (étapes) ─────────────────────────────────────── */}
      <div className="md:hidden bg-creme" style={{ borderBottom: '1px solid rgba(78,26,50,0.08)', overflowX: 'auto' }}>
        <div style={{ display: 'flex', padding: '0 16px', minWidth: 'max-content' }}>
          {STEPS.map(step => (
            <div
              key={step.n}
              className="font-manrope"
              style={{
                padding: '14px 14px',
                fontSize: 13,
                fontWeight: step.active ? 600 : 400,
                color: step.active ? '#291A10' : 'rgba(41,26,16,0.45)',
                borderBottom: step.active ? '2px solid var(--color-accent)' : '2px solid transparent',
                whiteSpace: 'nowrap',
                display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              {step.label}
              {step.done && (
                <svg width="11" height="8" viewBox="0 0 11 8" fill="none">
                  <path d="M1 4l3 3 6-6" stroke="rgba(41,26,16,0.4)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Contenu — PortfolioPageClient rendu UNE SEULE FOIS ─────────── */}
      <div className="max-w-5xl mx-auto px-5 md:px-6 pt-8 pb-44 md:pb-20">
        <div className="md:flex md:items-start" style={{ gap: '0 48px' }}>

          {/* Sidebar — masquée sur mobile, colonne fixe 200px desktop */}
          <aside className="hidden md:block md:shrink-0" style={{ width: 200 }}>
            <p className="font-josefin uppercase text-bordeaux" style={{ fontSize: 10, letterSpacing: '0.12em', marginBottom: 16 }}>
              MON PROFIL
            </p>
            <nav style={{ display: 'flex', flexDirection: 'column' }}>
              {STEPS.map(step => (
                <div key={step.n} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid rgba(78,26,50,0.07)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontFamily: 'var(--font-manrope-var, Manrope, system-ui, sans-serif)', fontSize: 11, color: 'rgba(41,26,16,0.3)', minWidth: 16 }}>{step.n}</span>
                    <span style={{ fontFamily: 'var(--font-manrope-var, Manrope, system-ui, sans-serif)', fontSize: 13, color: step.active ? '#291A10' : 'rgba(41,26,16,0.45)', fontWeight: step.active ? 700 : 400 }}>{step.label}</span>
                  </span>
                  {step.done && (
                    <svg width="13" height="10" viewBox="0 0 13 10" fill="none">
                      <path d="M1.5 5l3.5 3.5L11.5 1" stroke="rgba(41,26,16,0.35)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                  {step.active && <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-accent)', flexShrink: 0 }} />}
                </div>
              ))}
            </nav>
          </aside>

          {/* Contenu unique — flex-1 sur desktop, pleine largeur sur mobile */}
          <div className="md:flex-1 md:min-w-0">
            <PortfolioPageClient initialPhotos={photos} vendorId={dashboard.id} />
          </div>

        </div>
      </div>
    </div>
  )
}
