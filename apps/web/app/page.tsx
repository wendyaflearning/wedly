import Navbar from "./_components/Navbar";
import HeroSection from "./_components/HeroSection";
import HowSection from "./_components/HowSection";
import BifurcationSection from "./_components/BifurcationSection";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <HeroSection />
      <HowSection />
      <BifurcationSection />
    </div>
  );
}
