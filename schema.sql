-- Digital Base CMS schema / upgrade SQL
-- Existing projects: run the ALTER TABLE lines once.
-- New projects: the CREATE TABLE IF NOT EXISTS blocks are safe to run repeatedly.

CREATE TABLE IF NOT EXISTS posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('文字', '图片', '视频', '文章')),
  images TEXT NOT NULL DEFAULT '[]',
  video_url TEXT,
  tags TEXT NOT NULL DEFAULT '[]',
  is_public INTEGER NOT NULL DEFAULT 1,
  is_pinned INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT
);

-- Existing database upgrade only, run these ALTER lines once if your posts table
-- was created before CMS v2. Keep them commented on a fresh database.
-- ALTER TABLE posts ADD COLUMN is_public INTEGER NOT NULL DEFAULT 1;
-- ALTER TABLE posts ADD COLUMN is_pinned INTEGER NOT NULL DEFAULT 0;
-- ALTER TABLE posts ADD COLUMN updated_at TEXT;

CREATE INDEX IF NOT EXISTS idx_posts_public_sort ON posts (is_public, is_pinned DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts (created_at DESC);

CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nickname TEXT NOT NULL,
  content TEXT NOT NULL,
  is_public INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Existing database upgrade only, run this ALTER line once if your messages table
-- was created before CMS v2. Keep it commented on a fresh database.
-- ALTER TABLE messages ADD COLUMN is_public INTEGER NOT NULL DEFAULT 1;

CREATE INDEX IF NOT EXISTS idx_messages_public_sort ON messages (is_public, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages (created_at DESC);

CREATE TABLE IF NOT EXISTS site_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL DEFAULT '',
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS hero_slides (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT,
  subtitle TEXT,
  description TEXT,
  image TEXT NOT NULL,
  button_text TEXT,
  button_link TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_public INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_hero_slides_sort ON hero_slides (is_public, sort_order ASC, id DESC);

CREATE TABLE IF NOT EXISTS video_links (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  cover TEXT,
  url TEXT NOT NULL,
  tags TEXT NOT NULL DEFAULT '[]',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_public INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_video_links_sort ON video_links (is_public, sort_order ASC, id DESC);

CREATE TABLE IF NOT EXISTS projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  cover TEXT,
  url TEXT NOT NULL,
  tags TEXT NOT NULL DEFAULT '[]',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_public INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_projects_sort ON projects (is_public, sort_order ASC, id DESC);

CREATE TABLE IF NOT EXISTS resources (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  url TEXT NOT NULL,
  category TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_public INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_resources_sort ON resources (is_public, sort_order ASC, id DESC);

CREATE TABLE IF NOT EXISTS bookmarks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  url TEXT NOT NULL,
  category TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_public INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_bookmarks_sort ON bookmarks (is_public, category, sort_order ASC, id DESC);

CREATE TABLE IF NOT EXISTS friends (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  status TEXT,
  avatar TEXT,
  tag TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_public INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_friends_sort ON friends (is_public, sort_order ASC, id DESC);

CREATE TABLE IF NOT EXISTS media_assets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  url TEXT NOT NULL,
  key TEXT,
  filename TEXT,
  original_name TEXT,
  mime_type TEXT,
  size INTEGER NOT NULL DEFAULT 0,
  source TEXT NOT NULL CHECK (source IN ('r2', 'external')),
  category TEXT NOT NULL DEFAULT 'other' CHECK (category IN ('post', 'hero', 'slide', 'project', 'resource', 'avatar', 'gallery', 'other')),
  alt TEXT,
  caption TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_media_assets_category ON media_assets (category, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_media_assets_created_at ON media_assets (created_at DESC);
