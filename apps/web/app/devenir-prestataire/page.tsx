import type { Metadata } from "next";
import Navbar from "../_components/Navbar";
import Footer from "../_components/Footer";
import TallyEmbed from "./_components/TallyEmbed";

export const metadata: Metadata = {
  title: "Devenir prestataire | Wedly",
  description: "Rejoignez Wedly et laissez les couples qui vous ressemblent venir à vous.",
};

export default function DevenirPrestatairePage() {
  return (
    <div className="bg-creme min-h-screen flex flex-col" style={{ fontFamily: "var(--font-manrope-var)" }}>
      <Navbar />

      <div
        className="relative flex-1 flex flex-col items-center justify-center px-6 py-20 md:py-28 overflow-hidden"
        style={{ background: "linear-gradient(165deg,#FFF6ED 0%, #F6EDE2 60%, #F0E4D4 100%)" }}
      >
        <div
          aria-hidden="true"
          className="absolute -top-40 -left-36 w-[420px] h-[420px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(78,26,50,0.16), transparent 70%)", filter: "blur(80px)" }}
        />
        <div
          aria-hidden="true"
          className="absolute -bottom-44 -right-36 w-[480px] h-[480px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(227,87,4,0.08), transparent 70%)", filter: "blur(90px)" }}
        />

        <div className="relative z-10 w-full max-w-[640px] flex flex-col items-center gap-9 md:gap-10">
          <div className="flex flex-col items-center gap-4 text-center">
            <h1
              style={{
                fontFamily: "var(--font-cormorant-var)",
                fontWeight: 300,
                fontSize: "clamp(28px, 4.5vw, 44px)",
                lineHeight: 1.15,
                color: "var(--color-bordeaux)",
                letterSpacing: "-0.01em",
              }}
            >
              Faites partie de{" "}
              <em style={{ fontStyle: "italic", fontWeight: 600, color: "var(--color-accent)" }}>
                l&apos;aventure Wedly
              </em>
              .
            </h1>
            <div className="w-10 h-0.5" style={{ background: "var(--color-bordeaux)" }} />
            <p
              style={{
                fontFamily: "var(--font-dm-sans-var)",
                fontSize: "15px",
                lineHeight: 1.55,
                color: "rgba(78,26,50,0.68)",
                maxWidth: "440px",
              }}
            >
              Vous êtes prestataire de mariage ? Laissez-nous quelques informations
              sur votre activité, on revient vers vous rapidement.
            </p>
          </div>

          <div
            className="w-full rounded-[20px] p-7 md:p-9"
            style={{
              border: "1px solid rgba(78,26,50,0.16)",
              background: "rgba(255,246,237,0.55)",
              backdropFilter: "blur(28px)",
              WebkitBackdropFilter: "blur(28px)",
              boxShadow: "0 24px 60px rgba(78,26,50,0.10)",
            }}
          >
            <TallyEmbed />
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
