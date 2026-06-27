'use client'
import { useState, useEffect } from 'react'
import { Toast } from '@/components/ui/Toast'
import { useToast } from '@/hooks/useToast'

interface FormState {
  brandName: string
  phone: string
  address: string
  zipcode: string
  city: string
  siret: string
  firstName: string
  lastName: string
}

const empty: FormState = { brandName: '', phone: '', address: '', zipcode: '', city: '', siret: '', firstName: '', lastName: '' }

function Field({ label, value, onChange, disabled = false, hint }: {
  label: string
  value: string
  onChange?: (v: string) => void
  disabled?: boolean
  hint?: string
}) {
  return (
    <div className="py-5">
      <label className="block font-manrope text-[10px] tracking-[0.22em] uppercase mb-2" style={{ color: 'rgba(78,26,50,0.4)' }}>
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={onChange ? e => onChange(e.target.value) : undefined}
        disabled={disabled}
        className={[
          'w-full rounded-xl border px-4 py-3 font-manrope text-[14px] outline-none transition-colors duration-150',
          disabled
            ? 'border-bordeaux/10 bg-bordeaux/5 text-bordeaux/35 cursor-not-allowed'
            : 'border-bordeaux/15 bg-white text-texte focus:border-bordeaux/40',
        ].join(' ')}
      />
      {hint && (
        <p className="mt-1.5 font-manrope text-[12px]" style={{ color: 'rgba(41,26,16,0.45)' }}>{hint}</p>
      )}
    </div>
  )
}

function Divider() {
  return <div className="border-t" style={{ borderColor: 'rgba(78,26,50,0.08)' }} />
}

export default function GeneralInfoForm({ vendorId }: { vendorId: string }) {
  const [form, setForm] = useState<FormState>(empty)
  const [snapshot, setSnapshot] = useState<FormState>(empty)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const { toast, showToast } = useToast()

  useEffect(() => {
    fetch(`/api/vendors/${vendorId}/legal-info`)
      .then(r => r.json())
      .then(data => {
        const state: FormState = {
          brandName: data.brand_name ?? '',
          phone: data.phone ?? '',
          address: data.address ?? '',
          zipcode: data.zipcode ?? '',
          city: data.city ?? '',
          siret: data.siret ?? '',
          firstName: data.first_name ?? '',
          lastName: data.last_name ?? '',
        }
        setForm(state)
        setSnapshot(state)
      })
      .catch(() => showToast('error', 'Impossible de charger les données.'))
      .finally(() => setLoading(false))
  }, [vendorId])

  function set(field: keyof FormState) {
    return (value: string) => setForm(prev => ({ ...prev, [field]: value }))
  }

  const isDirty = JSON.stringify(form) !== JSON.stringify(snapshot)

  async function handleSubmit() {
    setSubmitting(true)
    try {
      const res = await fetch(`/api/vendors/${vendorId}/legal-info`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: {
            brand_name: form.brandName,
            first_name: form.firstName,
            last_name:  form.lastName,
            siret:      form.siret,
            phone:      form.phone,
            address:    form.address,
            zipcode:    form.zipcode,
            city:       form.city,
          }
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error ?? 'Une erreur est survenue.')
      }
      setSnapshot({ ...form })
      showToast('success', 'Informations enregistrées ✓')
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Une erreur est survenue.')
    } finally {
      setSubmitting(false)
    }
  }

  function handleCancel() {
    setForm({ ...snapshot })
  }

  return (
    <>
      <Toast toast={toast} />
      <div className="max-w-[640px] mx-auto px-5 md:px-0 py-10 md:py-14 pb-32">

        {/* Notice */}
        <div className="flex items-start gap-3 rounded-xl border px-4 py-3 mb-8" style={{ borderColor: 'rgba(157,79,30,0.25)', backgroundColor: 'rgba(157,79,30,0.05)' }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0 mt-0.5">
            <rect x="5" y="7" width="6" height="6" rx="1" stroke="#9D4F1E" strokeWidth="1.3" />
            <path d="M5.5 7V5.5a2.5 2.5 0 0 1 5 0V7" stroke="#9D4F1E" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
          <p className="font-manrope text-[13px]" style={{ color: 'rgba(41,26,16,0.7)' }}>
            Ces informations <strong className="font-semibold" style={{ color: 'rgba(41,26,16,0.85)' }}>ne sont pas publiques</strong>. Elles nous permettent de valider votre profil.
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border bg-white px-6 md:px-8" style={{ borderColor: 'rgba(78,26,50,0.10)' }}>
          {loading ? (
            <div className="py-5 space-y-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-12 rounded-xl bg-bordeaux/10 animate-pulse" />
              ))}
            </div>
          ) : (
            <>
              <Field label="Nom commercial" value={form.brandName} onChange={set('brandName')} />
              <Divider />
              <Field label="Numéro de téléphone professionnel" value={form.phone} onChange={set('phone')} />
              <Divider />
              <Field label="Adresse" value={form.address} onChange={set('address')} />
              <Field label="Code postal" value={form.zipcode} onChange={set('zipcode')} />
              <Field label="Ville" value={form.city} onChange={set('city')} />
              <Divider />
              <Field
                label="SIRET"
                value={form.siret}
                disabled
                hint="14 chiffres — auto-entrepreneur, SASU, EURL..."
              />
            </>
          )}
        </div>

      </div>

      {/* Sticky footer */}
      <footer className="sticky bottom-0 bg-creme border-t px-5 py-4 md:px-[72px]" style={{ borderColor: 'rgba(78,26,50,0.10)' }}>
        <div className="flex gap-3 max-w-[640px] mx-auto">
          <button
              onClick={handleCancel}
              disabled={!isDirty || submitting}
              className={[
                'shrink-0 px-6 py-3 rounded-full font-manrope text-[13px] tracking-[0.06em] border transition-colors duration-200',
                isDirty && !submitting
                    ? 'border-bordeaux/30 text-bordeaux hover:bg-bordeaux/5'
                    : 'border-bordeaux/15 text-bordeaux/30',
              ].join(' ')}
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={!isDirty || submitting}
            className={[
              'grow md:grow-0 px-6 py-3 rounded-full font-manrope text-[13px] tracking-[0.06em] text-creme transition-colors duration-200',
              isDirty && !submitting ? 'bg-accent' : 'bg-bordeaux/20',
            ].join(' ')}
          >
            {submitting ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </div>
      </footer>
    </>
  )
}
