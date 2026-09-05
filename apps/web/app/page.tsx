import { PendingActionsBadge } from "@/components/wedream/PendingActionsBadge";
import { PendingActionsProvider } from "@/components/wedream/PendingActionsProvider";
import { fetchInitialCtaStatuses } from "@/lib/couple-cta-status";
import { fetchWedreamShowcaseImages } from "@/lib/wedream-gallery";
import Navbar from "./_components/Navbar";
import Hero from "./_components/Hero";
import TransitionSection from "./_components/TransitionSection";
import WedreamShowcase from "./_components/WedreamShowcase";
import HowSection from "./_components/HowSection";
import Footer from "./_components/Footer";
import ScrollReveal from "./_components/ScrollReveal";

const SHOWCASE_SIZE = 10;

export default async function Home() {
  const [showcaseItems, initialCtaStatuses] = await Promise.all([
    fetchWedreamShowcaseImages(SHOWCASE_SIZE),
    fetchInitialCtaStatuses(),
  ]);

  return (
    <PendingActionsProvider>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <Hero />
        <ScrollReveal>
          <TransitionSection />
        </ScrollReveal>
        <ScrollReveal>
          <WedreamShowcase items={showcaseItems} initialCtaStatuses={initialCtaStatuses} />
        </ScrollReveal>
        <ScrollReveal>
          <HowSection />
        </ScrollReveal>
        <ScrollReveal>
          <Footer />
        </ScrollReveal>
      </div>
      <PendingActionsBadge />
    </PendingActionsProvider>
  );
}
