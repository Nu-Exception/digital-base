# DIGITAL BASE V3

> 一个部署在 **Cloudflare Pages + Functions + D1** 上的个人数字基地。  
> 它不是单纯的静态主页，而是一个可以长期维护的个人内容平台：动态墙、项目展示、视频入口、资源站、导航收藏、留言板、CMS 后台都可以通过网页后台管理。

<p align="center">
  <img src="https://img.shields.io/badge/Cloudflare-Pages-F38020?style=for-the-badge&logo=cloudflare&logoColor=white" />
  <img src="https://img.shields.io/badge/Database-D1-F38020?style=for-the-badge&logo=cloudflare&logoColor=white" />
  <img src="https://img.shields.io/badge/Frontend-HTML%2FCSS%2FJS-222?style=for-the-badge" />
  <img src="https://img.shields.io/badge/CMS-Admin_Panel-ffd43b?style=for-the-badge" />
</p>

---

## 目录

- [项目介绍](#项目介绍)
- [功能预览](#功能预览)
- [使用前必须准备](#使用前必须准备)
- [Cloudflare 账号与信用卡验证说明](#cloudflare-账号与信用卡验证说明)
- [本地项目准备](#本地项目准备)
- [GitHub 仓库准备](#github-仓库准备)
- [Cloudflare Pages 部署](#cloudflare-pages-部署)
- [创建 D1 数据库](#创建-d1-数据库)
- [绑定 D1 数据库](#绑定-d1-数据库)
- [初始化数据库表](#初始化数据库表)
- [登录后台 CMS](#登录后台-cms)
- [后台内容管理说明](#后台内容管理说明)
- [视频入口封面规则](#视频入口封面规则)
- [全站背景图设置](#全站背景图设置)
- [留言板审核与显示](#留言板审核与显示)
- [常用测试地址](#常用测试地址)
- [常见问题与解决方法](#常见问题与解决方法)
- [更新项目的推荐流程](#更新项目的推荐流程)
- [项目结构说明](#项目结构说明)
- [联系方式](#联系方式)

---

## 项目介绍

**Digital Base V3** 是一个偏游戏控制台风格的个人网站，适合用来展示自己的项目、GitHub 仓库、喜欢的视频、常用网站导航、资源站、个人动态和留言内容。

它的核心结构是：

```txt
前台展示页面 + 后台 CMS + Cloudflare Functions API + Cloudflare D1 数据库
```

也就是说，你不需要每次改内容都去改代码。只要登录后台，就可以新增、编辑、隐藏、删除大部分内容。

---

## 功能预览

### 前台功能

| 模块 | 说明 |
|---|---|
| 首页 Hero | 展示个人网站主视觉、标题、简介、按钮 |
| 视频传送门 | 支持视频入口卡片，YouTube 自动封面，悬停/手机可静音预览 |
| 动态墙 | 发布文字、图片、视频类动态 |
| STATUS PANEL | 自动统计动态、项目、资源、导航、留言数量 |
| Recent Log | 最近动态轮播展示 |
| 项目控制台 | 展示 GitHub 项目或个人作品 |
| 资源站 | 放 Cloudflare、GitHub、ChatGPT 等资源入口 |
| 我的导航 | 放常用网站、工具、游戏、素材站 |
| 留言板 | 访客留言，后台可审核、隐藏、删除 |
| 全站背景 | 支持后台配置大背景图 |

### 后台 CMS 功能

| 后台菜单 | 用途 |
|---|---|
| 首页设置 | 改首页标题、描述、按钮、状态文案、全站背景图 |
| 轮播管理 | 管理首页 Hero 轮播图 |
| 动态管理 | 新增/编辑/隐藏/删除动态 |
| 留言管理 | 审核、隐藏、删除留言 |
| 视频入口 | 管理视频传送门内容 |
| 项目管理 | 管理项目展示 |
| 资源站 | 管理资源入口 |
| 我的导航 | 管理常用入口和书签 |
| 朋友空间 | 预留功能，可后续扩展 |
| 返回前台 | 回到网站首页 |
| 退出登录 | 退出 CMS 后台 |

---

## 使用前必须准备

在开始之前，一定先准备好这些东西，避免中途白忙活。

### 必备账号

| 项目 | 是否必须 | 用途 |
|---|---:|---|
| GitHub 账号 | 必须 | 存放项目代码 |
| Cloudflare 账号 | 必须 | 部署网站、创建 D1 数据库 |
| 邮箱 | 必须 | 注册、验证账号 |
| 可用网络环境 | 推荐 | Cloudflare、GitHub 访问可能受网络影响 |
| 信用卡 / 可验证支付方式 | 可能需要 | Cloudflare 账号风控或部分服务验证 |

### 本地工具

建议电脑安装：

| 工具 | 用途 |
|---|---|
| Git | 提交和上传项目 |
| Node.js | 运行检查命令、脚本 |
| VS Code / Trae / Cursor | 修改代码 |
| 浏览器 | 测试网站和后台 |

检查 Git：

```bash
git --version
```

检查 Node.js：

```bash
node -v
```

---

## Cloudflare 账号与信用卡验证说明

这个项目使用了 Cloudflare 的：

```txt
Cloudflare Pages
Cloudflare Functions
Cloudflare D1
```

大多数情况下免费额度够用。但是新账号、风控账号、部分地区账号，Cloudflare 可能会要求你进行支付方式验证。

### 可能遇到的情况

你可能在 Cloudflare 使用过程中遇到：

- 创建服务时提示验证身份
- 绑定某些资源时要求添加付款方式
- D1 / R2 / Workers 相关服务要求验证
- 账号安全风控要求信用卡验证

### 这一步是不是一定要做？

不一定。有些账号可以直接创建 Pages 和 D1，有些账号会被要求验证信用卡或付款方式。

### 需要注意

Cloudflare 验证信用卡通常是为了确认账号真实性，不等于一定会收费。但你仍然要自己看清 Cloudflare 页面提示，确认是否有付费计划、是否开启了额外收费服务。

### 建议

在继续部署前，先确认：

```txt
Cloudflare 账号能正常登录
Pages 能创建项目
D1 能创建数据库
账号没有验证拦截
```

如果卡在验证页面，先完成验证再继续。否则后面代码推上去了，也可能因为资源没有创建成功导致网站功能不完整。

---

## 本地项目准备

### 1. 下载或克隆项目

```bash
git clone https://github.com/Nu-Exception/digital-base.git
cd digital-base
```

如果你是下载 ZIP，解压后进入项目目录。

### 2. 确认目录里有这些文件

```txt
index.html
script.js
styles.css
README.md
schema.sql
admin/
functions/
data/
```

如果没有这些文件，说明你进错文件夹了。

### 3. 确认是不是 Git 仓库

```bash
git status
```

正常会显示：

```txt
On branch main
```

如果显示：

```txt
fatal: not a git repository
```

说明当前文件夹不是 Git 仓库。你需要进入真正的项目目录，例如：

```bash
cd digital-base-v3
```

或者重新初始化：

```bash
git init
git branch -M main
```

---

## GitHub 仓库准备

### 1. 创建 GitHub 仓库

进入 GitHub：

```txt
GitHub → New repository
```

建议仓库名：

```txt
digital-base
```

选择：

```txt
Public
```

创建后复制仓库地址，例如：

```txt
https://github.com/Nu-Exception/digital-base.git
```

### 2. 绑定远程仓库

```bash
git remote add origin https://github.com/Nu-Exception/digital-base.git
```

如果已经绑定过，但地址不对：

```bash
git remote set-url origin https://github.com/Nu-Exception/digital-base.git
```

查看远程地址：

```bash
git remote -v
```

### 3. 首次提交

```bash
git add .
git commit -m "init digital base"
git push -u origin main
```

---

## Cloudflare Pages 部署

### 1. 进入 Cloudflare Dashboard

打开 Cloudflare 后：

```txt
Workers & Pages → Create application → Pages → Connect to Git
```

### 2. 选择 GitHub 仓库

选择你的仓库：

```txt
digital-base
```

### 3. 构建设置

因为这个项目是原生 HTML/CSS/JS，不需要构建命令。

推荐设置：

| 项目 | 填写 |
|---|---|
| Framework preset | None |
| Build command | 留空 |
| Build output directory | `/` 或留空 |
| Root directory | `/` |

如果 Cloudflare 要求输出目录，可以填：

```txt
/
```

### 4. 部署

点击：

```txt
Save and Deploy
```

等待部署完成，成功后会得到类似：

```txt
https://digital-base.pages.dev
```

---

## 创建 D1 数据库

后台动态、项目、留言等内容需要 D1 数据库保存。

Cloudflare Dashboard：

```txt
Storage & databases → D1 SQL Database → Create
```

数据库名建议：

```txt
digital-base-db
```

创建完成后记住数据库名称。

---

## 绑定 D1 数据库

进入你的 Pages 项目：

```txt
Workers & Pages → digital-base → Settings → Bindings
```

添加 D1 绑定：

| 类型 | 变量名 | 数据库 |
|---|---|---|
| D1 database | `DB` | `digital-base-db` |

注意变量名必须是：

```txt
DB
```

如果写成别的，Functions API 会读不到数据库。

保存后重新部署一次。

---

## 初始化数据库表

项目根目录有：

```txt
schema.sql
```

这个文件用于创建表。

### 方法一：Cloudflare 控制台执行

进入：

```txt
D1 → digital-base-db → Console
```

复制 `schema.sql` 内容进去执行。

### 方法二：使用 Wrangler

如果你安装了 Wrangler：

```bash
npx wrangler d1 execute digital-base-db --file=./schema.sql
```

执行成功后，数据库会创建这些表：

```txt
posts
projects
resources
bookmarks
messages
video_links
hero_slides
site_settings
friends
```

不同版本可能略有差异，以 `schema.sql` 为准。

---

## 登录后台 CMS

部署成功后，后台地址一般是：

```txt
https://你的域名/admin/
```

例如：

```txt
https://digital-base.pages.dev/admin/
```

### 默认 Token / 密码

项目里后台验证通常会用一个 token。你需要检查：

```txt
functions/_lib/cms.js
admin/admin.js
```

或项目文档中定义的 admin token。

如果后台提示未授权，说明：

- token 不对
- API 没部署成功
- Functions 没生效
- D1 没绑定

---

## 后台内容管理说明

### 首页设置

路径：

```txt
后台 → 首页设置
```

可修改：

| 字段 | 作用 |
|---|---|
| Hero Kicker | 首页小标题 |
| Hero 标题 | 首页大标题 |
| Hero 描述 | 首页介绍文字 |
| 主按钮文字 | 第一个按钮文案 |
| 主按钮链接 | 第一个按钮跳转 |
| 副按钮文字 | 第二个按钮文案 |
| 副按钮链接 | 第二个按钮跳转 |
| 状态标题 | 状态卡标题 |
| 状态说明 | 状态卡说明 |
| 背景图链接 | 全站底层背景图 |

注意：**背景图链接控制的是整个网站底层背景，不是 Hero 轮播图。**

### 动态管理

路径：

```txt
后台 → 动态管理
```

可以发布文字、图片、视频类动态。图片链接一行一个。

### 视频入口

路径：

```txt
后台 → 视频入口
```

字段说明：

| 字段 | 说明 |
|---|---|
| 标题 | 视频卡片标题 |
| 说明 | 视频简介 |
| 封面图 | 可填图片直链，也可填视频链接 |
| 跳转链接 | 点击打开跳转的链接 |
| 标签 | 逗号分隔 |
| 排序 | 数字越小越靠前 |
| 显示 | 是否在前台显示 |

### 项目管理

路径：

```txt
后台 → 项目管理
```

适合填写 GitHub 项目、自己做的网站、工具软件、学习项目、视频剪辑展示项目。

### 资源站

路径：

```txt
后台 → 资源站
```

适合放 Cloudflare、GitHub、ChatGPT、文档站、开发工具、图片素材站。

### 我的导航

路径：

```txt
后台 → 我的导航
```

这里的数据会影响首页：

```txt
FAST LINKS / 常用入口
```

也会影响：

```txt
我的导航页 / 书签收藏区
```

### 留言管理

路径：

```txt
后台 → 留言管理
```

访客留言后，后台可以显示、隐藏、删除。如果前台没有显示留言，先看后台是否处于隐藏或待审核状态。

---

## 视频入口封面规则

视频入口的「封面图」字段支持两种写法。

### 1. 图片直链

可以填：

```txt
https://example.com/image.jpg
https://example.com/image.png
https://example.com/image.webp
```

前台会直接显示图片。

### 2. 视频链接

YouTube 链接会自动识别并生成封面：

```txt
https://www.youtube.com/watch?v=xxxx
https://youtu.be/xxxx
https://youtube.com/shorts/xxxx
```

系统会自动转换成 YouTube 缩略图。

### 3. B站或其他视频链接

B站、抖音、小红书等链接不一定能直接拿到封面，因为平台可能有跨域、反爬或权限限制。

这种情况下：

- 不会报错
- 会显示统一视频占位封面
- 点击打开仍然跳转原链接

---

## 全站背景图设置

进入：

```txt
后台 → 首页设置 → 背景图链接
```

填入图片直链，例如：

```txt
https://example.com/background.jpg
```

建议图片为横向大图、暗色、赛博风、游戏桌面、深夜工作台、复古电脑、雨夜城市。

不建议使用太亮的图，否则文字会看不清。

### 图片链接必须是直链

正确：

```txt
https://example.com/bg.jpg
```

错误：

```txt
Pinterest 页面链接
B站页面链接
网页文章链接
```

---

## 留言板审核与显示

留言板逻辑可能根据版本不同有两种模式。

### 模式一：留言后直接显示

访客发布留言后，前台立即显示。

### 模式二：后台审核后显示

访客发布留言后，后台可见，但前台不显示。你需要进入：

```txt
后台 → 留言管理
```

点击：

```txt
显示
```

如果 `/api/messages` 返回空，但后台有留言，检查 `is_public` 或后台显示状态。

---

## 常用测试地址

部署后，可以用这些地址检查接口是否正常。

```txt
https://你的域名/api/posts
https://你的域名/api/projects
https://你的域名/api/resources
https://你的域名/api/bookmarks
https://你的域名/api/messages
https://你的域名/api/messages?debug=1
```

正常接口会返回类似：

```json
{
  "posts": []
}
```

或者：

```json
{
  "messages": []
}
```

如果 debug 有数据，但正常接口空，说明过滤逻辑或显示状态有问题。

---

## 常见问题与解决方法

### 1. git push 报错：not a git repository

报错：

```txt
fatal: not a git repository
```

原因：当前目录不是 Git 仓库。

解决：

```bash
cd 你的项目目录
git status
```

如果还是不行：

```bash
git init
git branch -M main
```

### 2. Cloudflare 部署成功，但 API 返回空

先打开：

```txt
/api/posts
/api/projects
/api/messages
```

如果都返回空，检查：

1. D1 是否创建
2. Pages 是否绑定了 D1
3. 绑定变量名是否是 `DB`
4. 是否重新部署
5. 数据库表是否初始化
6. 后台内容是否勾选显示

### 3. 后台能看到数据，前台不显示

检查：

```txt
是否点了显示
is_public 是否为 1
前台是否缓存
是否 Ctrl + F5 强制刷新
/api 对应接口是否返回数据
```

### 4. 留言接口 debug 有数据，但正常接口没数据

打开：

```txt
/api/messages?debug=1
```

如果 debug 里 `all_rows` 有数据，但 `/api/messages` 空，说明 messages 接口过滤逻辑有问题。

解决方向：

```txt
让 /api/messages 直接返回最近 50 条 messages 表数据
```

### 5. 时间显示不对

如果显示的是 UTC 时间，不是中国时间，需要统一使用：

```txt
Asia/Shanghai
```

前端格式化应使用：

```js
new Date(dateString).toLocaleString("zh-CN", {
  timeZone: "Asia/Shanghai"
});
```

数据库可以继续存 UTC，显示层转换即可。

### 6. 视频封面不显示

检查封面图字段。

正确图片直链：

```txt
https://xxx.com/xxx.jpg
```

YouTube 视频链接：

```txt
https://www.youtube.com/watch?v=xxxx
```

如果是 B站、抖音、小红书，可能无法自动拿封面，会显示占位图，这是正常现象。

### 7. 网站打开自动跳到底部

检查是否存在：

```txt
scrollIntoView
autofocus
focus()
location.hash
window.scrollTo
```

首次打开网站时，如果没有 hash，应该保持顶部：

```js
window.scrollTo(0, 0);
```

### 8. Cloudflare Pages 修改后没生效

可能是部署还没完成、浏览器缓存、Cloudflare 缓存、推送的不是 main 分支。

解决：

```txt
Cloudflare Pages → Deployments
```

确认最新 commit 变绿。然后浏览器：

```txt
Ctrl + F5
```

### 9. GitHub API 限流

如果脚本读取 GitHub 项目时报：

```txt
API rate limit exceeded
```

解决：

- 等一小时
- 或使用 GitHub Token
- 或手动在后台项目管理添加项目

### 10. Cloudflare 绑定里没有 R2

当前版本主要使用：

```txt
D1 + 外链图片
```

如果你没有做站内图片上传，R2 不是必须。图片可以先用外部图床、GitHub 图片、Cloudinary、Postimages 等方式。

以后如果要做真正的后台上传图片，再接入 R2。

---

## 更新项目的推荐流程

每次修改项目后，建议使用命令行提交。

```bash
git status
git add .
git commit -m "update site"
git push
```

Cloudflare Pages 会自动部署。

部署后进入：

```txt
Cloudflare Pages → Deployments
```

确认最新提交变成绿色。

---

## 推荐给 Codex 的更新习惯

以后让 AI 或 Codex 修改项目时，建议每次都加上：

```txt
同步更新 README.md，说明本次改动内容、使用方法和注意事项。
```

这样 README 不会落后于项目功能。

---

## 项目结构说明

```txt
digital-base/
├── index.html
├── script.js
├── styles.css
├── README.md
├── schema.sql
├── data/
│   └── site.json
├── admin/
│   ├── index.html
│   ├── admin.js
│   └── admin.css
└── functions/
    ├── _lib/
    │   ├── cms.js
    │   └── resource.js
    └── api/
        ├── posts.js
        ├── projects.js
        ├── resources.js
        ├── bookmarks.js
        ├── messages.js
        ├── video-links.js
        ├── hero-slides.js
        └── site-settings.js
```

### 重要文件说明

| 文件 | 作用 |
|---|---|
| `index.html` | 前台页面结构 |
| `script.js` | 前台动态渲染和交互逻辑 |
| `styles.css` | 前台样式 |
| `admin/index.html` | 后台页面结构 |
| `admin/admin.js` | 后台管理逻辑 |
| `admin/admin.css` | 后台样式 |
| `functions/api/*.js` | Cloudflare Functions API |
| `schema.sql` | D1 数据库表结构 |
| `README.md` | 项目说明文档 |

---

## 适合继续扩展的功能

以后可以继续加：

- 图片上传到 R2
- Markdown 文章系统
- 留言回复
- 评论系统
- 访客统计
- Steam 状态展示
- GitHub 提交记录
- 视频分类页
- 搜索功能
- 标签归档
- 手机端专属优化
- 登录权限系统
- 主题切换
- 音乐播放器

---

## 联系方式

作者：**CS**

GitHub：

```txt
https://github.com/Nu-Exception
```

项目地址：

```txt
https://github.com/Nu-Exception/digital-base
```

邮箱：

```txt
gameforum.clubtime@gmail.com
```

个人网站：

```txt
https://digital-base.pages.dev
```

---

## 最后说明

这个项目不是一次性写完就结束的模板，而是一个可以不断扩展的个人数字基地。

你可以把它当成：

```txt
个人主页
项目展示台
游戏内容入口
学习记录站
工具导航页
数字生活档案馆
```

先让它跑起来，再慢慢填内容、改样式、加功能。

真正重要的是：

```txt
先部署成功
再接好数据库
再确认 API 有数据
最后再慢慢美化
```

不要一开始就追求完美。能跑起来，才有继续优化的价值。
