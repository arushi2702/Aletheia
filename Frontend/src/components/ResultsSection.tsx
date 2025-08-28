import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Highlight } from "@/lib/api"

interface ResultsSectionProps {
  result: {
    type: "article" | "image" | "video" | null
    verdict: string
    confidence: number
    highlights?: Highlight[]
    original_text?: string
  } | null
  rephraseArticle: (text: string) => Promise<{
    neutral_text: string
  }>
}

export default function ResultsSection({
  result,
  rephraseArticle,
}: ResultsSectionProps) {
  const [open, setOpen] = useState(false)
  const [neutralText, setNeutralText] = useState<string | null>(null)

  if (!result) return null

  const handleRephraseClick = async () => {
    if (!result.original_text) return
    try {
      const res = await rephraseArticle(result.original_text)
      setNeutralText(res.neutral_text)
      setOpen(true)
    } catch (err) {
      console.error(err)
      alert("Error rephrasing article.")
    }
  }

  return (
    <section id="results" className="py-10 px-6 flex justify-center">
      <Card className="w-full max-w-2xl shadow-lg rounded-2xl">
        <CardContent className="space-y-6">
          <h2 className="text-2xl font-bold text-center">
            {result.type === "article"
              ? "Article Analysis Result"
              : result.type === "image"
              ? "Image Analysis Result"
              : "Video Analysis Result"}
          </h2>

          {/* Verdict */}
          <p className="text-lg text-gray-700">Verdict: {result.verdict}</p>

          {/* Confidence Score */}
          <div>
            <p className="text-sm font-medium mb-2">Confidence Score</p>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div
                className="bg-blue-500 h-4 rounded-full transition-all"
                style={{ width: `${result.confidence}%` }}
              />
            </div>
            <p className="text-sm text-gray-600 mt-1">
              {result.confidence}%
            </p>
          </div>

          {/* Highlights (only for article) */}
          {result.type === "article" && result.highlights && (
            <div>
              <h3 className="font-semibold mb-2">Highlights</h3>
              <ul className="space-y-1 text-sm">
                {result.highlights.map((h, i) => (
                  <li key={i}>
                    <span
                      className={
                        h.bias === "high"
                          ? "bg-red-300 px-1 rounded"
                          : h.bias === "medium"
                          ? "bg-yellow-200 px-1 rounded"
                          : h.bias === "low"
                          ? "bg-green-200 px-1 rounded"
                          : ""
                      }
                    >
                      {h.text}
                    </span>{" "}
                    – {Math.round(h.score * 100)}%
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Rephrase Button (only for article) */}
          {result.type === "article" && (
            <div className="flex justify-center">
              <Button onClick={handleRephraseClick} className="mt-4">
                Rephrase Article
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ✅ Rephrase Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Rephrased Article</DialogTitle>
            <DialogDescription>
              Compare the original text with the neutralized rewrite.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4 max-h-[70vh] overflow-y-auto">
            {/* Original with highlights */}
            <div>
              <h3 className="font-semibold mb-2">Original</h3>
              <div className="p-3 border rounded-lg text-sm space-y-2">
                {result.highlights && result.original_text ? (
                  result.original_text.split(/(\. |\n)/).map((chunk, i) => {
                    const match = result.highlights?.find(
                      (h) => chunk.includes(h.text)
                    )
                    return (
                      <span
                        key={i}
                        className={
                          match
                            ? match.bias === "high"
                              ? "bg-red-300 px-1 rounded"
                              : match.bias === "medium"
                              ? "bg-yellow-200 px-1 rounded"
                              : "bg-green-200 px-1 rounded"
                            : ""
                        }
                      >
                        {chunk}
                      </span>
                    )
                  })
                ) : (
                  <p className="text-gray-500 italic">No highlights available</p>
                )}
              </div>
            </div>

            {/* Neutralized version */}
            <div>
              <h3 className="font-semibold mb-2">Neutralized</h3>
              <div className="p-3 border rounded-lg text-sm whitespace-pre-wrap">
                {neutralText ? neutralText : "Rephrasing..."}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}
