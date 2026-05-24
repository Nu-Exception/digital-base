# 🎮 Digital Base V3

> 一个暗黑游戏平台风格的个人数字空间。  
> 支持首页展示、视频入口、收藏导航、动态墙、留言板、后台发布、Cloudflare D1 数据库存储。

![Status](https://img.shields.io/badge/status-online-brightgreen)
![Cloudflare Pages](https://img.shields.io/badge/deploy-Cloudflare%20Pages-orange)
![D1](https://img.shields.io/badge/database-Cloudflare%20D1-blue)
![Frontend](https://img.shields.io/badge/frontend-HTML%2FCSS%2FJS-yellow)

---

## 📌 项目简介

Digital Base V3 是一个偏「暗黑游戏平台 / 个人互联网老巢 / QQ空间式数字基地」风格的个人网站。

它不是普通博客，也不是完整视频网站，而是一个属于自己的个人数字空间，可以用来展示：

- 个人动态
- 图片文字内容
- 视频入口
- 项目展示
- 常用网站导航
- 朋友空间
- 留言内容
- 游戏相关内容
- 个人互联网收藏

当前版本已经从纯静态页面升级为：

```txt
Cloudflare Pages 前台
Cloudflare Pages Functions API
Cloudflare D1 数据库
/admin 后台发布系统
```

---

## ✨ 当前已实现功能

### 🏠 前台页面

- 暗黑游戏平台风格 UI
- 顶部导航栏
- 手机端菜单
- 视频入口横向滚动
- 动态墙
- 状态面板
- 最近动态
- 项目展示
- 资源站
- 我的导航页 / 书签收藏区
- 朋友空间
- 留言板
- 移动端适配

---

### 📝 动态墙

动态墙内容来自 Cloudflare D1 数据库。

支持发布：

- 文字动态
- 图片动态
- 视频链接动态
- 文章类型动态
- 标签
- 发布时间

后台发布后，前台会自动读取数据库内容并显示。

---

### 💬 留言板

留言板已接入 Cloudflare D1。

支持：

- 访客昵称
- 留言内容
- 发布时间
- 前台展示最近留言

---

### 🔐 后台发布系统

后台地址：

```txt
/admin/
```

功能：

- 管理员密码登录
- 发布动态
- 填写标题
- 填写正文
- 选择类型：文字 / 图片 / 视频 / 文章
- 填写图片链接
- 填写视频链接
- 填写标签
- 保存到 Cloudflare D1 数据库

管理员密码通过 Cloudflare Pages 环境变量设置：

```txt
ADMIN_PASSWORD
```

---

## 🧱 项目结构

```txt
digital-base
│
├── index.html                 前台页面
├── styles.css                 前台样式
├── script.js                  前台数据渲染、动态墙、留言板
├── README.md                  项目说明文档
├── schema.sql                 D1 数据库建表 SQL
│
├── data
│   └── site.json              静态内容和本地降级数据
│
├── admin
│   ├── index.html             后台登录和发布页面
│   ├── admin.css              后台样式
│   └── admin.js               后台登录、发布动态逻辑
│
└── functions
    └── api
        ├── login.js           管理员登录接口
        ├── posts.js           动态发布和读取接口
        └── messages.js        留言发布和读取接口
```

---

## 🛠 技术栈

```txt
HTML
CSS
JavaScript
Cloudflare Pages
Cloudflare Pages Functions
Cloudflare D1
GitHub
Git
```

不需要：

```txt
React
Vue
Next.js
Node.js 构建
npm install
服务器
宝塔面板
Docker
```

---

# 🚀 完整部署教程

下面是从零部署的完整流程，适合新手照着做。

---

## 1. 准备 GitHub 仓库

打开 GitHub，新建仓库：

```txt
digital-base
```

建议：

```txt
Public
```

不要勾选自动创建 README。

---

## 2. 本地初始化并上传代码

在项目文件夹打开 PowerShell 或终端。

执行：

```bash
git init
git add .
git commit -m "init digital base"
git branch -M main
git remote add origin https://github.com/你的用户名/digital-base.git
git push -u origin main
```

如果已经绑定过仓库，以后只需要：

```bash
git add .
git commit -m "update website"
git push
```

---

## 3. 部署到 Cloudflare Pages

打开 Cloudflare Dashboard：

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

选择你的 GitHub 仓库：

```txt
digital-base
```

---

## 4. Cloudflare Pages 构建设置

设置如下：

| 配置项 | 填写内容 |
|---|---|
| Framework preset | None |
| Build command | 留空 |
| Build output directory | . |
| Root directory | 留空 |
| Production branch | main |

然后点击：

```txt
Save and Deploy
```

部署成功后，你会得到一个网址，例如：

```txt
https://digital-base.pages.dev
```

---

# 🗄 Cloudflare D1 数据库配置

后台发布和留言功能需要 D1 数据库。

---

## 1. 创建 D1 数据库

Cloudflare Dashboard 进入：

```txt
Storage & databases
→ D1 SQL database
→ Create database
```

数据库名称填写：

```txt
digital-base-db
```

Location 保持默认即可。

点击：

```txt
Create
```

---

## 2. 初始化数据库表

创建完成后，进入数据库：

```txt
digital-base-db
→ Console
```

打开项目里的：

```txt
schema.sql
```

复制全部 SQL 内容，粘贴到 Cloudflare D1 Console 中执行。

执行成功后会创建表：

```txt
posts
messages
```

如果看到：

```txt
This query successfully executed.
```

说明数据库初始化成功。

---

## 3. schema.sql 内容说明

当前数据库主要有两张表。

### posts

用于保存后台发布的动态。

字段包括：

```txt
id
title
body
type
images
video_url
tags
created_at
```

---

### messages

用于保存留言板内容。

字段包括：

```txt
id
nickname
content
created_at
```

---

# 🔗 Pages 绑定 D1 数据库

数据库创建完成后，还需要绑定到 Pages 项目。

进入：

```txt
Workers & Pages
→ digital-base
→ Settings
→ Bindings
```

点击：

```txt
+ Add
```

选择：

```txt
D1 database
```

配置：

| 项目 | 内容 |
|---|---|
| Variable name | DB |
| D1 database | digital-base-db |

注意：

```txt
Variable name 必须是 DB
```

因为代码里读取的是：

```js
env.DB
```

保存即可。

---

# 🔐 设置后台管理员密码

进入：

```txt
Workers & Pages
→ digital-base
→ Settings
→ Variables and Secrets
```

点击：

```txt
+ Add
```

添加变量：

| 项目 | 内容 |
|---|---|
| Type | Text |
| Variable name | ADMIN_PASSWORD |
| Value | 你自己的后台密码 |

例如：

```txt
ADMIN_PASSWORD=your_password_here
```

注意：

变量名必须是：

```txt
ADMIN_PASSWORD
```

不能写成 `PASSWORD`，否则后台登录接口读取不到。

---

# 🔁 配置完成后重新部署

D1 绑定和环境变量设置完成后，需要重新部署一次。

在本地项目目录执行：

```bash
git commit --allow-empty -m "redeploy"
git push
```

Cloudflare Pages 会自动重新部署。

部署成功后，后台和数据库功能才会生效。

---

# 🔑 后台使用教程

后台地址：

```txt
https://digital-base.pages.dev/admin/
```

打开后输入你在 Cloudflare 设置的：

```txt
ADMIN_PASSWORD
```

登录成功后即可发布动态。

---

## 发布文字动态

填写：

```txt
标题：第一条后台动态
正文：测试后台发布功能是否正常。
类型：文字
标签：测试,后台,D1
```

发布后，回首页刷新，动态墙应该能看到这条内容。

---

## 发布图片动态

图片动态可以填写图片链接。

图片链接支持多个，一行一个。

示例：

```txt
https://example.com/image1.jpg
https://example.com/image2.jpg
```

说明：

当前版本暂时是填写图片 URL，不是直接上传图片文件。

后续可以升级 Cloudflare R2 图床，实现后台直接上传图片。

---

## 发布视频动态

视频动态可以填写视频链接。

支持：

```txt
mp4 直链
B站链接
YouTube 链接
你自己的视频站链接
```

当前版本主要用于展示视频入口或视频链接。

---

# 💬 留言板使用

前台留言板支持访客提交：

```txt
昵称
留言内容
```

提交后内容会保存到 D1 的 `messages` 表。

如果留言不显示，检查：

1. D1 是否绑定成功
2. Binding 名称是否为 `DB`
3. 数据库是否执行了 `schema.sql`
4. Cloudflare 是否重新部署
5. 浏览器控制台是否有接口错误

---

# 🔄 日常更新网站

以后修改代码、样式、README 或静态内容后：

```bash
git add .
git commit -m "update digital base"
git push
```

Cloudflare 会自动重新部署。

---

## 常见更新场景

### 修改 README

```bash
git add README.md
git commit -m "update README"
git push
```

---

### 修改前台样式

```bash
git add styles.css
git commit -m "update styles"
git push
```

---

### 修改前台页面

```bash
git add index.html script.js
git commit -m "update homepage"
git push
```

---

### 修改后台功能

```bash
git add admin functions
git commit -m "update admin functions"
git push
```

---

# 🧪 本地预览

普通静态预览：

```bash
python -m http.server 8080
```

然后打开：

```txt
http://localhost:8080
```

注意：

这种方式只能预览静态页面。

不能完整测试：

```txt
Cloudflare Pages Functions
D1 数据库
后台发布接口
留言接口
```

这些功能需要部署到 Cloudflare 后测试。

---

# 🧯 常见问题

## 1. 首页能打开，但后台发不了动态

检查：

- 是否创建 D1 数据库
- 是否执行 `schema.sql`
- 是否绑定 D1
- Binding 变量名是否为 `DB`
- 是否设置 `ADMIN_PASSWORD`
- 是否重新部署

---

## 2. 后台登录失败

检查 Cloudflare 环境变量：

```txt
ADMIN_PASSWORD
```

是否拼写正确。

不能写成：

```txt
PASSWORD
ADMIN_PASS
admin_password
```

必须是：

```txt
ADMIN_PASSWORD
```

---

## 3. git push 被拒绝

先执行：

```bash
git pull --rebase origin main
git push
```

如果出现 README 冲突，需要手动解决冲突后：

```bash
git add README.md
git rebase --continue
git push
```

---

## 4. Vim 弹出来不知道怎么退出

如果 Git 打开 Vim 编辑器：

按：

```txt
Esc
```

输入：

```txt
:wq
```

回车。

如果想强制退出：

```txt
Esc
:q!
```

回车。

---

## 5. GitHub 无法连接

如果出现：

```txt
Could not connect to server
```

可能是网络问题。

可以：

- 换节点
- 换网络
- 用手机热点
- 稍后重试

然后重新执行：

```bash
git push
```

---

# 📦 后续可升级方向

## 第一阶段：完善后台

- 动态删除
- 动态编辑
- 留言删除
- 留言审核
- 文章详情页

---

## 第二阶段：媒体功能

- Cloudflare R2 图床
- 后台上传图片
- 视频封面上传
- 图片相册
- 游戏截图墙

---

## 第三阶段：互动功能

- 动态评论
- 点赞
- 朋友留言墙
- 今日牢大
- 开黑预约
- 访客昵称记忆

---

## 第四阶段：个人空间高级化

- 时间轴
- 音乐播放器
- 主题切换
- 私密动态
- 登录系统
- 朋友权限
- Markdown 文章编辑器

---

# 🧠 项目定位

Digital Base 不是传统博客。

它更像：

```txt
个人主页
+ QQ空间
+ 游戏大厅
+ 收藏导航
+ 动态墙
+ 朋友空间
+ 视频入口
```

目标是打造一个真正属于自己的：

```txt
个人互联网数字基地
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

# ⭐ 说明

这个项目适合慢慢扩展。

先把基础功能跑通：

```txt
部署
后台
D1
动态墙
留言板
```

后面再逐步加入：

```txt
图床
评论
文章
相册
权限
朋友互动
```

一点点把它变成真正的个人数字空间。
