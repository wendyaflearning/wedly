'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Toast } from '@/components/ui/Toast'
import { useToast } from '@/hooks/useToast'
import { apiFetch } from '@/lib/fetchClient'
import type { VendorProviderLead } from '@/lib/vendor'
import {
  formatBudget,
  formatGuestCount,
  formatRequestedAt,
  formatWeddingDate,
  isLeadDecidable,
  isUnlockedVendorLead,
  leadStatusLabel,
} from '@/lib/vendor-leads'

const STROKE = 'var(--color-gris)'

function CalendarIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 14 14" fill="none" className="shrink-0">
      <rect x="1.5" y="3" width="11" height="9.5" rx="1.2" stroke={STROKE} strokeWidth="1.1" />
      <path d="M1.5 5.5h11" stroke={STROKE} strokeWidth="1.1" />
      <path d="M4.3 1.5v3M9.7 1.5v3" stroke={STROKE} strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  )
}

function GuestsIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 14 14" fill="none" className="shrink-0">
      <circle cx="5" cy="4" r="2.1" stroke={STROKE} strokeWidth="1.1" />
      <path d="M1.3 12c.3-2.3 1.8-3.6 3.7-3.6s3.4 1.3 3.7 3.6" stroke={STROKE} strokeWidth="1.1" strokeLinecap="round" />
      <circle cx="10.2" cy="4.6" r="1.6" stroke={STROKE} strokeWidth="1.1" />
      <path d="M9 8.7c1.5.1 2.6 1.2 2.9 3.1" stroke={STROKE} strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  )
}

function BudgetIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 14 14" fill="none" className="shrink-0">
      <circle cx="7" cy="7" r="5.8" stroke={STROKE} strokeWidth="1.1" />
      <path
        d="M9 4.8c-.4-.4-1-.6-1.7-.6-1.3 0-2.3.9-2.3 2s1 1.9 2.3 1.9c1.3 0 2.3.8 2.3 1.9s-1 2-2.3 2c-.7 0-1.3-.2-1.7-.6"
        stroke={STROKE}
        strokeWidth="1"
        strokeLinecap="round"
      />
    </svg>
  )
}

function TagIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 14 14" fill="none" className="shrink-0">
      <path
        d="M1.5 6.6L6.6 1.5h4.4c.6 0 1 .4 1 1v4.4L7 11.9c-.4.4-1 .4-1.4 0L1.5 8c-.4-.4-.4-1 0-1.4z"
        stroke={STROKE}
        strokeWidth="1.1"
        strokeLinejoin="round"
      />
      <circle cx="9" cy="4" r="0.9" fill={STROKE} />
    </svg>
  )
}

function PhoneIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 14 14" fill="none" className="shrink-0">
      <path
        d="M3 1.8c.4 1.2 1 2.2 1.7 3-.5.6-.9 1-1.3 1.2.9 2 2.4 3.5 4.4 4.4.2-.4.6-.8 1.2-1.3.8.7 1.8 1.3 3 1.7v1.6c0 .6-.5 1-1.1 1C6.5 12.7 1.3 7.5 1 3.1c0-.6.4-1.1 1-1.1h1z"
        stroke={STROKE}
        strokeWidth="1.1"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function MailIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 14 14" fill="none" className="shrink-0">
      <rect x="1" y="2.5" width="12" height="9" rx="1.2" stroke={STROKE} strokeWidth="1.1" />
      <path d="M1.5 3.3l5.5 4 5.5-4" stroke={STROKE} strokeWidth="1.1" strokeLinejoin="round" />
    </svg>
  )
}

function PhotoPlaceholderIcon() {
  return (
    <svg width="34" height="34" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="2" y="4" width="20" height="16" rx="1.5" stroke={STROKE} strokeWidth="1.2" />
      <circle cx="8" cy="10" r="1.6" stroke={STROKE} strokeWidth="1.2" />
      <path d="M2 16.5l5-5 4 4 4.5-5L22 15" stroke={STROKE} strokeWidth="1.2" />
    </svg>
  )
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="block text-[10px] font-semibold tracking-[0.14em] uppercase text-gris">
      {children}
    </span>
  )
}

/** Une ligne « libellé / valeur » de la colonne gauche, séparée par un filet. */
function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2.5 py-[18px] border-b border-bordeaux/10">
      {icon}
      <div>
        <FieldLabel>{label}</FieldLabel>
        <span className="text-[15px] text-texte">{value}</span>
      </div>
    </div>
  )
}

