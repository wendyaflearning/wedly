'use client'

import { useState } from 'react'

type State = 'idle' | 'loading' | 'success' | 'error'

// Motif repris de ExpiredInvitationScreen (app/onboarding/[token]/page.tsx) — extraire
// en composant partagé si un 3e usage apparaît. Deux usages ne le justifient pas encore.
function Screen({ label, title, children }: { label: string; title: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-creme px-6 text-center text-texte">
      <div className="max-w-lg">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-highlight">{label}</p>
        <h1 className="mt-4 font-cormorant text-[34px] font-semibold leading-tight text-bordeaux">
          {title}
        </h1>
        {children}
      </div>
    </div>
  )
}

export default function UnsubscribeConfirm({ vendorId }: { vendorId: string }) {
  const [state, setState] = useState<State>('idle')

  async function handleUnsubscribe() {
    setState('loading')
    try {
      // Toujours via le Route Handler local, jamais l'URL Symfony depuis le navigateur.
      const res = await fetch(`/api/vendors/${vendorId}/unsubscribe`, { method: 'POST' })
      // Le backend ne distingue pas « vient d'être désinscrit » de « déjà désinscrit ».
      // Le front n'a donc pas à lire le corps de la réponse.
      setState(res.ok ? 'success' : 'error')
    } catch {
      setState('error')
    }
  }

  if (state === 'success') {
    return (
      <Screen label="Désinscription" title="C’est fait.">
        <p className="mt-4 text-base leading-7 text-gris">
          Vous ne recevrez plus nos emails de campagne.
        </p>
        <p className="mt-3 text-sm leading-6 text-gris">
          Les emails liés à votre compte, réinitialisation de mot de passe, invitation,
          continueront à vous parvenir.
        </p>
      </Screen>
    )
  }

  if (state === 'error') {
    return (
      <Screen label="Désinscription" title="L’opération n’a pas abouti.">
        <p className="mt-4 text-base leading-7 text-gris">
          Réessayez dans un instant, ou écrivez-nous à contact@wedly-apps.com.
        </p>
        <button
          type="button"
          onClick={() => setState('idle')}
          className="mt-8 inline-flex items-center justify-center rounded-[13px] bg-gradient-to-br from-accent to-highlight px-6 py-4 font-manrope text-[15px] font-semibold text-creme transition-[transform,filter] duration-150 hover:-translate-y-px hover:brightness-105"
        >
          Réessayer
        </button>
      </Screen>
    )
  }

  return (
    <Screen label="Désinscription" title="Ne plus recevoir nos emails ?">
      <p className="mt-4 text-base leading-7 text-gris">
        Confirmez ci-dessous et vous serez retiré de nos campagnes email. Les emails liés à
        votre compte continueront de vous parvenir.
      </p>
      <button
        type="button"
        onClick={handleUnsubscribe}
        disabled={state === 'loading'}
        className="mt-8 inline-flex items-center justify-center rounded-[13px] bg-gradient-to-br from-accent to-highlight px-6 py-4 font-manrope text-[15px] font-semibold text-creme transition-[transform,filter] duration-150 hover:-translate-y-px hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
      >
        {state === 'loading' ? 'Désinscription en cours…' : 'Se désinscrire'}
      </button>
    </Screen>
  )
}
