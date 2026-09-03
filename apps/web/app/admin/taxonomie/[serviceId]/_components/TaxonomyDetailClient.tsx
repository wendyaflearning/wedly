'use client'

import { Fragment, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, ChevronRight, Plus, Tags, X } from 'lucide-react'
import { apiFetch } from '@/lib/fetchClient'
import type {
  AdminTagTypeWithValues,
  AdminTagValue,
  CreateTagTypePayload,
  CreateTagValuePayload,
  UpdateTagTypePayload,
  UpdateTagValuePayload,
} from '@/lib/admin-types'
import { KebabMenu } from './KebabMenu'
import { TagTypeModal, type TagTypeFormValues } from './TagTypeModal'

type StatusFilter = 'active' | 'inactive'

function StatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <span
      className={`inline-flex h-7 items-center gap-1.5 rounded-full px-2.5 text-xs font-semibold ${
        isActive ? 'bg-success-soft text-success' : 'bg-texte/8 text-texte/45'
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${isActive ? 'bg-success' : 'bg-texte/35'}`} />
      {isActive ? 'Actif' : 'Désactivé'}
    </span>
  )
}

function SegmentedToggle({
  value,
  onChange,
  small = false,
}: {
  value: StatusFilter
  onChange: (value: StatusFilter) => void
  small?: boolean
}) {
  const sizing = small ? 'px-3 py-1.5 text-xs' : 'px-4 py-1.5 text-sm'

  return (
    <div className="inline-flex w-fit rounded-lg bg-texte/6 p-1">
      {(['active', 'inactive'] as const).map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          className={`rounded-md font-semibold transition-colors ${sizing} ${
            value === option ? 'bg-white text-bordeaux shadow-sm' : 'text-texte/50'
          }`}
        >
          {option === 'active' ? 'Actifs' : 'Désactivés'}
        </button>
      ))}
    </div>
  )
}

