'use client';

import { useEffect, useState } from 'react';

export default function PasswordResetBanner() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setVisible(false), 5000);
    return () => clearTimeout(t);
  }, []);

  if (!visible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="fixed z-[55] flex flex-col overflow-hidden font-manrope bg-accent
        top-4 left-4 right-4 rounded-[8px] shadow-[0_4px_20px_rgba(41,26,16,0.25)]
        md:top-0 md:left-auto md:right-[148px] md:w-[400px] md:h-[72px] md:rounded-t-none md:rounded-b-[6px] md:shadow-[0_6px_24px_rgba(41,26,16,0.22)]"
      style={{ animation: 'toast-in 0.3s cubic-bezier(0.22,1,0.36,1) both' }}
    >
      <button
        className="absolute right-3 top-3 md:top-1/2 md:-translate-y-1/2 text-creme/60 hover:text-creme transition-colors"
        aria-label="Fermer la notification"
        onClick={() => setVisible(false)}
      >
        <svg width="9" height="9" viewBox="0 0 9 9" fill="none" aria-hidden="true">
          <path d="M1 1L8 8M8 1L1 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>

      {/* Content row */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-3 pr-8 md:flex-1 md:pt-0 md:pb-0">
        <div
          className="flex-shrink-0 w-[28px] h-[28px] rounded-full border border-creme/20 flex items-center justify-center text-creme"
          aria-hidden="true"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <polyline
              points="2,7.5 5.5,11 12,4"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div>
          <p className="text-[13px] font-semibold text-creme leading-tight">
            Mot de passe modifié
          </p>
          <p className="text-[12px] text-creme/75 mt-0.5 leading-[1.4]">
            Vous allez être redirigé vers votre tableau de bord.
          </p>
        </div>
      </div>

      {/* Progress bar — pinned to bottom */}
      <div className="h-[3px] bg-creme/15 flex-shrink-0">
        <div
          className="h-full bg-creme origin-left"
          style={{ animation: 'toast-progress 5s linear forwards' }}
        />
      </div>
    </div>
  );
}
