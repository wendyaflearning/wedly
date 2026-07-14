export async function apiFetch<T = unknown>(url: string, options: RequestInit): Promise<T> {
  const res = await fetch(url, options)
  if (!res.ok) {
    const data = await res.json().catch(() => null)
    throw new Error(data?.error ?? 'Une erreur est survenue.')
  }
  return res.json() as Promise<T>
}
