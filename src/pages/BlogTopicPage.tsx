import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { fccArchiveApi } from '@/services/api';
import { FccArchivePost } from '@/types';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { Loader2, Newspaper, RefreshCw, Tag, ChevronLeft, ArrowUpRight } from 'lucide-react';

/**
 * /blog/:tagSlug/:page — the paginated feed of one archive topic.
 *
 * "tat-ca" is the mixed feed across every topic. Pages are plain crawlable
 * URLs (/blog/javascript/2 is page 2) with 20 posts each — no infinite scroll,
 * no bulk loading.
 *
 * The archive holds crawler metadata only (no article bodies), so every card
 * links to the original freeCodeCamp.org permalink and keeps the attribution
 * (publisher + author + original URL) visible.
 */

const POSTS_PER_PAGE = 20;
const ALL_TOPICS_SLUG = 'tat-ca';

/** Guards against overlapping requests when the user clicks pages quickly. */
let loadSeq = 0;

const formatDate = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '';

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

/** Title-case label from a URL slug. */
const slugToLabel = (slug: string): string => slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

/** Cover image with a graceful placeholder when the remote asset fails. */
const ArchiveCover: React.FC<{ post: FccArchivePost; eager: boolean }> = ({ post, eager }) => {
  const [failed, setFailed] = useState(false);
  if (!post.coverImage || failed) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-primary-blue/10 via-surface to-accent-cyan/10 flex items-center justify-center">
        <Newspaper className="w-10 h-10 text-primary-blue/30" />
      </div>
    );
  }
  return (
    <img
      src={post.coverImage}
      alt={post.title}
      width={376}
      height={176}
      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
      loading={eager ? 'eager' : 'lazy'}
      fetchPriority={eager ? 'high' : 'auto'}
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
    />
  );
};

