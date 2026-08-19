'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Copy, Save, Send, Trash2 } from 'lucide-react'
import type {
  AdminVendorDraft,
  AdminVendorInvitationSendResponse,
  ConfessionOption,
  CultureOption,
  RegionOption,
  ServiceOptionNode,
} from '@/lib/admin-types'
import { PortfolioGallery } from '@/components/profile/PortfolioGallery'
import { PortfolioTaggingModal } from '@/components/portfolio/PortfolioTaggingModal'
import { useAdminPortfolioUpload } from '@/hooks/useAdminPortfolioUpload'
import { useServiceTagTypes } from '@/hooks/useServiceTagTypes'

const PRICE_TYPES = [
  { value: 'per_service', label: 'Par prestation' },
  { value: 'per_person', label: 'Par personne' },
  { value: 'per_hour', label: "À l'heure" },
]

const VENUE_TYPES = [
  { value: 'chateau', label: 'Château' },
  { value: 'domaine', label: 'Domaine' },
  { value: 'loft', label: 'Loft' },
  { value: 'autre', label: 'Autre' },
]

type ServiceOption = {
  id: string
  label: string
  category: string
}

type DraftFormState = {
  firstname: string
  lastName: string
  email: string
  brandName: string
  serviceId: string
  regionIds: string[]
  priceMin: string
  priceMax: string
  priceType: string
  cultureIds: string[]
  confessionIds: string[]
  phone: string
  address: string
  zipcode: string
  legalCity: string
  siret: string
  venueType: string
  capacityMin: string
  capacityMax: string
  nearestCity: string
  distanceToCityMinutes: string
  hasCatering: boolean
  hasAccommodation: boolean
  hasOutdoorSpace: boolean
  hasCorkageFee: boolean
  hasToilets: boolean
  isPmrAccessible: boolean
  coversMin: string
  coversMax: string
  isKosher: boolean
  isHalal: boolean
  isVegan: boolean
  isGlutenFree: boolean
  offersTableService: boolean
  offersBuffet: boolean
  offersCocktail: boolean
  providesTableware: boolean
  providesFurniture: boolean
}

function flattenServices(nodes: ServiceOptionNode[], parentName?: string): ServiceOption[] {
  return nodes.flatMap((node) => {
    const label = parentName ? `${parentName} - ${node.name}` : node.name
    if (node.children.length === 0) {
      return [{ id: node.id, label, category: node.category ?? 'freelance' }]
    }

    return flattenServices(node.children, node.name)
  })
}

function centsToEuro(value: number | null | undefined): string {
  return typeof value === 'number' ? String(value / 100) : ''
}

function parseEuroToCents(value: string): number | null {
  const normalized = value.replace(',', '.').trim()
  if (!normalized) return null

  const parsed = Number(normalized)
  if (!Number.isFinite(parsed) || parsed < 0) return null

  return Math.round(parsed * 100)
}

