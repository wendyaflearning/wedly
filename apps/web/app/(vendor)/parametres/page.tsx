'use client'

export default function ParametresPage() {
  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/login'
  }

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

        <div className="flex items-center justify-between mb-6">
          <h2 className="font-cormorant text-[28px] md:text-[32px] text-texte leading-none">
            Vos informations
          </h2>
          <button
            disabled
            className="bg-bordeaux text-creme text-[11px] font-semibold tracking-[0.1em] uppercase px-5 py-2.5 rounded opacity-50 cursor-not-allowed"
          >
            Enregistrer
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
          <Field label="Nom complet" placeholder="Nom complet" />
          <Field label="Adresse e-mail" placeholder="email@exemple.fr" type="email" />
          <Field label="Téléphone" placeholder="+33 6 00 00 00 00" type="tel" />
          <Field label="Profession" placeholder="Photographe" disabled />
        </div>
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
          <div className="flex items-center justify-between py-4 border-b border-bordeaux/10">
            <div>
              <p className="text-[13px] font-medium text-texte">Mot de passe</p>
              <p className="text-[12px] text-gris mt-0.5">Dernière modification il y a 3 mois</p>
            </div>
            <button
              disabled
              className="flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.1em] uppercase text-accent cursor-not-allowed opacity-60"
            >
              Modifier
              <svg width="6" height="10" viewBox="0 0 6 10" fill="none">
                <path d="M1 1l4 4-4 4" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>

          <div className="flex items-center justify-between py-4 border-b border-bordeaux/10">
            <div>
              <p className="text-[13px] font-medium text-texte">Authentification à deux facteurs</p>
              <p className="text-[12px] text-gris mt-0.5">
                Sécurisez votre compte avec un code envoyé par SMS à chaque connexion
              </p>
            </div>
            <Toggle on={false} />
          </div>
        </div>
      </section>

      <hr className="border-0 h-px bg-bordeaux/10 mb-12 md:mb-14" />

      {/* ── NOTIFICATIONS ──────────────────────────────────────────────── */}
      <section className="mb-12 md:mb-14">
        <p className="text-[11px] font-semibold tracking-[0.15em] uppercase text-accent mb-4">
          Notifications
        </p>
        <h2 className="font-cormorant text-[28px] md:text-[32px] text-texte leading-none mb-6">
          Préférences de notifications
        </h2>

        <div className="border-t border-bordeaux/10">
          <NotifRow
            label="Nouveau match reçu"
            description="Soyez alerté dès qu'un couple vous matche en retour"
            on
          />
          <NotifRow
            label="Nouveau message"
            description="Notification pour chaque message entrant dans votre messagerie"
            on
          />
          <NotifRow
            label="Rappels de disponibilités"
            description="Rappel hebdomadaire pour tenir votre calendrier à jour"
            on={false}
          />
        </div>
      </section>

      <hr className="border-0 h-px bg-bordeaux/10 mb-6" />

      {/* ── Se déconnecter ─────────────────────────────────────────────── */}
      <button
        onClick={handleLogout}
        className="flex items-center gap-2 text-[13px] font-medium text-highlight cursor-pointer hover:opacity-75 transition-opacity"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M5.5 12H2.5a1 1 0 01-1-1V3a1 1 0 011-1H5.5" stroke="#E35704" strokeWidth="1.25" strokeLinecap="round" />
          <path d="M9.5 10l3-3-3-3M12.5 7H5.5" stroke="#E35704" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Se déconnecter
      </button>

    </div>
  )
}

function Field({
  label,
  placeholder,
  type = 'text',
  disabled = false,
}: {
  label: string
  placeholder: string
  type?: string
  disabled?: boolean
}) {
  return (
    <div>
      <label className="block text-[10px] font-medium tracking-[0.12em] uppercase text-gris mb-1.5">
        {label}
      </label>
      <input
        type={type}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full border border-bordeaux/20 rounded px-3.5 py-3 text-sm text-texte bg-creme placeholder:text-gris/60 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:border-bordeaux/40"
      />
    </div>
  )
}

function Toggle({ on }: { on: boolean }) {
  return (
    <div
      className={`relative flex-shrink-0 w-10 h-[22px] rounded-full cursor-not-allowed transition-colors ${on ? 'bg-bordeaux' : 'bg-bordeaux/20'}`}
    >
      <span
        className={`absolute top-[3px] w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${on ? 'left-[22px]' : 'left-[3px]'}`}
      />
    </div>
  )
}

function NotifRow({
  label,
  description,
  on,
}: {
  label: string
  description: string
  on: boolean
}) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-bordeaux/10">
      <div>
        <p className="text-[13px] font-medium text-texte">{label}</p>
        <p className="text-[12px] text-gris mt-0.5">{description}</p>
      </div>
      <Toggle on={on} />
    </div>
  )
}
