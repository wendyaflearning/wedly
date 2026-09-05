"use client";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

const LOGO_LIGHT = "https://res.cloudinary.com/dadvrspox/image/upload/v1781796191/logo_light_kcub6h.svg";

export default function Footer() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  return (
    <footer className="w-full bg-bordeaux px-6 md:px-16 py-14 md:py-20 flex flex-col gap-11">
      <Image src={LOGO_LIGHT} alt="Wedly" width={130} height={64} unoptimized style={{ height: "48px", width: "auto" }} />

      <div className="flex flex-col gap-4 max-w-[420px]">
        {!submitted ? (
          <>
            <p
              style={{ fontFamily: "var(--font-dm-sans-var)", fontWeight: 500, fontSize: "14px", color: "var(--color-creme)" }}
            >
              Nos plus belles trouvailles, dans votre boîte mail.
            </p>
            <form
              className="flex flex-col md:flex-row gap-2.5"
              onSubmit={(e) => {
                e.preventDefault();
                if (email) setSubmitted(true);
              }}
            >
              <input
                type="email"
                required
                placeholder="Adresse e-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 outline-none"
                style={{
                  padding: "13px 16px",
                  borderRadius: "13px",
                  border: "1px solid rgba(255,246,237,0.28)",
                  background: "rgba(255,246,237,0.08)",
                  color: "var(--color-creme)",
                  fontFamily: "var(--font-dm-sans-var)",
                  fontSize: "14px",
                }}
              />
              <button
                type="submit"
                style={{
                  padding: "13px 26px",
                  background: "transparent",
                  border: "1px solid rgba(255,246,237,0.45)",
                  borderRadius: "13px",
                  fontFamily: "var(--font-dm-sans-var)",
                  fontWeight: 500,
                  fontSize: "12px",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "var(--color-creme)",
                  whiteSpace: "nowrap",
                }}
              >
                S&apos;inscrire
              </button>
            </form>
          </>
        ) : (
          <p
            style={{ fontFamily: "var(--font-cormorant-var)", fontStyle: "italic", fontWeight: 300, fontSize: "20px", color: "var(--color-creme)" }}
          >
            Merci, on reste en contact.
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-14">
        <div className="flex flex-col gap-3">
          <span
            style={{ fontFamily: "var(--font-manrope-var)", fontWeight: 600, fontSize: "10px", letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,246,237,0.5)" }}
          >
            En savoir plus
          </span>
          <Link href="/#how" style={{ fontFamily: "var(--font-dm-sans-var)", fontSize: "13px", color: "var(--color-creme)", textDecoration: "none" }}>
            Comment ça marche
          </Link>
          <Link href="/wedream-vendors" style={{ fontFamily: "var(--font-dm-sans-var)", fontSize: "13px", color: "var(--color-creme)", textDecoration: "none" }}>
            Wedream
          </Link>
        </div>
        <div className="flex flex-col gap-3">
          <span
            style={{ fontFamily: "var(--font-manrope-var)", fontWeight: 600, fontSize: "10px", letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,246,237,0.5)" }}
          >
            Suivez-nous
          </span>
          <a
            href="https://www.instagram.com/wedlyapps/"
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontFamily: "var(--font-dm-sans-var)", fontSize: "13px", color: "var(--color-creme)", textDecoration: "none" }}
          >
            Instagram
          </a>
          <a
            href="https://tiktok.com/@wedlyapps"
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontFamily: "var(--font-dm-sans-var)", fontSize: "13px", color: "var(--color-creme)", textDecoration: "none" }}
          >
            TikTok
          </a>
        </div>
      </div>

      <p style={{ fontFamily: "var(--font-cormorant-var)", fontStyle: "italic", fontWeight: 300, fontSize: "13px", color: "rgba(255,246,237,0.45)" }}>
        © Wedly 2026, pensé en France, à deux.
      </p>
    </footer>
  );
}
