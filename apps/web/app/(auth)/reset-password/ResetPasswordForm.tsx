'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function ResetPasswordForm() {
  const router        = useRouter();
  const searchParams  = useSearchParams();
  const token         = searchParams.get('token') ?? '';

  const [password, setPassword]               = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [showPassword, setShowPassword]       = useState(false);
  const [showConfirm, setShowConfirm]         = useState(false);
  const [loading, setLoading]                 = useState(false);
  const [error, setError]                     = useState('');

  const pwLengthOk   = password.length >= 8;
  const confirmMatch = passwordConfirm !== '' && password === passwordConfirm;
  const confirmMismatch = passwordConfirm !== '' && password !== passwordConfirm;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!pwLengthOk) {
      setError('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    if (!confirmMatch) {
      setError('Les mots de passe ne correspondent pas. Recommencez, vous y êtes presque.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ token, password, passwordConfirm }),
      });

      if (res.ok) {
        router.push('/dashboard?password_reset=success');
        return;
      }

      const data = await res.json();
      setError(data.error ?? 'Une erreur est survenue. Réessayez.');
    } catch {
      setError('Une erreur réseau est survenue. Réessayez.');
    }

    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-[20px] md:gap-[24px] w-full text-left">
      <div className="flex flex-col gap-[8px]">
        <span className="font-manrope text-[10.5px] font-bold tracking-[0.18em] uppercase text-[rgb(240,168,117)] md:text-highlight">
          Réinitialisation
        </span>
        <h1 className="font-cormorant font-medium text-[30px] leading-[1.1] text-creme tracking-[0.005em] md:hidden">
          Un nouveau départ.
        </h1>
        <h1 className="hidden md:block font-cormorant font-medium text-[38px] leading-[1.1] text-texte tracking-[0.005em]">
          Un nouveau départ.
        </h1>
        <p className="font-manrope text-[13.5px] leading-[1.6] text-[rgba(255,246,237,0.65)] md:text-gris">
          Choisissez un mot de passe que vous retiendrez cette fois.
        </p>
      </div>

      <div className="flex flex-col gap-[14px]">
        {/* Nouveau mot de passe */}
        <div className="flex flex-col gap-[8px]">
          <label
            htmlFor="password"
            className="font-manrope text-[10.5px] font-semibold tracking-[0.09em] uppercase text-[rgba(255,246,237,0.62)] md:text-[rgba(41,26,16,0.52)]"
          >
            Nouveau mot de passe
          </label>
          <div className="relative flex items-center">
            <span className="absolute left-[15px] flex pointer-events-none text-[rgba(255,246,237,0.55)] md:text-[rgba(78,26,50,0.5)]">
              <svg width="14" height="15" viewBox="0 0 14 15" fill="none" aria-hidden="true">
                <rect x="2" y="6.4" width="10" height="7" rx="1.7" stroke="currentColor" strokeWidth="1.3" />
                <path d="M4.3 6.4V4.6a2.7 2.7 0 0 1 5.4 0v1.8" stroke="currentColor" strokeWidth="1.3" />
              </svg>
            </span>
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
              placeholder="••••••••"
              required
              autoComplete="new-password"
              className="w-full font-manrope text-[15px] text-creme md:text-texte bg-[rgba(255,246,237,0.06)] md:bg-white border-[1.5px] border-[rgba(255,246,237,0.16)] md:border-[rgba(78,26,50,0.12)] rounded-[13px] outline-none transition-[border-color,box-shadow] duration-[180ms] placeholder:text-[rgba(255,246,237,0.4)] md:placeholder:text-[rgba(41,26,16,0.34)] focus:border-[#F0A875] focus:shadow-[0_0_0_4px_rgba(240,168,117,0.2)] md:focus:border-[#E35704] md:focus:shadow-[0_0_0_4px_rgba(227,87,4,0.14)]"
              style={{ padding: '15px 46px 15px 43px' }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Masquer' : 'Afficher'}
              className="absolute right-[15px] flex cursor-pointer text-[rgba(255,246,237,0.62)] md:text-[rgba(41,26,16,0.52)]"
            >
              {showPassword ? (
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                  <path d="M1.4 9S4.2 3.8 9 3.8 16.6 9 16.6 9 13.8 14.2 9 14.2 1.4 9 1.4 9Z" stroke="currentColor" strokeWidth="1.3" />
                  <circle cx="9" cy="9" r="2.3" stroke="currentColor" strokeWidth="1.3" />
                  <path d="M2 2l14 14" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                  <path d="M1.4 9S4.2 3.8 9 3.8 16.6 9 16.6 9 13.8 14.2 9 14.2 1.4 9 1.4 9Z" stroke="currentColor" strokeWidth="1.3" />
                  <circle cx="9" cy="9" r="2.3" stroke="currentColor" strokeWidth="1.3" />
                </svg>
              )}
            </button>
          </div>
          {password !== '' && (
            <span
              className="font-manrope text-[11px] tracking-[0.06em]"
              style={{ color: pwLengthOk ? '#4E7A3A' : 'rgba(255,246,237,0.45)' }}
            >
              <span className="md:hidden" style={{ color: pwLengthOk ? '#4E7A3A' : 'rgba(255,246,237,0.45)' }}>
                {pwLengthOk ? '✓' : '○'} 8 caractères minimum
              </span>
              <span className="hidden md:inline" style={{ color: pwLengthOk ? '#4E7A3A' : 'rgba(41,26,16,0.38)' }}>
                {pwLengthOk ? '✓' : '○'} 8 caractères minimum
              </span>
            </span>
          )}
        </div>

        {/* Confirmer le mot de passe */}
        <div className="flex flex-col gap-[8px]">
          <label
            htmlFor="passwordConfirm"
            className="font-manrope text-[10.5px] font-semibold tracking-[0.09em] uppercase text-[rgba(255,246,237,0.62)] md:text-[rgba(41,26,16,0.52)]"
          >
            Confirmer le mot de passe
          </label>
          <div className="relative flex items-center">
            <span className="absolute left-[15px] flex pointer-events-none text-[rgba(255,246,237,0.55)] md:text-[rgba(78,26,50,0.5)]">
              <svg width="14" height="15" viewBox="0 0 14 15" fill="none" aria-hidden="true">
                <rect x="2" y="6.4" width="10" height="7" rx="1.7" stroke="currentColor" strokeWidth="1.3" />
                <path d="M4.3 6.4V4.6a2.7 2.7 0 0 1 5.4 0v1.8" stroke="currentColor" strokeWidth="1.3" />
              </svg>
            </span>
            <input
              id="passwordConfirm"
              type={showConfirm ? 'text' : 'password'}
              value={passwordConfirm}
              onChange={(e) => { setPasswordConfirm(e.target.value); setError(''); }}
              placeholder="••••••••"
              required
              autoComplete="new-password"
              className={`w-full font-manrope text-[15px] text-creme md:text-texte bg-[rgba(255,246,237,0.06)] md:bg-white border-[1.5px] rounded-[13px] outline-none transition-[border-color,box-shadow] duration-[180ms] placeholder:text-[rgba(255,246,237,0.4)] md:placeholder:text-[rgba(41,26,16,0.34)] focus:shadow-[0_0_0_4px_rgba(240,168,117,0.2)] md:focus:shadow-[0_0_0_4px_rgba(227,87,4,0.14)] ${
                confirmMismatch
                  ? 'border-highlight focus:border-highlight md:border-highlight'
                  : 'border-[rgba(255,246,237,0.16)] md:border-[rgba(78,26,50,0.12)] focus:border-[#F0A875] md:focus:border-[#E35704]'
              }`}
              style={{ padding: '15px 46px 15px 43px' }}
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              aria-label={showConfirm ? 'Masquer' : 'Afficher'}
              className="absolute right-[15px] flex cursor-pointer text-[rgba(255,246,237,0.62)] md:text-[rgba(41,26,16,0.52)]"
            >
              {showConfirm ? (
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                  <path d="M1.4 9S4.2 3.8 9 3.8 16.6 9 16.6 9 13.8 14.2 9 14.2 1.4 9 1.4 9Z" stroke="currentColor" strokeWidth="1.3" />
                  <circle cx="9" cy="9" r="2.3" stroke="currentColor" strokeWidth="1.3" />
                  <path d="M2 2l14 14" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                  <path d="M1.4 9S4.2 3.8 9 3.8 16.6 9 16.6 9 13.8 14.2 9 14.2 1.4 9 1.4 9Z" stroke="currentColor" strokeWidth="1.3" />
                  <circle cx="9" cy="9" r="2.3" stroke="currentColor" strokeWidth="1.3" />
                </svg>
              )}
            </button>
          </div>

          {confirmMatch && (
            <span className="font-manrope text-[11px] tracking-[0.06em]" style={{ color: '#4E7A3A' }}>
              ✓ Les mots de passe correspondent
            </span>
          )}
          {(confirmMismatch || error) && (
            <p className="flex items-start gap-[6px] font-manrope text-[12.5px] leading-[1.5] text-highlight">
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true" className="flex-shrink-0 mt-[1px]">
                <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.3" />
                <path d="M8 5v3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                <circle cx="8" cy="11.5" r="0.75" fill="currentColor" />
              </svg>
              {error || 'Les mots de passe ne correspondent pas.'}
            </p>
          )}
        </div>
      </div>

      <button
        type="submit"
        className="w-full flex items-center justify-center gap-[9px] font-manrope text-[15px] font-semibold text-creme tracking-[0.01em] rounded-[13px] bg-gradient-to-br from-[#E35704] to-[#F58324] md:from-accent md:to-highlight shadow-[0px_14px_32px_rgba(227,87,4,0.42)] md:shadow-[0px_12px_28px_rgba(227,87,4,0.3)] transition-[transform,box-shadow,filter] duration-[150ms] hover:-translate-y-px hover:brightness-105 cursor-pointer whitespace-nowrap border-none"
        style={{ padding: '16px 24px' }}
      >
        <span>Confirmer</span>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M2.6 8h9.4M8.4 4l4 4-4 4" stroke="#FFF6ED" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </form>
  );
}
