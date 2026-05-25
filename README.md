# DIGITAL BASE V3

> Cyber Style Personal Base  
> 基于 Cloudflare Pages + Functions + D1 的个人数字基地

---

<p align="center">

一个持续搭建中的个人互动网站。  
集成 CMS 后台、动态系统、项目展示、资源导航和 Cloudflare Functions API。

</p>

---

# 项目预览

## 前台页面

- 首页 Hero
- 动态墙
- 项目控制台
- 视频入口
- 资源导航
- 游戏风 UI

---

## CMS 后台

支持在线管理：

- 首页内容
- 动态发布
- 项目管理
- 视频入口
- 导航收藏
- 资源站

无需重新修改代码即可更新网站内容。

---

# 项目特点

## 游戏 / 赛博风 UI

整体采用：

- 深色电竞风
- HUD 风格布局
- 发光描边
- 卡片式模块
- 动态光效

灵感来源：

- 游戏大厅
- 战术终端
- OBS 控制台
- 深夜电竞房

---

## Cloudflare 全家桶部署

项目运行于：

- Cloudflare Pages
- Cloudflare Functions
- Cloudflare D1

特点：

- 免费部署
- 全球 CDN
- 自动 HTTPS
- GitHub 自动更新
- 无需传统服务器

---

## 轻量 CMS

本项目最大的目标之一：

> 不使用传统后端服务器，也能拥有自己的 CMS 后台。

整个系统基于：

- Functions API
- D1 数据库
- 原生 HTML/CSS/JS

实现轻量内容管理。

---

# 当前已实现功能

## 首页 Hero 系统

支持：

- 标题
- 描述
- 状态卡片
- 按钮跳转
- 背景图

可直接后台修改。

---

## 动态墙系统

支持：

- 文字动态
- 图片动态
- 标签分类
- 时间排序
- 置顶功能

目前图片支持：

- jpg
- png
- webp
- gif

支持外链图片。

---

## 项目展示系统

支持展示：

- GitHub 项目
- 网站项目
- 视频项目
- 工具项目

功能：

- 项目封面
- 标签
- 跳转链接
- 排序
- 显示隐藏

---

## 视频入口系统

用于整合：

- 视频主页
- 剪辑合集
- 回放入口
- 收藏频道

避免视频内容分散。

---

## 资源导航系统

目前整理：

- Cloudflare
- GitHub
- ChatGPT
- Steam
- AI 工具
- 开发资源

后续会继续扩展。

---

# 技术栈

## 前端

- HTML5
- CSS3
- JavaScript

---

## 云平台

- Cloudflare Pages
- Cloudflare Functions
- Cloudflare D1

---

## 数据结构

- SQLite（D1）
- REST API
- JSON

---

# 项目结构

```bash
/functions
  /api
  /lib

/admin
/assets
/data
```

---

# API 示例

## 获取动态列表

```bash
/api/posts
```

---

## 获取项目列表

```bash
/api/projects
```

---

## 获取站点设置

```bash
/api/site-settings
```

---

# 本地运行

## 1. 克隆项目

```bash
git clone https://github.com/Nu-Exception/digital-base.git
```

---

## 2. 进入项目目录

```bash
cd digital-base
```

---

## 3. 本地预览

可以直接使用：

```bash
Live Server
```

或者：

```bash
npx wrangler pages dev .
```

---

# Cloudflare 部署教程

## 1. Fork 或上传项目到 GitHub

将项目上传到自己的 GitHub 仓库。

---

## 2. 登录 Cloudflare

进入：

```txt
Workers & Pages
```

---

## 3. 创建 Pages 项目

选择：

```txt
Connect to Git
```

连接 GitHub 仓库。

---

## 4. 部署配置

构建配置：

```txt
Framework preset:
None

Build command:
（留空）

Build output directory:
/
```

---

## 5. 创建 D1 数据库

进入：

```txt
Storage & Databases -> D1
```

创建数据库。

例如：

```txt
digital-base-db
```

---

## 6. 绑定 D1

进入：

```txt
Pages -> Settings -> Bindings
```

添加：

```txt
Type:
D1 Database

Variable name:
DB
```

绑定你的 D1 数据库。

---

## 7. 初始化数据库

执行 SQL：

```sql
CREATE TABLE posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT,
  content TEXT
);
```

或者导入项目提供的：

```txt
schema.sql
```

---

## 8. 自动部署

以后只需要：

```bash
git push
```

Cloudflare Pages 会自动重新部署。

---

# 图片上传说明

目前版本使用：

```txt
外链图片
```

推荐：

- Postimages
- ImgBB
- GitHub Raw

注意：

必须填写：

```txt
直接图片链接
```

例如：

```txt
https://i.postimg.cc/xxxxx/demo.jpg
```

而不是网页链接。

---

