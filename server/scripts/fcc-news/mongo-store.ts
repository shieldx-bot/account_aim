/**
 * MongoDB backend for the freeCodeCamp archive.
 *
 * Documents live in a collection keyed by the article slug (_id = slug) so
 * merges stay idempotent across resumed crawls and repeated tag passes.
 * Crawl progress is kept in a single `crawl_state` document.
 */

import { MongoClient, type Collection } from 'mongodb';
import { config } from 'dotenv';
import type { PostCard } from './parser';
import { mergeCard, type CrawlState, type PostRecord } from './store';
import type { ArchiveStore } from './archive-store';

config();

export interface MongoArchiveConfig {
  uri: string;
  dbName: string;
  postsCollection: string;
}

export function mongoConfigFromEnv(): MongoArchiveConfig | null {
  const uri = process.env.MONGODB_URI;
  if (!uri) return null;
  return {
    uri,
    dbName: process.env.FCC_MONGODB_DB || 'fcc_news',
    postsCollection: process.env.FCC_MONGODB_COLLECTION || 'posts',
  };
}

const STATE_DOC_ID = 'current';

export class MongoArchive implements ArchiveStore {
  readonly kind = 'mongo' as const;
  private readonly client: MongoClient;
  private readonly postsCol: Collection<PostRecord & { _id: string }>;
  private readonly stateCol: Collection<CrawlState & { _id: string }>;

  private constructor(client: MongoClient, cfg: MongoArchiveConfig) {
    this.client = client;
    const db = client.db(cfg.dbName);
    this.postsCol = db.collection<PostRecord & { _id: string }>(cfg.postsCollection);
    this.stateCol = db.collection<CrawlState & { _id: string }>('crawl_state');
  }

  static async connect(cfg: MongoArchiveConfig): Promise<MongoArchive> {
    const client = new MongoClient(cfg.uri, {
      serverSelectionTimeoutMS: 15_000,
      connectTimeoutMS: 15_000,
    });
    await client.connect();
    // Fail fast with a clear message when the cluster is unreachable.
    await client.db(cfg.dbName).command({ ping: 1 });
    const archive = new MongoArchive(client, cfg);
    await archive.ensureIndexes();
    return archive;
  }

  private async ensureIndexes(): Promise<void> {
    await this.postsCol.createIndexes([
      { key: { foundInTags: 1 }, name: 'foundInTags_1' },
      { key: { publishedAt: -1 }, name: 'publishedAt_-1' },
      { key: { authorName: 1 }, name: 'authorName_1' },
      { key: { title: 'text' }, name: 'title_text' },
    ]);
  }

  describe(): string {
    return `mongodb:${this.postsCol.dbName}/${this.postsCol.collectionName}`;
  }

  async loadPosts(): Promise<Map<string, PostRecord>> {
    const posts = new Map<string, PostRecord>();
    for await (const doc of this.postsCol.find({})) {
      const { _id, ...record } = doc;
      posts.set(_id, record as PostRecord);
    }
    return posts;
  }

  async upsertMany(cards: PostCard[], sourceTag: string): Promise<number> {
    if (cards.length === 0) return 0;
    const now = new Date().toISOString();

    const existingDocs = await this.postsCol
      .find({ _id: { $in: cards.map((c) => c.id) } })
      .toArray();
    const byId = new Map(existingDocs.map((d) => [d._id, { ...(d as PostRecord & { _id: string }) }]));

    const operations = [];
    let newPosts = 0;
    for (const card of cards) {
      const existing = byId.get(card.id);
      const { record, isNew } = mergeCard(existing, card, sourceTag, now);
      if (isNew) newPosts++;
      operations.push({
        replaceOne: {
          filter: { _id: card.id },
          replacement: { _id: card.id, ...record },
          upsert: true,
        },
      });
    }
    await this.postsCol.bulkWrite(operations, { ordered: false });
    return newPosts;
  }

  async loadState(): Promise<CrawlState> {
    const doc = await this.stateCol.findOne({ _id: STATE_DOC_ID });
    if (!doc) {
      return {
        version: 1,
        startedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        pagesFetched: 0,
        retries: 0,
        tags: {},
        errors: [],
      };
    }
    const { _id, ...rest } = doc;
    void _id;
    return rest;
  }

  async saveState(state: CrawlState): Promise<void> {
    const stamped = { ...state, updatedAt: new Date().toISOString() };
    await this.stateCol.updateOne(
      { _id: STATE_DOC_ID },
      { $set: { ...stamped, _id: STATE_DOC_ID } },
      { upsert: true },
    );
  }

  async flush(): Promise<void> {
    // Writes are already durable (write concern majority is not required here,
    // default is fine for an archive that can be re-crawled at any time).
  }

  async close(): Promise<void> {
    await this.client.close();
  }
}
