import { Suspense } from 'react';
import ResetPasswordForm from './ResetPasswordForm';

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen relative flex flex-col md:flex-row bg-bordeaux md:bg-creme md:[background-image:none]">
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
      <div className="relative z-10 md:hidden flex flex-col items-center text-center gap-6 px-[22px] pt-[72px] pb-[32px]">
        <img src="/signature.svg" alt="Wedly" style={{ height: '42px', width: 'auto' }} />
        <h2
          className="font-cormorant italic font-medium text-[28px] leading-[1.15] text-creme tracking-[0.005em] max-w-[260px]"
          style={{ textShadow: 'rgba(34,12,22,0.5) 0px 2px 24px' }}
        >
          Vous y êtes presque.
        </h2>
      </div>

      {/* Desktop: left panel */}
      <div
        className="hidden md:flex w-[52%] relative flex-col items-center justify-center overflow-hidden bg-bordeaux bg-cover bg-center"
        style={{ backgroundImage: "url('/wedly-silk-plum2.png')" }}
      >
        <div className="absolute inset-0" style={{ background: 'rgba(34,12,22,0.44)' }} />

        <div className="relative z-10 flex flex-col items-center text-center px-14 gap-8">
          <img src="/signature.svg" alt="Wedly" style={{ height: '54px', width: 'auto' }} />
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
            Vous y êtes presque.
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

      {/* Right panel: form */}
      <div className="relative z-10 flex-1 flex flex-col justify-end md:justify-center md:items-center md:bg-creme px-[22px] pb-[36px] md:p-0">
        <div className="w-full md:max-w-[400px] md:w-[400px] rounded-[26px] border border-[rgba(255,246,237,0.16)] bg-[rgba(46,18,32,0.52)] [backdrop-filter:blur(30px)_saturate(1.1)] shadow-[0px_28px_70px_rgba(15,6,11,0.5),inset_0px_1px_0px_rgba(255,246,237,0.14)] p-[28px_24px] md:rounded-none md:border-0 md:bg-transparent md:[backdrop-filter:none] md:shadow-none md:p-0">
          <Suspense>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
