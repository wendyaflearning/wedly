"use client";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import MobileMenu from "./MobileMenu";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <header
        className="relative w-full bg-creme px-6 py-4 md:px-10 md:py-8 flex items-center justify-between"
        style={{ borderBottom: "1px solid rgba(158, 142, 133, 0.25)" }}
      >
        <Link href="/" className="shrink-0" aria-label="Wedly — accueil">
          <Image src="/logo.png" alt="Wedly" width={120} height={40} priority />
        </Link>

        {/* Desktop nav — centered absolutely */}
        <nav className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center gap-8">
          {[
            { label: "Comment ça marche", href: "#how" },
            { label: "Nos prestataires", href: "#prestataires" },
            { label: "Notre histoire", href: "#histoire" },
          ].map(({ label, href }) => (
            <a
              key={label}
              href={href}
              style={{
                fontFamily: "var(--font-dm-sans-var)",
                fontSize: "11px",
                letterSpacing: "0.12em",
                color: "rgba(41, 26, 16, 0.7)",
                textDecoration: "none",
                textTransform: "uppercase",
                fontWeight: 400,
              }}
            >
              {label}
            </a>
          ))}
        </nav>

        <p
          className="hidden md:block shrink-0"
          style={{ fontFamily: "var(--font-dm-sans-var)", fontSize: "11px", color: "rgba(41, 26, 16, 0.5)", fontStyle: "italic" }}
        >
          Lancement France · 2025 · Accès sur invitation
        </p>

        {/* Mobile hamburger */}
        <button
          className="md:hidden flex flex-col gap-[5px] p-1"
          onClick={() => setMenuOpen(true)}
          aria-label="Ouvrir le menu"
        >
          <span className="block w-6 h-px bg-texte" />
          <span className="block w-6 h-px bg-texte" />
          <span className="block w-6 h-px bg-texte" />
        </button>
      </header>

      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}
