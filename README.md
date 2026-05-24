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