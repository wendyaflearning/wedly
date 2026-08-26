import type { Metadata } from "next";
import WedreamHero from "./_components/WedreamHero";
import WedreamConcept from "./_components/WedreamConcept";

export const metadata: Metadata = {
  title: "Wedream — Wedly",
  description: "De l'inspiration à la réalité en un clic : découvrez Wedream.",
};

export default function WedreamPage() {
  return (
    <div className="h-svh md:h-screen overflow-y-scroll snap-y snap-proximity">
      <WedreamHero />
      <WedreamConcept />
    </div>
  );
}
