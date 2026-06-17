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
      className="fixed top-5 left-1/2 z-50 flex items-center gap-3 px-5 py-3.5 rounded-[14px] shadow-[0_8px_32px_rgba(41,26,16,0.18)] border border-[rgba(78,112,58,0.2)] bg-white font-manrope text-[13.5px] font-medium text-[#2E5422]"
      style={{
        transform: 'translateX(-50%)',
        animation: 'modalPop 0.34s cubic-bezier(0.22,1,0.36,1) both',
      }}
    >
      <span className="flex items-center justify-center w-[22px] h-[22px] rounded-full bg-[#4E7A3A] flex-shrink-0">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
          <path d="M2 6.2 4.5 8.8 10 3" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      Votre mot de passe a bien été mis à jour.
    </div>
  );
}
