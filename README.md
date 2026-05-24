# 🎮 Digital Base

> 一个暗黑游戏平台风格的个人互联网基地。
>
> 基于 Cloudflare Pages + GitHub 的纯静态网站方案。

---

# 📸 项目简介

Digital Base 是一个偏「游戏平台 / 数字基地 / 互动空间」风格的个人网站。

它不是传统博客，也不是完整视频网站。

更像是：

* 个人互联网老巢
* 游戏与生活空间
* 视频传送门
* 资源站
* 收藏导航页
* 朋友互动区

项目采用：

```txt
HTML + CSS + JavaScript
```

不需要：

```txt
Node.js
npm
数据库
服务器
后端框架
```

适合：

* 新手学习部署网站
* 个人主页
* 游戏风网站
* 互动空间
* Cloudflare 静态部署

---

# ✨ 当前功能

## 🖥 首页功能

* 暗黑游戏平台风格首页
* 顶部导航栏
* 大轮播图
* 视频传送门
* 项目卡片
* 最近动态
* 在线状态区域
* 移动端适配
* 左侧浮动菜单

---

## 📚 我的导航页 / 收藏书签

支持：

* 收藏网站
* 常用工具
* AI 工具
* 游戏网站
* 开发工具
* 视频网站
* 素材网站

支持分类筛选。

---

## 📱 手机端支持

已适配：

* iPhone
* Android
* 平板

支持：

* 手机端菜单
* 横向视频滚动
* 自适应布局
* 小屏幕优化

---

# 🧱 项目结构

```txt
Digital Base
│
├── index.html          页面结构
├── styles.css          网站样式
├── script.js           动态功能
├── README.md           项目说明
│
└── data
    └── site.json       网站内容配置
```

---

# ⚙️ 如何修改网站内容

网站的大部分内容都集中在：

```txt
/data/site.json
```

里面。

你不需要会编程。

只需要修改 JSON 内容即可。

---

# 📌 site.json 可以修改什么

## 首页轮播图

```json
"heroSlides"
```

修改首页大图。

---

## 最近动态

```json
"updates"
```

修改首页最近动态。

---

## 视频传送门

```json
"videos"
```

建议只保留：

```txt
3 ~ 6 个
```

精选入口。

这个项目不建议做成完整视频网站。

更适合当：

```txt
视频项目入口
```

---

## 项目卡片

```json
"projects"
```

展示你的项目。

---

## 收藏导航页

```json
"bookmarks"
```

这里可以添加：

* AI 工具
* 游戏网站
* GitHub
* Cloudflare
* Steam
* Bilibili
* 常用网页
* 收藏夹

---

## 朋友空间

```json
"friends"
```

修改朋友状态。

---

## 留言板

```json
"messages"
```

修改留言内容。

---

# 💻 本地预览网站

推荐在项目目录启动本地服务：

```bash
autopep8
python -m http.server 8080
```

然后打开：

```txt
http://localhost:8080
```

---

# 🚀 部署教程（新手版）

本项目使用：

```txt
GitHub + Cloudflare Pages
```

免费部署。

---

# 第一步：安装 Git

下载：

```txt
https://git-scm.com/downloads
```

安装完成后：

右键文件夹 →

```txt
Open in Terminal
```

即可。

---

# 第二步：创建 GitHub 仓库

打开：

```txt
https://github.com
```

新建仓库：

```txt
digital-base
```

推荐：

```txt
Public
```

不要勾选 README。

---

# 第三步：上传项目到 GitHub

在项目目录打开终端：

执行：

```bash
git init

git add .

git commit -m "init digital base"

git branch -M main

git remote add origin https://github.com/你的用户名/digital-base.git

git push -u origin main
```

上传成功后：

GitHub 会出现你的项目文件。

---

# 第四步：部署到 Cloudflare Pages

打开：

```txt
https://dash.cloudflare.com
```

进入：

```txt
Workers & Pages
→ Create application
→ Pages
→ Import an existing Git repository
```

选择：

```txt
digital-base
```

仓库。

---

# 第五步：Cloudflare Pages 配置

配置如下：

| 项目                     | 内容   |
| ---------------------- | ---- |
| Framework preset       | None |
| Build command          | 留空   |
| Build output directory | .    |
| Production branch      | main |

然后点击：

```txt
Save and Deploy
```

---

# 🎉 部署完成

部署成功后：

Cloudflare 会给你一个：

```txt
xxxxx.pages.dev
```

网址。

例如：

```txt
digital-base.pages.dev
```

别人就可以访问你的网站了。

---

# 🔄 后续如何更新网站

以后修改完网站内容后：

在项目目录执行：

```bash
git add .

git commit -m "update website"

git push
```

Cloudflare 会自动重新部署。

不需要重新上传。

---

# ☁️ 后续可升级功能

后面可以继续加入：

## 互动功能

* 真实留言板
* 评论系统
* 好友在线状态
* 今日牢大
* 开黑预约

---

## Cloudflare 功能

* D1 数据库
* R2 图床
* Workers API
* 登录系统
* Cloudflare Tunnel

---

## 内容功能

* 视频项目入口
* 游戏截图墙
* AI 工具区
* 收藏导航页
* 资源站

---

# 🛠 技术栈

```txt
HTML
CSS
JavaScript
GitHub
Cloudflare Pages
```

---

# 📬 联系方式

## 微信

```txt
Entropy4761
```

## QQ

```txt
476199719
```

---

# 📄 License

MIT License

---

# ⭐ 项目说明

这是一个偏个人兴趣、游戏平台风格的互联网空间项目。

适合慢慢扩展。

它不一定需要变成一个复杂网站。

但可以成为你自己的：

```txt
互联网数字基地
```