/**
 * Une coordonnée débloquée, avec son action directe (`tel:` / `mailto:`).
 *
 * La ligne s'affiche même sans valeur. Le téléphone est optionnel à
 * l'inscription (WED-216) : masquer la ligne laisserait le prestataire se
 * demander si le couple n'a pas donné de numéro ou si l'écran est cassé — deux
 * lectures très différentes de la même absence.
 */
function ContactRow({
  icon,
  label,
  value,
  href,
  action,
}: {
  icon: React.ReactNode
  label: string
  value: string | null
  href?: string
  action: string
}) {
  return (
    <div className="flex items-center justify-between gap-4 pb-[22px] mb-[22px] border-b border-bordeaux/10">
      <div className="flex items-center gap-2.5 min-w-0">
        {icon}
        <div className="min-w-0">
          <FieldLabel>{label}</FieldLabel>
          {value ? (
            <span className="text-[15px] text-texte break-words">{value}</span>
          ) : (
            <span className="text-[15px] italic text-gris">Non renseigné</span>
          )}
        </div>
      </div>

      {value && href && (
        <a
          href={href}
          className="shrink-0 text-[11px] font-bold tracking-[0.08em] uppercase text-accent no-underline hover:text-highlight whitespace-nowrap"
        >
          {action} →
        </a>
      )}
    </div>
  )
}

const ACTION_BUTTON =
  'flex-1 rounded-[10px] py-3.5 text-[12px] font-bold tracking-[0.08em] uppercase transition-colors disabled:opacity-50 disabled:cursor-not-allowed'

