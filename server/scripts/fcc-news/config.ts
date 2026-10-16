/**
 * freeCodeCamp News Archiver — shared configuration.
 *
 * freeCodeCamp.org/news is a Ghost-powered publication. Every tag page
 * (e.g. /news/tag/programming/2/) is server-side rendered and lists 25
 * posts per page, so the full archive can be rebuilt from the tag
 * pagination alone. All shared posts MUST carry source attribution.
 */

export const FCC_NEWS_BASE = 'https://www.freecodecamp.org/news';

export interface TagConfig {
  /** URL slug, e.g. "programming" -> /news/tag/programming/ */
  slug: string;
  /** Display label as shown on the site. */
  label: string;
  /** Expected total post count shown next to the tag on the site. */
  count: number;
}

/**
 * Tags requested by the archive owner (parsed from
 * https://www.freecodecamp.org/news/tag/programming/2/ sidebar).
 */
export const DEFAULT_TAGS: TagConfig[] = [
  { slug: 'programming', label: 'General Programming', count: 2773 },
  { slug: 'tech', label: 'tech', count: 2736 },
  { slug: 'javascript', label: 'JavaScript', count: 2594 },
  { slug: 'web-development', label: 'Web Development', count: 2090 },
  { slug: 'technology', label: 'technology', count: 1720 },
  { slug: 'python', label: 'Python', count: 1074 },
  { slug: 'youtube', label: 'youtube', count: 1011 },
  { slug: 'react', label: 'React', count: 970 },
  { slug: 'startup', label: 'startup', count: 718 },
  { slug: 'software-development', label: 'software development', count: 698 },
  { slug: 'design', label: 'Design', count: 581 },
  { slug: 'productivity', label: 'Productivity', count: 549 },
  { slug: 'life-lessons', label: 'Life lessons', count: 532 },
  { slug: 'css', label: 'CSS', count: 499 },
  { slug: 'self-improvement', label: 'self-improvement', count: 486 },
];

export const SITEMAP_TAGS_URL = `${FCC_NEWS_BASE}/sitemap-tags.xml`;
export const SITEMAP_POSTS_URL = `${FCC_NEWS_BASE}/sitemap-posts.xml`;

export const CRAWL_DEFAULTS = {
  /** Posts per listing page on freeCodeCamp (informational). */
  perPage: 25,
  /** Delay between two requests made by the same worker. */
  delayMs: 500,
  /** Concurrent tag crawlers. */
  concurrency: 2,
  /** Retries per request on 429/5xx/network errors. */
  maxRetries: 4,
  requestTimeoutMs: 30_000,
  userAgent:
    'Mozilla/5.0 (compatible; fcc-news-archiver/1.0; +https://www.freecodecamp.org/news/ - personal offline archive with attribution)',
};

/** Attribution strings reused by every sharing surface. */
export const ATTRIBUTION = {
  publisher: 'freeCodeCamp.org',
  publisherUrl: FCC_NEWS_BASE,
  charityNote:
    'freeCodeCamp is a donor-supported tax-exempt 501(c)(3) charity organization.',
};

export function tagPageUrl(slug: string, page: number): string {
  const base = `${FCC_NEWS_BASE}/tag/${slug}/`;
  return page <= 1 ? base : `${base}${page}/`;
}

/**
 * The home feed paginates by appending the page number to the URL with a
 * double slash (that is what the site's own "Load More" button requests):
 *   https://www.freecodecamp.org/news//2/
 * Pagination ends with a 404, same as the tag pages.
 */
export function indexPageUrl(page: number): string {
  return `${FCC_NEWS_BASE}//${page}/`;
}

/** Virtual source slug used for posts discovered through the home feed. */
export const INDEX_SOURCE = '_index';

export function postUrl(id: string): string {
  return `${FCC_NEWS_BASE}/${id}/`;
}
