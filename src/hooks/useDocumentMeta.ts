import { useEffect, useRef } from 'react';

export interface DocumentMeta {
  title: string;
  description?: string;
  /** Relative or absolute image URL — normalized to an absolute URL */
  image?: string;
  /** Absolute canonical URL for the current view */
  canonicalUrl?: string;
  type?: 'website' | 'article';
  publishedTime?: string;
  /** Only pass when it genuinely differs from publishedTime */
  modifiedTime?: string;
  authorName?: string;
  section?: string;
  /** Rendered as meta keywords + one article:tag per entry */
  tags?: string[];
  robots?: string;
  siteName?: string;
  /** JSON-LD object(s) — one <script> is injected per object */
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
}

export const DEFAULT_SITE_NAME = 'AgentLab';
export const DEFAULT_OG_LOCALE = 'en_US';
export const DEFAULT_ROBOTS = 'index,follow';

/** Marker applied to every tag/script this hook creates */
const SEO_MARK = 'data-seo';
/** Marker used by the backend crawler-render endpoint for server-injected JSON-LD */
const SSR_JSONLD_MARK = 'data-ssr-jsonld';
const JSONLD_SELECTOR = 'script[type="application/ld+json"]';

/** Resolve a possibly-relative URL against the current origin (absolute) */
export const toAbsoluteUrl = (url?: string | null): string | undefined => {
  if (!url) return undefined;
  try {
    return new URL(url, window.location.origin).toString();
  } catch {
    return undefined;
  }
};

interface MetaTarget {
  attr: 'name' | 'property';
  key: string;
}

/** Single-value meta tags managed by the hook (queried-or-created on every run) */
const META_TARGETS: MetaTarget[] = [
  { attr: 'name', key: 'description' },
  { attr: 'name', key: 'keywords' },
  { attr: 'name', key: 'robots' },
  { attr: 'name', key: 'twitter:card' },
  { attr: 'name', key: 'twitter:title' },
  { attr: 'name', key: 'twitter:description' },
  { attr: 'name', key: 'twitter:image' },
  { attr: 'name', key: 'twitter:image:alt' },
  { attr: 'property', key: 'og:title' },
  { attr: 'property', key: 'og:description' },
  { attr: 'property', key: 'og:type' },
  { attr: 'property', key: 'og:url' },
  { attr: 'property', key: 'og:image' },
  { attr: 'property', key: 'og:image:alt' },
  { attr: 'property', key: 'og:site_name' },
  { attr: 'property', key: 'og:locale' },
  { attr: 'property', key: 'article:published_time' },
  { attr: 'property', key: 'article:modified_time' },
  { attr: 'property', key: 'article:author' },
  { attr: 'property', key: 'article:section' },
];

interface HeadSnapshot {
  title: string;
  metas: Array<{ target: MetaTarget; el: HTMLMetaElement | null; content: string | null }>;
  canonical: { el: HTMLLinkElement | null; href: string | null };
}

/** Capture the head state before the first mutation so it can be restored on unmount */
const readHeadSnapshot = (): HeadSnapshot => ({
  title: document.title,
  metas: META_TARGETS.map((target) => {
    const el = document.head.querySelector<HTMLMetaElement>(`meta[${target.attr}="${target.key}"]`);
    return { target, el, content: el ? el.getAttribute('content') : null };
  }),
  canonical: (() => {
    const el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    return { el, href: el ? el.getAttribute('href') : null };
  })(),
});

/** Query-or-create a meta tag, updating any existing one in place (SSR-safe) */
const upsertMeta = (
  attr: 'name' | 'property',
  key: string,
  content: string,
  created: HTMLElement[]
): void => {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    el.setAttribute(SEO_MARK, '1');
    document.head.appendChild(el);
    created.push(el);
  }
  el.setAttribute('content', content);
};

/** Query-or-create the canonical link, updating any existing one in place */
const upsertCanonical = (href: string, created: HTMLElement[]): void => {
  let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    link.setAttribute(SEO_MARK, '1');
    document.head.appendChild(link);
    created.push(link);
  }
  link.setAttribute('href', href);
};

const removeSeoJsonLd = (): void => {
  document.head.querySelectorAll<HTMLScriptElement>(JSONLD_SELECTOR).forEach((script) => {
    if (script.getAttribute(SEO_MARK) === '1' || script.getAttribute(SSR_JSONLD_MARK) === '1') {
      script.remove();
    }
  });
};

/**
 * SPA meta manager — Googlebot renders JavaScript, so updating document.title
 * and the OG/Twitter meta on route change is enough for indexing. Paired with
 * the dynamic /sitemap.xml served by the backend.
 *
 * Tags are queried-or-created and updated in place, so meta injected by the
 * backend crawler-render endpoint is overwritten with the same values on
 * hydration (no duplicates). Everything the hook creates carries data-seo="1";
 * on unmount the head snapshot taken on mount is restored, which stops stale
 * og:image/description/canonical values from bleeding across routes.
 */
