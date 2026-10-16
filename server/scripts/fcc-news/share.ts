#!/usr/bin/env node
/**
 * freeCodeCamp News sharing bundle generator.
 *
 * Reads the archived posts (posts.jsonl) and produces ready-to-share packs
 * where EVERY entry carries explicit source attribution:
 *   - author + author profile URL
 *   - publisher: freeCodeCamp.org
 *   - original permalink
 *   - ready-made citation strings (Vietnamese + English)
 *
 * Usage:
 *   npm run share:fcc                          # all tags -> shared/
 *   npm run share:fcc -- --tag programming     # one tag only
 *   npm run share:fcc -- --limit 20            # spot check a small pack
 */

import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ATTRIBUTION, DEFAULT_TAGS } from './config';
import { resolvePaths, type PostRecord } from './store';
import { createStore, type StoreKind } from './store-factory';

interface ShareOptions {
  outDir: string;
  tag: string | null;
  limit: number;
  sort: 'newest' | 'oldest';
  store: StoreKind;
}

function parseArgs(argv: string[]): ShareOptions {
  const options: ShareOptions = {
    outDir: 'data/fcc-news',
    tag: null,
    limit: 0,
    sort: 'newest',
    store: 'auto',
  };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const next = argv[i + 1];
    if (arg === '--out') {
      options.outDir = next;
      i++;
    } else if (arg === '--tag') {
      options.tag = next;
      i++;
    } else if (arg === '--limit') {
      options.limit = Number(next) || 0;
      i++;
    } else if (arg === '--sort') {
      options.sort = next === 'oldest' ? 'oldest' : 'newest';
      i++;
    } else if (arg === '--store') {
      options.store = (['auto', 'file', 'mongo'].includes(next) ? next : 'auto') as StoreKind;
      i++;
    } else if (arg === '--help') {
      console.log(`
freeCodeCamp sharing bundle generator

  --out <dir>      archive location (default: data/fcc-news for JSONL)
  --store <kind>   auto | file | mongo (default: auto -> mongo if MONGODB_URI set)
  --tag <slug>     only generate the pack for one tag
  --limit <n>      cap entries per tag (default: unlimited)
  --sort <order>   newest | oldest (default: newest)
`);
      process.exit(0);
    }
  }
  return options;
}

const MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatDate(iso: string | null): { vi: string; en: string; ymd: string | null } {
  if (!iso) return { vi: 'không rõ', en: 'n/a', ymd: null };
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { vi: 'không rõ', en: 'n/a', ymd: null };
  const ymd = d.toISOString().slice(0, 10);
  return {
    vi: `${String(d.getUTCDate()).padStart(2, '0')}/${String(d.getUTCMonth() + 1).padStart(2, '0')}/${d.getUTCFullYear()}`,
    en: `${MONTHS_EN[d.getUTCMonth()]} ${String(d.getUTCDate()).padStart(2, '0')}, ${d.getUTCFullYear()}`,
    ymd,
  };
}

function citationVi(p: PostRecord): string {
  const date = formatDate(p.publishedAt);
  const author = p.authorName ? `${p.authorName}, ` : '';
  return `“${p.title}” — ${author}${ATTRIBUTION.publisher}, ${date.vi}. ${p.url}`;
}

function citationEn(p: PostRecord): string {
  const date = formatDate(p.publishedAt);
  const author = p.authorName ?? ATTRIBUTION.publisher;
  return `${author} (${date.en}). ${p.title}. ${ATTRIBUTION.publisher}. ${p.url}`;
}

