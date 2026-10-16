/**
 * Persistent storage for the freeCodeCamp archive.
 *
 * - posts.jsonl : one JSON record per article (upserted by id)
 * - state.json  : crawl progress per tag so runs are resumable
 *
 * Both files are written atomically (tmp file + rename) so an interrupted
 * run never leaves a half-written dataset behind.
 */

import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { PostCard } from './parser';

export interface PostRecord {
  id: string;
  title: string;
  url: string;
  authorName: string | null;
  authorUrl: string | null;
  publishedAt: string | null;
  coverImage: string | null;
  /** Tag labels found on the listing card, e.g. "#async/await". */
  tags: string[];
  /** Tag slugs found on the listing card. */
  tagSlugs: string[];
  /** Archive tags this post was discovered through. */
  foundInTags: string[];
  firstSeenAt: string;
  lastSeenAt: string;
}

export interface TagProgress {
  done: boolean;
  pagesFetched: number;
  nextPage: number;
}

export interface CrawlState {
  version: number;
  startedAt: string;
  updatedAt: string;
  pagesFetched: number;
  retries: number;
  tags: Record<string, TagProgress>;
  errors: Array<{ tag: string; page: number; status: string; at: string }>;
}

export interface Paths {
  root: string;
  postsFile: string;
  stateFile: string;
  sharedDir: string;
}

export function resolvePaths(outDir: string): Paths {
  const root = outDir;
  return {
    root,
    postsFile: join(root, 'posts.jsonl'),
    stateFile: join(root, 'state.json'),
    sharedDir: join(root, 'shared'),
  };
}

export function ensureDirs(paths: Paths): void {
  mkdirSync(paths.root, { recursive: true });
  mkdirSync(paths.sharedDir, { recursive: true });
}

export function loadPosts(paths: Paths): Map<string, PostRecord> {
  const posts = new Map<string, PostRecord>();
  if (!existsSync(paths.postsFile)) return posts;
  const content = readFileSync(paths.postsFile, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      const record = JSON.parse(trimmed) as PostRecord;
      posts.set(record.id, record);
    } catch {
      console.warn(`[store] skipping malformed line in ${paths.postsFile}`);
    }
  }
  return posts;
}

export function savePosts(paths: Paths, posts: Map<string, PostRecord>): void {
  const lines = [...posts.values()].map((p) => JSON.stringify(p));
  atomicWrite(paths.postsFile, `${lines.join('\n')}\n`);
}

/**
 * Merges a parsed listing card into an archive record (pure function shared
 * by the file and MongoDB backends). Returns the merged record plus whether
 * it was created for the first time.
 */
export function mergeCard(
  existing: PostRecord | undefined,
  card: PostCard,
  sourceTag: string,
  now = new Date().toISOString(),
): { record: PostRecord; isNew: boolean } {
  if (existing) {
    existing.title = card.title || existing.title;
    existing.authorName = card.authorName ?? existing.authorName;
    existing.authorUrl = card.authorUrl ?? existing.authorUrl;
    existing.publishedAt = card.publishedAt ?? existing.publishedAt;
    existing.coverImage = card.coverImage ?? existing.coverImage;
    existing.tags = mergeUnique(existing.tags, card.tagText ? [card.tagText] : []);
    existing.tagSlugs = mergeUnique(existing.tagSlugs, card.tagSlug ? [card.tagSlug] : []);
    existing.foundInTags = mergeUnique(existing.foundInTags, [sourceTag]);
    existing.lastSeenAt = now;
    return { record: existing, isNew: false };
  }

  const record: PostRecord = {
    id: card.id,
    title: card.title,
    url: card.url,
    authorName: card.authorName,
    authorUrl: card.authorUrl,
    publishedAt: card.publishedAt,
    coverImage: card.coverImage,
    tags: card.tagText ? [card.tagText] : [],
    tagSlugs: card.tagSlug ? [card.tagSlug] : [],
    foundInTags: [sourceTag],
    firstSeenAt: now,
    lastSeenAt: now,
  };
  return { record, isNew: true };
}

export function loadState(paths: Paths): CrawlState {
  const fresh: CrawlState = {
    version: 1,
    startedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    pagesFetched: 0,
    retries: 0,
    tags: {},
    errors: [],
  };
  if (!existsSync(paths.stateFile)) return fresh;
  try {
    const parsed = JSON.parse(readFileSync(paths.stateFile, 'utf8')) as CrawlState;
    return { ...fresh, ...parsed };
  } catch {
    console.warn('[store] state.json corrupted, starting fresh');
    return fresh;
  }
}

export function saveState(paths: Paths, state: CrawlState): void {
  state.updatedAt = new Date().toISOString();
  atomicWrite(paths.stateFile, `${JSON.stringify(state, null, 2)}\n`);
}

export function mergeUnique<T>(target: T[], extra: T[]): T[] {
  const out = [...target];
  for (const item of extra) {
    if (!out.includes(item)) out.push(item);
  }
  return out;
}

function atomicWrite(file: string, content: string): void {
  const tmp = `${file}.tmp`;
  writeFileSync(tmp, content, 'utf8');
  renameSync(tmp, file);
}
