import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import AnalysisCards from "@/components/AnalysisCards";
import ResultsSection from "@/components/ResultsSection";
import Footer from "@/components/Footer";

function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <HeroSection />
        <AnalysisCards scrollToSection={() => {}} />
        <ResultsSection />
      </main>
      <Footer />
    </div>
  );
}

export default App;