function escapeMarkdown(text: string): string {
  return text.replace(/([\\`*_[\]<>])/g, '\\$1');
}

interface TagPack {
  slug: string;
  label: string;
  posts: PostRecord[];
}

function buildPacks(posts: Map<string, PostRecord>, options: ShareOptions): TagPack[] {
  const tagSlugs = options.tag ? [options.tag] : DEFAULT_TAGS.map((t) => t.slug);
  const labelBySlug = new Map(DEFAULT_TAGS.map((t) => [t.slug, t.label]));
  const packs: TagPack[] = [];

  for (const slug of tagSlugs) {
    const matched = [...posts.values()].filter((p) => p.foundInTags.includes(slug));
    matched.sort((a, b) => {
      const av = a.publishedAt ?? '';
      const bv = b.publishedAt ?? '';
      return options.sort === 'newest' ? bv.localeCompare(av) : av.localeCompare(bv);
    });
    if (options.limit > 0) matched.length = Math.min(matched.length, options.limit);
    packs.push({ slug, label: labelBySlug.get(slug) ?? slug, posts: matched });
  }
  return packs;
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  const paths = resolvePaths(options.outDir);
  const store = await createStore(options.store, options.outDir);
  const posts = await store.loadPosts();
  if (posts.size === 0) {
    console.error(`Archive is empty (${store.describe()}) — run the crawler first: npm run crawl:fcc.`);
    await store.close();
    process.exit(1);
  }

  const collectedAt = new Date().toISOString();
  const packs = buildPacks(posts, options);
  mkdirSync(paths.sharedDir, { recursive: true });

  const citationLines: string[] = [];
  for (const pack of packs) {
    const file = join(paths.sharedDir, `${pack.slug}.md`);
    writeFileSync(file, renderPack(pack, collectedAt), 'utf8');
    for (const p of pack.posts) {
      citationLines.push(
        JSON.stringify({
          id: p.id,
          title: p.title,
          author: p.authorName,
          authorUrl: p.authorUrl,
          publishedAt: p.publishedAt,
          url: p.url,
          tag: pack.slug,
          citationVi: citationVi(p),
          citationEn: citationEn(p),
          attribution: `${ATTRIBUTION.publisher} (${ATTRIBUTION.publisherUrl}) — ${ATTRIBUTION.charityNote}`,
        }),
      );
    }
    console.log(`[share] #${pack.slug}: ${pack.posts.length} posts -> ${file}`);
  }

  writeFileSync(join(paths.sharedDir, 'index.md'), renderIndex(packs, posts.size, collectedAt), 'utf8');
  writeFileSync(join(paths.sharedDir, 'citations.jsonl'), `${citationLines.join('\n')}\n`, 'utf8');
  console.log(`[share] citations.jsonl: ${citationLines.length} entries`);
  console.log(`[share] index: ${join(paths.sharedDir, 'index.md')}`);
  await store.close();
}

main().catch(async (err) => {
  console.error(err);
  process.exit(1);
});

function renderPack(pack: TagPack, collectedAt: string): string {
  const lines: string[] = [];
  lines.push(`# Chia sẻ lại bài viết freeCodeCamp — ${pack.label}`);
  lines.push('');
  lines.push(`- **Nguồn gốc:** https://www.freecodecamp.org/news/tag/${pack.slug}/`);
  lines.push(`- **Nhà xuất bản:** ${ATTRIBUTION.publisher} — ${ATTRIBUTION.charityNote}`);
  lines.push(`- **Số bài viết trong bộ:** ${pack.posts.length} (mới nhất trước)`);
  lines.push(`- **Ngày thu thập:** ${collectedAt}`);
  lines.push('');
  lines.push(
    '> **Lưu ý bản quyền:** Toàn bộ bài viết thuộc bản quyền của tác giả tương ứng và ' +
      `${ATTRIBUTION.publisher}. Khi chia sẻ lại, bắt buộc ghi rõ nguồn trích dẫn: tên tác giả, ` +
      `"${ATTRIBUTION.publisher}", đường dẫn bài gốc và ngày xuất bản.`,
  );
  lines.push('');
  lines.push('---');

  pack.posts.forEach((p, index) => {
    const date = formatDate(p.publishedAt);
    const author = p.authorName ?? 'Không rõ tác giả';
    lines.push('');
    lines.push(`### ${index + 1}. ${escapeMarkdown(p.title)}`);
    lines.push('');
    lines.push(`- **Tác giả:** ${escapeMarkdown(author)}${p.authorUrl ? ` — <${p.authorUrl}>` : ''}`);
    lines.push(`- **Ngày xuất bản:** ${date.vi}`);
    lines.push(`- **Chủ đề:** ${p.tags.length > 0 ? p.tags.map(escapeMarkdown).join(', ') : '(không có)'}`);
    lines.push(`- **Bài gốc:** ${p.url}`);
    lines.push('');
    lines.push('**Trích dẫn khi chia sẻ (Vietnamese):**');
    lines.push('');
    lines.push(`> ${escapeMarkdown(citationVi(p))}`);
    lines.push('');
    lines.push('**Citation (English):**');
    lines.push('');
    lines.push(`> ${escapeMarkdown(citationEn(p))}`);
  });
  lines.push('');
  return lines.join('\n');
}

function renderIndex(packs: TagPack[], totalPosts: number, collectedAt: string): string {
  const lines: string[] = [];
  lines.push('# freeCodeCamp News — Bộ chia sẻ có trích dẫn nguồn');
  lines.push('');
  lines.push(`- **Nguồn:** ${ATTRIBUTION.publisherUrl}`);
  lines.push(`- **Nhà xuất bản:** ${ATTRIBUTION.publisher} — ${ATTRIBUTION.charityNote}`);
  lines.push(`- **Tổng số bài viết đã lưu:** ${totalPosts}`);
  lines.push(`- **Ngày thu thập:** ${collectedAt}`);
  lines.push('');
  lines.push('Mỗi thẻ (tag) có một bộ chia sẻ riêng. Mọi mục trong các bộ này đều ghi rõ tác giả, nguồn và đường dẫn bài gốc.');
  lines.push('');
  lines.push('| Tag | Bài viết | Tệp |');
  lines.push('| --- | --- | --- |');
  for (const pack of packs) {
    lines.push(`| ${pack.label} | ${pack.posts.length} | [${pack.slug}.md](./${pack.slug}.md) |`);
  }
  lines.push('');
  lines.push('## Trích dẫn mẫu');
  lines.push('');
  lines.push('```text');
  lines.push('“Tiêu đề bài viết” — Tên tác giả, freeCodeCamp.org, dd/mm/yyyy. https://www.freecodecamp.org/news/slug/');
  lines.push('```');
  lines.push('');
  lines.push(
    `Khi chia sẻ lại nội dung từ ${ATTRIBUTION.publisher}, vui lòng giữ nguyên tên tác giả, ghi rõ ` +
      `"${ATTRIBUTION.publisher}" làm nguồn và đính kèm đường dẫn bài gốc.`,
  );
  lines.push('');
  return lines.join('\n');
}

main().catch(async (err) => {
  console.error(err);
  process.exit(1);
});