export function LeadDetailClient({ lead: initialLead }: { lead: VendorProviderLead }) {
  // La réponse du PATCH est la demande telle qu'elle se lit désormais — après une
  // acceptation, la forme débloquée avec les coordonnées. On la garde ici plutôt
  // que de relancer un GET : les coordonnées s'affichent dans la foulée du clic.
  const [lead, setLead] = useState(initialLead)
  const [submitting, setSubmitting] = useState(false)
  const router = useRouter()
  const { toast, showToast } = useToast()

  const statusLabel = leadStatusLabel(lead.status)
  const decidable = isLeadDecidable(lead.status)
  const unlocked = isUnlockedVendorLead(lead)
  const weddingDate = formatWeddingDate(lead.weddingDate)
  const requestedAt = formatRequestedAt(lead.requestedAt)

  async function decide(decision: 'accept' | 'refuse') {
    // Refus = confirmation simple, pas de motif : la décision est actée telle
    // quelle côté backend, aucune liste de raisons n'est envoyée (WED-52).
    if (decision === 'refuse' && !window.confirm('Refuser cette demande de mise en relation ?')) {
      return
    }

    setSubmitting(true)
    try {
      const updated = await apiFetch<VendorProviderLead>(
        `/api/vendors/me/provider-leads/${lead.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ decision }),
        }
      )
      setLead(updated)
      showToast(
        'success',
        decision === 'accept'
          ? 'Demande acceptée — les coordonnées du couple sont désormais visibles.'
          : 'Demande refusée. Le couple en est informé.'
      )
      router.refresh()
    } catch (err) {
      // Le 409 « demande déjà traitée » arrive ici avec le message du backend :
      // un double clic ou un vieil onglet le lit au lieu de basculer en silence.
      showToast('error', err instanceof Error ? err.message : 'Une erreur est survenue.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="font-manrope">
      <Toast toast={toast} />

      <div className="px-6 md:px-12 py-[22px]">
        <Link
          href="/dashboard/wedream"
          className="inline-flex items-center gap-1.5 font-cormorant italic text-[15px] text-texte no-underline hover:text-accent"
        >
          <span className="text-[16px]">‹</span> Retour à mes demandes
        </Link>
      </div>

      {/* ── Bandeau ──────────────────────────────────────────────────────── */}
      <section className="bg-bordeaux text-creme px-6 md:px-12 pt-[26px] pb-[30px]">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 md:gap-6">
          <div>
            <span className="block text-[11px] font-semibold tracking-[0.14em] uppercase text-highlight">
              Demande de mise en relation
            </span>

            <h1 className="font-cormorant text-[34px] leading-[1.15] text-creme mt-2.5">
              {lead.firstName}
            </h1>

            <div className="flex items-center gap-3 mt-3">
              {lead.category && (
                <>
                  <span className="text-[13px] text-creme/55">{lead.category}</span>
                  <span className="text-creme/55">·</span>
                </>
              )}
              <span
                className={[
                  'inline-flex items-center px-3.5 py-1.5 rounded-full text-[10px] font-bold tracking-[0.1em] uppercase whitespace-nowrap',
                  decidable
                    ? 'bg-accent text-creme'
                    : unlocked
                      ? 'bg-accent/85 text-creme'
                      : 'border border-creme/55 text-creme/55',
                ].join(' ')}
              >
                {statusLabel}
              </span>
            </div>
          </div>

          {requestedAt && (
            <div className="md:text-right">
              <span className="block font-cormorant italic font-light text-[13px] text-creme/55">
                Demande reçue
              </span>
              <span className="block text-[14px] font-semibold text-creme mt-1">{requestedAt}</span>
            </div>
          )}
        </div>
      </section>

      {/* ── Contenu ──────────────────────────────────────────────────────── */}
      <section className="px-6 md:px-12 pt-11 pb-24 grid gap-10 md:gap-16 md:grid-cols-2 items-start">
        <div>
          {/* Les coordonnées n'existent dans l'objet qu'une fois la demande
              acceptée : il n'y a rien à masquer, la forme reçue s'en charge. */}
          {unlocked && (
            <ContactRow
              icon={<PhoneIcon />}
              label="Téléphone"
              value={lead.phone}
              href={lead.phone ? `tel:${lead.phone.replace(/\s/g, '')}` : undefined}
              action="Appeler"
            />
          )}

          {unlocked && (
            <ContactRow
              icon={<MailIcon />}
              label="E-mail"
              value={lead.email}
              href={`mailto:${lead.email}`}
              action="Écrire"
            />
          )}

          {weddingDate && (
            <InfoRow icon={<CalendarIcon />} label="Date du mariage" value={weddingDate} />
          )}
          <InfoRow
            icon={<GuestsIcon />}
            label="Nombre d'invités"
            value={formatGuestCount(lead.guestCount)}
          />
          <InfoRow
            icon={<BudgetIcon />}
            label="Budget global du mariage"
            value={formatBudget(lead.weddingBudgetCents)}
          />
          {lead.category && (
            <InfoRow icon={<TagIcon />} label="Catégorie demandée" value={lead.category} />
          )}

          {decidable && (
            <div className="flex gap-3 mt-[30px]">
              <button
                type="button"
                onClick={() => decide('accept')}
                disabled={submitting}
                className={`${ACTION_BUTTON} bg-accent text-creme hover:bg-highlight`}
              >
                Accepter
              </button>
              <button
                type="button"
                onClick={() => decide('refuse')}
                disabled={submitting}
                className={`${ACTION_BUTTON} bg-transparent text-bordeaux border-[1.5px] border-bordeaux hover:bg-bordeaux/[0.06]`}
              >
                Refuser
              </button>
            </div>
          )}

          {unlocked && (
            <div className="flex items-center gap-2.5 mt-[30px] px-4 py-3.5 rounded-[10px] bg-accent/[0.08]">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <circle cx="8" cy="8" r="6.5" stroke="var(--color-accent)" strokeWidth="1.3" />
                <path
                  d="M5.3 8.2l1.8 1.8 3.6-4.2"
                  stroke="var(--color-accent)"
                  strokeWidth="1.3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="text-[13px] text-accent">Vous avez accepté cette demande.</span>
            </div>
          )}

          {!decidable && !unlocked && (
            <Link
              href="/dashboard/wedream"
              className="inline-flex items-center gap-1.5 mt-[22px] font-cormorant italic text-[16px] text-bordeaux no-underline hover:text-accent"
            >
              Retour aux demandes →
            </Link>
          )}
        </div>

        {/* ── Photo coup de cœur ─────────────────────────────────────────── */}
        <div>
          <FieldLabel>Photo coup de cœur</FieldLabel>

          <div
            className={[
              'relative mt-3.5 aspect-[4/5] rounded-[13px] overflow-hidden',
              lead.photoUrl
                ? 'border border-bordeaux/10'
                : 'border border-dashed border-bordeaux/20 bg-texte/[0.04]',
            ].join(' ')}
          >
            {lead.photoUrl ? (
              <Image
                src={lead.photoUrl}
                alt="La photo de votre portfolio qui a déclenché la demande"
                fill
                sizes="(max-width: 768px) 100vw, 45vw"
                className="object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2.5">
                <PhotoPlaceholderIcon />
                <span className="text-[12px] text-gris">Photo coup de cœur</span>
              </div>
            )}
          </div>

          {lead.specialtyTags.length > 0 && (
            <div className="flex flex-wrap items-center gap-2.5 mt-3.5">
              {lead.specialtyTags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-[13px] py-[5px] rounded-full border border-bordeaux/20 text-[10px] font-bold tracking-[0.1em] uppercase text-gris"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
