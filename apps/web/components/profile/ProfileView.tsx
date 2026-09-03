'use client'

import type { AdminVendorProfile } from '@/lib/admin-types'
import { PortfolioTagViewer } from './PortfolioTagViewer'

function formatMoney(cents: number) {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(cents / 100)
}

function formatDate(value: string | null) {
  if (!value) return null
  return new Intl.DateTimeFormat('fr-FR').format(new Date(value))
}

function displayValue(value: string | number | boolean | null | undefined) {
  if (value === null || value === undefined || value === '') return 'Non renseigné'
  if (typeof value === 'boolean') return value ? 'Oui' : 'Non'
  return String(value)
}

function Section({
  title,
  isEmpty,
  children,
}: {
  title: string
  isEmpty?: boolean
  children: React.ReactNode
}) {
  return (
    <section className="rounded-lg border border-[#e3d7cb] bg-white">
      <div className="border-b border-[#efe6dc] px-5 py-4">
        <h2 className="font-cormorant text-2xl font-semibold text-bordeaux">{title}</h2>
      </div>
      <div className="px-5 py-5">
        {isEmpty ? <p className="text-sm font-semibold text-texte/50">Non renseigné</p> : children}
      </div>
    </section>
  )
}

function DetailGrid({ items }: { items: Array<{ label: string; value: string | number | boolean | null | undefined }> }) {
  return (
    <dl className="grid gap-4 md:grid-cols-2">
      {items.map((item) => (
        <div key={item.label} className="border-b border-[#f0e7df] pb-3">
          <dt className="text-xs font-semibold uppercase text-texte/45">{item.label}</dt>
          <dd className="mt-1 text-sm leading-6 text-texte">{displayValue(item.value)}</dd>
        </div>
      ))}
    </dl>
  )
}

function PillList({ items }: { items: Array<{ id: string; name: string }> }) {
  if (items.length === 0) return <p className="text-sm font-semibold text-texte/50">Non renseigné</p>

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <span key={item.id} className="rounded-md border border-[#eaded2] bg-[#fbf7f2] px-3 py-2 text-sm text-texte">
          {item.name}
        </span>
      ))}
    </div>
  )
}

function SpecificDetails({ profile }: { profile: AdminVendorProfile }) {
  const details = profile.specificDetails
  if (!details) return null

  if (details.type === 'venue') {
    return (
      <Section title="Caractéristiques spécifiques">
        <DetailGrid
          items={[
            { label: 'Type de lieu', value: details.details.venueType },
            {
              label: 'Capacité',
              value:
                details.details.capacityMin || details.details.capacityMax
                  ? `${details.details.capacityMin ?? 'Non renseigné'} - ${details.details.capacityMax ?? 'Non renseigné'} invités`
                  : null,
            },
            { label: 'Ville la plus proche', value: details.details.nearestCity },
            { label: 'Distance ville', value: details.details.distanceToCityMinutes ? `${details.details.distanceToCityMinutes} min` : null },
            { label: 'Traiteur sur place', value: details.details.hasCatering },
            { label: 'Hébergement', value: details.details.hasAccommodation },
            { label: 'Espace extérieur', value: details.details.hasOutdoorSpace },
            { label: 'Droit de bouchon', value: details.details.hasCorkageFee },
            { label: 'Toilettes', value: details.details.hasToilets },
            { label: 'Accès PMR', value: details.details.isPmrAccessible },
          ]}
        />
      </Section>
    )
  }

  return (
    <Section title="Caractéristiques spécifiques">
      <DetailGrid
        items={[
          {
            label: 'Nombre de couverts',
            value:
              details.details.coversMin || details.details.coversMax
                ? `${details.details.coversMin ?? 'Non renseigné'} - ${details.details.coversMax ?? 'Non renseigné'}`
                : null,
          },
          { label: 'Casher', value: details.details.isKosher },
          { label: 'Halal', value: details.details.isHalal },
          { label: 'Vegan', value: details.details.isVegan },
          { label: 'Sans gluten', value: details.details.isGlutenFree },
          { label: 'Service à table', value: details.details.offersTableService },
          { label: 'Buffet', value: details.details.offersBuffet },
          { label: 'Cocktail', value: details.details.offersCocktail },
          { label: 'Vaisselle fournie', value: details.details.providesTableware },
          { label: 'Mobilier fourni', value: details.details.providesFurniture },
        ]}
      />
    </Section>
  )
}

