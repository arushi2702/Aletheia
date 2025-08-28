const BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000"

// ------------------------------
// Types
// ------------------------------
export interface Highlight {
  text: string
  bias: "high" | "medium" | "low" | "neutral"
  score: number // 0–1
  explanation: string
}

export interface ArticleAnalysisResult {
  overall_bias: string // biased / neutral
  confidence: number // always 0–100 (percentage)
  highlights: Highlight[]
  original_text: string
  neutral_text?: string
}

// ------------------------------
// Article analysis
// ------------------------------
export async function analyzeArticle(input: string): Promise<ArticleAnalysisResult> {
  const fd = new FormData()
  fd.append("text", input) // backend expects "text"

  const res = await fetch(`${BASE}/analyze/article`, {
    method: "POST",
    body: fd,
  })

  if (!res.ok) throw new Error(await res.text())
  const data = await res.json()

  // ✅ Normalize confidence to percentage
  const rawConfidence = Number(data.confidence_score)
  const confidence =
    isNaN(rawConfidence) ? 0 : rawConfidence <= 1 ? rawConfidence * 100 : rawConfidence

  return {
    overall_bias: data.overall_bias || "neutral",
    confidence: Math.round(confidence),
    highlights: (data.highlights || []).map((h: any) => ({
      text: h.sentence,
      bias: h.bias || (h.score > 0.6 ? "high" : h.score > 0.3 ? "medium" : "low"),
      score: h.score,
      explanation: h.explanation,
    })),
    original_text: input,
  }
}

// ------------------------------
// Rephrase article
// ------------------------------
export async function rephraseArticle(
  text: string
): Promise<{ neutral_text: string }> {
  const res = await fetch(`${BASE}/rephrase`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }), // ✅ backend requires "text"
  })

  if (!res.ok) throw new Error(await res.text())
  const data = await res.json()

  return {
    neutral_text: data.neutral_text || "",
  }
}

// ------------------------------
// Image analysis (CNN)
// ------------------------------
export async function analyzeImage(file: File) {
  const fd = new FormData()
  fd.append("file", file)

  const res = await fetch(`${BASE}/analyze/image`, {
    method: "POST",
    body: fd,
  })

  if (!res.ok) throw new Error(await res.text())
  const data = await res.json()

  // ✅ Normalize confidence
  const score = Number(data.score)
  return {
    label: data.label || "Unknown",
    score: isNaN(score) ? 0 : score <= 1 ? score : score / 100,
  }
}

// ------------------------------
// Video analysis (YOLO/ViT)
// ------------------------------
export async function analyzeVideo(file: File) {
  const fd = new FormData()
  fd.append("file", file)

  const res = await fetch(`${BASE}/analyze/video`, {
    method: "POST",
    body: fd,
  })

  if (!res.ok) throw new Error(await res.text())
  const data = await res.json()

  // ✅ Normalize video score
  const score = Number(data.score)
  return {
    ...data,
    score: isNaN(score) ? 0 : score <= 1 ? score : score / 100,
  }
}

// ------------------------------
// Video job status check
// ------------------------------
export async function getJob(jobId: string) {
  const res = await fetch(`${BASE}/analyze/video/status/${jobId}`)
  if (!res.ok) throw new Error(await res.text())
  const data = await res.json()

  // ✅ Normalize score inside job result
  if (data.result?.score !== undefined) {
    const score = Number(data.result.score)
    data.result.score = isNaN(score) ? 0 : score <= 1 ? score : score / 100
  }

  return data
}