# 后续开发计划

正在慢慢加入：

- 朋友空间
- AI 实验区
- 登录系统
- 评论系统
- 文件上传
- 多主题模式
- 更完整 CMS
- 用户系统
- Markdown 编辑器

---

# 项目状态

```txt
ACTIVE DEVELOPMENT
```

项目仍在持续开发中。

很多模块还会继续优化。

---

# 作者

## CS

正在学习：

- 前端开发
- Cloudflare Workers
- UI 设计
- AI 工具
- 网站系统搭建

---

# 联系方式

## GitHub

https://github.com/Nu-Exception

---

## Website

https://digital-base.pages.dev

---

## 微信

Entropy4761

---

## QQ

476199719

---

# License

MIT

---

## Projects API Rendering

前台项目控制台优先读取 `/api/projects`，只显示公开项目，并按 `sort_order ASC`、`created_at DESC` 排序。API 失败或没有项目数据时，才回退 `data/site.json` 的默认项目。

---

## CMS/API Dynamic Rendering

前台栏目正在逐步从静态 `data/site.json` 迁移到 CMS/API 动态渲染：

- 项目控制台读取 `/api/projects`
- 资源站读取 `/api/resources`
- 书签导航读取 `/api/bookmarks`
- 视频入口读取 `/api/video-links`
- 动态墙和 Recent Log 读取 `/api/posts`
- 首页 Hero 读取 `/api/site-settings`

`data/site.json` 现在只作为 API 失败或数据库暂无内容时的 fallback。

我的导航 / 书签收藏区已经改为完全由后台 CMS 管理，只读取 `/api/bookmarks`。如果数据库暂无书签，前台显示“暂无导航数据”，不会再回退到 Steam、Epic、ChatGPT 等默认静态卡片。

留言板、状态面板、Recent Log 和 Fast Links 也已经去除默认假数据：

- 留言板只显示 `/api/messages` 返回的真实留言；无数据时显示“暂无留言”
- 状态面板读取 CMS/site settings 或 `data/site.json` 的状态配置；未配置时显示简洁在线状态
- Recent Log 读取 `/api/posts`；无数据时显示“暂无动态”
- Fast Links 优先从 `/api/bookmarks` 或 `/api/resources` 取前 4 条；无数据时显示“暂无快捷入口”

前台内容整体优先读取 CMS/API，无数据时显示空状态提示，避免继续展示默认占位假数据。

留言板公开接口 `/api/messages` 会兼容 `is_public`、`visible`、`is_visible` 显示字段；后台留言管理点“显示”后，前台刷新或发布留言成功后会重新读取接口。可用 `/api/messages?debug=1` 检查表字段、总数和最近 5 条留言。

`/api/messages` 正常模式已修复公开留言查询：会读取 Cloudflare D1 的 `result.results`，并兼容 `is_public = 1`、`is_public = '1'`、`is_public = true`、`is_public IS NULL`。如果 `/api/messages?debug=1` 能看到公开留言，正常 `/api/messages` 也应该返回到 `messages` 数组中。

留言接口正常模式现在会先读取 `messages` 表最近 50 条原始数据，再在 JS 中过滤公开留言，避免 D1/SQLite 在 `WHERE is_public = 1` 这类条件上因为字段类型差异返回空数组。`/api/messages?debug=1` 会额外返回 `all_rows`，方便对照正式接口是否漏数据。

留言接口正常模式进一步简化为直接返回 `messages` 表最近 50 条已保存留言，不再在接口层过滤 `is_public`；隐藏和删除由后台留言管理控制，前台只负责渲染 `/api/messages` 返回的 `messages` 数组。

前台留言板已兼容 D1 常用字段：昵称读取 `nickname` / `name` / `author`，内容读取 `content` / `message` / `body`，时间读取 `created_at` / `createdAt`。如果接口返回空数组，右侧留言列表只显示“暂无留言”，不再展示阿杰、老王、站长等默认假留言。

视频传送门已改为 CMS/API 驱动，只读取 `/api/video-links`。如果后台“视频入口”暂无数据，前台显示“暂无视频入口”，不会再展示默认写死的视频卡片；只有在后台新增并显示视频入口后，才会出现在前台。

朋友空间是预留模块，当前前台暂时隐藏；后续可扩展为友链、开黑状态、留言互动等功能。后台朋友空间菜单会继续保留。

Base Lab / 后续扩展模块当前也作为预留模块隐藏，不在前台展示静态说明。前台剩余默认假数据已经清理，CMS/API 没有数据时统一显示空状态提示。

测试地址：

```txt
/api/projects
/api/resources
/api/bookmarks
/api/video-links
/api/posts
/api/messages
```

维护规则：

- 后续每次新增功能、API、页面或后台模块，都要同步更新 README.md
- README 不要随便重写，只做增量维护
