import seoPagesData from './seoPagesData.json'

export type SeoPageData = {
  path: string
  title: string
  eyebrow: string
  description: string
  toolCta?: {
    eyebrow: string
    title: string
    body: string
    primaryLabel: string
    secondaryLabel?: string
    secondaryHref?: string
  }
  sections: Array<{ heading: string; body: string }>
  contentBlocks?: Array<{
    heading: string
    body: string
    bullets?: string[]
    ctaLabel?: string
    ctaHref?: string
  }>
  checklist: string[]
  examples: Array<{ title: string; body: string }>
  faqs: Array<{ question: string; answer: string }>
  relatedLinks: Array<{ href: string; label: string }>
  sources?: Array<{ label: string; url: string; note: string }>
}

export const seoPages = seoPagesData as SeoPageData[]
