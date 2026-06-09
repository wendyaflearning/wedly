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
    throw new Error((json as { error?: string }).error ?? 'Une erreur est survenue.')
  }
  return res.json()
}
