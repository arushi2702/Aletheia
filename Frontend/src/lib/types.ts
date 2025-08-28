export type Weight = { token: string; weight: number }

export type BiasedSpan = {
  start: number
  end: number
  sentence: string
  score: number // 0..1 bias confidence
  explanation?: Weight[] // LIME/SHAP weights (optional until integrated)
}

export type ArticleAnalysisResult = {
  url: string
  text: string
  spans: BiasedSpan[]
  overall_score?: number // from article_model
  themes?: string[] // optional tags
}

export type ImageResult = { label: 'real' | 'manipulated'; score: number }
export type VideoResult = { label: 'real' | 'deepfake'; score: number }
