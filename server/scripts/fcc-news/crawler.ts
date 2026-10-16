#!/usr/bin/env node
/**
 * freeCodeCamp News crawler.
 *
 * Walks the tag pagination of https://www.freecodecamp.org/news/
 * (e.g. /news/tag/programming/2/), parses every post card and stores a
 * deduplicated, citation-ready archive of the articles in MongoDB
 * (default when MONGODB_URI is set) or in local JSONL files.
 *
 * Usage:
 *   npm run crawl:fcc -- --tags programming,javascript
 *   npm run crawl:fcc --                                # all configured tags
 *   npm run crawl:fcc -- --all-tags                     # every tag in the sitemap
 *   npm run crawl:fcc -- --max-pages 2                  # smoke test
 *   npm run crawl:fcc -- --store file --out data/fcc-news # JSONL fallback
 *
 * Output:
 *   MongoDB    : <db>.<posts> + <db>.crawl_state
 *   JSONL      : <out>/posts.jsonl + <out>/state.json
 */

import { request } from 'node:https';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  CRAWL_DEFAULTS,
  DEFAULT_TAGS,
  FCC_NEWS_BASE,
  INDEX_SOURCE,
  SITEMAP_TAGS_URL,
  indexPageUrl,
  tagPageUrl,
  type TagConfig,
} from './config';
import { parsePostCards, parsePostPage, parseTagCounts } from './parser';
import type { CrawlState, PostRecord } from './store';
import { resolvePaths } from './store';
import type { ArchiveStore } from './archive-store';
import { createStore, type StoreKind } from './store-factory';

interface CliOptions {
  outDir: string;
  tags: string[];
  allTags: boolean;
  maxPages: number;
  delayMs: number;
  concurrency: number;
  resume: boolean;
  store: StoreKind;
  /** Crawl the home feed (/news//N/) to sweep every post, tag-agnostic. */
  index: boolean;
  /** Re-fetch the slugs listed in missing-posts.txt from their own pages. */
  fillMissing: boolean;
  /** True when --tags was passed explicitly on the command line. */
  tagsExplicit: boolean;
  /** Tag slugs whose progress should be cleared ("all" for every tag). */
  reset: string[];
}

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = {
    outDir: 'data/fcc-news',
    tags: DEFAULT_TAGS.map((t) => t.slug),
    allTags: false,
    maxPages: 0,
    delayMs: CRAWL_DEFAULTS.delayMs,
    concurrency: CRAWL_DEFAULTS.concurrency,
    resume: true,
    store: 'auto',
    index: false,
    fillMissing: false,
    tagsExplicit: false,
    reset: [],
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const next = argv[i + 1];
    switch (arg) {
      case '--out':
        options.outDir = next;
        i++;
        break;
      case '--tags':
        options.tags = next
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean);
        options.tagsExplicit = true;
        i++;
        break;
      case '--all-tags':
        options.allTags = true;
        break;
      case '--max-pages':
        options.maxPages = Number(next) || 0;
        i++;
        break;
      case '--delay':
        options.delayMs = Number(next) || CRAWL_DEFAULTS.delayMs;
        i++;
        break;
      case '--concurrency':
        options.concurrency = Math.max(1, Number(next) || 1);
        i++;
        break;
      case '--store':
        options.store = (['auto', 'file', 'mongo'].includes(next) ? next : 'auto') as StoreKind;
        i++;
        break;
      case '--fresh':
        options.resume = false;
        break;
      case '--index':
        options.index = true;
        break;
      case '--fill-missing':
        options.fillMissing = true;
        break;
      case '--reset': {
        const value = next ?? '';
        options.reset = value === 'all' ? ['all'] : value.split(',').map((t) => t.trim()).filter(Boolean);
        i++;
        break;
      }
      case '--help':
        printHelp();
        process.exit(0);
      default:
        if (arg.startsWith('--')) {
          console.error(`Unknown option: ${arg}`);
          process.exit(1);
        }
    }
  }
  return options;
}

