import Navbar from "./components/Navbar";
import HeroSection from "./components/HeroSection";
import HowSection from "./components/HowSection";
import BifurcationSection from "./components/BifurcationSection";

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
