#!/usr/bin/env node
/**
 * Coverage report: compares the archived posts with the site's official
 * post sitemap (sitemap-posts.xml) so we can prove how much of the
 * freeCodeCamp archive we captured.
 *
 * Usage: npm run coverage:fcc -- --store mongo
 */

import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { SITEMAP_POSTS_URL } from './config';
import { resolvePaths } from './store';
import { createStore, type StoreKind } from './store-factory';

function parseArgs(argv: string[]): { outDir: string; store: StoreKind } {
  const outDir = argv[argv.indexOf('--out') + 1] ?? 'data/fcc-news';
  const storeArg = argv[argv.indexOf('--store') + 1];
  const store: StoreKind = storeArg && ['auto', 'file', 'mongo'].includes(storeArg) ? (storeArg as StoreKind) : 'auto';
  return { outDir, store };
}

async function main(): Promise<void> {
  const { outDir, store: storeKind } = parseArgs(process.argv.slice(2));
  const paths = resolvePaths(outDir);
  const store = await createStore(storeKind, outDir);
  const posts = await store.loadPosts();
  if (posts.size === 0) {
    console.error(`Archive is empty (${store.describe()}) — run the crawler first: npm run crawl:fcc.`);
    await store.close();
    process.exit(1);
  }

  console.log(`[coverage] downloading ${SITEMAP_POSTS_URL} ...`);
  const res = await fetch(SITEMAP_POSTS_URL, {
    headers: { 'User-Agent': 'fcc-news-archiver/1.0', Accept: 'application/xml' },
  });
  if (!res.ok) {
    console.error(`[coverage] sitemap HTTP ${res.status}`);
    await store.close();
    process.exit(1);
  }
  const xml = await res.text();

  const sitemapIds = [...xml.matchAll(/<loc>https:\/\/www\.freecodecamp\.org\/news\/([^<]+)\/<\/loc>/g)]
    .map((m) => decodeURIComponent(m[1]))
    .filter((slug) => slug && !['about', 'support', 'shop', 'donate'].includes(slug));

  const archived = new Set(posts.keys());
  const missing = sitemapIds.filter((id) => !archived.has(id));
  const extra = [...archived].filter((id) => !sitemapIds.includes(id));

  const report = [
    '# freeCodeCamp News — báo cáo độ phủ',
    '',
    `- Archive: ${store.describe()}`,
    `- Sitemap posts: ${sitemapIds.length}`,
    `- Archived posts: ${archived.size}`,
    `- Covered: ${sitemapIds.length - missing.length} (${(((sitemapIds.length - missing.length) / sitemapIds.length) * 100).toFixed(2)}%)`,
    `- Missing: ${missing.length}`,
    `- Archived but not in sitemap: ${extra.length}`,
    '',
  ].join('\n');

  writeFileSync(join(paths.root, 'coverage.md'), report, 'utf8');
  writeFileSync(join(paths.root, 'missing-posts.txt'), `${missing.join('\n')}\n`, 'utf8');
  console.log(report);
  console.log(`[coverage] report: ${join(paths.root, 'coverage.md')}`);
  await store.close();
}

main().catch(async (err) => {
  console.error(err);
  process.exit(1);
});