function nullableNumber(value: string): number | null {
  if (value.trim() === '') return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function initialState(draft?: AdminVendorDraft): DraftFormState {
  return {
    firstname: draft?.identity.firstname ?? '',
    lastName: draft?.identity.lastName ?? '',
    email: draft?.identity.email ?? '',
    brandName: draft?.identity.brandName ?? '',
    serviceId: draft?.profession.serviceId ?? '',
    regionIds: draft?.zonesPricing.regions ?? [],
    priceMin: centsToEuro(draft?.zonesPricing.priceMin),
    priceMax: centsToEuro(draft?.zonesPricing.priceMax),
    priceType: draft?.zonesPricing.priceType ?? 'per_service',
    cultureIds: draft?.experiences.cultureIds ?? [],
    confessionIds: draft?.experiences.confessionIds ?? [],
    phone: draft?.legalInfo.phone ?? '',
    address: draft?.legalInfo.address ?? '',
    zipcode: draft?.legalInfo.zipcode ?? '',
    legalCity: draft?.legalInfo.city ?? draft?.zonesPricing.city ?? '',
    siret: draft?.legalInfo.siret ?? '',
    venueType: draft?.venueCharacteristics?.venueType ?? 'autre',
    capacityMin: draft?.venueCharacteristics?.capacityMin?.toString() ?? '',
    capacityMax: draft?.venueCharacteristics?.capacityMax?.toString() ?? '',
    nearestCity: draft?.venueCharacteristics?.nearestCity ?? '',
    distanceToCityMinutes: draft?.venueCharacteristics?.distanceToCityMinutes?.toString() ?? '',
    hasCatering: draft?.venueCharacteristics?.hasCatering ?? false,
    hasAccommodation: draft?.venueCharacteristics?.hasAccommodation ?? false,
    hasOutdoorSpace: draft?.venueCharacteristics?.hasOutdoorSpace ?? false,
    hasCorkageFee: draft?.venueCharacteristics?.hasCorkageFee ?? false,
    hasToilets: draft?.venueCharacteristics?.hasToilets ?? false,
    isPmrAccessible: draft?.venueCharacteristics?.isPmrAccessible ?? false,
    coversMin: draft?.cateringCharacteristics?.coversMin?.toString() ?? '',
    coversMax: draft?.cateringCharacteristics?.coversMax?.toString() ?? '',
    isKosher: draft?.cateringCharacteristics?.isKosher ?? false,
    isHalal: draft?.cateringCharacteristics?.isHalal ?? false,
    isVegan: draft?.cateringCharacteristics?.isVegan ?? false,
    isGlutenFree: draft?.cateringCharacteristics?.isGlutenFree ?? false,
    offersTableService: draft?.cateringCharacteristics?.offersTableService ?? false,
    offersBuffet: draft?.cateringCharacteristics?.offersBuffet ?? false,
    offersCocktail: draft?.cateringCharacteristics?.offersCocktail ?? false,
    providesTableware: draft?.cateringCharacteristics?.providesTableware ?? false,
    providesFurniture: draft?.cateringCharacteristics?.providesFurniture ?? false,
  }
}

export function AdminVendorDraftForm({
  draft,
  services,
  regions,
  cultures,
  confessions,
}: {
  draft?: AdminVendorDraft
  services: ServiceOptionNode[]
  regions: RegionOption[]
  cultures: CultureOption[]
  confessions: ConfessionOption[]
}) {
  const router = useRouter()
  const [vendorId, setVendorId] = useState(draft?.id ?? null)
  const [form, setForm] = useState<DraftFormState>(() => initialState(draft))
  const [saving, setSaving] = useState(false)
  const [sending, setSending] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [sendResult, setSendResult] = useState<AdminVendorInvitationSendResponse | null>(null)
  const [copied, setCopied] = useState(false)
  const hasPendingInvitation = draft?.invitation?.status === 'pending' || sendResult !== null

  const {
    images: portfolioImages,
    pendingUploads,
    addFiles,
    retryUpload,
    deleteImage,
    taggingQueue,
    openTagging,
    confirmTagging,
    cancelTagging,
    completedCount,
  } = useAdminPortfolioUpload({
    initialImages: draft?.portfolio ?? [],
  })
  const { tagTypes, loading: tagTypesLoading, error: tagTypesFetchError } =
    useServiceTagTypes(form.serviceId || null)
  const tagTypesError = form.serviceId === ''
    ? "Sélectionnez d'abord un métier pour pouvoir tagger les photos."
    : tagTypesFetchError
  const portfolioPendingUploads = useMemo(
    () => pendingUploads.map((p) => ({ localId: p.localId, previewUrl: URL.createObjectURL(p.file), status: p.status })),
    [pendingUploads]
  )

  const serviceOptions = useMemo(() => flattenServices(services), [services])
  const selectedService = serviceOptions.find((service) => service.id === form.serviceId)
  const selectedCategory = selectedService?.category ?? 'freelance'
  const isVenue = selectedCategory === 'lieu'
  const isCatering = selectedCategory === 'traiteur'
  const isServiceAutoTagged =
    form.serviceId !== '' && (draft?.profession.autoTaggedServiceIds ?? []).includes(form.serviceId)

  const priceMin = parseEuroToCents(form.priceMin)
  const priceMax = parseEuroToCents(form.priceMax)
  const priceRangeValid = priceMin === null || priceMax === null || priceMax >= priceMin
  const canSend =
    form.firstname.trim() !== '' &&
    form.email.trim() !== '' &&
    form.brandName.trim() !== '' &&
    form.serviceId !== '' &&
    form.regionIds.length > 0 &&
    priceRangeValid &&
    form.priceType !== ''

  function update<K extends keyof DraftFormState>(key: K, value: DraftFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function toggleArray(key: 'regionIds' | 'cultureIds' | 'confessionIds', value: string) {
    setForm((current) => ({
      ...current,
      [key]: current[key].includes(value)
        ? current[key].filter((item) => item !== value)
        : [...current[key], value],
    }))
  }

  function payload() {
    return {
      firstname: form.firstname.trim(),
      last_name: form.lastName.trim() || null,
      email: form.email.trim(),
      brand_name: form.brandName.trim(),
      service_id: form.serviceId,
      regions: form.regionIds,
      price_min: priceMin,
      price_max: priceMax,
      price_type: form.priceType,
      experiences: {
        culture_ids: form.cultureIds,
        confession_ids: form.confessionIds,
      },
      legal_info: {
        phone: form.phone.trim() || null,
        address: form.address.trim() || null,
        zipcode: form.zipcode.trim() || null,
        city: form.legalCity.trim() || null,
        siret: form.siret.replace(/\s/g, '') || null,
      },
      venue_characteristics: isVenue ? {
        venue_type: form.venueType,
        capacity_min: nullableNumber(form.capacityMin),
        capacity_max: nullableNumber(form.capacityMax),
        nearest_city: form.nearestCity.trim() || null,
        distance_to_city_minutes: nullableNumber(form.distanceToCityMinutes),
        has_catering: form.hasCatering,
        has_accommodation: form.hasAccommodation,
        has_outdoor_space: form.hasOutdoorSpace,
        has_corkage_fee: form.hasCorkageFee,
        has_toilets: form.hasToilets,
        is_pmr_accessible: form.isPmrAccessible,
      } : null,
      catering_characteristics: isCatering ? {
        covers_min: nullableNumber(form.coversMin),
        covers_max: nullableNumber(form.coversMax),
        is_kosher: form.isKosher,
        is_halal: form.isHalal,
        is_vegan: form.isVegan,
        is_gluten_free: form.isGlutenFree,
        offers_table_service: form.offersTableService,
        offers_buffet: form.offersBuffet,
        offers_cocktail: form.offersCocktail,
        provides_tableware: form.providesTableware,
        provides_furniture: form.providesFurniture,
      } : null,
    }
  }

  async function saveDraft(options?: { navigate?: boolean }): Promise<string | null> {
    if (saving) return vendorId

    setSaving(true)
    setError(null)
    setNotice(null)

    const response = await fetch(vendorId ? `/api/admin/vendors/${vendorId}/draft` : '/api/admin/vendors/drafts', {
      method: vendorId ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload()),
    })
    const data = await response.json().catch(() => ({}))

    setSaving(false)
    if (!response.ok) {
      setError(typeof data.error === 'string' ? data.error : 'La sauvegarde du brouillon a échoué.')
      return null
    }

    const id = (data as AdminVendorDraft).id
    const wasCreation = !vendorId
    setVendorId(id)
    setNotice('Brouillon enregistré.')
    if (options?.navigate ?? true) {
      router.refresh()
      if (wasCreation) {
        router.replace(`/admin/vendors/${id}/edit`)
      }
    }

    return id
  }

  async function sendInvitation() {
    if (!canSend || sending) return

    setSending(true)
    setError(null)
    setNotice(null)

    const id = vendorId ?? await saveDraft()
    if (!id) {
      setSending(false)
      return
    }

    const response = await fetch(`/api/admin/vendors/${id}/send-invitation`, { method: 'POST' })
    const data = await response.json().catch(() => ({}))
    setSending(false)

    if (!response.ok) {
      setError(typeof data.error === 'string' ? data.error : "L'envoi de l'invitation a échoué.")
      return
    }

    setSendResult(data as AdminVendorInvitationSendResponse)
    setNotice((data as AdminVendorInvitationSendResponse).emailSent
      ? 'Invitation envoyée par email.'
      : "Invitation créée, mais l'email n'a pas pu être envoyé.")
    router.refresh()
  }

  async function deleteDraft() {
    if (!vendorId || deleting) return
    const confirmed = window.confirm('Supprimer ce brouillon ?')
    if (!confirmed) return

    setDeleting(true)
    setError(null)
    setNotice(null)

    const response = await fetch(`/api/admin/vendors/${vendorId}/draft`, { method: 'DELETE' })
    setDeleting(false)

    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      setError(typeof data.error === 'string' ? data.error : 'La suppression du brouillon a échoué.')
      return
    }

    router.push('/admin/prestataires?view=drafts&toast=draft-deleted')
    router.refresh()
  }

  async function copyInvitationUrl() {
    if (!sendResult?.invitationUrl) return
    await navigator.clipboard.writeText(sendResult.invitationUrl)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="sticky top-16 z-30 rounded-lg border border-bordeaux/10 bg-white px-4 py-3 shadow-sm lg:top-0">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase text-gris">
              {hasPendingInvitation ? 'Invitation en attente' : 'Brouillon prestataire'}
            </p>
            <h1 className="font-cormorant text-[34px] font-semibold leading-tight text-bordeaux">
              {vendorId ? 'Modifier un prestataire' : 'Ajouter un prestataire'}
            </h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/prestataires" className="inline-flex h-10 items-center rounded-md border border-[#d8c9ba] px-4 text-sm font-semibold text-texte no-underline">
              Retour
            </Link>
              {!hasPendingInvitation && (
                <button
                  type="button"
                  onClick={() => void saveDraft()}
                  disabled={saving || sending || deleting}
                  className="inline-flex h-10 items-center gap-2 rounded-md border border-bordeaux/20 px-4 text-sm font-semibold text-bordeaux disabled:cursor-not-allowed disabled:opacity-45"
                >
                  <Save size={16} aria-hidden="true" />
                  {saving ? 'Sauvegarde...' : 'Enregistrer le brouillon'}
                </button>
              )}
              {vendorId && !hasPendingInvitation && (
                <button
                  type="button"
                  onClick={() => void deleteDraft()}
                  disabled={saving || sending || deleting}
                  className="inline-flex h-10 items-center gap-2 rounded-md border border-danger/20 px-4 text-sm font-semibold text-danger disabled:cursor-not-allowed disabled:opacity-45"
                >
                  <Trash2 size={16} aria-hidden="true" />
                  {deleting ? 'Suppression...' : 'Supprimer'}
                </button>
              )}
              <button
                type="button"
                onClick={() => void sendInvitation()}
                disabled={!canSend || saving || sending || deleting}
                className="inline-flex h-10 items-center gap-2 rounded-md bg-highlight px-4 text-sm font-semibold text-creme disabled:cursor-not-allowed disabled:opacity-45"
              >
              <Send size={16} aria-hidden="true" />
              {sending ? 'Envoi...' : hasPendingInvitation ? "Renvoyer l'invitation" : "Envoyer l'invitation"}
            </button>
          </div>
        </div>
        {!canSend && (
          <p className="mt-3 text-sm text-gris">
            {priceRangeValid
              ? 'L’envoi sera disponible après prénom, email, nom de marque, service et régions renseignés.'
              : 'Le prix minimum ne peut pas dépasser le prix maximum.'}
          </p>
        )}
        {notice && <p className="mt-3 rounded-md bg-success-soft px-3 py-2 text-sm font-semibold text-success">{notice}</p>}
        {error && <p className="mt-3 rounded-md bg-danger-soft px-3 py-2 text-sm font-semibold text-danger">{error}</p>}
      </div>

      {sendResult && (
        <section className="rounded-lg border border-success-border bg-success-soft p-4">
          <div className="flex items-start gap-3">
            <Check size={22} className="mt-0.5 text-success" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-bold text-success">Invitation prête</h2>
              <div className="mt-3 flex flex-col gap-2 rounded-md border border-success-border bg-white p-3 md:flex-row md:items-center">
                <code className="min-w-0 flex-1 break-all text-xs text-texte">{sendResult.invitationUrl}</code>
                <button
                  type="button"
                  onClick={copyInvitationUrl}
                  className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-md bg-success px-3 text-sm font-semibold text-white"
                >
                  <Copy size={15} aria-hidden="true" />
                  {copied ? 'Copié' : 'Copier'}
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="rounded-lg border border-bordeaux/10 bg-white p-5 shadow-sm">
        <h2 className="font-cormorant text-2xl font-semibold text-bordeaux">Identité</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <TextField label="Prénom *" value={form.firstname} onChange={(value) => update('firstname', value)} />
          <TextField label="Nom" value={form.lastName} onChange={(value) => update('lastName', value)} />
          <TextField label="Email *" value={form.email} onChange={(value) => update('email', value)} type="email" />
          <TextField label="Nom de marque *" value={form.brandName} onChange={(value) => update('brandName', value)} />
        </div>
      </section>

      <section className="rounded-lg border border-bordeaux/10 bg-white p-5 shadow-sm">
        <h2 className="font-cormorant text-2xl font-semibold text-bordeaux">Profession</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-2">
            <SelectField label="Service principal *" value={form.serviceId} onChange={(value) => update('serviceId', value)}>
              <option value="">Sélectionner un service</option>
              {serviceOptions.map((service) => (
                <option key={service.id} value={service.id}>{service.label}</option>
              ))}
            </SelectField>
            {isServiceAutoTagged && (
              <span className="inline-flex h-7 w-fit items-center rounded-md border border-dore/35 bg-dore/10 px-2.5 text-xs font-semibold text-accent">
                Ajouté automatiquement
              </span>
            )}
          </div>
          <SelectField label="Type de prix *" value={form.priceType} onChange={(value) => update('priceType', value)}>
            {PRICE_TYPES.map((priceType) => (
              <option key={priceType.value} value={priceType.value}>{priceType.label}</option>
            ))}
          </SelectField>
        </div>
      </section>

      <section className="rounded-lg border border-bordeaux/10 bg-white p-5 shadow-sm">
        <h2 className="font-cormorant text-2xl font-semibold text-bordeaux">Portfolio</h2>
        <div className="mt-5">
          <PortfolioGallery
            images={portfolioImages}
            editable={{
              onAddFiles: (files) => {
                void addFiles(files, async () => {
                  if (vendorId) return vendorId
                  const id = await saveDraft({ navigate: false })
                  if (id) window.history.replaceState(null, '', `/admin/vendors/${id}/edit`)
                  return id
                })
              },
              onDelete: (imageId) => {
                // Une tuile existante implique que le brouillon existe déjà.
                deleteImage(imageId, vendorId as string).catch(() => setError('La suppression de la photo a échoué.'))
              },
              onTileClick: (imageId) => openTagging(imageId),
              pendingUploads: portfolioPendingUploads,
              onRetry: (localId) => { void retryUpload(localId, vendorId as string) },
            }}
          />
        </div>
      </section>

      {taggingQueue.length > 0 && (() => {
        const activeId = taggingQueue[0]
        const activeImage = portfolioImages.find((img) => img.id === activeId)
        if (!activeImage) return null

        return (
          <PortfolioTaggingModal
            key={activeId}
            photoUrl={activeImage.url}
            serviceLabel={selectedService?.label ?? 'métier non défini'}
            tagTypes={tagTypes}
            tagTypesLoading={tagTypesLoading}
            tagTypesError={tagTypesError}
            initialTagValueIds={activeImage.tags.map((t) => t.id)}
            queuePosition={completedCount + 1}
            queueTotal={completedCount + taggingQueue.length}
            onConfirm={(tagValueIds) => confirmTagging(activeId, vendorId as string, tagValueIds)}
            onCancel={() => cancelTagging(activeId, vendorId as string)}
          />
        )
      })()}

      <section className="rounded-lg border border-bordeaux/10 bg-white p-5 shadow-sm">
        <h2 className="font-cormorant text-2xl font-semibold text-bordeaux">Zones et tarifs</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <TextField label="Prix minimum (€)" value={form.priceMin} onChange={(value) => update('priceMin', value)} inputMode="decimal" />
          <TextField label="Prix maximum (€)" value={form.priceMax} onChange={(value) => update('priceMax', value)} inputMode="decimal" />
          <TextField label="Ville" value={form.legalCity} onChange={(value) => update('legalCity', value)} />
        </div>
        <CheckboxGrid
          label="Régions *"
          items={regions}
          selectedIds={form.regionIds}
          onToggle={(id) => toggleArray('regionIds', id)}
        />
      </section>

      <section className="rounded-lg border border-bordeaux/10 bg-white p-5 shadow-sm">
        <h2 className="font-cormorant text-2xl font-semibold text-bordeaux">Expériences</h2>
        <CheckboxGrid label="Cultures" items={cultures} selectedIds={form.cultureIds} onToggle={(id) => toggleArray('cultureIds', id)} />
        <CheckboxGrid label="Confessions" items={confessions} selectedIds={form.confessionIds} onToggle={(id) => toggleArray('confessionIds', id)} />
      </section>

      <section className="rounded-lg border border-bordeaux/10 bg-white p-5 shadow-sm">
        <h2 className="font-cormorant text-2xl font-semibold text-bordeaux">Informations légales</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <TextField label="Téléphone" value={form.phone} onChange={(value) => update('phone', value)} />
          <TextField label="SIRET" value={form.siret} onChange={(value) => update('siret', value)} />
          <TextField label="Adresse" value={form.address} onChange={(value) => update('address', value)} />
          <TextField label="Code postal" value={form.zipcode} onChange={(value) => update('zipcode', value)} />
        </div>
      </section>

      {isVenue && (
        <section className="rounded-lg border border-bordeaux/10 bg-white p-5 shadow-sm">
          <h2 className="font-cormorant text-2xl font-semibold text-bordeaux">Caractéristiques du lieu</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <SelectField label="Type de lieu" value={form.venueType} onChange={(value) => update('venueType', value)}>
              {VENUE_TYPES.map((venueType) => <option key={venueType.value} value={venueType.value}>{venueType.label}</option>)}
            </SelectField>
            <TextField label="Capacité minimum" value={form.capacityMin} onChange={(value) => update('capacityMin', value)} inputMode="numeric" />
            <TextField label="Capacité maximum" value={form.capacityMax} onChange={(value) => update('capacityMax', value)} inputMode="numeric" />
            <TextField label="Ville proche" value={form.nearestCity} onChange={(value) => update('nearestCity', value)} />
            <TextField label="Distance en minutes" value={form.distanceToCityMinutes} onChange={(value) => update('distanceToCityMinutes', value)} inputMode="numeric" />
          </div>
          <ToggleGrid
            items={[
              ['hasCatering', 'Traiteur inclus'],
              ['hasAccommodation', 'Hébergement'],
              ['hasOutdoorSpace', 'Espace extérieur'],
              ['hasCorkageFee', 'Droit de bouchon'],
              ['hasToilets', 'Toilettes'],
              ['isPmrAccessible', 'Accessible PMR'],
            ]}
            form={form}
            update={update}
          />
        </section>
      )}

      {isCatering && (
        <section className="rounded-lg border border-bordeaux/10 bg-white p-5 shadow-sm">
          <h2 className="font-cormorant text-2xl font-semibold text-bordeaux">Caractéristiques traiteur</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <TextField label="Couverts minimum" value={form.coversMin} onChange={(value) => update('coversMin', value)} inputMode="numeric" />
            <TextField label="Couverts maximum" value={form.coversMax} onChange={(value) => update('coversMax', value)} inputMode="numeric" />
          </div>
          <ToggleGrid
            items={[
              ['isKosher', 'Casher'],
              ['isHalal', 'Halal'],
              ['isVegan', 'Vegan'],
              ['isGlutenFree', 'Sans gluten'],
              ['offersTableService', 'Service à table'],
              ['offersBuffet', 'Buffet'],
              ['offersCocktail', 'Cocktail'],
              ['providesTableware', 'Vaisselle fournie'],
              ['providesFurniture', 'Mobilier fourni'],
            ]}
            form={form}
            update={update}
          />
        </section>
      )}
    </div>
  )
}

function TextField({
  label,
  value,
  onChange,
  type = 'text',
  inputMode,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
  inputMode?: 'decimal' | 'numeric'
}) {
  return (
    <label className="flex flex-col gap-2 text-sm font-semibold text-texte">
      {label}
      <input
        type={type}
        inputMode={inputMode}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 rounded-md border border-[#d8c9ba] px-3 text-sm font-normal outline-none focus:border-bordeaux"
      />
    </label>
  )
}

function SelectField({
  label,
  value,
  onChange,
  children,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  children: ReactNode
}) {
  return (
    <label className="flex flex-col gap-2 text-sm font-semibold text-texte">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 rounded-md border border-[#d8c9ba] bg-white px-3 text-sm font-normal outline-none focus:border-bordeaux"
      >
        {children}
      </select>
    </label>
  )
}

function CheckboxGrid({
  label,
  items,
  selectedIds,
  onToggle,
}: {
  label: string
  items: Array<{ id: string; name: string }>
  selectedIds: string[]
  onToggle: (id: string) => void
}) {
  return (
    <fieldset className="mt-5 flex flex-col gap-3">
      <legend className="text-sm font-semibold text-texte">{label}</legend>
      <div className="grid max-h-52 gap-2 overflow-y-auto rounded-md border border-[#eaded2] p-3 md:grid-cols-2">
        {items.map((item) => (
          <label key={item.id} className="flex items-center gap-2 text-sm text-texte">
            <input
              type="checkbox"
              checked={selectedIds.includes(item.id)}
              onChange={() => onToggle(item.id)}
              className="h-4 w-4 accent-bordeaux"
            />
            <span>{item.name}</span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}

function ToggleGrid({
  items,
  form,
  update,
}: {
  items: Array<[keyof DraftFormState, string]>
  form: DraftFormState
  update: <K extends keyof DraftFormState>(key: K, value: DraftFormState[K]) => void
}) {
  return (
    <div className="mt-5 grid gap-2 md:grid-cols-2">
      {items.map(([key, label]) => (
        <label key={key} className="flex items-center gap-2 rounded-md border border-[#eaded2] px-3 py-3 text-sm text-texte">
          <input
            type="checkbox"
            checked={Boolean(form[key])}
            onChange={(event) => update(key, event.target.checked as DraftFormState[typeof key])}
            className="h-4 w-4 accent-bordeaux"
          />
          <span>{label}</span>
        </label>
      ))}
    </div>
  )
}
