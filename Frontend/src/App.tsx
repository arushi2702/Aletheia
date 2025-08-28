import { useState } from "react"
import Header from "@/components/Header"
import HeroSection from "@/components/HeroSection"
import AnalysisCards from "@/components/AnalysisCards"
import ResultsSection from "@/components/ResultsSection"
import Footer from "@/components/Footer"
import { Highlight } from "@/lib/api"

function App() {
  const [result, setResult] = useState<{
    type: "article" | "image" | "video" | null
    verdict: string
    confidence: number
    highlights?: Highlight[]
    original_text?: string
  } | null>(null)

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: "smooth" })
  }

  // 🔹 Call backend for analysis
  const analyzeContent = async (type: "article" | "image" | "video") => {
    try {
      let res
      if (type === "article") {
        res = await fetch("http://localhost:8080/analyze/article", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            text: "The so-called reform proposed by the government is nothing more than a shameless power grab. These corrupt politicians, who have never cared about ordinary citizens, are now trying to strip people of their basic rights under the false pretense of progress.",
          }),
        })
      } else if (type === "image") {
        // TODO: add actual image upload logic
        setResult({
          type,
          verdict: "The image appears to have a neutral presentation.",
          confidence: 65,
        })
        scrollToSection("results")
        return
      } else {
        // TODO: add actual video upload logic
        setResult({
          type,
          verdict: "The video demonstrates subtle ideological bias.",
          confidence: 74,
        })
        scrollToSection("results")
        return
      }

      if (!res.ok) throw new Error("Analysis failed")
      const data = await res.json()

      setResult({
        type,
        verdict: `Overall bias: ${data.overall_bias}`,
        confidence: data.confidence_pct,
        highlights: data.highlights,
        original_text: data.original_text,
      })
      scrollToSection("results")
    } catch (err) {
      console.error("Analysis error:", err)
      alert("Error analyzing content")
    }
  }

  // 🔹 Call backend for rephrasing
  const rephraseArticle = async (text: string) => {
    try {
      const res = await fetch("http://localhost:8080/rephrase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      })
      if (!res.ok) throw new Error("Failed to rephrase")
      return await res.json()
    } catch (err) {
      console.error("Rephrase error:", err)
      throw err
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <HeroSection scrollToSection={scrollToSection} />
        <AnalysisCards
          scrollToSection={scrollToSection}
          analyzeContent={analyzeContent}
        />
        {result && (
          <ResultsSection
            result={result}
            rephraseArticle={rephraseArticle}
          />
        )}
      </main>
      <Footer />
    </div>
  )
}

export default App
