'use client';

import { useState } from 'react';
import { isCoupleSpaceRedirect } from '@/lib/auth-redirect';
import { loginVendor } from '@/lib/auth';
import { buildCoupleSpaceEntryUrl } from '@/lib/couple-space';
import { browserStorage } from '@/lib/wedream-pending-actions';
import { flushPendingActions } from '@/lib/wedream-pending-flush';

export default function LoginForm({
  redirectTo,
  shouldFlushPendingActions = false,
}: {
  redirectTo?: string;
  shouldFlushPendingActions?: boolean;
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isEmailValid = email.includes('@') && email.includes('.');
  const isCoupleLogin = isCoupleSpaceRedirect(redirectTo);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const result = await loginVendor(email, password, redirectTo);
    if (result.success) {
      // `result.redirectTo` sort de `safeRedirectForRole()`, donc du rôle résolu
      // côté serveur et non de l'URL : un prestataire ou un admin qui arriverait
      // ici avec le drapeau dans l'adresse est ramené sur son propre espace, et
      // ce test rend `false`. Le garde-fou de rôle est déjà là, gratuitement.
      if (shouldFlushPendingActions && isCoupleSpaceRedirect(result.redirectTo)) {
        const { done } = await flushPendingActions(browserStorage('local'));

        // Le test reste ici et n'entre pas dans `buildCoupleSpaceEntryUrl` :
        // sans rien de rejoué, la destination n'est pas l'onglet nu mais le
        // `redirectTo` résolu depuis le rôle, quelques lignes plus bas.
        if (done > 0) {
          window.location.href = buildCoupleSpaceEntryUrl(done);
          return;
        }
        // Rien n'a abouti : on ne promet pas au couple des coups de cœur qu'il
        // ne retrouverait pas. Connexion normale, sans confirmation.
      }

      window.location.href = result.redirectTo;
    } else {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-[18px] md:gap-[22px] w-full text-left">
      {/* Header */}
      <div className="flex flex-col gap-[9px]">
        <span className="font-manrope text-[10.5px] font-bold tracking-[0.18em] uppercase text-[rgb(240,168,117)] md:text-highlight">
          {isCoupleLogin ? 'Espace couple' : 'Espace prestataire'}
        </span>
        <h1 className="font-cormorant font-medium text-[30px] leading-[1.1] text-creme tracking-[0.005em] md:hidden">
          Connexion
        </h1>
        <h1 className="hidden md:block font-cormorant font-medium text-[38px] leading-[1.1] text-texte tracking-[0.005em]">
          {isCoupleLogin ? 'Retrouvez votre espace' : 'Bienvenue sur Wedly'}
        </h1>
      </div>

      {/* Fields */}
      <div className="flex flex-col gap-[15px]">
        {/* Email */}
        <div className="flex flex-col gap-[8px]">
          <label
            htmlFor="email"
            className="font-manrope text-[10.5px] font-semibold tracking-[0.09em] uppercase text-[rgba(255,246,237,0.62)] md:text-[rgba(41,26,16,0.52)]"
          >
            Adresse email
          </label>
          <div className="relative flex items-center">
            <span className="absolute left-[15px] flex pointer-events-none text-[rgba(255,246,237,0.55)] md:text-[rgba(78,26,50,0.5)]">
              <svg width="17" height="17" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                <rect x="2" y="3.7" width="14" height="10.6" rx="2.2" stroke="currentColor" strokeWidth="1.3" />
                <path d="M2.7 4.8 9 9.4l6.3-4.6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
              </svg>
            </span>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="votre@email.com"
              required
              autoComplete="email"
              autoCapitalize="none"
              autoCorrect="off"
              className="w-full font-manrope text-[15px] text-creme md:text-texte bg-[rgba(255,246,237,0.06)] md:bg-[rgb(246,237,226)] border-[1.5px] border-[rgba(255,246,237,0.16)] md:border-[rgba(78,26,50,0.12)] rounded-[13px] outline-none transition-[border-color,box-shadow] duration-[180ms] placeholder:text-[rgba(255,246,237,0.4)] md:placeholder:text-[rgba(41,26,16,0.34)] focus:border-[#F0A875] focus:shadow-[0_0_0_4px_rgba(240,168,117,0.2)] md:focus:border-[#E35704] md:focus:shadow-[0_0_0_4px_rgba(227,87,4,0.14)]"
              style={{ padding: '15px 46px 15px 43px' }}
            />
            {isEmailValid && (
              <span className="absolute right-[13px] flex pointer-events-none">
                <svg width="21" height="21" viewBox="0 0 22 22" fill="none" aria-hidden="true">
                  <circle cx="11" cy="11" r="11" fill="#E35704" />
                  <path d="M6.6 11.2 9.4 14 15 8" stroke="#FFF6ED" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            )}
          </div>
        </div>

        {/* Password */}
        <div className="flex flex-col gap-[9px]">
          <div className="flex flex-col gap-[8px]">
            <label
              htmlFor="password"
              className="font-manrope text-[10.5px] font-semibold tracking-[0.09em] uppercase text-[rgba(255,246,237,0.62)] md:text-[rgba(41,26,16,0.52)]"
            >
              Mot de passe
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
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Votre mot de passe"
                required
                autoComplete="current-password"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                className="w-full font-manrope text-[15px] text-creme md:text-texte bg-[rgba(255,246,237,0.08)] md:bg-white border-[1.5px] border-[rgba(255,246,237,0.26)] md:border-[rgba(78,26,50,0.2)] rounded-[13px] outline-none transition-[border-color,box-shadow] duration-[180ms] placeholder:text-[rgba(255,246,237,0.4)] md:placeholder:text-[rgba(41,26,16,0.34)] focus:border-[#F0A875] focus:shadow-[0_0_0_4px_rgba(240,168,117,0.2)] md:focus:border-[#E35704] md:focus:shadow-[0_0_0_4px_rgba(227,87,4,0.14)]"
                style={{ padding: '15px 46px 15px 43px' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
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
          </div>
          <div className="flex justify-end">
            <a
              href="/forgot-password"
              className="font-manrope text-[12.5px] font-semibold text-[rgb(240,201,168)] md:text-accent no-underline transition-opacity duration-[150ms] hover:opacity-65"
            >
              Mot de passe oublié&nbsp;?
            </a>
          </div>
        </div>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="w-full flex items-center justify-center gap-[9px] font-manrope text-[15px] font-semibold text-creme tracking-[0.01em] rounded-[13px] bg-gradient-to-br from-[#E35704] to-[#F58324] md:from-accent md:to-highlight shadow-[0px_14px_32px_rgba(227,87,4,0.42)] md:shadow-[0px_12px_28px_rgba(227,87,4,0.3)] transition-[transform,box-shadow,filter] duration-[150ms] hover:-translate-y-px hover:brightness-105 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 cursor-pointer whitespace-nowrap border-none"
        style={{ padding: '16px 24px' }}
      >
        <span>{loading ? 'Connexion en cours…' : 'Accéder à mon espace'}</span>
        {!loading && (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M2.6 8h9.4M8.4 4l4 4-4 4" stroke="#FFF6ED" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      {error && (
        <p className="font-manrope text-[13px] text-highlight leading-[1.4]">{error}</p>
      )}
    </form>
  );
}