function printHelp(): void {
  console.log(`
freeCodeCamp News crawler

  --out <dir>        output directory for JSONL store (default: data/fcc-news)
  --tags <a,b,c>     tag slugs to crawl (default: configured tag set)
  --all-tags         crawl every tag listed in the site sitemap
  --max-pages <n>    stop each tag after n pages (0 = unlimited)
  --delay <ms>       delay between requests per worker (default ${CRAWL_DEFAULTS.delayMs})
  --concurrency <n>  parallel tag workers (default ${CRAWL_DEFAULTS.concurrency})
  --store <kind>     auto | file | mongo (default: auto -> mongo if MONGODB_URI set)
  --fresh            ignore previous progress
  --index            also crawl the home feed (/news//N/) — covers every post
                     regardless of tag; use --tags 0 or combine with tag crawl
  --fill-missing     re-fetch the slugs listed in <out>/missing-posts.txt
                     (produced by coverage:fcc) directly from their own pages
  --reset <all|a,b>  clear progress for the given tags and re-walk them
                     (already archived posts are kept and deduplicated)
`);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface FetchResult {
  status: number;
  body: string;
}

function fetchText(url: string, maxRetries: number, timeoutMs: number): Promise<FetchResult> {
  return new Promise((resolve, reject) => {
    const attempt = (retriesLeft: number, backoffMs: number) => {
      const req = request(
        url,
        {
          headers: {
            'User-Agent': CRAWL_DEFAULTS.userAgent,
            Accept: 'text/html,application/xhtml+xml',
            'Accept-Language': 'en-US,en;q=0.9',
          },
        },
        (res) => {
          const chunks: Buffer[] = [];
          res.on('data', (c: Buffer) => chunks.push(c));
          res.on('end', () => {
            const body = Buffer.concat(chunks).toString('utf8');
            if ((res.statusCode === 429 || (res.statusCode ?? 0) >= 500) && retriesLeft > 0) {
              const retryAfter = Number(res.headers['retry-after']);
              const wait = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : backoffMs;
              setTimeout(() => attempt(retriesLeft - 1, backoffMs * 2), wait);
              return;
            }
            resolve({ status: res.statusCode ?? 0, body });
          });
        },
      );
      req.setTimeout(timeoutMs, () => req.destroy(new Error(`timeout after ${timeoutMs}ms`)));
      req.on('error', (err) => {
        if (retriesLeft > 0) {
          setTimeout(() => attempt(retriesLeft - 1, backoffMs * 2), backoffMs);
        } else {
          reject(err);
        }
      });
      req.end();
    };
    attempt(maxRetries, 1000);
  });
}

/** 404 can be transient; retry a few times before declaring the tag finished. */
async function fetchTagPage(
  url: string,
  retries = 3,
): Promise<{ status: number; body: string; notFound: boolean }> {
  let last: FetchResult = { status: 0, body: '' };
  for (let i = 0; i < retries; i++) {
    if (i > 0) await sleep(1500 * i);
    try {
      last = await fetchText(url, 0, CRAWL_DEFAULTS.requestTimeoutMs);
    } catch (err) {
      if (i === retries - 1) throw err;
      continue;
    }
    if (last.status !== 404) break;
  }
  return { ...last, notFound: last.status === 404 };
}

async function fetchAllTagConfigs(): Promise<TagConfig[]> {
  const { body } = await fetchText(SITEMAP_TAGS_URL, CRAWL_DEFAULTS.maxRetries, CRAWL_DEFAULTS.requestTimeoutMs);
  const parsed = parseTagCounts(body);
  const fromSitemap = [...body.matchAll(/<loc>https:\/\/www\.freecodecamp\.org\/news\/tag\/([^<]+)\/<\/loc>/g)].map(
    (m) => ({ slug: decodeURIComponent(m[1]), label: m[1], count: 0 }),
  );
  const seen = new Set<string>();
  const merged: TagConfig[] = [];
  for (const tag of [...parsed, ...fromSitemap]) {
    if (seen.has(tag.slug)) continue;
    seen.add(tag.slug);
    merged.push({ slug: tag.slug, label: tag.label || tag.slug, count: tag.count });
  }
  return merged;
}

interface CrawlRuntime {
  store: ArchiveStore;
  state: CrawlState;
  options: CliOptions;
  totalPosts: number;
  newPostsThisRun: number;
  pagesThisRun: number;
  stopping: boolean;
}

async function crawlTag(
  tag: TagConfig,
  runtime: CrawlRuntime,
  urlFor: (slug: string, page: number) => string = tagPageUrl,
): Promise<void> {
  const { options, state, store } = runtime;
  const progress = state.tags[tag.slug] ?? { done: false, pagesFetched: 0, nextPage: 1 };
  state.tags[tag.slug] = progress;

  if (progress.done) {
    console.log(`[skip] #${tag.label} already complete (${progress.pagesFetched} pages)`);
    return;
  }

  let page = progress.nextPage;
  const label = `#${tag.slug}`;
  // Ids of the previously fetched page. Ghost repeats the final partial page
  // once pagination is exhausted, so a page whose ids are all contained in
  // the previous page marks the real end. A page that merely yields no new
  // posts does NOT: older pages can still hold unseen articles.
  let prevIds = new Set<string>();

  while (true) {
    if (runtime.stopping) {
      console.log(`[stop] ${label} paused at page ${page} (resume later with the same command)`);
      await store.saveState(state);
      return;
    }
    if (options.maxPages > 0 && progress.pagesFetched >= options.maxPages) {
      console.log(
        `[limit] ${label} reached --max-pages=${options.maxPages} (page ${progress.nextPage - 1} last fetched)`,
      );
      await store.saveState(state);
      return;
    }

    const url = urlFor(tag.slug, page);
    let result: Awaited<ReturnType<typeof fetchTagPage>>;
    try {
      result = await fetchTagPage(url);
    } catch (err) {
      progress.nextPage = page;
      state.errors.push({
        tag: tag.slug,
        page,
        status: err instanceof Error ? err.message : String(err),
        at: new Date().toISOString(),
      });
      await store.saveState(state);
      console.error(`[error] ${label} page ${page} failed: ${err instanceof Error ? err.message : err}`);
      return;
    }

    // Past-the-end pages are 404 with a template body; the tag is exhausted.
    // The 404 template may contain unrelated recommendation cards, so we
    // never ingest its content.
    if (result.notFound) {
      progress.done = true;
      progress.nextPage = page;
      console.log(`[done] ${label} page ${page} -> 404 after retries, pagination exhausted`);
      await store.saveState(state);
      await store.flush();
      return;
    }

    if (result.status !== 200) {
      state.errors.push({ tag: tag.slug, page, status: String(result.status), at: new Date().toISOString() });
      await store.saveState(state);
      console.error(`[error] ${label} page ${page} -> HTTP ${result.status}, resumable`);
      return;
    }

    const cards = parsePostCards(result.body);
    runtime.pagesThisRun++;
    progress.pagesFetched++;
    state.pagesFetched++;

    if (cards.length === 0) {
      progress.done = true;
      progress.nextPage = page;
      console.log(`[done] ${label} no posts on page ${page} — exhausted`);
      await store.saveState(state);
      await store.flush();
      return;
    }

    const currentIds = new Set(cards.map((c) => c.id));
    const isClampedRepeat = [...currentIds].every((id) => prevIds.has(id));

    const newOnPage = await store.upsertMany(cards, tag.slug);
    runtime.newPostsThisRun += newOnPage;
    runtime.totalPosts += newOnPage;

    if (isClampedRepeat) {
      progress.done = true;
      progress.nextPage = page;
      console.log(
        `[done] ${label} exhausted at page ${page} (clamped repeat of page ${page - 1}, +${newOnPage} new)`,
      );
      await store.saveState(state);
      await store.flush();
      return;
    }
    prevIds = currentIds;

    if (newOnPage > 0 || progress.pagesFetched % 10 === 0) {
      console.log(
        `[page] ${label} ${page} +${newOnPage} new  (tag ${progress.pagesFetched} pages, archive ${runtime.totalPosts} posts)`,
      );
    }
    page++;
    progress.nextPage = page;

    if (progress.pagesFetched % 10 === 0) {
      await store.saveState(state);
      await store.flush();
    }

    await sleep(options.delayMs);
  }
}

async function fillMissingPosts(runtime: CrawlRuntime): Promise<void> {
  const { options, store } = runtime;
  const paths = resolvePaths(options.outDir);
  const file = join(paths.root, 'missing-posts.txt');
  if (!existsSync(file)) {
    console.error(`[fill] ${file} not found — run npm run coverage:fcc first.`);
    return;
  }
  const slugs = readFileSync(file, 'utf8')
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);
  if (slugs.length === 0) {
    console.log('[fill] nothing to fill');
    return;
  }

  console.log(`[fill] ${slugs.length} posts to fetch from their own pages`);
  let filled = 0;
  for (const slug of slugs) {
    const url = `${FCC_NEWS_BASE}/${slug}/`;
    try {
      const { status, body, notFound } = await fetchTagPage(url);
      if (notFound || status !== 200) {
        console.warn(`[fill] ${slug} -> HTTP ${status}, skipped`);
        continue;
      }
      const card = parsePostPage(body, slug);
      if (!card) {
        console.warn(`[fill] ${slug} -> no metadata found, skipped`);
        continue;
      }
      const isNew = await store.upsertMany([card], '_postpage');
      if (isNew > 0) {
        filled++;
        console.log(`[fill] ${slug} -> archived (${card.authorName ?? 'no author'}, ${card.publishedAt?.slice(0, 10) ?? '?'})`);
      } else {
        console.log(`[fill] ${slug} -> merged into existing record`);
      }
    } catch (err) {
      console.error(`[fill] ${slug} failed: ${err instanceof Error ? err.message : err}`);
    }
    await sleep(options.delayMs);
  }

  await store.flush();
  console.log(`[fill] done: ${filled}/${slugs.length} posts added`);
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  const store = await createStore(options.store, options.outDir);
  console.log(`[store] ${store.describe()}`);

  let tagConfigs: TagConfig[];
  if (options.allTags) {
    console.log('[tags] discovering every tag from the sitemap...');
    tagConfigs = await fetchAllTagConfigs();
    console.log(`[tags] ${tagConfigs.length} tags discovered`);
    if (options.index) {
      tagConfigs.unshift({ slug: INDEX_SOURCE, label: 'Home feed', count: 0 });
    }
  } else if (options.index && !options.tagsExplicit) {
    // Index-only sweep: the home feed covers every post on the site.
    tagConfigs = [{ slug: INDEX_SOURCE, label: 'Home feed', count: 0 }];
    console.log('[tags] sweeping the home feed (/news//N/) — covers every post');
  } else {
    const bySlug = new Map(DEFAULT_TAGS.map((t) => [t.slug, t]));
    tagConfigs = options.tags.map((slug) => bySlug.get(slug) ?? { slug, label: slug, count: 0 });
    if (options.index) {
      tagConfigs.unshift({ slug: INDEX_SOURCE, label: 'Home feed', count: 0 });
    }
    const expected = tagConfigs.reduce((sum, t) => sum + t.count, 0);
    console.log(`[tags] ${tagConfigs.length} configured tags, ${expected} post slots expected`);
  }

  const posts: Map<string, PostRecord> = options.resume ? await store.loadPosts() : new Map();
  const state = options.resume ? await store.loadState() : await store.loadState();
  if (!options.resume) {
    state.tags = {};
    state.errors = [];
    state.pagesFetched = 0;
    state.startedAt = new Date().toISOString();
  }
  if (options.reset.length > 0) {
    const slugs = options.reset.includes('all') ? Object.keys(state.tags) : options.reset;
    for (const slug of slugs) {
      if (state.tags[slug]) {
        delete state.tags[slug];
        console.log(`[reset] progress cleared for #${slug} (archived posts are kept)`);
      }
    }
  }

  const runtime: CrawlRuntime = {
    store,
    state,
    options,
    totalPosts: posts.size,
    newPostsThisRun: 0,
    pagesThisRun: 0,
    stopping: false,
  };

  if (options.fillMissing && !options.tagsExplicit && !options.allTags) {
    await fillMissingPosts(runtime);
    await store.close();
    return;
  }

  const shutdown = (signal: string) => {
    if (runtime.stopping) process.exit(1);
    console.log(`\n[signal] ${signal} received — finishing in-flight requests and saving...`);
    runtime.stopping = true;
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  const queue = [...tagConfigs];
  const workers = Array.from({ length: Math.min(options.concurrency, queue.length) }, async () => {
    while (queue.length > 0 && !runtime.stopping) {
      const tag = queue.shift();
      if (!tag) break;
      const urlFor =
        tag.slug === INDEX_SOURCE ? (slug: string, page: number) => indexPageUrl(page) : tagPageUrl;
      await crawlTag(tag, runtime, urlFor);
    }
  });
  await Promise.all(workers);

  await store.saveState(state);
  await store.flush();

  const doneTags = tagConfigs.filter((t) => state.tags[t.slug]?.done).length;
  console.log(`
=== crawl summary ===
store         : ${store.describe()}
tags complete : ${doneTags}/${tagConfigs.length}
pages fetched : ${runtime.pagesThisRun} this run (${state.pagesFetched} total)
posts archived: ${runtime.totalPosts} unique (+${runtime.newPostsThisRun} this run)
errors        : ${state.errors.length}
`);

  await store.close();
}

main().catch(async (err) => {
  console.error(err);
  process.exit(1);
});
