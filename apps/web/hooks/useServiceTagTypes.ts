'use client'
import { useEffect, useState } from 'react'
import type { TagType } from '@/lib/portfolio-tags'

export interface UseServiceTagTypesReturn {
  tagTypes: TagType[]
  loading:  boolean
  error:    string | null
}

export function useServiceTagTypes(serviceId: string | null): UseServiceTagTypesReturn {
  const [prevServiceId, setPrevServiceId] = useState(serviceId)
  const [tagTypes, setTagTypes]           = useState<TagType[]>([])
  const [loading, setLoading]             = useState(serviceId !== null)
  const [error, setError]                 = useState<string | null>(null)

  if (serviceId !== prevServiceId) {
    setPrevServiceId(serviceId)
    setTagTypes([])
    setLoading(serviceId !== null)
    setError(null)
  }

  useEffect(() => {
    if (serviceId === null) return

    let cancelled = false

    fetch(`/api/services/${serviceId}/tag-types`, { cache: 'no-store' })
      .then(async res => {
        if (!res.ok) {
          const data = await res.json().catch(() => null)
          throw new Error(data?.error ?? 'Une erreur est survenue.')
        }
        return res.json() as Promise<TagType[]>
      })
      .then(data => {
        if (!cancelled) setTagTypes(data)
      })
      .catch(err => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Une erreur est survenue.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [serviceId])

  return { tagTypes, loading, error }
}
