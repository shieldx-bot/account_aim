/**
 * Backend-agnostic archive interface.
 *
 * The crawler only talks to an ArchiveStore, so the same crawl can target
 * either local JSONL files or MongoDB (server/data/fcc-news vs Atlas).
 */

import type { PostCard } from './parser';
import type { CrawlState, PostRecord } from './store';

export interface ArchiveStore {
  readonly kind: 'file' | 'mongo';
  /** Human readable location shown in logs. */
  describe(): string;
  loadPosts(): Promise<Map<string, PostRecord>>;
  /** Merges cards into the archive, returns how many were brand new. */
  upsertMany(cards: PostCard[], sourceTag: string): Promise<number>;
  loadState(): Promise<CrawlState>;
  saveState(state: CrawlState): Promise<void>;
  /** Persists anything buffered in memory. */
  flush(): Promise<void>;
  close(): Promise<void>;
}
