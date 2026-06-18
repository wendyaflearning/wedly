'use client';

import { useState } from 'react';

type State = 'idle' | 'success';

const LEFT_CLAIMS: Record<State, string> = {
  idle:    'Ça arrive aux meilleurs.',
  success: "C'est en chemin.",
};

function LeftPanel({ claim }: { claim: string }) {
  return (
    <>
      {/* Mobile: bg image + overlay */}
      <div
        className="absolute inset-0 md:hidden bg-bordeaux bg-cover bg-center"
        style={{ backgroundImage: "url('/wedly-silk-plum2.png')" }}
      />
      <div
        className="absolute inset-0 md:hidden pointer-events-none"
        style={{
          background:
            'linear-gradient(rgba(34,12,22,0.5) 0%, rgba(34,12,22,0.18) 35%, rgba(20,7,14,0.38) 70%, rgba(15,6,11,0.7) 100%)',
        }}
      />

      {/* Mobile header */}
      <div className="relative z-10 md:hidden flex flex-col items-center text-center gap-3 px-[22px] pt-[44px] pb-[8px]">
        <img src="https://res.cloudinary.com/dadvrspox/image/upload/v1781796191/logo_light_kcub6h.svg" alt="Wedly" style={{ height: '42px', width: 'auto' }} />
        <h2
          className="font-cormorant italic font-medium text-[28px] leading-[1.15] text-creme tracking-[0.005em] max-w-[260px]"
          style={{ textShadow: 'rgba(34,12,22,0.5) 0px 2px 24px' }}
        >
          {claim}
        </h2>
      </div>

      {/* Desktop left panel */}
      <div
        className="hidden md:flex w-[52%] relative flex-col items-center justify-center overflow-hidden bg-bordeaux bg-cover bg-center"
        style={{ backgroundImage: "url('/wedly-silk-plum2.png')" }}
      >
        <div className="absolute inset-0" style={{ background: 'rgba(34,12,22,0.44)' }} />

        <div className="relative z-10 flex flex-col items-center text-center px-14 gap-8">
          <img src="https://res.cloudinary.com/dadvrspox/image/upload/v1781796191/logo_light_kcub6h.svg" alt="Wedly" style={{ height: '54px', width: 'auto' }} />
          <div className="flex items-center justify-center gap-4 w-full">
            <span className="h-px w-[80px] bg-[rgba(255,246,237,0.25)]" />
            <svg width="36" height="12" viewBox="0 0 56 18" fill="none" aria-hidden="true">
              <circle cx="20" cy="9" r="8" stroke="rgba(255,246,237,0.45)" strokeWidth="1.3" />
              <circle cx="34" cy="9" r="8" stroke="rgba(227,87,4,0.7)" strokeWidth="1.3" />
            </svg>
            <span className="h-px w-[80px] bg-[rgba(255,246,237,0.25)]" />
          </div>
          <h2
            className="font-cormorant italic font-medium text-[44px] leading-[1.12] text-creme tracking-[0.005em] max-w-[340px]"
            style={{ textShadow: 'rgba(34,12,22,0.4) 0px 2px 32px' }}
          >
            {claim}
          </h2>
        </div>

        <div className="absolute bottom-[48px] flex items-center gap-[14px]">
          <svg width="40" height="26" viewBox="0 0 62 40" fill="none" aria-hidden="true">
            <circle cx="24" cy="20" r="15" stroke="rgba(255,246,237,0.5)" strokeWidth="1.6" />
            <circle cx="40" cy="20" r="15" stroke="#E35704" strokeWidth="1.6" />
          </svg>
          <span className="font-manrope text-[10.5px] font-medium tracking-[0.2em] uppercase text-[rgba(255,246,237,0.45)]">
            Espace prestataire
          </span>
        </div>
      </div>
    </>
  );
}

