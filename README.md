# Digital Base V3 CMS

暗黑游戏平台风格的个人数字空间。当前项目使用 Cloudflare Pages + Pages Functions + D1，不使用 React、Vue、Next.js，也不需要 npm 构建。

## 当前功能

- 前台首页 Hero、轮播、动态墙、视频传送门、项目区、资源站、我的导航、朋友空间、留言板
- `/admin` CMS 后台
- 后台登录使用 `ADMIN_PASSWORD`
- 所有后台写操作使用 `Authorization: Bearer <adminToken>`
- 动态墙数据来源是 D1 `posts` 表，通过 `/api/posts` 读取
- `data/site.json` 只作为 API 请求失败时的 fallback

## 后台动态管理

进入 `/admin` -> `动态管理`：

- `编辑`：回填原动态内容，可修改 `title`、`body`、`type`、`images`、`video_url`、`tags`、`is_public`、`is_pinned`
- `images`：填写外链图片地址，一行一个 URL，支持 `jpg`、`jpeg`、`png`、`webp`、`gif`
- `删除`：会弹出确认框，确认后调用 `DELETE /api/posts?id=xxx`
- `隐藏/显示`：切换 `is_public`
- `置顶/取消置顶`：切换 `is_pinned`

保存动态时，后台会把 `images` 写入 D1 `posts.images` 字段，格式是 JSON 数组字符串。前台读取 `/api/posts` 后会在动态卡片中展示这些外链图片；图片加载失败会自动隐藏，不影响页面。

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
