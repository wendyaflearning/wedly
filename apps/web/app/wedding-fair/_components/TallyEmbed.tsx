"use client";

import Script from "next/script";
import { useEffect } from "react";

declare global {
  interface Window {
    Tally?: { loadEmbeds: () => void };
  }
}

const TALLY_EMBED_SRC =
  "https://tally.so/embed/VLXoda?alignLeft=1&hideTitle=1&transparentBackground=1&dynamicHeight=1";
const TALLY_WIDGET_SCRIPT_SRC = "https://tally.so/widgets/embed.js";

export default function TallyEmbed() {
  useEffect(() => {
    window.Tally?.loadEmbeds();
  }, []);

  return (
    <>
      <iframe
        data-tally-src={TALLY_EMBED_SRC}
        loading="lazy"
        width="100%"
        height={222}
        title="Salon du Mariage 2026 — Capture couple x prestataire"
        style={{ border: 0 }}
      />
      <Script src={TALLY_WIDGET_SCRIPT_SRC} strategy="afterInteractive" onLoad={() => window.Tally?.loadEmbeds()} />
    </>
  );
}