export function ProfileView({ profile }: { profile: AdminVendorProfile }) {
  const professionEmpty = profile.profession.services.length === 0 && !profile.profession.description
  const experiencesEmpty = profile.experiences.cultures.length === 0 && profile.experiences.confessions.length === 0
  const zonesEmpty = profile.zonesPricing.regions.length === 0
  const legalEmpty = Object.values(profile.legal).every((value) => value === null || value === '')

  return (
    <div className="flex flex-col gap-5">
      <Section title="Profession" isEmpty={professionEmpty}>
        <div className="flex flex-col gap-5">
          <DetailGrid items={[{ label: 'Type', value: profile.profession.type }, { label: 'Description', value: profile.profession.description }]} />
          <div>
            <h3 className="mb-3 text-sm font-semibold text-texte">Métiers</h3>
            <PillList items={profile.profession.services} />
          </div>
        </div>
      </Section>

      <Section title="Expériences" isEmpty={experiencesEmpty}>
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <h3 className="mb-3 text-sm font-semibold text-texte">Cultures</h3>
            <PillList items={profile.experiences.cultures} />
          </div>
          <div>
            <h3 className="mb-3 text-sm font-semibold text-texte">Confessions</h3>
            <PillList items={profile.experiences.confessions} />
          </div>
        </div>
      </Section>

      <Section title="Zones et tarifs" isEmpty={zonesEmpty}>
        <div className="flex flex-col gap-5">
          <DetailGrid
            items={[
              { label: 'Tarif minimum', value: formatMoney(profile.zonesPricing.priceMinCents) },
              { label: 'Tarif maximum', value: formatMoney(profile.zonesPricing.priceMaxCents) },
              { label: 'Mode de tarification', value: profile.zonesPricing.priceTypeLabel },
            ]}
          />
          <div>
            <h3 className="mb-3 text-sm font-semibold text-texte">Zones</h3>
            <PillList items={profile.zonesPricing.regions} />
          </div>
        </div>
      </Section>

      <Section title="Portfolio" isEmpty={profile.portfolio.length === 0}>
        <PortfolioTagViewer
          images={profile.portfolio}
          serviceId={profile.profession.services[0]?.id ?? null}
          serviceLabel={profile.profession.services[0]?.name ?? 'métier non défini'}
        />
      </Section>

      <Section title="Informations légales" isEmpty={legalEmpty}>
        <DetailGrid
          items={[
            { label: 'Nom commercial', value: profile.legal.brandName },
            { label: 'Prénom', value: profile.legal.firstName },
            { label: 'Nom', value: profile.legal.lastName },
            { label: 'Email', value: profile.legal.email },
            { label: 'Téléphone', value: profile.legal.phone },
            { label: 'Adresse', value: profile.legal.address },
            { label: 'Code postal', value: profile.legal.zipcode },
            { label: 'Ville', value: profile.legal.city },
            { label: 'SIRET', value: profile.legal.siret },
            { label: 'SIRET vérifié', value: profile.legal.siretVerified },
            { label: 'Raison sociale', value: profile.legal.legalName },
            { label: 'Forme juridique', value: profile.legal.legalForm },
            { label: 'Statut légal', value: profile.legal.legalStatus },
            { label: 'Date de création', value: formatDate(profile.legal.incorporatedAt) },
          ]}
        />
      </Section>

      <SpecificDetails profile={profile} />
    </div>
  )
}
