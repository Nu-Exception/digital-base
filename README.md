# Digital Base V3 CMS

暗黑游戏平台风格的个人数字空间。当前版本是：

- Cloudflare Pages 前台
- Cloudflare Pages Functions API
- Cloudflare D1 数据库存储内容
- `/admin` 原生 HTML/CSS/JS 内容管理后台
- 不使用 React、Vue、Next.js，不需要 npm 构建

## 当前功能

前台：

- 首页 Hero 区
- 轮播图
- 动态墙：数据来源是 D1 `posts` 表，通过 `/api/posts` 读取
- 视频传送门
- 项目区
- 资源站
- 我的导航 / 书签收藏区
- 朋友空间
- 留言板
- `data/site.json` 只作为 API 请求失败时的 fallback，不作为动态墙主数据

后台 CMS：

- 仪表盘：动态、留言、轮播、项目、导航数量，以及最近动态/留言
- 首页设置：修改 Hero 文案、按钮、状态卡片、背景图
- 轮播管理：新增、编辑、删除、隐藏/显示、排序
- 动态管理：新增、编辑、删除、隐藏/显示、置顶/取消置顶
- 留言管理：隐藏/显示、删除
- 视频入口、项目、资源站、我的导航、朋友空间管理

所有后台写操作都需要：

```txt
Authorization: Bearer <adminToken>
```

`adminToken` 来自 `/api/login`，第一阶段直接使用 `ADMIN_PASSWORD`。

## 项目结构

```txt
index.html
styles.css
script.js
data/site.json

admin/
  index.html
  admin.css
  admin.js

functions/
  _lib/
    cms.js
    resource.js
  api/
    login.js
    site-settings.js
    hero-slides.js
    posts.js
    messages.js
    video-links.js
    projects.js
    resources.js
    bookmarks.js
    friends.js

schema.sql
```

## D1 升级 SQL

`schema.sql` 包含完整表结构。新数据库可以直接执行 `schema.sql`。

如果你已经运行过上一版，只需要把下面这段复制到 Cloudflare D1 Console 执行。注意：D1/SQLite 的 `ALTER TABLE ADD COLUMN` 通常没有可靠的 `IF NOT EXISTS`，所以下面 4 条 `ALTER TABLE` 只执行一次；如果已经执行过，就不要重复执行。

```sql
ALTER TABLE posts ADD COLUMN is_public INTEGER NOT NULL DEFAULT 1;
ALTER TABLE posts ADD COLUMN is_pinned INTEGER NOT NULL DEFAULT 0;
ALTER TABLE posts ADD COLUMN updated_at TEXT;
ALTER TABLE messages ADD COLUMN is_public INTEGER NOT NULL DEFAULT 1;

CREATE INDEX IF NOT EXISTS idx_posts_public_sort ON posts (is_public, is_pinned DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_public_sort ON messages (is_public, created_at DESC);

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
```

## 绑定 D1

在 Cloudflare Pages 项目：

1. 打开 `Settings` -> `Bindings`
2. 添加 `D1 database binding`
3. Variable name 填 `DB`
4. 选择你的 D1 数据库
5. 保存并重新部署

## 设置管理员密码

在 Pages 项目：

1. 打开 `Settings` -> `Variables and Secrets`
2. 新增变量：

```txt
ADMIN_PASSWORD=你的强密码
```

3. 保存并重新部署

后台登录地址：

```txt
/admin
```

## 如何使用后台

动态墙数据来源：

1. 后台发布动态会写入 D1 的 `posts` 表。
2. 前台首页动态墙刷新后请求 `/api/posts`。
3. `/api/posts` 成功返回 `posts` 数组时，前台只渲染 D1 数据。
4. 只有 `/api/posts` 请求失败时，才回退到 `data/site.json` 的静态内容。
5. API 成功但没有动态时，前台显示“还没有发布动态”，不会显示旧默认动态。

修改首页文字：

1. 登录 `/admin`
2. 打开 `首页设置`
3. 修改 Hero Kicker、Hero 标题、描述、按钮文字/链接、状态卡片、背景图
4. 点击保存
5. 刷新前台，前台会优先读取 `/api/site-settings`

管理轮播：

1. 打开 `轮播管理`
2. 新增或编辑轮播图
3. 用 `排序` 控制显示顺序
4. 用 `隐藏/显示` 控制前台是否展示

删除动态：

1. 打开 `动态管理`
2. 找到对应动态
3. 点击 `删除`
4. 确认后会从 D1 删除

管理留言：

1. 打开 `留言管理`
2. 可以隐藏/显示留言
3. 可以删除垃圾留言

## select 白底白字修复

后台统一设置了：

```css
select {
  background: #111827;
  color: #fff;
  border: 1px solid #facc15;
  color-scheme: dark;
}

option {
  background: #111827;
  color: #fff;
}
```

## GitHub 更新线上网站

```bash
git status
git add .
git commit -m "upgrade admin to cms"
git push
```

推送到 `main` 后 Cloudflare Pages 会自动部署。修改 D1 绑定或 `ADMIN_PASSWORD` 后，也需要重新部署一次。

## Cloudflare Pages 设置

- Framework preset: `None`
- Build command: 留空，或 `exit 0`
- Build output directory: `/`
- Production branch: `main`
