import seoPagesData from './seoPagesData.json'

export type SeoPageData = {
  path: string
  title: string
  eyebrow: string
  description: string
  sections: Array<{ heading: string; body: string }>
  checklist: string[]
  examples: Array<{ title: string; body: string }>
  faqs: Array<{ question: string; answer: string }>
  relatedLinks: Array<{ href: string; label: string }>
}

export const seoPages = seoPagesData as SeoPageData[]
