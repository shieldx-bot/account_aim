import { MongoClient } from 'mongodb';
import { webcrypto } from 'node:crypto';
import { config } from 'dotenv';

// Node 18 has no global Web Crypto API, which the mongodb driver's SCRAM
// authentication needs. Production runs Node 20+ (globalThis.crypto exists),
// so this only affects older local/dev runtimes.
if (typeof globalThis.crypto === 'undefined') {
  Object.defineProperty(globalThis, 'crypto', { value: webcrypto, configurable: true });
}

// Idempotent — the server root already loads .env via config/env.ts; this
// keeps the service self-sufficient for the crawler scripts and CLI checks.
config();

/**
 * Read model for the freeCodeCamp news archive (MongoDB).
 *
 * The archive is written by the crawler in `scripts/fcc-news/` (collection
 * `posts`, `_id` = article slug). Documents carry crawler metadata only —
 * title, original URL, author, publish date, cover image and tags — so the
 * public surface links back to the original article instead of copying its
 * body. Every consumer MUST keep the freeCodeCamp attribution visible.
 */

export interface FccArchivePost {
  id: string;
  title: string;
  url: string;
  authorName: string | null;
  publishedAt: string | null;
  coverImage: string | null;
  tags: string[];
}

export interface FccArchiveTag {
  /** Tag label as stored, e.g. "#JavaScript". */
  label: string;
  /** URL/filter friendly form, e.g. "javascript". */
  slug: string;
  count: number;
}

export interface FccArchiveTagPage {
  tags: FccArchiveTag[];
  /** Total distinct tags — drives the topic-index pagination. */
  total: number;
  page: number;
  totalPages: number;
  limit: number;
}

export interface FccArchiveListResult {
  posts: FccArchivePost[];
  total: number;
  page: number;
  totalPages: number;
  limit: number;
}

export interface FccArchiveConfig {
  uri: string;
  dbName: string;
  postsCollection: string;
}

export function fccArchiveConfigFromEnv(): FccArchiveConfig | null {
  const uri = process.env.MONGODB_URI;
  if (!uri) return null;
  return {
    uri,
    dbName: process.env.FCC_MONGODB_DB || 'fcc_news',
    postsCollection: process.env.FCC_MONGODB_COLLECTION || 'posts',
  };
}

/** Tag cache TTL — counts change only when the crawler runs again. */
const TAG_CACHE_TTL_MS = 5 * 60 * 1000;

let clientPromise: Promise<MongoClient> | null = null;
let tagCache: { expiresAt: number; tags: FccArchiveTag[] } | null = null;

/**
 * Lazily connect (and cache the connection) so the API boots fine when
 * MONGODB_URI is unset or the cluster is temporarily unreachable — only the
 * archive endpoints fail, the rest of the backend keeps serving.
 */
async function getClient(cfg: FccArchiveConfig): Promise<MongoClient> {
  if (!clientPromise) {
    const client = new MongoClient(cfg.uri, {
      serverSelectionTimeoutMS: 15_000,
      connectTimeoutMS: 15_000,
      maxPoolSize: 10,
    });
    clientPromise = client.connect().then(() => client);
    clientPromise.catch(() => {
      // Allow the next request to retry the connection.
      clientPromise = null;
    });
  }
  return clientPromise;
}

/** Escape user input before embedding it in a RegExp. */
const escapeRegex = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** "#Data Science" → "data-space" style slug used for filter pills/URLs. */
const tagSlug = (label: string): string =>
  label
    .replace(/^#/, '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const PROJECTION = {
  _id: 0,
  id: 1,
  title: 1,
  url: 1,
  authorName: 1,
  publishedAt: 1,
  coverImage: 1,
  tags: 1,
} as const;

/**
 * Paginated feed of archived posts, newest first.
 * `q` matches the title (case-insensitive), `tag` matches any stored tag
 * (case-insensitive, with or without the leading "#").
 */
