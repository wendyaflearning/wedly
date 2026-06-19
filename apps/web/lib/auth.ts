export async function loginVendor(
  email: string,
  password: string
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (res.ok) return { success: true };
    return {
      success: false,
      error:
        'Ces identifiants ne correspondent pas. Vérifiez votre mot de passe ou réinitialisez-le.',
    };
  } catch {
    return { success: false, error: 'Une erreur réseau est survenue. Réessayez.' };
  }
}
