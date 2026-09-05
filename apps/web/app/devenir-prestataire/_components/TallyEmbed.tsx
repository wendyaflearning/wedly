"use client";

import Script from "next/script";
import { useEffect, useState } from "react";

declare global {
  interface Window {
    Tally?: { loadEmbeds: () => void };
  }
}

const TALLY_EMBED_SRC =
  "https://tally.so/embed/VLXoda?alignLeft=1&hideTitle=1&transparentBackground=1&dynamicHeight=1";
const TALLY_WIDGET_SCRIPT_SRC = "https://tally.so/widgets/embed.js";

/**
 * Le script Tally met 2-4s à peupler l'iframe (widget tiers, chargé après
 * l'interactivité) : sans indicateur, la carte reste visuellement vide et
 * lit comme cassée le temps que ça charge.
 */
export default function TallyEmbed() {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    window.Tally?.loadEmbeds();
  }, []);

  return (
    <div className="relative">
      {!loaded && (
        <div
          aria-hidden="true"
          className="absolute inset-0 flex flex-col gap-4 animate-pulse"
          style={{ padding: "4px 0" }}
        >
          <div className="h-3 w-24 rounded-full" style={{ background: "rgba(78,26,50,0.10)" }} />
          <div className="h-11 w-full rounded-[13px]" style={{ background: "rgba(78,26,50,0.08)" }} />
          <div className="h-11 w-32 rounded-[13px]" style={{ background: "rgba(227,87,4,0.16)" }} />
        </div>
      )}
      <iframe
        data-tally-src={TALLY_EMBED_SRC}
        loading="lazy"
        width="100%"
        height={222}
        title="Formulaire prestataire Wedly"
        style={{ border: 0, opacity: loaded ? 1 : 0, transition: "opacity 0.3s ease-out" }}
        onLoad={(e) => {
          // Un iframe sans `src` déclenche déjà un load sur son `about:blank`
          // initial, avant même que le script Tally n'y pose la vraie URL —
          // ignorer ce premier événement, sinon le squelette disparaît avant
          // que le formulaire n'ait quoi que ce soit à montrer.
          if (e.currentTarget.src) setLoaded(true);
        }}
      />
      <Script src={TALLY_WIDGET_SCRIPT_SRC} strategy="afterInteractive" onLoad={() => window.Tally?.loadEmbeds()} />
    </div>
  );
}
