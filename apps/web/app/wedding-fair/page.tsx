import type { Metadata } from "next";
import HeroSection from "./_components/HeroSection";
import ObservationSection from "./_components/ObservationSection";
import TimelineSection from "./_components/TimelineSection";
import FormSection from "./_components/FormSection";

export const metadata: Metadata = {
  title: "Wedly — Salon du Mariage, 5-6 septembre 2026",
  description:
    "Rencontrez Wedly au Salon du Mariage les 5 et 6 septembre 2026 : une nouvelle façon de trouver ses prestataires, pour les couples comme pour les professionnels.",
};

export default function WeddingFairPage() {
  return (
    <div className="bg-creme" style={{ minHeight: "100vh" }}>
      <HeroSection />
      <ObservationSection />
      <TimelineSection />
      <FormSection />
    </div>
  );
}