export async function listArchivePosts(params: {
  page?: number;
  limit?: number;
  q?: string;
  tag?: string;
}): Promise<FccArchiveListResult> {
  const cfg = fccArchiveConfigFromEnv();
  if (!cfg) throw new Error('MONGODB_URI is not configured for the article archive.');

  const page = Math.max(1, Math.floor(params.page ?? 1));
  const limit = Math.min(48, Math.max(1, Math.floor(params.limit ?? 12)));
  const filter: Record<string, unknown> = {};

  const q = params.q?.trim();
  if (q) filter.title = { $regex: escapeRegex(q), $options: 'i' };

  const tag = params.tag?.trim();
  if (tag) {
    const bare = tag.replace(/^#/, '');
    filter.tags = { $regex: `^#?${escapeRegex(bare)}$`, $options: 'i' };
  }

  const client = await getClient(cfg);
  const col = client.db(cfg.dbName).collection(cfg.postsCollection);

  const [total, docs] = await Promise.all([
    col.countDocuments(filter),
    col
      .find(filter, { projection: PROJECTION })
      .sort({ publishedAt: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray(),
  ]);

  return {
    posts: docs.map((doc) => ({
      id: String(doc.id ?? ''),
      title: String(doc.title ?? ''),
      url: String(doc.url ?? ''),
      authorName: doc.authorName ?? null,
      publishedAt: doc.publishedAt ?? null,
      coverImage: doc.coverImage ?? null,
      tags: Array.isArray(doc.tags) ? doc.tags.filter((t: unknown) => typeof t === 'string') : [],
    })),
    total,
    page,
    totalPages: Math.max(1, Math.ceil(total / limit)),
    limit,
  };
}

/**
 * Topics (tags) by post count, paginated — powers the blog topic index.
 * The full sorted list is cached for a few minutes; pages are sliced from it.
 */
export async function listArchiveTags(params?: {
  page?: number;
  limit?: number;
}): Promise<FccArchiveTagPage> {
  const cfg = fccArchiveConfigFromEnv();
  if (!cfg) throw new Error('MONGODB_URI is not configured for the article archive.');

  const page = Math.max(1, Math.floor(params?.page ?? 1));
  const limit = Math.min(120, Math.max(1, Math.floor(params?.limit ?? 60)));

  const all = await loadAllTags(cfg);

  return {
    tags: all.slice((page - 1) * limit, page * limit),
    total: all.length,
    page,
    totalPages: Math.max(1, Math.ceil(all.length / limit)),
    limit,
  };
}

/** Full tag list by post count, cached for TAG_CACHE_TTL_MS. */
const loadAllTags = async (cfg: FccArchiveConfig): Promise<FccArchiveTag[]> => {
  if (tagCache && tagCache.expiresAt > Date.now()) return tagCache.tags;

  const client = await getClient(cfg);
  const col = client.db(cfg.dbName).collection(cfg.postsCollection);

  const rows = await col
    .aggregate<{ _id: string; count: number }>([
      { $match: { tags: { $exists: true, $nin: [null, []] } } },
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1, _id: 1 } },
    ])
    .toArray();

  // Collapse case variants ("#JavaScript" vs "#javascript") onto one slug.
  const bySlug = new Map<string, FccArchiveTag>();
  for (const row of rows) {
    const label = String(row._id ?? '').trim();
    if (!label) continue;
    const slug = tagSlug(label);
    if (!slug) continue;
    const existing = bySlug.get(slug);
    if (existing) {
      existing.count += row.count;
      // Keep the most "canonical" casing: prefer the variant starting with '#'.
      if (!existing.label.startsWith('#') && label.startsWith('#')) existing.label = label;
    } else {
      bySlug.set(slug, { label, slug, count: row.count });
    }
  }

  const tags = [...bySlug.values()].sort((a, b) => b.count - a.count);
  tagCache = { expiresAt: Date.now() + TAG_CACHE_TTL_MS, tags };
  return tags;
};

/** Total archived post count (cheap collection scan on ~13k docs). */
export async function countArchivePosts(): Promise<number> {
  const cfg = fccArchiveConfigFromEnv();
  if (!cfg) throw new Error('MONGODB_URI is not configured for the article archive.');
  const client = await getClient(cfg);
  return client.db(cfg.dbName).collection(cfg.postsCollection).countDocuments({});
}