export const useDocumentMeta = (meta: DocumentMeta): void => {
  const createdRef = useRef<HTMLElement[]>([]);
  const articleTagElsRef = useRef<HTMLMetaElement[]>([]);
  const jsonLdElsRef = useRef<HTMLScriptElement[]>([]);

  // Keep the latest meta reachable from a serialized-dependency effect so
  // object/array props (tags, jsonLd) do not retrigger it by identity.
  const metaRef = useRef(meta);
  metaRef.current = meta;
  const serialized = JSON.stringify(meta);

  // Declared first so the snapshot is taken before the apply effect mutates the head.
  useEffect(() => {
    const snapshot = readHeadSnapshot();
    return () => {
      // Restore the exact head state captured on mount
      document.title = snapshot.title;
      snapshot.metas.forEach(({ target, el, content }) => {
        if (!el) return;
        if (content === null) el.removeAttribute('content');
        else el.setAttribute('content', content);
      });
      if (snapshot.canonical.el) {
        if (snapshot.canonical.href === null) snapshot.canonical.el.removeAttribute('href');
        else snapshot.canonical.el.setAttribute('href', snapshot.canonical.href);
      }
      // Remove every element this hook created plus any server-rendered JSON-LD
      createdRef.current.forEach((el) => el.remove());
      createdRef.current = [];
      articleTagElsRef.current.forEach((el) => el.remove());
      articleTagElsRef.current = [];
      jsonLdElsRef.current.forEach((el) => el.remove());
      jsonLdElsRef.current = [];
      removeSeoJsonLd();
    };
  }, []);

  useEffect(() => {
    const {
      title,
      description,
      image,
      canonicalUrl,
      type = 'website',
      publishedTime,
      modifiedTime,
      authorName,
      section,
      tags,
      robots = DEFAULT_ROBOTS,
      siteName = DEFAULT_SITE_NAME,
      jsonLd,
    } = metaRef.current;

    // Drop server-rendered + previous client JSON-LD before injecting the current version
    removeSeoJsonLd();
    jsonLdElsRef.current = [];

    // article:tag is multi-valued — rebuild on every run
    articleTagElsRef.current.forEach((el) => el.remove());
    articleTagElsRef.current = [];

    const absoluteImage = toAbsoluteUrl(image);

    document.title = title;
    upsertMeta('property', 'og:title', title, createdRef.current);
    upsertMeta('name', 'twitter:title', title, createdRef.current);
    upsertMeta('property', 'og:type', type, createdRef.current);
    upsertMeta('property', 'og:site_name', siteName, createdRef.current);
    upsertMeta('property', 'og:locale', DEFAULT_OG_LOCALE, createdRef.current);
    upsertMeta('name', 'robots', robots, createdRef.current);
    upsertMeta('name', 'twitter:card', absoluteImage ? 'summary_large_image' : 'summary', createdRef.current);

    if (description) {
      upsertMeta('name', 'description', description, createdRef.current);
      upsertMeta('property', 'og:description', description, createdRef.current);
      upsertMeta('name', 'twitter:description', description, createdRef.current);
    }
    if (canonicalUrl) {
      upsertMeta('property', 'og:url', canonicalUrl, createdRef.current);
      upsertCanonical(canonicalUrl, createdRef.current);
    }
    if (absoluteImage) {
      upsertMeta('property', 'og:image', absoluteImage, createdRef.current);
      upsertMeta('property', 'og:image:alt', title, createdRef.current);
      upsertMeta('name', 'twitter:image', absoluteImage, createdRef.current);
      upsertMeta('name', 'twitter:image:alt', title, createdRef.current);
    }
    if (publishedTime) {
      upsertMeta('property', 'article:published_time', publishedTime, createdRef.current);
    }
    if (modifiedTime) {
      upsertMeta('property', 'article:modified_time', modifiedTime, createdRef.current);
    }
    if (authorName) {
      upsertMeta('property', 'article:author', authorName, createdRef.current);
    }
    if (section) {
      upsertMeta('property', 'article:section', section, createdRef.current);
    }
    if (tags && tags.length > 0) {
      upsertMeta('name', 'keywords', tags.join(', '), createdRef.current);
      tags.forEach((tag) => {
        const el = document.createElement('meta');
        el.setAttribute('property', 'article:tag');
        el.setAttribute('content', tag);
        el.setAttribute(SEO_MARK, '1');
        document.head.appendChild(el);
        articleTagElsRef.current.push(el);
      });
    }

    const jsonLdObjects = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];
    jsonLdObjects.forEach((object) => {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.setAttribute(SEO_MARK, '1');
      script.textContent = JSON.stringify(object);
      document.head.appendChild(script);
      jsonLdElsRef.current.push(script);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serialized]);
};
