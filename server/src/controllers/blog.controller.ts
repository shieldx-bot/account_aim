import { Request, Response } from 'express';
import { env } from '../config/env.js';
import { listArchivePosts, listArchiveTags } from '../services/fcc-archive.service.js';

/**
 * Blog module — sitemap, robots.txt, RSS and crawler rendering.
 *
 * The blog is served exclusively from the MongoDB freeCodeCamp archive
 * (fcc_news.posts) at /blog. The archive holds crawler metadata only, so
 * every rendered entry links to the ORIGINAL freeCodeCamp permalink and
 * keeps publisher/author attribution — article bodies are never copied.
 */

const SITE_NAME = 'AgentLab';
const FCC_NEWS_SOURCE_URL = 'https://www.freecodecamp.org/news';
const BLOG_DESCRIPTION =
  'An archive of articles from freeCodeCamp.org — thousands of posts on programming, JavaScript, Python, React, AI and software engineering, each entry linking to the original post with author attribution.';
/** Default social share image — a real raster asset shipped with the SPA. */
const DEFAULT_OG_IMAGE = '/images/hero-code.jpg';

/**
 * Crawler user agents (search engines, social scrapers, AI crawlers) that get
 * server-rendered meta tags from GET /render. Keep in sync with the
 * $blog_render_bot map in nginx.conf.
 */
const CRAWLER_UA =
  /(googlebot|google-inspectiontool|bingbot|yandex|baiduspider|duckduckbot|slurp|facebookexternalhit|twitterbot|linkedinbot|discordbot|slackbot|whatsapp|telegrambot|applebot|petalbot|semrushbot|ahrefsbot|mj12bot|bytespider|gptbot|claudebot|lighthouse|ia_archiver)/i;

/** Escape a value for XML/HTML text and double-quoted attribute contexts. */
const escapeXml = (value: unknown): string =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

const requestBase = (req: Request): string =>
  (env.APP_URL || `${req.protocol}://${req.get('host') || 'localhost'}`).replace(/\/+$/, '');

/** APP_URL + path (or absolute passthrough) for og:image / RSS image URLs. */
const toAbsoluteUrl = (base: string, url?: string | null): string | undefined => {
  if (!url) return undefined;
  if (/^https?:\/\//i.test(url)) return url;
  return `${base}${url.startsWith('/') ? url : `/${url}`}`;
};

const toIso = (value: unknown): string | undefined => {
  if (!value) return undefined;
  const date = value instanceof Date ? value : new Date(value as string);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
};

const toRfc822 = (value: unknown): string => {
  const date = value instanceof Date ? value : new Date(String(value || ''));
  return Number.isNaN(date.getTime()) ? new Date().toUTCString() : date.toUTCString();
};

// ── Dynamic rendering for crawlers ────────────────────────────────────────────

const SPA_SHELL_TTL_MS = 5 * 60 * 1000;
const SHELL_FETCH_TIMEOUT_MS = 5000;
let spaShellCache: { text: string; expiresAt: number } | null = null;
let spaShellInFlight: Promise<string> | null = null;

/**
 * Fetch the SPA index.html from the frontend origin (WEB_ORIGIN first), cached
 * for 5 minutes. Concurrent misses share one in-flight request. Throws when
 * the frontend is unreachable so callers can fall back to the built-in shell.
 */
const fetchSpaShell = async (origin: string): Promise<string> => {
  const now = Date.now();
  if (spaShellCache && spaShellCache.expiresAt > now) return spaShellCache.text;
  if (!spaShellInFlight) {
    const request = (async () => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), SHELL_FETCH_TIMEOUT_MS);
      try {
        const res = await fetch(`${origin.replace(/\/+$/, '')}/`, {
          headers: { 'User-Agent': 'SEORenderer/1.0 (+internal)' },
          signal: controller.signal,
        });
        if (!res.ok) throw new Error(`Shell request failed with status ${res.status}`);
        return await res.text();
      } finally {
        clearTimeout(timer);
      }
    })();
    spaShellInFlight = request
      .then((text) => {
        spaShellCache = { text, expiresAt: Date.now() + SPA_SHELL_TTL_MS };
        spaShellInFlight = null;
        return text;
      })
      .catch((err) => {
        spaShellInFlight = null;
        throw err;
      });
  }
  return spaShellInFlight;
};

interface RenderMeta {
  title: string;
  description: string;
  canonical: string;
  image: string;
  ogType?: string;
  robots?: string;
  modifiedTime?: string;
}

