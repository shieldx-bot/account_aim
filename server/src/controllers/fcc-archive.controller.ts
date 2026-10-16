import { Request, Response } from 'express';
import {
  listArchivePosts,
  listArchiveTags,
  countArchivePosts,
} from '../services/fcc-archive.service.js';

/**
 * Public read-only API over the freeCodeCamp news archive stored in MongoDB.
 *
 * The archive only holds crawler metadata (no article bodies), so the UI
 * links each entry to the original freeCodeCamp.org permalink. Attribution
 * (publisher + author + original URL) is part of every payload and MUST stay
 * visible in the UI.
 */

const parsePositiveInt = (value: unknown, fallback: number): number => {
  const parsed = parseInt(String(value ?? ''), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

/**
 * GET /api/blog/posts?page&limit&q&tag
 * Paginated feed of archived freeCodeCamp posts (newest first).
 */
export const listFccArchivePosts = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await listArchivePosts({
      page: parsePositiveInt(req.query.page, 1),
      limit: parsePositiveInt(req.query.limit, 20),
      q: req.query.q ? String(req.query.q) : undefined,
      tag: req.query.tag ? String(req.query.tag) : undefined,
    });
    res.status(200).json({
      success: true,
      data: result.posts,
      count: result.total,
      page: result.page,
      totalPages: result.totalPages,
      limit: result.limit,
    });
  } catch (err) {
    console.error('[FccArchiveController] Error listing archived posts:', err);
    const message =
      process.env.MONGODB_URI === undefined
        ? 'The article archive is not configured on this server.'
        : 'Unable to load the article archive.';
    res.status(503).json({ success: false, message });
  }
};

/** GET /api/blog/tags?page&limit — paginated topics (tags) by post count. */
export const listFccArchiveTags = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await listArchiveTags({
      page: parsePositiveInt(req.query.page, 1),
      limit: parsePositiveInt(req.query.limit, 60),
    });
    res.status(200).json({
      success: true,
      data: result.tags,
      count: result.total,
      page: result.page,
      totalPages: result.totalPages,
      limit: result.limit,
    });
  } catch (err) {
    console.error('[FccArchiveController] Error listing archive tags:', err);
    res.status(503).json({ success: false, message: 'Unable to load archive tags.' });
  }
};

/**
 * GET /api/blog/stats — archive totals (shown in the blog hero):
 * total posts and total distinct topics.
 */
export const getFccArchiveStats = async (_req: Request, res: Response): Promise<void> => {
  try {
    const [total, topicPage] = await Promise.all([countArchivePosts(), listArchiveTags({ page: 1, limit: 1 })]);
    res.status(200).json({
      success: true,
      data: {
        total,
        topics: topicPage.total,
        source: 'freeCodeCamp.org',
        sourceUrl: 'https://www.freecodecamp.org/news',
      },
    });
  } catch (err) {
    console.error('[FccArchiveController] Error reading archive stats:', err);
    res.status(503).json({ success: false, message: 'Unable to read archive stats.' });
  }
};