export default function ForgotPasswordForm() {
  const [email, setEmail]     = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [state, setState]     = useState<State>('idle');

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isEmailValid) {
      setError("Cet email ne nous dit rien. Vérifiez l'adresse ou contactez-nous à bonjour@wedly.fr.");
      return;
    }
    setLoading(true);
    setError('');
    try {
      await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
    } catch {
      // silent — always show success
    }
    setState('success');
    setLoading(false);
  }

  return (
    <div className="min-h-screen relative flex flex-col md:flex-row bg-bordeaux md:bg-creme md:[background-image:none]">
      <LeftPanel claim={LEFT_CLAIMS[state]} />

      {/* Right panel */}
      <div className="relative z-10 px-[22px] pt-[16px] pb-[36px] md:flex-1 md:flex md:flex-col md:justify-center md:items-center md:bg-creme md:p-0">
        <div className="w-full md:max-w-[400px] md:w-[400px] rounded-[26px] border border-[rgba(255,246,237,0.16)] bg-[rgba(46,18,32,0.52)] [backdrop-filter:blur(30px)_saturate(1.1)] shadow-[0px_28px_70px_rgba(15,6,11,0.5),inset_0px_1px_0px_rgba(255,246,237,0.14)] p-[28px_24px] md:rounded-none md:border-0 md:bg-transparent md:[backdrop-filter:none] md:shadow-none md:p-0">

          {state === 'success' ? (
            <div className="flex flex-col items-center text-center gap-[24px] py-[8px]">
              <div className="flex items-center justify-center w-[72px] h-[72px] rounded-full bg-[rgba(255,246,237,0.12)] md:bg-[rgba(78,26,50,0.06)] border border-[rgba(255,246,237,0.18)] md:border-[rgba(78,26,50,0.1)]">
                <svg width="30" height="30" viewBox="0 0 30 30" fill="none" aria-hidden="true">
                  <rect x="4" y="7" width="22" height="16" rx="3.5" stroke="#9D4F1E" strokeWidth="1.5" />
                  <path d="M4.5 8.5 15 16.5l10.5-8" stroke="#9D4F1E" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </div>
              <div className="flex flex-col gap-[10px]">
                <h2 className="font-cormorant font-medium text-[30px] leading-[1.1] text-creme md:text-texte">
                  Regardez votre boîte mail.
                </h2>
                <p className="font-manrope text-[14px] leading-[1.65] text-[rgba(255,246,237,0.7)] md:text-gris max-w-[320px]">
                  Un lien vient de vous être envoyé. Cliquez dessus pour choisir un nouveau mot de passe. Pas de mail&nbsp;? Vérifiez vos spams.
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-[20px] md:gap-[24px] w-full text-left">
              <div className="flex flex-col gap-[8px]">
                <span className="font-manrope text-[10.5px] font-bold tracking-[0.18em] uppercase text-[rgb(240,168,117)] md:text-highlight">
                  Réinitialisation
                </span>
                <h1 className="font-cormorant font-medium text-[30px] leading-[1.1] text-creme tracking-[0.005em] md:hidden">
                  Mot de passe oublié&nbsp;?
                </h1>
                <h1 className="hidden md:block font-cormorant font-medium text-[38px] leading-[1.1] text-texte tracking-[0.005em]">
                  Mot de passe oublié&nbsp;?
                </h1>
                <p className="font-manrope text-[13.5px] leading-[1.6] text-[rgba(255,246,237,0.65)] md:text-gris">
                  Entrez votre email, un lien vous attend dans quelques secondes.
                </p>
              </div>

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
                    onChange={(e) => { setEmail(e.target.value); setError(''); }}
                    placeholder="atelier.lumiere@gmail.com"
                    required
                    autoComplete="email"
                    autoCapitalize="none"
                    autoCorrect="off"
                    className={`w-full font-manrope text-[15px] text-creme md:text-texte bg-[rgba(255,246,237,0.06)] md:bg-white border-[1.5px] rounded-[13px] outline-none transition-[border-color,box-shadow] duration-[180ms] placeholder:text-[rgba(255,246,237,0.4)] md:placeholder:text-[rgba(41,26,16,0.34)] focus:shadow-[0_0_0_4px_rgba(240,168,117,0.2)] md:focus:shadow-[0_0_0_4px_rgba(227,87,4,0.14)] ${
                      error
                        ? 'border-highlight focus:border-highlight md:border-highlight'
                        : 'border-[rgba(255,246,237,0.16)] md:border-[rgba(78,26,50,0.12)] focus:border-[#F0A875] md:focus:border-[#E35704]'
                    }`}
                    style={{ padding: '15px 46px 15px 43px' }}
                  />
                  {isEmailValid && !error && (
                    <span className="absolute right-[13px] flex pointer-events-none">
                      <svg width="21" height="21" viewBox="0 0 22 22" fill="none" aria-hidden="true">
                        <circle cx="11" cy="11" r="11" fill="#E35704" />
                        <path d="M6.6 11.2 9.4 14 15 8" stroke="#FFF6ED" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                  )}
                </div>
                {error && (
                  <p className="flex items-start gap-[6px] font-manrope text-[12.5px] leading-[1.5] text-highlight">
                    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true" className="flex-shrink-0 mt-[1px]">
                      <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.3" />
                      <path d="M8 5v3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                      <circle cx="8" cy="11.5" r="0.75" fill="currentColor" />
                    </svg>
                    {error}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-[9px] font-manrope text-[15px] font-semibold text-creme tracking-[0.01em] rounded-[13px] bg-gradient-to-br from-[#E35704] to-[#F58324] md:from-accent md:to-highlight shadow-[0px_14px_32px_rgba(227,87,4,0.42)] md:shadow-[0px_12px_28px_rgba(227,87,4,0.3)] transition-[transform,box-shadow,filter] duration-[150ms] hover:-translate-y-px hover:brightness-105 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 cursor-pointer whitespace-nowrap border-none"
                style={{ padding: '16px 24px' }}
              >
                <span>{loading ? 'Envoi en cours…' : 'Recevoir le lien'}</span>
                {!loading && (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path d="M2.6 8h9.4M8.4 4l4 4-4 4" stroke="#FFF6ED" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>

              <a
                href="/login"
                className="text-center font-manrope text-[13px] font-semibold text-[rgb(240,201,168)] md:text-accent no-underline transition-opacity duration-[150ms] hover:opacity-65"
              >
                ← Retour à la connexion
              </a>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}