/** The injected head block: title, description, robots, canonical, social tags, JSON-LD. */
const buildMetaBlock = (meta: RenderMeta, jsonLd: unknown[]): string => {
  const lines: string[] = [
    `<title>${escapeXml(meta.title)}</title>`,
    `<meta name="description" content="${escapeXml(meta.description)}" />`,
    `<meta name="robots" content="${escapeXml(meta.robots || 'index, follow')}" />`,
    `<link rel="canonical" href="${escapeXml(meta.canonical)}" />`,
    `<meta property="og:site_name" content="${SITE_NAME}" />`,
    `<meta property="og:type" content="${escapeXml(meta.ogType || 'website')}" />`,
    `<meta property="og:title" content="${escapeXml(meta.title)}" />`,
    `<meta property="og:description" content="${escapeXml(meta.description)}" />`,
    `<meta property="og:url" content="${escapeXml(meta.canonical)}" />`,
    `<meta property="og:image" content="${escapeXml(meta.image)}" />`,
    `<meta property="og:locale" content="en_US" />`,
    '<meta name="twitter:card" content="summary_large_image" />',
    `<meta name="twitter:title" content="${escapeXml(meta.title)}" />`,
    `<meta name="twitter:description" content="${escapeXml(meta.description)}" />`,
    `<meta name="twitter:image" content="${escapeXml(meta.image)}" />`,
  ];
  if (meta.modifiedTime) lines.push(`<meta property="article:modified_time" content="${escapeXml(meta.modifiedTime)}" />`);
  for (const ld of jsonLd) {
    // \u003c escaping keeps a stray </script> inside a JSON string harmless.
    const payload = JSON.stringify(ld).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026');
    lines.push(`<script type="application/ld+json" data-ssr-jsonld="1">${payload}</script>`);
  }
  return lines.map((line) => `    ${line}`).join('\n');
};

/** Distinguish the sitewide Organization/WebSite JSON-LD from page-level blocks. */
const isSitewideJsonLd = (body: string): boolean => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(body);
  } catch {
    return true; // static markup we do not understand — keep it untouched
  }
  const types: string[] = [];
  const walk = (node: unknown): void => {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) {
      node.forEach(walk);
      return;
    }
    const record = node as Record<string, unknown>;
    const type = record['@type'];
    if (typeof type === 'string') types.push(type);
    else if (Array.isArray(type)) type.forEach((t) => typeof t === 'string' && types.push(t));
    if ('@graph' in record) walk(record['@graph']);
  };
  walk(parsed);
  return types.some((type) => type === 'Organization' || type === 'WebSite');
};

/**
 * Strip the shell's page-level SEO tags so the injected block is the single
 * source of truth for crawlers. The sitewide Organization/WebSite JSON-LD and
 * every <script src> (the React bundle) are preserved so Googlebot can still
 * render the SPA after reading the meta.
 */
