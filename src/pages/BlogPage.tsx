import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { fccArchiveApi } from '@/services/api';
import { FccArchiveTag } from '@/types';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { Loader2, Library, Newspaper, RefreshCw, Tag } from 'lucide-react';

/**
 * /blog — topic index of the MongoDB freeCodeCamp archive.
 *
 * Deliberately does NOT load any posts: the blog entry point only lists the
 * topics (tags). Picking a topic opens its paginated feed at
 * /blog/<topic>/<page> (20 posts per page) — no infinite scroll, no bulk load.
 */

const TOPICS_PER_PAGE = 60;
/** "All posts" entry point — mixed feed across every topic. */
const ALL_TOPICS_SLUG = 'tat-ca';

const formatCount = (value: number): string => value.toLocaleString('en-US');

/** page window: current ± 2 with first/last anchors and ellipsis gaps */
const buildPageItems = (current: number, total: number): Array<number | 'gap'> => {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const candidates = new Set<number>([1, total, current, current - 1, current + 1, current - 2, current + 2]);
  const pages = [...candidates].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const items: Array<number | 'gap'> = [];
  let previous = 0;
  pages.forEach((p) => {
    if (previous && p - previous > 1) items.push('gap');
    items.push(p);
    previous = p;
  });
  return items;
};

const TopicPagination: React.FC<{ page: number; totalPages: number; hrefFor: (target: number) => string }> = ({
  page,
  totalPages,
  hrefFor,
}) => {
  if (totalPages <= 1) return null;
  return (
    <nav aria-label="Topic pagination" className="mt-10 flex flex-wrap items-center justify-center gap-2">
      {page > 1 ? (
        <Link
          to={hrefFor(page - 1)}
          aria-label="Previous page"
          className="px-3 py-2 rounded-xl bg-white border border-border-subtle text-text-secondary hover:text-text-primary text-xs font-bold transition-colors"
        >
          ← Previous
        </Link>
      ) : (
        <span className="px-3 py-2 rounded-xl bg-white border border-border-subtle text-text-muted opacity-40 text-xs font-bold cursor-not-allowed">
          ← Previous
        </span>
      )}
      {buildPageItems(page, totalPages).map((item, index) =>
        item === 'gap' ? (
          <span key={`gap-${index}`} className="px-2 text-xs font-mono text-text-muted">
            …
          </span>
        ) : (
          <Link
            key={item}
            to={hrefFor(item)}
            aria-label={`Page ${item}`}
            aria-current={item === page ? 'page' : undefined}
            className={`px-3.5 py-2 rounded-xl text-xs font-mono transition-all ${
              item === page
                ? 'bg-primary-blue text-white font-bold shadow-md shadow-primary-blue/20'
                : 'bg-white border border-border-subtle text-text-secondary font-bold hover:text-text-primary'
            }`}
          >
            {item}
          </Link>
        )
      )}
      {page < totalPages ? (
        <Link
          to={hrefFor(page + 1)}
          aria-label="Next page"
          className="px-3 py-2 rounded-xl bg-white border border-border-subtle text-text-secondary hover:text-text-primary text-xs font-bold transition-colors"
        >
          Next →
        </Link>
      ) : (
        <span className="px-3 py-2 rounded-xl bg-white border border-border-subtle text-text-muted opacity-40 text-xs font-bold cursor-not-allowed">
          Next →
        </span>
      )}
    </nav>
  );
};

