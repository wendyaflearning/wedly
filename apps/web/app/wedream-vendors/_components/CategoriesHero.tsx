import Image from "next/image";

const COUPLE_IMAGE_URL =
  "https://res.cloudinary.com/dadvrspox/image/upload/v1787060519/Ajith_Kumar_Photo_o4gyai.jpg";
const ARTISAN_IMAGE_URL =
  "https://res.cloudinary.com/dadvrspox/image/upload/v1787060488/hero_wedream_vendors_csntjc.jpg";

export default function CategoriesHero() {
  return (
    <div className="flex flex-col md:grid md:grid-cols-[45fr_55fr] md:h-[88vh] bg-creme">
      <div className="flex flex-col items-center text-center box-border px-6 pt-11 md:px-16 md:pt-[88px]">
        <p
          className="text-gris uppercase m-0 text-[10px] mb-[18px] md:text-[11px] md:mb-[22px]"
          style={{ fontFamily: "var(--font-manrope-var)", fontWeight: 600, letterSpacing: "0.22em" }}
        >
          Wedream · Prestataires
        </p>
        <h1
          className="text-texte m-0"
          style={{ fontFamily: "var(--font-cormorant-var)", fontWeight: 300, letterSpacing: "-0.02em" }}
        >
          <span className="block text-[36px] leading-[1.12] md:text-[clamp(38px,4.6vw,62px)] md:leading-[1.1]">
            Le rêve,
            <br />
            c&apos;était vous.
          </span>
          <span className="text-accent italic block text-[22px] leading-[1.2] mt-2 md:text-[clamp(38px,4.6vw,62px)] md:leading-[1.1] md:mt-[6px]">
            La suite, c&apos;est eux.
          </span>
        </h1>
        <div
          className="relative overflow-hidden mt-7 w-[140px] h-[206px] rounded-t-[70px] shadow-[0_14px_32px_rgba(41,26,16,0.18)] md:mt-auto md:w-[clamp(150px,12vw,190px)] md:h-[clamp(230px,19vw,300px)] md:rounded-t-[clamp(60px,15vw,75px)] md:border-8 md:border-creme md:shadow-[0_18px_40px_rgba(41,26,16,0.2)]"
        >
          <Image
            src={COUPLE_IMAGE_URL}
            alt="Couple — instant volé, non posé"
            fill
            className="object-cover"
            sizes="190px"
            priority
          />
        </div>
      </div>

      <div
        className="hidden md:block relative overflow-hidden w-full aspect-[4/3] mt-8 md:mt-0 md:aspect-auto md:h-full"
        style={{ backgroundColor: "#EDE1D3" }}
      >
        <Image
          src={ARTISAN_IMAGE_URL}
          alt="Mains d'un artisan en plein geste — fleuriste, traiteur ou couturière"
          fill
          className="object-cover"
          sizes="(min-width: 768px) 55vw, 100vw"
          priority
        />
        <div
          className="hidden md:block absolute inset-x-0 bottom-0 pointer-events-none"
          style={{
            height: "38%",
            background: "linear-gradient(180deg, rgba(41,26,16,0) 0%, rgba(41,26,16,0.32) 100%)",
          }}
        />
      </div>
    </div>
  );
}
