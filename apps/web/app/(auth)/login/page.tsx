import Navbar from '../../_components/Navbar';
import LoginForm from './LoginForm';

type LoginPageProps = {
  searchParams?: Promise<{
    redirect?: string | string[];
    flush?: string | string[];
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const redirectTo = typeof params?.redirect === 'string' ? params.redirect : undefined;
  // Posé par l'écran « vous avez déjà un compte » du parcours d'inscription
  // (WED-162) : ce couple a des gestes en attente à rejouer une fois connecté.
  // Toute autre connexion arrive sans ce drapeau et n'est pas concernée.
  const shouldFlushPendingActions = params?.flush === 'pending-actions';

  return (
    <>
      <Navbar />
      <div className="min-h-screen relative flex flex-col lg:flex-row bg-bordeaux lg:bg-creme lg:[background-image:none]">
      {/* Mobile background: image + overlay covers the full page */}
      <div
        className="absolute inset-0 lg:hidden bg-bordeaux bg-cover bg-center"
        style={{ backgroundImage: "url('/wedly-silk-plum2.png')" }}
      />
      <div
        className="absolute inset-0 lg:hidden pointer-events-none"
        style={{
          background:
            'linear-gradient(rgba(34,12,22,0.5) 0%, rgba(34,12,22,0.18) 35%, rgba(20,7,14,0.38) 70%, rgba(15,6,11,0.7) 100%)',
        }}
      />

      {/* ── Mobile header: logo centré + tagline ─────────────────────── */}
      <div className="relative z-10 lg:hidden flex flex-col items-center text-center gap-7 px-[22px] pt-[72px] pb-[32px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://res.cloudinary.com/dadvrspox/image/upload/v1781796191/logo_light_kcub6h.svg"
          alt="Wedly"
          style={{ height: '44px', width: 'auto' }}
        />
        {/* Séparateur décoratif */}
        <div className="flex items-center justify-center gap-3 w-full">
          <span className="h-px w-[60px] bg-[rgba(255,246,237,0.22)]" />
          <span className="h-px w-[60px] bg-[rgba(255,246,237,0.22)]" />
        </div>
        <h2
          className="font-cormorant italic font-medium text-[30px] leading-[1.15] text-creme tracking-[0.005em] max-w-[260px]"
          style={{ textShadow: 'rgba(34,12,22,0.5) 0px 2px 24px' }}
        >
          Chaque mariage mérite les meilleurs.
        </h2>
      </div>

      {/* ── Desktop panneau gauche ────────────────────────────────────── */}
      <div
        className="hidden lg:flex w-[52%] relative flex-col items-center justify-center overflow-hidden bg-bordeaux bg-cover bg-center"
      >
        {/* Overlay */}
        <div
          className="absolute inset-0"
          style={{ background: 'rgba(34,12,22,0.44)' }}
        />

        {/* Contenu centré */}
        <div className="relative z-10 flex flex-col items-center text-center px-14 gap-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://res.cloudinary.com/dadvrspox/image/upload/v1781796191/logo_light_kcub6h.svg"
            alt="Wedly"
            style={{ height: '54px', width: 'auto' }}
          />
          {/* Séparateur décoratif */}
          <div className="flex items-center justify-center gap-4 w-full">
            <span className="h-px w-[80px] bg-[rgba(255,246,237,0.25)]" />
            <span className="h-px w-[80px] bg-[rgba(255,246,237,0.25)]" />
          </div>
          <h2
            className="font-cormorant italic font-medium text-[42px] leading-[1.12] text-creme tracking-[0.005em] max-w-[340px]"
            style={{ textShadow: 'rgba(34,12,22,0.4) 0px 2px 32px' }}
          >
            Chaque mariage mérite les meilleurs.
          </h2>
        </div>

        {/* Branding bas — ancré en bas au centre */}
        <div className="absolute bottom-[48px] flex items-center gap-[14px]">
          <span className="font-manrope text-[10.5px] font-medium tracking-[0.2em] uppercase text-[rgba(255,246,237,0.45)]">
            L&apos;excellence du mariage
          </span>
        </div>
      </div>

      {/* ── Panneau formulaire ────────────────────────────────────────── */}
      <div className="relative z-10 flex-1 flex flex-col justify-end lg:justify-center lg:items-center lg:bg-creme px-[22px] pb-[36px] lg:p-0">
        <div className="w-full max-w-[420px] mx-auto lg:max-w-[400px] lg:w-[400px] rounded-[26px] border border-[rgba(255,246,237,0.16)] bg-[rgba(46,18,32,0.52)] [backdrop-filter:blur(30px)_saturate(1.1)] shadow-[0px_28px_70px_rgba(15,6,11,0.5),inset_0px_1px_0px_rgba(255,246,237,0.14)] p-[28px_24px] lg:rounded-none lg:border-0 lg:bg-transparent lg:[backdrop-filter:none] lg:shadow-none lg:p-0">
          <LoginForm redirectTo={redirectTo} shouldFlushPendingActions={shouldFlushPendingActions} />
        </div>
      </div>
      </div>
    </>
  );
}