const PostCard: React.FC<{ post: FccArchivePost; eager: boolean }> = ({ post, eager }) => (
  <li>
    <article className="group flex flex-col rounded-2xl bg-white border border-border-subtle overflow-hidden hover:border-primary-blue/50 hover:shadow-xl hover:shadow-primary-blue/5 transition-all h-full">
      <div className="relative h-44 bg-surface overflow-hidden shrink-0">
        <a href={post.url} target="_blank" rel="noopener noreferrer nofollow" tabIndex={-1} aria-hidden="true">
          <ArchiveCover post={post} eager={eager} />
        </a>
      </div>
      <div className="flex flex-col flex-1 p-5">
        <h2 className="text-sm font-bold text-text-primary leading-snug group-hover:text-primary-blue transition-colors">
          <a href={post.url} target="_blank" rel="noopener noreferrer nofollow">
            {post.title}
          </a>
        </h2>
        {post.authorName && <p className="text-xs text-text-secondary mt-2">Author: {post.authorName}</p>}
        <div className="mt-auto pt-4 flex items-center gap-3 text-[10px] font-mono text-text-muted">
          <time dateTime={post.publishedAt || undefined}>{formatDate(post.publishedAt)}</time>
          {post.tags.length > 0 && (
            <Link
              to={`/blog/${post.tags[0].replace(/^#/, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')}/1`}
              className="inline-flex items-center gap-1 hover:text-primary-blue"
            >
              <Tag className="w-3 h-3" />
              {post.tags[0].replace(/^#/, '')}
            </Link>
          )}
        </div>
        <a
          href={post.url}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-primary-blue hover:underline"
        >
          Read the original on freeCodeCamp
          <ArrowUpRight className="w-3.5 h-3.5" />
        </a>
      </div>
    </article>
  </li>
);

export const BlogTopicPage: React.FC = () => {
  const { tagSlug = '', page: pageParam = '1' } = useParams<{ tagSlug: string; page: string }>();
  const slug = (tagSlug || '').toLowerCase();
  const page = Math.max(1, parseInt(pageParam || '1', 10) || 1);
  const isAll = slug === ALL_TOPICS_SLUG || slug === 'all';

  const [posts, setPosts] = useState<FccArchivePost[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  /** Bumped by the retry button to re-run the load effect. */
  const [retryTick, setRetryTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const requestId = ++loadSeq;
    setIsLoading(true);
    setError(null);
    fccArchiveApi
      .list({ page, limit: POSTS_PER_PAGE, tag: isAll ? undefined : slug })
      .then((result) => {
        if (cancelled || requestId !== loadSeq) return;
        setPosts(result.posts);
        setTotal(result.total);
        setTotalPages(result.totalPages);
      })
      .catch((err: Error) => {
        if (cancelled || requestId !== loadSeq) return;
        setError(err.message);
      })
      .finally(() => {
        if (!cancelled && requestId === loadSeq) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [slug, page, isAll, retryTick]);

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const topicLabel = isAll ? 'All posts' : slugToLabel(slug);

  useDocumentMeta({
    title: `${topicLabel} | Blog | AgentLab`,
    description: isAll
      ? 'Every article archived from freeCodeCamp.org — programming, JavaScript, Python, React, AI and software engineering, each entry linking to the original post with author attribution.'
      : `Articles tagged "${topicLabel}" from the freeCodeCamp.org archive — every entry links to the original post with author attribution.`,
    canonicalUrl: `${origin}/blog/${slug}/${page}`,
    type: 'website',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: topicLabel,
      description: 'Articles archived from freeCodeCamp.org',
      url: `${origin}/blog/${slug}/${page}`,
      inLanguage: 'en',
      isPartOf: { '@type': 'Blog', name: 'Blog | AgentLab', url: `${origin}/blog` },
      mainEntity: {
        '@type': 'ItemList',
        numberOfItems: posts.length,
        itemListElement: posts.map((post, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          url: post.url,
          name: post.title,
        })),
      },
    },
  });

  const pageHref = (target: number) => `/blog/${slug}/${target}`;

  const emptyTopic = !isLoading && !error && total === 0;
  const pageOutOfRange = !isLoading && !error && total > 0 && posts.length === 0;

  return (
    <div className="min-h-screen bg-canvas">
      {/* Hero */}
      <section className="border-b border-border-subtle bg-surface">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 py-12">
          <Link
            to="/blog"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-text-secondary hover:text-primary-blue transition-colors mb-4"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            All topics
          </Link>
          <div className="flex items-center gap-2 text-xs font-mono text-accent-cyan font-bold uppercase tracking-widest mb-3">
            <Tag className="w-4 h-4" />
            {isAll ? 'All topics' : `#${slugToLabel(slug)}`}
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-text-primary tracking-tight">{topicLabel}</h1>
          <p className="text-sm text-text-secondary mt-3 max-w-2xl">
            {isLoading ? (
              'Loading posts...'
            ) : (
              <>
                {formatCount(total)} posts{totalPages > 1 ? ` · page ${page}/${formatCount(totalPages)}` : ''}
              </>
            )}
          </p>
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
            — every article is copyrighted by its respective author.
          </p>
        </div>
      </section>

      {/* Feed */}
      <section className="max-w-[1240px] mx-auto px-4 sm:px-6 py-10">
        {isLoading ? (
          <div className="py-20 text-center space-y-3">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary-blue" />
            <p className="text-xs text-text-muted font-mono">Loading posts...</p>
          </div>
        ) : error ? (
          <div className="py-20 text-center space-y-3">
            <p className="text-xs text-status-error font-semibold">{error}</p>
            <button
              type="button"
              onClick={() => setRetryTick((t) => t + 1)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-border-subtle text-text-secondary hover:text-text-primary text-xs font-bold cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Try again
            </button>
          </div>
        ) : emptyTopic ? (
          <div className="py-20 text-center space-y-2">
            <Newspaper className="w-10 h-10 mx-auto text-text-muted/40" />
            <p className="text-sm font-bold text-text-primary">Topic not found.</p>
            <p className="text-xs text-text-muted">This topic does not exist or has no posts yet.</p>
            <Link to="/blog" className="inline-block mt-3 px-4 py-2 rounded-xl bg-primary-blue text-white text-xs font-bold">
              Browse all topics
            </Link>
          </div>
        ) : pageOutOfRange ? (
          <div className="py-20 text-center space-y-2">
            <Newspaper className="w-10 h-10 mx-auto text-text-muted/40" />
            <p className="text-sm font-bold text-text-primary">Page {page} does not exist.</p>
            <p className="text-xs text-text-muted">This topic has {formatCount(totalPages)} pages.</p>
            <Link
              to={pageHref(1)}
              className="inline-block mt-3 px-4 py-2 rounded-xl bg-primary-blue text-white text-xs font-bold"
            >
              Go to page 1
            </Link>
          </div>
        ) : (
          <>
            <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 list-none p-0 m-0">
              {posts.map((post, index) => (
                <PostCard key={`${post.id}-${index}`} post={post} eager={index < 4} />
              ))}
            </ul>

            {/* Crawlable pagination */}
            {totalPages > 1 && (
              <nav aria-label="Post pagination" className="mt-10 flex flex-wrap items-center justify-center gap-2">
                {page > 1 ? (
                  <Link
                    to={pageHref(page - 1)}
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
                      to={pageHref(item)}
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
                    to={pageHref(page + 1)}
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
            )}
          </>
        )}
      </section>
    </div>
  );
};

export default BlogTopicPage;
