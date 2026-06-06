import rawSeoPagesData from './seoPagesData.json'
import sharedSeoPageData from './seoPageSharedData.json'

export type SeoSource = { label: string; url: string; note: string }
export type SeoRelatedLink = { href: string; label: string }

export type SeoPageData = {
  path: string
  title: string
  metaTitle?: string
  eyebrow: string
  description: string
  lastUpdated?: string
  reviewMethod?: {
    heading: string
    body: string
    checks: string[]
  }
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
  relatedLinks: SeoRelatedLink[]
  sources?: SeoSource[]
  listItems?: Array<{ href: string; label: string; description?: string }>
}

type RawSeoPageData = Omit<SeoPageData, 'relatedLinks' | 'sources'> & {
  relatedLinks?: SeoRelatedLink[]
  relatedLinkRefs?: string[]
  sources?: SeoSource[]
  sourceRefs?: string[]
}

type SharedSeoPageData = {
  sources: Record<string, SeoSource>
  relatedLinks: Record<string, SeoRelatedLink>
}

const shared = sharedSeoPageData as SharedSeoPageData

function resolveSources(page: RawSeoPageData) {
  if (page.sources) return page.sources
  return page.sourceRefs?.map((ref) => shared.sources[ref]).filter(Boolean) ?? []
}

function resolveRelatedLinks(page: RawSeoPageData) {
  if (page.relatedLinks) return page.relatedLinks
  return page.relatedLinkRefs?.map((ref) => shared.relatedLinks[ref]).filter(Boolean) ?? []
}

export const seoPages = (rawSeoPagesData as RawSeoPageData[]).map((page) => ({
  ...page,
  sources: resolveSources(page),
  relatedLinks: resolveRelatedLinks(page),
})) satisfies SeoPageData[]
