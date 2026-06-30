export async function loginVendor(
  email: string,
  password: string,
  redirectTo?: string
): Promise<{ success: true; redirectTo: string } | { success: false; error: string }> {
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, redirectTo }),
    });
    if (res.ok) {
      const data = await res.json();
      return { success: true, redirectTo: data.redirectTo ?? '/dashboard' };
    }

    return {
      success: false,
      error:
        'Ces identifiants ne correspondent pas. Vérifiez votre mot de passe ou réinitialisez-le.',
    };
  } catch {
    return { success: false, error: 'Une erreur réseau est survenue. Réessayez.' };
  }
}