const stripShellSeoTags = (shell: string): string =>
  shell
    .replace(/<script\b[^>]*data-ssr-jsonld[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<title>[\s\S]*?<\/title>/gi, '')
    .replace(/<meta\b[^>]*\bname=["'](?:description|robots)["'][^>]*>/gi, '')
    .replace(/<link\b[^>]*\brel=["']canonical["'][^>]*>/gi, '')
    .replace(/<meta\b[^>]*\b(?:property|name)=["'](?:og|twitter|article):[^"']*["'][^>]*>/gi, '')
    .replace(/<script\b[^>]*\btype=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi, (match: string, body: string) =>
      isSitewideJsonLd(String(body)) ? match : ''
    );

const injectMetaBlock = (shell: string, block: string): string => {
  const cleaned = stripShellSeoTags(shell);
  if (/<\/head>/i.test(cleaned)) {
    return cleaned.replace(/<\/head>/i, `<!-- SEO meta injected for crawler user agents -->\n${block}\n  </head>`);
  }
  return `${block}\n${cleaned}`;
};

/** Degraded-but-safe shell when the frontend origin is unreachable. */
const fallbackShell = (block: string, body = ''): string => `<!doctype html>
  <html lang="vi">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
${block}
    </head>
    <body>
      <div id="root">${body}</div>
      <noscript>This page requires JavaScript. Please enable JavaScript or visit the AgentLab homepage.</noscript>
    </body>
  </html>`;

// ── Server-rendered body content for crawlers ────────────────────────────────

/** Marker on the crawler-only <main>, mirrored by SPA cleanup for hot-reload. */
const CRAWLER_BODY_MARK = 'data-crawler-body';
const LIST_LIMIT = 30;
/** Topics listed in the crawler body of the blog index. */
const TOPIC_LIST_LIMIT = 60;
/** Only topics with at least this many posts are included in the sitemap. */
const SITEMAP_MIN_TOPIC_POSTS = 5;

/** "Mar 12, 2026" — English display date for crawler-facing HTML. */
const formatSeoDate = (value: unknown): string => {
  const d = value instanceof Date ? value : new Date(String(value || ''));
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' });
};

/**
 * Crawlable list for /blog (the MongoDB freeCodeCamp archive topic index).
 * Entries link to the ORIGINAL freeCodeCamp permalink and keep the
 * publisher/author attribution — the archive never copies article bodies.
 */
const archiveListHtml = (posts: any[]): string => {
  const items = posts
    .map((post: any) => {
      const meta = [
        post.authorName ? escapeXml(post.authorName) : null,
        formatSeoDate(post.publishedAt),
        'freeCodeCamp.org',
      ]
        .filter(Boolean)
        .map((part) => `<span>${part}</span>`)
        .join('<span aria-hidden="true"> · </span>');
      return `      <li>
        <article>
          <h2><a href="${escapeXml(post.url)}" rel="noopener noreferrer nofollow">${escapeXml(post.title)}</a></h2>
          <p class="seo-meta">${meta}</p>
        </article>
      </li>`;
    })
    .join('\n');
  return `    <section class="seo-list">
      <h1>Posts archived from freeCodeCamp</h1>
      <p>Posts archived from <a href="${escapeXml(FCC_NEWS_SOURCE_URL)}" rel="noopener noreferrer nofollow">freeCodeCamp.org</a> — a 501(c)(3) nonprofit. Every article is copyrighted by its respective author.</p>
      <ul>
${items}
      </ul>
    </section>`;
};

/** Crawlable topic index for /blog — links to each topic's first page. */
const topicListHtml = (tags: any[]): string => {
  const items = tags
    .map((tag: any) => `      <li><a href="/blog/${escapeXml(tag.slug)}/1">#${escapeXml(String(tag.label).replace(/^#/, ''))}</a> <span class="seo-meta">(${tag.count} posts)</span></li>`)
    .join('\n');
  return `    <section class="seo-list">
      <h1>Blog Topics</h1>
      <p>Posts archived from <a href="${escapeXml(FCC_NEWS_SOURCE_URL)}" rel="noopener noreferrer nofollow">freeCodeCamp.org</a> — a 501(c)(3) nonprofit.</p>
      <ul>
${items}
      </ul>
    </section>`;
};

/** Drop the previous crawler body so a rewritten shell never stacks copies. */
const stripCrawlerBody = (shell: string): string =>
  shell.replace(new RegExp(`<main\\b[^>]*${CRAWLER_BODY_MARK}[^>]*>[\\s\\S]*?<\\/main>`, 'gi'), '');

/**
 * Put the crawlable content inside the SPA mount node. React replaces the
 * node's children on hydration, so humans still get the full interactive app
 * while crawlers — and no-JS visitors — read real HTML with real links.
 */
const injectCrawlerBody = (shell: string, body: string): string => {
  if (!body) return shell;
  return stripCrawlerBody(shell).replace(
    /<div id="root"[^>]*><\/div>/i,
    `<div id="root">${body}</div>`
  );
};

// ── SEO endpoints ─────────────────────────────────────────────────────────────

/**
 * GET /sitemap.xml (mounted from index.ts)
 * Static storefront pages + the blog topic index (/blog) + the first page of
 * every topic that has enough posts to be worth indexing.
 */
export const getSitemap = async (req: Request, res: Response): Promise<void> => {
  try {
    const base = requestBase(req);
    const today = new Date().toISOString().slice(0, 10);
    const urls: string[] = [];
    const addUrl = (loc: string, priority = '0.5') =>
      urls.push(`  <url><loc>${escapeXml(base)}${loc}</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>${priority}</priority></url>`);

    for (const p of ['/', '/products', '/blog', '/about', '/status', '/docs', '/terms']) addUrl(p);

    try {
      const { tags } = await listArchiveTags({ page: 1, limit: 500 });
      for (const tag of tags) {
        if (tag.count >= SITEMAP_MIN_TOPIC_POSTS) addUrl(`/blog/${tag.slug}/1`, '0.4');
      }
    } catch (err) {
      console.error('[BlogController] Sitemap topic listing failed:', err);
    }

    res
      .status(200)
      .type('application/xml')
      .send(
        `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>`
      );
  } catch (err) {
    console.error('[BlogController] Error generating sitemap:', err);
    res.status(500).type('application/xml').send('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>');
  }
};

/**
 * GET /robots.txt (mounted from index.ts)
 * Crawl policy + absolute sitemap pointer, derived from APP_URL.
 */
export const getRobotsTxt = async (req: Request, res: Response): Promise<void> => {
  try {
    const base = requestBase(req);
    const body = ['User-agent: *', 'Allow: /', 'Disallow: /admin', 'Disallow: /api/', '', `Sitemap: ${base}/sitemap.xml`, ''].join(
      '\n'
    );
    res.status(200).setHeader('Content-Type', 'text/plain; charset=utf-8').send(body);
  } catch (err) {
    console.error('[BlogController] Error generating robots.txt:', err);
    res.status(500).setHeader('Content-Type', 'text/plain; charset=utf-8').send('User-agent: *\nDisallow: /\n');
  }
};

/**
 * GET /blog/rss.xml (mounted from index.ts)
 * RSS 2.0 feed of the 20 most recent archived freeCodeCamp posts. Items link
 * to the original permalinks with publisher attribution.
 */
export const getRssFeed = async (req: Request, res: Response): Promise<void> => {
  try {
    const base = requestBase(req);
    let posts: any[] = [];
    try {
      const result = await listArchivePosts({ page: 1, limit: 20 });
      posts = result.posts;
    } catch (err) {
      console.error('[BlogController] RSS feed archive read failed:', err);
    }
    const feedTitle = `${SITE_NAME} Blog`;
    const channelImage = toAbsoluteUrl(base, DEFAULT_OG_IMAGE);
    const lines: string[] = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
      '  <channel>',
      `    <title>${escapeXml(feedTitle)}</title>`,
      `    <link>${escapeXml(base)}/blog</link>`,
      `    <description>${escapeXml(BLOG_DESCRIPTION)}</description>`,
      '    <language>en-us</language>',
      `    <lastBuildDate>${toRfc822(new Date())}</lastBuildDate>`,
      `    <atom:link rel="self" type="application/rss+xml" href="${escapeXml(`${base}/blog/rss.xml`)}" />`,
    ];
    if (channelImage) {
      lines.push(
        '    <image>',
        `      <url>${escapeXml(channelImage)}</url>`,
        `      <title>${escapeXml(feedTitle)}</title>`,
        `      <link>${escapeXml(base)}/blog</link>`,
        '    </image>'
      );
    }
    for (const post of posts) {
      const link = post.url;
      lines.push(
        '    <item>',
        `      <title>${escapeXml(post.title)}</title>`,
        `      <link>${escapeXml(link)}</link>`,
        `      <guid isPermaLink="true">${escapeXml(link)}</guid>`,
        `      <pubDate>${toRfc822(post.publishedAt)}</pubDate>`,
        ...(post.authorName ? [`      <author>${escapeXml(post.authorName)}</author>`] : []),
        ...(post.tags?.length ? [`      <category>${escapeXml(post.tags[0].replace(/^#/, ''))}</category>`] : []),
        '    </item>'
      );
    }
    lines.push('  </channel>', '</rss>', '');
    res.status(200).setHeader('Content-Type', 'application/rss+xml; charset=utf-8').send(lines.join('\n'));
  } catch (err) {
    console.error('[BlogController] Error generating RSS feed:', err);
    res.status(500).setHeader('Content-Type', 'application/rss+xml; charset=utf-8').send('<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel></channel></rss>');
  }
};

/**
 * GET /render (mounted from index.ts) — dynamic rendering for crawlers.
 * nginx routes only crawler user-agents on /blog here and passes the original
 * path in X-Original-URI. Non-crawler callers get a 404 JSON response.
 */
export const renderBlogMeta = async (req: Request, res: Response): Promise<void> => {
  try {
    const ua = String(req.get('user-agent') || '');
    if (!CRAWLER_UA.test(ua)) {
      res.status(404).json({ success: false, message: 'Not found.' });
      return;
    }

    const base = requestBase(req);
    const origin = (
      process.env.WEB_ORIGIN ||
      env.APP_URL ||
      `${req.protocol}://${req.get('host') || 'localhost'}`
    ).replace(/\/+$/, '');
    const originalUri = String(req.get('x-original-uri') || '/').split('?')[0].split('#')[0];
    const defaultImage = toAbsoluteUrl(base, DEFAULT_OG_IMAGE) || `${base}${DEFAULT_OG_IMAGE}`;

    const notFound = (): { status: number; meta: RenderMeta; jsonLd: unknown[] } => ({
      status: 404,
      meta: {
        title: `Page not found | ${SITE_NAME}`,
        description: 'This page does not exist or has been removed.',
        canonical: `${base}${originalUri}`,
        image: defaultImage,
        robots: 'noindex, follow',
      },
      jsonLd: [],
    });

    let rendered: { status: number; meta: RenderMeta; jsonLd: unknown[] };
    /** Crawler body kind: topic index, topic feed, or none. */
    let bodyKind: 'topics' | 'posts' | 'none' = 'none';
    /** Topic slug for 'posts' bodies ('tat-ca' = every topic). */
    let bodyTag = '';

    const topicMatch = originalUri.match(/^\/blog\/([^/]+)(?:\/(\d+))?\/?$/);

    if (/^\/blog(?:\/archive)?\/?$/.test(originalUri)) {
      // Topic index. /blog/archive is a legacy alias — canonical stays /blog.
      const canonical = `${base}/blog`;
      rendered = {
        status: 200,
        meta: {
          title: `Blog — Topics | ${SITE_NAME}`,
          description: BLOG_DESCRIPTION,
          canonical,
          image: defaultImage,
          ogType: 'website',
        },
        jsonLd: [
          {
            '@context': 'https://schema.org',
            '@type': 'Blog',
            name: `Blog | ${SITE_NAME}`,
            description: BLOG_DESCRIPTION,
            url: canonical,
            inLanguage: 'en',
            publisher: {
              '@type': 'Organization',
              name: SITE_NAME,
              logo: { '@type': 'ImageObject', url: defaultImage },
            },
          },
        ],
      };
      bodyKind = 'topics';
    } else if (topicMatch) {
      // /blog/<topic>/<page> (canonical for a missing page segment is page 1).
      const slug = decodeURIComponent(topicMatch[1]).toLowerCase();
      const page = parseInt(topicMatch[2] || '1', 10) || 1;
      const isAll = slug === 'tat-ca' || slug === 'all';
      const canonical = `${base}/blog/${slug}/${page}`;
      const topicLabel = isAll ? 'All posts' : `#${slug.replace(/-/g, ' ')}`;
      rendered = {
        status: 200,
        meta: {
          title: `${topicLabel} | Blog | ${SITE_NAME}`,
          description: isAll
            ? BLOG_DESCRIPTION
            : `Articles tagged "${topicLabel}" from the freeCodeCamp.org archive.`,
          canonical,
          image: defaultImage,
          ogType: 'website',
        },
        jsonLd: [
          {
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: topicLabel,
            description: 'Articles archived from freeCodeCamp.org',
            url: canonical,
            inLanguage: 'en',
            isPartOf: { '@type': 'Blog', name: `Blog | ${SITE_NAME}`, url: `${base}/blog` },
          },
        ],
      };
      bodyKind = 'posts';
      bodyTag = isAll ? '' : slug;
    } else {
      rendered = notFound();
    }

    const block = buildMetaBlock(rendered.meta, rendered.jsonLd);
    let body = '';
    if (bodyKind === 'topics') {
      try {
        const { tags } = await listArchiveTags({ page: 1, limit: TOPIC_LIST_LIMIT });
        body = `  <main ${CRAWLER_BODY_MARK}="1">\n${topicListHtml(tags)}\n  </main>`;
      } catch (err) {
        console.error('[BlogController] Crawler topic body render failed:', err);
      }
    } else if (bodyKind === 'posts') {
      try {
        const { posts } = await listArchivePosts({
          page: 1,
          limit: LIST_LIMIT,
          tag: bodyTag || undefined,
        });
        body = `  <main ${CRAWLER_BODY_MARK}="1">\n${archiveListHtml(posts)}\n  </main>`;
      } catch (err) {
        console.error('[BlogController] Crawler body render failed:', err);
      }
    }
    let html: string;
    try {
      const shell = await fetchSpaShell(origin);
      html = injectCrawlerBody(injectMetaBlock(shell, block), body);
    } catch (err) {
      console.warn('[BlogController] SPA shell unavailable, using built-in fallback:', (err as Error).message);
      html = fallbackShell(block, body);
    }

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=600');
    res.status(rendered.status).send(html);
  } catch (err) {
    console.error('[BlogController] Error rendering blog meta:', err);
    res.status(500).json({ success: false, message: 'Unable to render page metadata.' });
  }
};
