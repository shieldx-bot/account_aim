/**
 * Chooses the archive backend:
 *   --store auto   -> MongoDB when MONGODB_URI is set, else JSONL files
 *   --store mongo  -> force MongoDB
 *   --store file   -> force JSONL files
 */

import { resolvePaths, type CrawlState, type Paths, type PostRecord } from './store';
import { MongoArchive, mongoConfigFromEnv } from './mongo-store';
import type { ArchiveStore } from './archive-store';
import { mergeCard, loadPosts as loadFilePosts, savePosts as saveFilePosts, loadState as loadFileState, saveState as saveFileState } from './store';
import type { PostCard } from './parser';

export type StoreKind = 'auto' | 'file' | 'mongo';

class FileArchive implements ArchiveStore {
  readonly kind = 'file' as const;
  private posts: Map<string, PostRecord> = new Map();

  constructor(private readonly paths: Paths) {}

  describe(): string {
    return `file:${this.paths.postsFile}`;
  }

  async loadPosts(): Promise<Map<string, PostRecord>> {
    this.posts = loadFilePosts(this.paths);
    return this.posts;
  }

  async upsertMany(cards: PostCard[], sourceTag: string): Promise<number> {
    let newPosts = 0;
    for (const card of cards) {
      const { record, isNew } = mergeCard(this.posts.get(card.id), card, sourceTag);
      this.posts.set(card.id, record);
      if (isNew) newPosts++;
    }
    return newPosts;
  }

  async loadState(): Promise<CrawlState> {
    return loadFileState(this.paths);
  }

  async saveState(state: CrawlState): Promise<void> {
    saveFileState(this.paths, state);
  }

  async flush(): Promise<void> {
    saveFilePosts(this.paths, this.posts);
  }

  async close(): Promise<void> {}
}

export async function createStore(kind: StoreKind, outDir: string): Promise<ArchiveStore> {
  const mongoCfg = mongoConfigFromEnv();
  const useMongo = kind === 'mongo' || (kind === 'auto' && mongoCfg !== null);

  if (useMongo) {
    if (!mongoCfg) {
      throw new Error('MongoDB store requested but MONGODB_URI is not set (see server/.env).');
    }
    return MongoArchive.connect(mongoCfg);
  }

  const paths = resolvePaths(outDir);
  const { ensureDirs } = await import('./store');
  ensureDirs(paths);
  return new FileArchive(paths);
}
