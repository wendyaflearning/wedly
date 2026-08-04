'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Toast } from '@/components/ui/Toast'
import { useToast } from '@/hooks/useToast'
import { apiFetch } from '@/lib/fetchClient'

interface Props {
  initialFirstName: string
  initialLastName: string
  initialEmail: string
}

export default function AccountInfoForm({ initialFirstName, initialLastName, initialEmail }: Props) {
  const [firstName, setFirstName] = useState(initialFirstName)
  const [lastName, setLastName] = useState(initialLastName)
  const [email, setEmail] = useState(initialEmail)
  const [submitting, setSubmitting] = useState(false)
  const router = useRouter()
  const { toast, showToast } = useToast()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      await apiFetch('/api/vendors/me/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName, lastName, email }),
      })
      showToast('success', 'Informations enregistrées ✓')
      router.refresh()
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Une erreur est survenue.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <Toast toast={toast} />
      <form onSubmit={handleSubmit}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-cormorant text-[28px] md:text-[32px] text-texte leading-none">
            Vos informations
          </h2>
          <button
            type="submit"
            disabled={submitting}
            className="bg-bordeaux text-creme text-[11px] font-semibold tracking-[0.1em] uppercase px-5 py-2.5 rounded disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
          <Field label="Prénom" value={firstName} onChange={setFirstName} placeholder="Prénom" />
          <Field label="Nom" value={lastName} onChange={setLastName} placeholder="Nom" />
          <Field
            label="Adresse e-mail"
            value={email}
            onChange={setEmail}
            placeholder="email@exemple.fr"
            type="email"
          />
        </div>

        <p className="mt-5 text-[12px] text-gris">
          Votre téléphone professionnel et votre métier se gèrent depuis{' '}
          <Link
            href="/dashboard/profile/general-info"
            className="text-accent underline underline-offset-2 hover:opacity-75 transition-opacity"
          >
            Informations générales →
          </Link>
        </p>
      </form>
    </>
  )
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder: string
  type?: string
}) {
  return (
    <div>
      <label className="block text-[10px] font-medium tracking-[0.12em] uppercase text-gris mb-1.5">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-bordeaux/20 rounded px-3.5 py-3 text-sm text-texte bg-creme placeholder:text-gris/60 focus:outline-none focus:border-bordeaux/40"
      />
    </div>
  )
}
