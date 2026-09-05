"use client";
import { useEffect, useRef, useState } from "react";

/**
 * Fait apparaître son contenu (fondu + léger décalage vertical) quand il
 * entre dans le viewport au scroll, façon Squarespace — plutôt que tout
 * afficher d'un bloc au chargement. Se déclenche une seule fois.
 */
export default function ScrollReveal({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  // Une fois l'animation terminée, le `transform` est complètement retiré
  // (pas juste mis à translateY(0)) : un transform actif — même à zéro —
  // fait de ce wrapper le containing block des descendants `position: fixed`
  // (la Lightbox, la modale de compte rendues par WedreamShowcase), qui se
  // retrouvent alors coincés dans la section au lieu de couvrir l'écran.
  const [settled, setSettled] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -60px 0px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(() => setSettled(true), 800);
    return () => clearTimeout(timer);
  }, [visible]);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: settled ? undefined : visible ? "translateY(0)" : "translateY(28px)",
        transition: "opacity 0.8s ease-out, transform 0.8s ease-out",
      }}
    >
      {children}
    </div>
  );
}
