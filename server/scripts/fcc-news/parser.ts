/**
 * HTML parsing utilities for freeCodeCamp tag listing pages.
 *
 * The site is server-side rendered Ghost markup. Each listing entry is an
 * <article class="post-card"> block that contains everything we need for a
 * citation-complete archive record: slug, title, primary tag, cover image,
 * author and an exact publication timestamp (<time datetime="...">).
 */

import { FCC_NEWS_BASE } from './config';

export interface PostCard {
  /** Article slug / stable id, e.g. "async-await-javascript-tutorial-...". */
  id: string;
  title: string;
  url: string;
  /** Primary tag shown on the card, e.g. "#async/await". */
  tagText: string | null;
  tagSlug: string | null;
  coverImage: string | null;
  authorName: string | null;
  authorUrl: string | null;
  /** ISO timestamp from the <time datetime> attribute. */
  publishedAt: string | null;
  /** Relative label as displayed, e.g. "5 years ago". */
  publishedText: string | null;
}

const ENTITY_MAP: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  hellip: '…',
  mdash: '—',
  ndash: '–',
  lsquo: '‘',
  rsquo: '’',
  ldquo: '“',
  rdquo: '”',
};

export function decodeEntities(input: string): string {
  return input
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number(dec)))
    .replace(/&([a-z]+);/gi, (m, name: string) => ENTITY_MAP[name.toLowerCase()] ?? m)
    .replace(/&amp;/gi, '&');
}

function normalizeText(html: string): string {
  return decodeEntities(html.replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim();
}

function matchGroup(haystack: string, pattern: RegExp): string | null {
  const m = haystack.match(pattern);
  return m && m[1] ? m[1].trim() : null;
}

/**
 * Parses every <article class="post-card"> block out of a listing page.
 * Footer sections (books, tags) never match because they are not post cards.
 */
export function parsePostCards(html: string): PostCard[] {
  const chunks = html.split('<article class="post-card"').slice(1);
  const cards: PostCard[] = [];

  for (const chunk of chunks) {
    const slugFromImage = matchGroup(chunk, /post-card-image-link"\s+href="\/news\/([^"\/]+)\//);
    const titleMatch = chunk.match(/<h2 class="post-card-title">\s*<a href="\/news\/([^"\/]+)\/"[^>]*>([\s\S]*?)<\/a>/);
    const ariaLabel = matchGroup(chunk, /post-card-image-link"[^>]*aria-label="([^"]*)"/);

    const id = slugFromImage ?? (titleMatch ? titleMatch[1] : null);
    if (!id) continue;

    const title = titleMatch ? normalizeText(titleMatch[2]) : ariaLabel ? decodeEntities(ariaLabel) : id;
    const tagHref = matchGroup(chunk, /<span class="post-card-tags">\s*<a[^>]*href="\/news\/tag\/([^"]+)\/"/);
    const tagText = matchGroup(chunk, /<span class="post-card-tags">\s*<a[^>]*>([\s\S]*?)<\/a>/);
    // Attribute order varies: src can appear before or after class="post-card-image".
    const coverImage = matchGroup(chunk, /post-card-image-link"[\s\S]*?<img[^>]*?\ssrc="([^"]+)"/);
    const authorHref = matchGroup(chunk, /href="(\/news\/author\/[^"]+\/)"/);
    const authorName = matchGroup(
      chunk,
      /<a class="meta-item" href="\/news\/author\/[^"]+\/"[^>]*>([\s\S]*?)<\/a>/,
    );
    const publishedAt = matchGroup(chunk, /<time[^>]*datetime="([^"]+)"/);
    const publishedText = matchGroup(chunk, /<time[^>]*datetime="[^"]*"[^>]*>([\s\S]*?)<\/time>/);

    cards.push({
      id,
      title,
      url: `${FCC_NEWS_BASE}/${id}/`,
      tagText: tagText ? normalizeText(tagText) : null,
      tagSlug: tagHref,
      coverImage: coverImage ? decodeEntities(coverImage) : null,
      authorName: authorName ? normalizeText(authorName) : null,
      authorUrl: authorHref ? `https://www.freecodecamp.org${authorHref}` : null,
      publishedAt: publishedAt ?? null,
      publishedText: publishedText ? normalizeText(publishedText) : null,
    });
  }

  return cards;
}

/**
 * Parses a single article page (JSON-LD + tag links). Used by the
 * --fill-missing pass for posts that never show up in listing feeds.
 */
export function parsePostPage(html: string, slug: string): PostCard | null {
  const jsonLd = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  let title = slug;
  let publishedAt: string | null = null;
  let authorName: string | null = null;
  let authorUrl: string | null = null;
  let coverImage: string | null = null;

  for (const block of jsonLd) {
    try {
      const data = JSON.parse(block[1]) as Record<string, unknown>;
      const type = data['@type'];
      const isArticle = type === 'Article' || (Array.isArray(type) && type.includes('Article'));
      if (!isArticle) continue;
      title = typeof data.headline === 'string' ? decodeEntities(data.headline) : title;
      publishedAt = typeof data.datePublished === 'string' ? data.datePublished : publishedAt;
      const author = data.author as { name?: string; url?: string } | undefined;
      authorName = author?.name ?? authorName;
      authorUrl = author?.url ?? authorUrl;
      const image = data.image as { url?: string } | undefined;
      coverImage = image?.url ?? coverImage;
      break;
    } catch {
      // keep trying other blocks
    }
  }

  if (!publishedAt && !authorName && title === slug) return null;

  const ogImage = html.match(/property="og:image"\s+content="([^"]+)"/);
  coverImage = coverImage ?? (ogImage ? decodeEntities(ogImage[1]) : null);

  // First tag link on the page is the post's primary tag.
  const tagLinks = [...new Set([...html.matchAll(/href="\/news\/tag\/([a-z0-9-]+)\/"/g)].map((m) => m[1]))].filter(
    (t) => t !== 'rss',
  );
  const primaryTag = tagLinks[0] ?? null;

  return {
    id: slug,
    title,
    url: `${FCC_NEWS_BASE}/${slug}/`,
    tagText: primaryTag ? `#${primaryTag}` : null,
    tagSlug: primaryTag,
    coverImage,
    authorName,
    authorUrl,
    publishedAt,
    publishedText: null,
  };
}
/** Extracts the tag list from the sidebar of any tag page. */
export function parseTagCounts(html: string): Array<{ slug: string; label: string; count: number }> {
  const tags: Array<{ slug: string; label: string; count: number }> = [];
  const re = /<a[^>]*href="\/news\/tag\/([^"]+)\/"[^>]*>\s*<h3[^>]*>([\s\S]*?)<\/h3>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const label = normalizeText(m[2].replace(/<small>[\s\S]*?<\/small>/, ''));
    const countMatch = m[2].match(/<small>\s*\|\s*([\d,]+)\s*<\/small>/);
    const count = countMatch ? Number(countMatch[1].replace(/,/g, '')) : 0;
    if (m[1] !== 'rss') tags.push({ slug: m[1], label: label.replace(/^#/, ''), count });
  }
  return tags;
}