export const BlogPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);

  const [tags, setTags] = useState<FccArchiveTag[]>([]);
  const [totalTopics, setTotalTopics] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState<{ total: number; topics: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    fccArchiveApi
      .getTags({ page, limit: TOPICS_PER_PAGE })
      .then((result) => {
        if (cancelled) return;
        setTags(result.tags);
        setTotalTopics(result.total);
        setTotalPages(result.totalPages);
      })
      .catch((err: Error) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setIsLoading(false));
    return () => {
      cancelled = true;
    };
  }, [page]);

  useEffect(() => {
    fccArchiveApi
      .getStats()
      .then((s) => setStats({ total: s.total, topics: s.topics }))
      .catch(() => setStats(null));
  }, []);

  const hrefFor = (target: number) => (target <= 1 ? '/blog' : `/blog?page=${target}`);

  const origin = typeof window !== 'undefined' ? window.location.origin : '';

  useDocumentMeta({
    title: 'Blog — Topics | AgentLab',
    description:
      'An archive of articles from freeCodeCamp.org, organized by topic. Pick a topic (JavaScript, Python, React, AI...) and browse its articles page by page — every entry links to the original post with author attribution.',
    canonicalUrl: `${origin}/blog`,
    type: 'website',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'Blog',
      name: 'Blog | AgentLab',
      description: 'An archive of articles from freeCodeCamp.org, organized by topic',
      url: `${origin}/blog`,
      inLanguage: 'en',
    },
  });

  return (
    <div className="min-h-screen bg-canvas">
      {/* Hero */}
      <section className="border-b border-border-subtle bg-surface">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 py-12 sm:py-16">
          <div className="flex items-center gap-2 text-xs font-mono text-accent-cyan font-bold uppercase tracking-widest mb-3">
            <Library className="w-4 h-4" />
            AgentLab Blog
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-text-primary tracking-tight">Blog Topics</h1>
          <p className="text-sm text-text-secondary mt-3 max-w-2xl">
            Articles archived from freeCodeCamp.org, organized by topic. Choose a topic below to browse its articles
            page by page (20 posts per page).
          </p>

          {/* Attribution — required by the archive sharing rules */}
          <p className="mt-4 inline-flex flex-wrap items-center gap-1.5 text-[11px] font-mono text-text-muted bg-white border border-border-subtle rounded-xl px-3 py-2">
            Source:
            <a
              href="https://www.freecodecamp.org/news"
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="text-primary-blue font-bold hover:underline"
            >
              freeCodeCamp.org
            </a>
            — a 501(c)(3) nonprofit. Every article is copyrighted by its respective author; please credit the source
            when sharing.
          </p>

          {stats && (
            <div className="mt-6 flex flex-wrap items-center gap-3 text-[11px] font-mono text-text-muted">
              <span className="px-3 py-1.5 rounded-xl bg-white border border-border-subtle">
                {formatCount(stats.total)} posts
              </span>
              <span className="px-3 py-1.5 rounded-xl bg-white border border-border-subtle">
                {formatCount(stats.topics)} topics
              </span>
            </div>
          )}
        </div>
      </section>

      {/* Topic index */}
      <section className="max-w-[1240px] mx-auto px-4 sm:px-6 py-10">
        {isLoading ? (
          <div className="py-20 text-center space-y-3">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary-blue" />
            <p className="text-xs text-text-muted font-mono">Loading topics...</p>
          </div>
        ) : error ? (
          <div className="py-20 text-center space-y-3">
            <p className="text-xs text-status-error font-semibold">{error}</p>
            <button
              type="button"
              onClick={() => setSearchParams(page > 1 ? { page: String(page) } : {})}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-border-subtle text-text-secondary hover:text-text-primary text-xs font-bold cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Try again
            </button>
          </div>
        ) : (
          <>
            <p className="text-[11px] text-text-muted font-mono mb-6">
              {formatCount(totalTopics)} topics
              {totalPages > 1 ? ` · page ${page}/${formatCount(totalPages)}` : ''}
            </p>

            <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 list-none p-0 m-0">
              {/* "All posts" entry — mixed feed across every topic */}
              <li>
                <Link
                  to={`/blog/${ALL_TOPICS_SLUG}/1`}
                  className="flex items-center justify-between gap-3 h-full p-4 rounded-2xl bg-primary-blue text-white border border-primary-blue shadow-md shadow-primary-blue/20 hover:bg-primary-hover transition-colors"
                >
                  <span className="flex items-center gap-2 font-bold text-sm">
                    <Newspaper className="w-4 h-4 shrink-0" />
                    All posts
                  </span>
                  {stats && <span className="text-xs font-mono opacity-80">{formatCount(stats.total)}</span>}
                </Link>
              </li>
              {tags.map((tag) => (
                <li key={tag.slug}>
                  <Link
                    to={`/blog/${tag.slug}/1`}
                    className="flex items-center justify-between gap-3 h-full p-4 rounded-2xl bg-white border border-border-subtle hover:border-primary-blue/50 hover:shadow-md hover:shadow-primary-blue/5 transition-all group"
                  >
                    <span className="flex items-center gap-2 font-bold text-sm text-text-primary group-hover:text-primary-blue transition-colors truncate">
                      <Tag className="w-4 h-4 shrink-0 text-text-muted group-hover:text-primary-blue" />
                      <span className="truncate">{tag.label.replace(/^#/, '')}</span>
                    </span>
                    <span className="text-xs font-mono text-text-muted shrink-0">{formatCount(tag.count)}</span>
                  </Link>
                </li>
              ))}
            </ul>

            <TopicPagination page={page} totalPages={totalPages} hrefFor={hrefFor} />
          </>
        )}
      </section>
    </div>
  );
};

export default BlogPage;
