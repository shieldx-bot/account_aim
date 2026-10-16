-- Drop the legacy PostgreSQL blog tables.
--
-- The blog is now served exclusively from the MongoDB freeCodeCamp archive
-- (fcc_news.posts) at /blog. These tables were created by the old migrations
-- 013_blog.sql / 014_blog_slug_history.sql; any existing databases still
-- carrying them are cleaned up here. IF EXISTS keeps the migration idempotent
-- for databases that never had the blog installed.

DROP TABLE IF EXISTS blog_post_tags;
DROP TABLE IF EXISTS blog_tags;
DROP TABLE IF EXISTS blog_post_slugs;
DROP TABLE IF EXISTS blog_posts;
DROP TABLE IF EXISTS blog_categories;
