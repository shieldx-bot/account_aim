import { Router } from 'express';
import {
  listFccArchivePosts,
  listFccArchiveTags,
  getFccArchiveStats,
} from '../controllers/fcc-archive.controller.js';

/**
 * FreeCodeCamp archive (MongoDB) public reads — mounted at /api/blog/fcc.
 * Read-only: the archive is written exclusively by the crawler scripts.
 */
export const fccArchiveRouter = Router();

fccArchiveRouter.get('/posts', listFccArchivePosts);
fccArchiveRouter.get('/tags', listFccArchiveTags);
fccArchiveRouter.get('/stats', getFccArchiveStats);
