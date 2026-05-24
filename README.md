# Digital Base V3

暗黑游戏平台风格的个人互动网站。项目保持纯静态方案，只使用 HTML / CSS / JavaScript，内容集中在 `data/site.json`。

## 文件说明

```txt
index.html       页面结构
styles.css       视觉样式和移动端适配
script.js        数据渲染、轮播、菜单、锚点高亮
data/site.json   网站内容配置
```

## 更新内容

主要修改 `data/site.json`：

- `hero`：首页大轮播上的标题、说明、按钮
- `heroSlides`：首页轮播图
- `videos`：视频传送门入口
- `projects`：项目卡片
- `resources`：资源站入口
- `bookmarks`：我的导航页 / 书签收藏区
- `friends`、`messages`、`updates`：朋友空间和动态内容

## 本地预览

推荐在项目目录启动一个静态服务：

```bash
python -m http.server 8080
```

然后访问：

```txt
http://localhost:8080
```

如果只是双击 `index.html`，浏览器可能会因为本地文件限制而拦截 `fetch("./data/site.json")`。

## GitHub 上传

```bash
git init
git add .
git commit -m "update digital base v3"
git branch -M main
git remote add origin https://github.com/你的用户名/你的仓库名.git
git push -u origin main
```

如果仓库已经存在，只需要：

```bash
git add .
git commit -m "update digital base v3"
git push
```

## Cloudflare Pages 部署

1. 打开 Cloudflare Dashboard，进入 `Workers & Pages`。
2. 选择 `Create application` -> `Pages` -> `Connect to Git`。
3. 选择 GitHub 仓库和 `main` 分支。
4. 构建设置：
   - Framework preset: `None`
   - Build command: 留空，或填写 `exit 0`
   - Build output directory: `/`
   - Production branch: `main`
5. 点击部署。之后每次 `git push` 到 `main`，Cloudflare Pages 会自动更新。
