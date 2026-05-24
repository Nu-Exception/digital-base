# DIGITAL BASE V3

> 一个持续搭建中的个人数字基地  
> Cloudflare Pages + Functions + D1 驱动的赛博风个人网站

---

# 项目介绍

Digital Base V3 是我目前正在长期维护的个人互动网站。

这个项目最开始只是一个简单主页，
后来逐渐加入了：

- CMS 后台
- 动态系统
- 项目展示
- 视频入口
- 资源导航
- 个人状态系统
- 云函数 API
- 数据库存储

现在它更像一个：

> “属于自己的数字基地”

这里会放：

- 我做过的项目
- 视频入口
- 收藏资源
- 游戏相关内容
- AI 工具实验
- 深夜灵感记录

整个网站使用偏暗色、赛博、游戏 UI 风格设计，
灵感来自：

- 游戏大厅 UI
- OBS 面板
- 战术终端
- 深夜电竞房氛围

---

# 技术栈

## 前端

- HTML5
- CSS3
- JavaScript

## 云平台

- Cloudflare Pages
- Cloudflare Functions
- Cloudflare D1

## 数据系统

- SQLite（D1）
- REST API
- JSON 数据结构

---

# 当前已实现功能

## CMS 后台

支持：

- 首页内容修改
- 动态发布
- 项目管理
- 视频入口管理
- 资源站管理
- 导航收藏管理

后台可直接在线编辑，
不需要重新改代码。

---

## 动态墙系统

支持：

- 文字动态
- 图片动态
- 标签分类
- 置顶
- 时间排序

目前图片支持：

- 外链图片
- jpg/png/webp/gif

---

## 项目展示系统

可展示：

- GitHub 项目
- 网站项目
- 视频项目
- 工具项目

支持：

- 封面图
- 标签
- 外链跳转
- 排序

---

## 视频入口系统

用于整合：

- 视频主页
- 剪辑入口
- 回放入口
- 收藏频道

避免视频内容过于分散。

---

## 资源导航

目前整理了：

- Cloudflare
- GitHub
- ChatGPT
- Steam
- 工具站
- 实验区

后续会继续扩展。

---

# 项目特点

## 游戏风 UI

整个网站采用：

- 暗色电竞风
- 发光描边
- HUD 风格模块
- 卡片式布局
- 赛博感动画

而不是传统博客风。

---

## Cloudflare 全家桶部署

项目目前运行于：

- Cloudflare Pages
- Functions
- D1 Database

特点：

- 免费
- 部署快
- 全球 CDN
- 适合个人项目

---

## 轻量 CMS

这个项目最大的目标之一：

> “不用传统服务器，也能拥有自己的内容后台”

因此整个 CMS 都是轻量结构。

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

## 获取动态

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

## 克隆项目

```bash
git clone https://github.com/Nu-Exception/digital-base.git
```

---

## 进入目录

```bash
cd digital-base
```

---

## 本地预览

直接使用：

```bash
Live Server
```

或者：

```bash
npx wrangler pages dev .
```

---

# 部署方式

推荐直接部署到：

## Cloudflare Pages

连接 GitHub 后即可自动部署。

---

# 后续计划

正在慢慢加入：

- 朋友空间
- AI 工具实验室
- 多主题模式
- 游戏数据展示
- 更完整 CMS
- 评论系统
- 登录系统
- 文件上传
- 自定义组件

---

# 项目状态

## 当前状态

```txt
ACTIVE DEVELOPMENT
```

这个项目仍然在持续更新。

很多地方还在重构和优化。

---

# 作者

## 松哥 / Nu-Exception

正在学习：

- 前端开发
- Cloudflare Workers
- UI 设计
- AI 工具
- 网站系统搭建

---

# License

MIT