export function TaxonomyDetailClient({
  serviceId,
  serviceName,
  tagTypes,
}: {
  serviceId: string
  serviceName: string
  tagTypes: AdminTagTypeWithValues[]
}) {
  const router = useRouter()

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active')
  const [expandedTagTypeId, setExpandedTagTypeId] = useState<string | null>(null)
  const [valueStatusFilters, setValueStatusFilters] = useState<Record<string, StatusFilter>>({})

  const [addingValueForTagTypeId, setAddingValueForTagTypeId] = useState<string | null>(null)
  const [addValueDraft, setAddValueDraft] = useState('')
  const [addValueVignetteDraft, setAddValueVignetteDraft] = useState('')
  const [addValueError, setAddValueError] = useState<string | null>(null)
  const [addValuePending, setAddValuePending] = useState(false)

  const [editingValueId, setEditingValueId] = useState<string | null>(null)
  const [editValueDraft, setEditValueDraft] = useState('')
  const [editValueVignetteDraft, setEditValueVignetteDraft] = useState('')
  const [editValueError, setEditValueError] = useState<string | null>(null)
  const [editValuePending, setEditValuePending] = useState(false)

  const [tagTypeModal, setTagTypeModal] = useState<
    { mode: 'create' } | { mode: 'edit'; tagType: AdminTagTypeWithValues } | null
  >(null)

  const filteredTagTypes = tagTypes
    .filter((tagType) => (statusFilter === 'active' ? tagType.isActive : !tagType.isActive))
    .sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary))

  function valueFilterFor(tagTypeId: string): StatusFilter {
    return valueStatusFilters[tagTypeId] ?? 'active'
  }

  function toggleExpanded(tagTypeId: string) {
    setExpandedTagTypeId((current) => (current === tagTypeId ? null : tagTypeId))
  }

  function openAddValue(tagTypeId: string) {
    setAddingValueForTagTypeId(tagTypeId)
    setAddValueDraft('')
    setAddValueVignetteDraft('')
    setAddValueError(null)
  }

  function cancelAddValue() {
    setAddingValueForTagTypeId(null)
    setAddValueDraft('')
    setAddValueVignetteDraft('')
    setAddValueError(null)
  }

  async function submitAddValue(tagTypeId: string) {
    const label = addValueDraft.trim()
    if (!label) return

    setAddValuePending(true)
    setAddValueError(null)
    try {
      await apiFetch('/api/admin/tag-values', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tagTypeId,
          label,
          // Champ vide => clé absente du JSON : le back ne sait pas effacer une
          // vignette, on ne lui envoie donc jamais de valeur vide.
          vignetteUrl: addValueVignetteDraft.trim() || undefined,
        } satisfies CreateTagValuePayload),
      })
      setAddValueDraft('')
      setAddValueVignetteDraft('')
      router.refresh()
    } catch (err) {
      setAddValueError(err instanceof Error ? err.message : 'Une erreur est survenue.')
    } finally {
      setAddValuePending(false)
    }
  }

  function openEditValue(tagValue: AdminTagValue) {
    setEditingValueId(tagValue.id)
    setEditValueDraft(tagValue.label)
    setEditValueVignetteDraft(tagValue.vignetteUrl ?? '')
    setEditValueError(null)
  }

  function cancelEditValue() {
    setEditingValueId(null)
    setEditValueDraft('')
    setEditValueVignetteDraft('')
    setEditValueError(null)
  }

  async function submitEditValue() {
    if (!editingValueId) return
    const label = editValueDraft.trim()
    if (!label) {
      setEditValueError('Le nom du tag est requis.')
      return
    }

    setEditValuePending(true)
    setEditValueError(null)
    try {
      await apiFetch(`/api/admin/tag-values/${editingValueId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          label,
          vignetteUrl: editValueVignetteDraft.trim() || undefined,
        } satisfies UpdateTagValuePayload),
      })
      setEditingValueId(null)
      router.refresh()
    } catch (err) {
      setEditValueError(err instanceof Error ? err.message : 'Une erreur est survenue.')
    } finally {
      setEditValuePending(false)
    }
  }

  async function deactivateTagType(id: string) {
    await apiFetch(`/api/admin/tag-types/${id}/deactivate`, { method: 'PATCH' })
    router.refresh()
  }

  async function activateTagType(id: string) {
    await apiFetch(`/api/admin/tag-types/${id}/activate`, { method: 'PATCH' })
    router.refresh()
  }

  async function deactivateTagValue(id: string) {
    await apiFetch(`/api/admin/tag-values/${id}/deactivate`, { method: 'PATCH' })
    router.refresh()
  }

  async function activateTagValue(id: string) {
    await apiFetch(`/api/admin/tag-values/${id}/activate`, { method: 'PATCH' })
    router.refresh()
  }

  async function submitTagTypeModal(
    values: TagTypeFormValues
  ): Promise<{ ok: true } | { ok: false; error: string }> {
    try {
      if (tagTypeModal?.mode === 'edit') {
        await apiFetch(`/api/admin/tag-types/${tagTypeModal.tagType.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            label: values.label,
            maxSelections: values.maxSelections,
          } satisfies UpdateTagTypePayload),
        })
      } else {
        await apiFetch('/api/admin/tag-types', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            serviceId,
            label: values.label,
            isPrimary: values.isPrimary,
            maxSelections: values.maxSelections,
          } satisfies CreateTagTypePayload),
        })
      }
      setTagTypeModal(null)
      router.refresh()
      return { ok: true }
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : 'Une erreur est survenue.' }
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div className="flex flex-col gap-2.5">
          <h1 className="font-cormorant text-[32px] font-semibold leading-none text-bordeaux">
            {serviceName}
          </h1>
          <SegmentedToggle value={statusFilter} onChange={setStatusFilter} />
        </div>
        <button
          type="button"
          onClick={() => setTagTypeModal({ mode: 'create' })}
          className="inline-flex h-11 items-center gap-2 rounded-md bg-accent px-4 text-sm font-bold text-white transition-colors hover:bg-accent/90"
        >
          <Plus size={15} aria-hidden="true" />
          Nouvelle catégorie
        </button>
      </div>

      {tagTypes.length === 0 ? (
        <div className="flex min-h-[360px] flex-col items-center justify-center gap-3 rounded-lg border border-bordeaux/10 bg-white px-10 py-16 text-center shadow-sm">
          <Tags size={48} strokeWidth={1.3} className="text-bordeaux/25" aria-hidden="true" />
          <h2 className="font-cormorant text-2xl font-semibold text-bordeaux">
            Aucune catégorie configurée
          </h2>
          <p className="max-w-[360px] text-sm leading-6 text-texte/55">
            Ce métier n&apos;a pas encore de catégorie de tags. Crées-en une pour commencer à
            organiser le portfolio des prestataires.
          </p>
          <button
            type="button"
            onClick={() => setTagTypeModal({ mode: 'create' })}
            className="mt-2 inline-flex items-center gap-2 rounded-md bg-accent px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-accent/90"
          >
            <Plus size={14} aria-hidden="true" />
            Nouvelle catégorie
          </button>
        </div>
      ) : filteredTagTypes.length === 0 ? (
        <div className="rounded-lg border border-bordeaux/10 bg-white p-10 text-center text-sm text-texte/50 shadow-sm">
          Aucune catégorie {statusFilter === 'active' ? 'active' : 'désactivée'}.
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-bordeaux/10 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-left">
              <thead className="bg-creme text-xs uppercase text-gris">
                  <tr>
                  <th className="px-6 py-4 font-bold">Nom de la catégorie</th>
                  <th className="px-6 py-4 font-bold">Sélection max. par photo</th>
                  <th className="px-6 py-4 font-bold">Statut</th>
                  <th className="w-12 px-6 py-4" aria-label="Action" />
                </tr>
              </thead>
              <tbody className="divide-y divide-bordeaux/8 text-sm">
                {filteredTagTypes.map((tagType) => {
                  const expanded = expandedTagTypeId === tagType.id
                  const valueFilter = valueFilterFor(tagType.id)
                  const filteredValues = tagType.tagValues.filter((value) =>
                    valueFilter === 'active' ? value.isActive : !value.isActive
                  )

                  return (
                    <Fragment key={tagType.id}>
                      <tr
                        onClick={() => toggleExpanded(tagType.id)}
                        className="cursor-pointer transition-colors hover:bg-creme"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2.5">
                            <ChevronRight
                              size={14}
                              className={`flex-shrink-0 text-texte/35 transition-transform ${
                                expanded ? 'rotate-90' : ''
                              }`}
                              aria-hidden="true"
                            />
                            <span className="text-[14.5px] font-bold text-texte">{tagType.label}</span>
                            {tagType.isPrimary && (
                              <span className="rounded-md bg-accent/12 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-accent">
                                Principale
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-texte/65">
                          {tagType.maxSelections === null
                            ? 'Illimité'
                            : `${tagType.maxSelections} tag${tagType.maxSelections > 1 ? 's' : ''} max`}
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge isActive={tagType.isActive} />
                        </td>
                        <td className="px-6 py-4" onClick={(event) => event.stopPropagation()}>
                          <KebabMenu
                            isActive={tagType.isActive}
                            onModify={() => setTagTypeModal({ mode: 'edit', tagType })}
                            onDeactivate={() => deactivateTagType(tagType.id)}
                            onActivate={() => activateTagType(tagType.id)}
                            canDeactivate={!tagType.isPrimary}
                            confirmLabel="cette catégorie"
                            pronoun="Elle"
                          />
                        </td>
                      </tr>

                      {expanded && (
                        <tr className="bg-creme/45">
                          <td colSpan={4} className="p-0">
                            <div className="flex flex-col gap-3 py-3 pl-14 pr-5">
                              {tagType.tagValues.length > 0 && (
                                <SegmentedToggle
                                  small
                                  value={valueFilter}
                                  onChange={(value) =>
                                    setValueStatusFilters((prev) => ({ ...prev, [tagType.id]: value }))
                                  }
                                />
                              )}

                              {tagType.tagValues.length === 0 ? (
                                <p className="px-1 text-sm text-texte/50">
                                  Aucun tag dans cette catégorie pour l&apos;instant.
                                </p>
                              ) : filteredValues.length === 0 ? (
                                <p className="px-1 text-sm text-texte/50">
                                  Aucun tag {valueFilter === 'active' ? 'actif' : 'désactivé'} dans cette
                                  catégorie.
                                </p>
                              ) : (
                                filteredValues.map((tagValue) =>
                                  editingValueId === tagValue.id ? (
                                    <div key={tagValue.id} className="flex flex-col gap-1.5">
                                      <div className="flex items-start gap-2">
                                        <div className="flex flex-1 flex-col gap-1.5">
                                          <input
                                            autoFocus
                                            type="text"
                                            value={editValueDraft}
                                            onChange={(event) => setEditValueDraft(event.target.value)}
                                            onKeyDown={(event) => {
                                              if (event.key === 'Enter') submitEditValue()
                                              if (event.key === 'Escape') cancelEditValue()
                                            }}
                                            className={`w-full rounded-md border bg-white px-3 py-2 text-sm text-texte outline-none ${
                                              editValueError ? 'border-danger' : 'border-accent'
                                            }`}
                                          />
                                          <input
                                            type="text"
                                            placeholder="URL vignette (optionnel)"
                                            value={editValueVignetteDraft}
                                            onChange={(event) => setEditValueVignetteDraft(event.target.value)}
                                            onKeyDown={(event) => {
                                              if (event.key === 'Enter') submitEditValue()
                                              if (event.key === 'Escape') cancelEditValue()
                                            }}
                                            className="w-full rounded-md border border-accent bg-white px-3 py-2 text-sm text-texte outline-none"
                                          />
                                        </div>
                                        <button
                                          type="button"
                                          onClick={submitEditValue}
                                          disabled={editValuePending}
                                          className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md bg-success-soft text-success"
                                          aria-label="Enregistrer"
                                        >
                                          <Check size={14} aria-hidden="true" />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={cancelEditValue}
                                          className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md bg-texte/6 text-texte/45"
                                          aria-label="Annuler"
                                        >
                                          <X size={14} aria-hidden="true" />
                                        </button>
                                      </div>
                                      {editValueError && (
                                        <p className="px-1 text-xs font-semibold text-danger">
                                          {editValueError}
                                        </p>
                                      )}
                                    </div>
                                  ) : (
                                    <div
                                      key={tagValue.id}
                                      className="flex items-center justify-between gap-3 rounded-md px-3 py-2 hover:bg-white"
                                    >
                                      <span className="flex min-w-0 items-center gap-2 text-sm font-medium text-texte">
                                        {tagValue.vignetteUrl && (
                                          // eslint-disable-next-line @next/next/no-img-element -- miniature admin 24px, URL arbitraire hors remotePatterns
                                          <img
                                            src={tagValue.vignetteUrl}
                                            alt=""
                                            className="h-6 w-6 flex-shrink-0 rounded object-cover"
                                            onError={(event) => {
                                              event.currentTarget.style.display = 'none'
                                            }}
                                          />
                                        )}
                                        <span className="truncate">{tagValue.label}</span>
                                      </span>
                                      <div className="flex items-center gap-3">
                                        <StatusBadge isActive={tagValue.isActive} />
                                        <KebabMenu
                                          isActive={tagValue.isActive}
                                          onModify={() => openEditValue(tagValue)}
                                          onDeactivate={() => deactivateTagValue(tagValue.id)}
                                          onActivate={() => activateTagValue(tagValue.id)}
                                          confirmLabel="ce tag"
                                          pronoun="Il"
                                        />
                                      </div>
                                    </div>
                                  )
                                )
                              )}

                              {addingValueForTagTypeId === tagType.id ? (
                                <div className="flex flex-col gap-1.5">
                                  <div className="flex items-start gap-2">
                                    <div className="flex flex-1 flex-col gap-1.5">
                                      <input
                                        autoFocus
                                        type="text"
                                        placeholder="Nom du tag"
                                        value={addValueDraft}
                                        onChange={(event) => setAddValueDraft(event.target.value)}
                                        onKeyDown={(event) => {
                                          if (event.key === 'Enter') submitAddValue(tagType.id)
                                          if (event.key === 'Escape') cancelAddValue()
                                        }}
                                        className={`w-full rounded-md border bg-white px-3 py-2 text-sm text-texte outline-none ${
                                          addValueError ? 'border-danger' : 'border-accent'
                                        }`}
                                      />
                                      <input
                                        type="text"
                                        placeholder="URL vignette (optionnel)"
                                        value={addValueVignetteDraft}
                                        onChange={(event) => setAddValueVignetteDraft(event.target.value)}
                                        onKeyDown={(event) => {
                                          if (event.key === 'Enter') submitAddValue(tagType.id)
                                          if (event.key === 'Escape') cancelAddValue()
                                        }}
                                        className="w-full rounded-md border border-accent bg-white px-3 py-2 text-sm text-texte outline-none"
                                      />
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => submitAddValue(tagType.id)}
                                      disabled={addValuePending}
                                      className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md bg-success-soft text-success"
                                      aria-label="Ajouter"
                                    >
                                      <Check size={14} aria-hidden="true" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={cancelAddValue}
                                      className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md bg-texte/6 text-texte/45"
                                      aria-label="Annuler"
                                    >
                                      <X size={14} aria-hidden="true" />
                                    </button>
                                  </div>
                                  {addValueError && (
                                    <p className="px-1 text-xs font-semibold text-danger">
                                      {addValueError}
                                    </p>
                                  )}
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => openAddValue(tagType.id)}
                                  className="flex w-fit items-center gap-1.5 rounded-md px-3 py-2 text-sm font-semibold text-accent hover:bg-accent/6"
                                >
                                  <Plus size={12} aria-hidden="true" />
                                  Ajouter un tag
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tagTypeModal && (
        <TagTypeModal
          mode={tagTypeModal.mode}
          initial={tagTypeModal.mode === 'edit' ? tagTypeModal.tagType : null}
          onCancel={() => setTagTypeModal(null)}
          onSubmit={submitTagTypeModal}
        />
      )}
    </div>
  )
}
