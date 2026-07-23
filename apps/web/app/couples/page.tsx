import type { Metadata } from "next";
import Navbar from "../_components/Navbar";
import HeroWedream from "./_components/HeroWedream";
import PromiseSection from "./_components/PromiseSection";
import PillarsSection from "./_components/PillarsSection";
import StorySection from "./_components/StorySection";
import ClosingSection from "./_components/ClosingSection";

export const metadata: Metadata = {
  title: "Wedly — Pour les couples",
  description: "Wedream, WedPlan, WedWallet : tout ce dont vous avez besoin pour organiser votre mariage, à deux.",
};

export default function CouplesPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <HeroWedream />
      <PromiseSection />
      <PillarsSection />
      <StorySection />
      <ClosingSection />
    </div>
  );
}
