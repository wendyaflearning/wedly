"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import MobileMenu from "./MobileMenu";

interface NavbarProps {
  /**
   * `scrollAware` : glass bordeaux transparent tant que la navbar est posée sur
   * un hero sombre, puis bascule en glass crème une fois le hero dépassé.
   * `static` : glass crème partout, pour les pages sans hero sombre en tête.
   */
  variant?: "scrollAware" | "static";
  links?: { label: string; href: string }[];
  /**
   * Force l'état bordeaux/crème indépendamment du scroll — pour un contexte
   * (ex. l'onboarding couple) où le fond change par étape plutôt qu'au
   * défilement.
   */
  forceState?: "dark" | "light";
  /** `false` : pas de `position: sticky` propre, pour l'empiler avec une
   * autre rangée (ex. le curseur de progression de l'onboarding) sous un
   * seul conteneur sticky commun plutôt que deux en concurrence. */
  sticky?: boolean;
}

// "Comment ça marche" est un chemin absolu vers l'ancre home (`/#how`) : cette
// section n'existe que sur `/`, un lien relatif (`#how`) ne ferait que
// changer le hash de la page courante sans jamais y naviguer quand la navbar
// est affichée ailleurs. "Wedream" pointe vers la vraie page Wedream, pas
// vers le teaser de la home.
const DEFAULT_LINKS = [
  { label: "Wedream", href: "/wedream-vendors" },
  { label: "Comment ça marche", href: "/#how" },
];

const LOGO_DARK = "/logo-dark.svg";
const LOGO_LIGHT = "https://res.cloudinary.com/dadvrspox/image/upload/v1781796191/logo_light_kcub6h.svg";

/** Distance de scroll (px) au-delà de laquelle la navbar quitte le hero sombre. */
const SCROLL_THRESHOLD = 80;

export default function Navbar({ variant = "static", links = DEFAULT_LINKS, forceState, sticky = true }: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isOverDarkHero, setIsOverDarkHero] = useState(variant === "scrollAware");

  useEffect(() => {
    if (variant !== "scrollAware" || forceState) return;

    function handleScroll() {
      setIsOverDarkHero(window.scrollY < SCROLL_THRESHOLD);
    }

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [variant, forceState]);

  const isDark = forceState ? forceState === "dark" : variant === "scrollAware" && isOverDarkHero;

  // Bordeaux quasi-plein (pas le glass dilué d'avant) : une séparation nette
  // avec le hero plutôt qu'un flou qui délave la couleur et fait ressortir les
  // artefacts de détourage du logo clair sur un fond instable.
  const navBg = isDark ? "rgba(78,26,50,0.94)" : "rgba(255,246,237,0.6)";
  const navBorder = isDark ? "rgba(255,246,237,0.18)" : "rgba(78,26,50,0.10)";
  const navText = isDark ? "var(--color-creme)" : "var(--color-bordeaux)";
  const logoSrc = isDark ? LOGO_LIGHT : LOGO_DARK;

  return (
    <>
      <header
        className={`${sticky ? "sticky top-0 z-30" : ""} w-full flex items-center justify-between px-6 py-4 md:px-10 transition-colors duration-300`}
        style={{
          backgroundColor: navBg,
          backdropFilter: isDark ? "none" : "blur(24px)",
          WebkitBackdropFilter: isDark ? "none" : "blur(24px)",
          borderBottom: `1px solid ${navBorder}`,
        }}
      >
        <Link href="/" className="shrink-0" aria-label="Wedly, accueil">
          <Image src={logoSrc} alt="Wedly" width={110} height={36} priority unoptimized={isDark} style={{ height: "34px", width: "auto" }} />
        </Link>

        <nav className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center gap-8">
          {links.map(({ label, href }) => (
            <a
              key={label}
              href={href}
              style={{
                fontFamily: "var(--font-dm-sans-var)",
                fontSize: "13px",
                color: navText,
                textDecoration: "none",
                fontWeight: 400,
              }}
            >
              {label}
            </a>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-6">
          <Link
            href="/couple-onboarding"
            style={{ fontFamily: "var(--font-dm-sans-var)", fontSize: "13px", color: navText, textDecoration: "none" }}
          >
            Inscription
          </Link>
          <Link
            href="/login"
            style={{ fontFamily: "var(--font-dm-sans-var)", fontSize: "13px", color: navText, textDecoration: "none" }}
          >
            Connexion
          </Link>
        </div>

        <button
          className="md:hidden flex flex-col gap-[5px] p-1"
          onClick={() => setMenuOpen(true)}
          aria-label="Ouvrir le menu"
        >
          <span className="block w-6 h-px" style={{ backgroundColor: navText }} />
          <span className="block w-6 h-px" style={{ backgroundColor: navText }} />
          <span className="block w-6 h-px" style={{ backgroundColor: navText }} />
        </button>
      </header>

      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} links={links} />
    </>
  );
}
