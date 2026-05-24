# Digital Base V3 CMS

暗黑游戏平台风格的个人数字空间。当前项目使用 Cloudflare Pages + Pages Functions + D1，不使用 React、Vue、Next.js，也不需要 npm 构建。

## 当前功能

- 前台首页 Hero、轮播、动态墙、视频传送门、项目区、资源站、我的导航、朋友空间、留言板
- `/admin` CMS 后台
- 后台登录使用 `ADMIN_PASSWORD`
- 所有后台写操作使用 `Authorization: Bearer <adminToken>`
- 媒体库支持外链图片保存和 Cloudflare R2 上传
- 动态墙数据来源是 D1 `posts` 表，通过 `/api/posts` 读取
- `data/site.json` 只作为 API 请求失败时的 fallback

## 后台动态管理

进入 `/admin` -> `动态管理`：

- `编辑`：回填原动态内容，可修改 `title`、`body`、`type`、`images`、`video_url`、`tags`、`is_public`、`is_pinned`
- `删除`：会弹出确认框，确认后调用 `DELETE /api/posts?id=xxx`
- `隐藏/显示`：切换 `is_public`
- `置顶/取消置顶`：切换 `is_pinned`

前台只显示 `is_public=1` 的动态，并按：

```sql
is_pinned DESC, created_at DESC
```

排序。

## 首页设置

进入 `/admin` -> `首页设置`，可以修改：

- `hero_kicker`
- `hero_title`
- `hero_description`
- `hero_primary_button_text`
- `hero_primary_button_link`
- `hero_secondary_button_text`
- `hero_secondary_button_link`
- `hero_status_title`
- `hero_status_description`
- `hero_background_image`

保存后写入 D1 `site_settings` 表。前台刷新后优先读取 `/api/site-settings`，失败才回退 `data/site.json`。

## 轮播管理

进入 `/admin` -> `轮播管理`：

- 新增 / 编辑 / 删除轮播
- 隐藏 / 显示
- 使用 `sort_order` 控制排序

前台优先读取 `/api/hero-slides`，只显示 `is_public=1`，并按 `sort_order ASC` 排序。D1 没有轮播数据时才回退 `data/site.json`。

## 留言管理

进入 `/admin` -> `留言管理`：

- 显示全部留言
- 支持隐藏 / 显示
- 支持删除

前台只显示 `is_public=1` 的留言。隐藏或删除后，前台刷新同步变化。

## 媒体库

进入 `/admin` -> `媒体库`：

- `上传图片到 R2`：选择图片、分类、alt、说明后上传
- `添加外链图片`：填写图片 URL、分类、alt、说明后保存到 D1
- 图片列表支持分类筛选、缩略图预览、复制 URL、删除
- 删除 `source=r2` 的图片时，会同时删除 R2 文件和 D1 记录
- 删除 `source=external` 的图片时，只删除 D1 记录
- 单文件最大 100MB

以下后台表单已接入 `上传图片` 和 `从媒体库选择`：

- 动态管理：`images`
- 首页设置：`hero_background_image`
- 轮播管理：`image`
- 视频入口：`cover`
- 项目管理：`cover`
- 资源站：`icon`
- 朋友空间：`avatar`

如果上传后返回的是 `uploads/2026/05/xxx.jpg` 这类 key，而不是完整 URL，说明还没有设置 `PUBLIC_ASSET_BASE_URL`。

## 同步测试

动态墙：

```txt
/api/posts
/api/posts?debug=1
```

首页设置：

```txt
/api/site-settings
```

轮播：

```txt
/api/hero-slides
```

如果 API 返回正确但前台没变，先等 Cloudflare Pages 部署完成，再强制刷新浏览器。前台和后台请求都已使用 `no-store`，正常不会继续读取旧缓存。

## D1 升级 SQL

新数据库可以直接执行 [schema.sql](./schema.sql)。

已有数据库升级时，如果旧表没有这些字段，只执行一次：

```sql
ALTER TABLE posts ADD COLUMN is_public INTEGER NOT NULL DEFAULT 1;
ALTER TABLE posts ADD COLUMN is_pinned INTEGER NOT NULL DEFAULT 0;
ALTER TABLE posts ADD COLUMN updated_at TEXT;
ALTER TABLE messages ADD COLUMN is_public INTEGER NOT NULL DEFAULT 1;
```

新增媒体库时执行：

```sql
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
```

D1/SQLite 对 `ALTER TABLE ADD COLUMN` 没有可靠的 `IF NOT EXISTS`，重复执行会报错。其余 `CREATE TABLE IF NOT EXISTS` 和 `CREATE INDEX IF NOT EXISTS` 可以按 [schema.sql](./schema.sql) 执行。

## Cloudflare 设置

Pages 设置：

- Framework preset: `None`
- Build command: 留空，或 `exit 0`
- Build output directory: `/`
- Production branch: `main`

D1 绑定：

1. Pages 项目 -> `Settings` -> `Bindings`
2. 添加 `D1 database binding`
3. Variable name 填 `DB`
4. Production 和 Preview 都建议绑定同一个或对应数据库
5. 保存后重新部署

R2 创建：

1. Cloudflare Dashboard -> `R2 Object Storage`
2. 创建一个 bucket，例如 `digital-base-assets`
3. 给 bucket 配置公开访问域名，可以使用 R2 的公开开发域名，或绑定自己的资源域名

Pages 绑定 R2：

1. Pages 项目 -> `Settings` -> `Bindings`
2. 添加 `R2 bucket binding`
3. Variable name 填 `ASSETS`
4. Bucket 选择刚创建的 R2 bucket
5. Production 和 Preview 都建议绑定
6. 保存后重新部署

公开图片地址：

在 Pages 项目 -> `Settings` -> `Variables and Secrets` 新增：

```txt
PUBLIC_ASSET_BASE_URL=https://你的R2公开域名
```

不要在末尾加 `/`。例如 R2 公开域名是 `https://assets.example.com`，上传后的图片地址会是：

```txt
https://assets.example.com/uploads/2026/05/时间戳-随机字符串.jpg
```

管理员密码：

1. Pages 项目 -> `Settings` -> `Variables and Secrets`
2. 新增：

```txt
ADMIN_PASSWORD=你的强密码
```

变量名必须是 `ADMIN_PASSWORD`。

## 常见问题

- 线上 API 空：检查 Production 环境是否绑定了 D1 的 `DB`
- 预览环境异常：Preview 环境也要绑定 D1 和 `ADMIN_PASSWORD`
- 后台无法写入：检查 `ADMIN_PASSWORD` 是否正确，重新登录 `/admin`
- 图片上传失败：检查 Pages Production/Preview 是否绑定了 R2，变量名必须是 `ASSETS`
- 上传后图片打不开：检查 `PUBLIC_ASSET_BASE_URL` 是否填写为 R2 的公开访问域名
- 媒体库报错：确认 D1 已执行 `media_assets` 建表 SQL
- 修改后没生效：确认 `git push` 后 Cloudflare Pages 已完成部署
- 前台不同步：直接访问 `/api/posts`、`/api/site-settings`、`/api/hero-slides` 看 API 返回

## 更新线上

```bash
git status
git add .
git commit -m "stabilize cms management"
git push
```

推送到 `main` 后，Cloudflare Pages 会自动重新部署。
