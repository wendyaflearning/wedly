import Navbar from "./components/Navbar";
import HeroSection from "./components/HeroSection";
import HowSection from "./components/HowSection";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <HeroSection />
      <HowSection />
    </div>
  );
}
