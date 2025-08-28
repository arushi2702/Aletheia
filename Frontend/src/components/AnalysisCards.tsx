"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, Image, Video, ArrowRight, Upload, Link } from "lucide-react"
import { useRef, useState } from "react"
import {
  analyzeArticle,
  analyzeImage,
  analyzeVideo,
  getJob,
  rephraseArticle,
} from "@/lib/api"
import ResultsSection from "./ResultsSection"

interface Highlight {
  text: string
  bias: "high" | "medium" | "low" | "neutral"
  score: number
  explanation: string
}

interface ArticleResult {
  type: "article"
  verdict: string
  confidence: number
  original_text: string
  highlights: Highlight[]
  neutral_text?: string
}

interface MediaResult {
  type: "image" | "video"
  verdict: string
  confidence: number
}

type Result = ArticleResult | MediaResult

interface AnalysisCardsProps {
  scrollToSection: (id: string) => void
}

const AnalysisCards: React.FC<AnalysisCardsProps> = ({ scrollToSection }) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const [result, setResult] = useState<Result | null>(null)
  const [loading, setLoading] = useState(false)

  // Handle Article Analysis
  const handleArticleAnalysis = async () => {
    const input = prompt("Enter article URL or text:")
    if (!input) return
    setLoading(true)
    try {
      const res = await analyzeArticle(input)
      setResult({
        type: "article",
        verdict: `Overall bias: ${res.overall_bias}`,
        confidence: res.confidence,
        original_text: res.original_text,
        highlights: res.highlights || [],
      })
      scrollToSection("results")
    } catch (err) {
      console.error(err)
      alert("Error analyzing article.")
    } finally {
      setLoading(false)
    }
  }

  // Handle Image/Video Upload
  const handleFileUpload = (fileType: "image" | "video") => {
    if (!fileInputRef.current) return
    fileInputRef.current.click()
    fileInputRef.current.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      setLoading(true)
      try {
        if (fileType === "image") {
          const res = await analyzeImage(file)
          setResult({
            type: "image",
            verdict: `Detected label: ${res.label}`,
            confidence: Math.round(res.score * 100),
          })
          scrollToSection("results")
        } else {
          const jobRes = await analyzeVideo(file)
          const jobStatus = await getJob(jobRes.job_id)

          if (jobStatus.result) {
            setResult({
              type: "video",
              verdict: `Video analysis: ${jobStatus.result.label || "Unknown"}`,
              confidence: Math.round((jobStatus.result.score || 0) * 100),
            })
          } else {
            setResult({
              type: "video",
              verdict: "Processing video... please try again shortly.",
              confidence: 0,
            })
          }
          scrollToSection("results")
        }
      } catch (err) {
        console.error(err)
        alert(`Error analyzing ${fileType}.`)
      } finally {
        setLoading(false)
      }
    }
  }

  // Hook up to /rephrase endpoint
  const handleRephrase = async (text: string) => {
    try {
      const res = await rephraseArticle(text)
      if (result && result.type === "article") {
        setResult({
          ...result,
          neutral_text: res.neutral_text,
          highlights: res.highlights || result.highlights,
        })
      }
      return { neutral_text: res.neutral_text }
    } catch (err) {
      console.error(err)
      alert("Error rephrasing article.")
      return { neutral_text: "" }
    }
  }

  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl md:text-4xl font-bold">
            Comprehensive Media Analysis
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Choose your analysis type and get instant insights.
          </p>
        </div>

        <input ref={fileInputRef} type="file" className="hidden" />

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Article Card */}
          <Card className="card-interactive group">
            <div className="space-y-6">
              <div className="space-y-3">
                <div className="w-12 h-12 bg-gradient-brand rounded-lg flex items-center justify-center">
                  <FileText className="h-6 w-6 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-semibold">Article Analysis</h3>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                Paste any news article URL or text to detect bias, emotional
                language, and accuracy.
              </p>
              <div className="flex items-center space-x-2 text-sm text-brand-primary">
                <Link className="h-4 w-4" />
                <span>URL or Text</span>
              </div>
              <Button
                className="w-full"
                variant="outline"
                onClick={handleArticleAnalysis}
                disabled={loading}
              >
                {loading ? "Processing..." : "Analyze Article"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </Card>

          {/* Image Card */}
          <Card className="card-interactive group">
            <div className="space-y-6">
              <div className="space-y-3">
                <div className="w-12 h-12 bg-gradient-brand rounded-lg flex items-center justify-center">
                  <Image className="h-6 w-6 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-semibold">Image Verification</h3>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                Upload images to detect deepfakes or manipulations.
              </p>
              <div className="flex items-center space-x-2 text-sm text-brand-primary">
                <Upload className="h-4 w-4" />
                <span>Upload Image</span>
              </div>
              <Button
                className="w-full"
                variant="outline"
                onClick={() => handleFileUpload("image")}
                disabled={loading}
              >
                {loading ? "Processing..." : "Check Image"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </Card>

          {/* Video Card */}
          <Card className="card-interactive group">
            <div className="space-y-6">
              <div className="space-y-3">
                <div className="w-12 h-12 bg-gradient-brand rounded-lg flex items-center justify-center">
                  <Video className="h-6 w-6 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-semibold">Video Scanning</h3>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                Scan videos for deepfakes and visual inconsistencies.
              </p>
              <div className="flex items-center space-x-2 text-sm text-brand-primary">
                <Upload className="h-4 w-4" />
                <span>Upload Video</span>
              </div>
              <Button
                className="w-full"
                variant="outline"
                onClick={() => handleFileUpload("video")}
                disabled={loading}
              >
                {loading ? "Processing..." : "Scan Video"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* ✅ Unified results renderer */}
      {result && (
        <ResultsSection result={result} rephraseArticle={handleRephrase} />
      )}
    </section>
  )
}

export default AnalysisCards
