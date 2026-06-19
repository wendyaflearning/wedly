import Navbar from "./_components/Navbar";
import HeroSection from "./_components/HeroSection";
import HowSection from "./_components/HowSection";
import PersonaSection from "./_components/PersonaSection";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <HeroSection />
      <HowSection />
      <PersonaSection />
    </div>
  );
}
