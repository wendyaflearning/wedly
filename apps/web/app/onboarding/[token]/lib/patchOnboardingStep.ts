export async function patchOnboardingStep(
  token: string,
  step: string,
  data: Record<string, unknown>,
): Promise<{ current_step: string }> {
  let res: Response
  try {
    res = await fetch(`/api/onboarding/${token}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ step, data }),
    })
  } catch {
    throw new Error('Une erreur est survenue.')
  }
  if (!res.ok) {
    const json = await res.json().catch(() => ({}))
    const data = json as { error?: string; errors?: Array<{ field: string; message: string }> }
    throw new Error(data.error ?? data.errors?.[0]?.message ?? 'Une erreur est survenue.')
  }
  return res.json()
}
