const tokenKey = "adminToken";
const $ = (selector) => document.querySelector(selector);

const navItems = [
  ["dashboard", "仪表盘"],
  ["site", "首页设置"],
  ["heroSlides", "轮播管理"],
  ["posts", "动态管理"],
  ["messages", "留言管理"],
  ["videos", "视频入口"],
  ["projects", "项目管理"],
  ["resources", "资源站"],
  ["bookmarks", "我的导航"],
  ["friends", "朋友空间"],
  ["media", "媒体库"],
  ["front", "返回前台"],
  ["logout", "退出登录"]
];

const mediaCategories = ["post", "hero", "slide", "project", "resource", "avatar", "gallery", "other"];
const mediaCategoryLabels = {
  post: "动态",
  hero: "首页",
  slide: "轮播",
  project: "项目",
  resource: "资源站",
  avatar: "头像",
  gallery: "图库",
  other: "其他"
};

const configs = {
  heroSlides: {
    title: "轮播管理",
    endpoint: "/api/hero-slides",
    listKey: "slides",
    idName: "hero-slide",
    fields: [
      ["title", "标题"],
      ["subtitle", "副标题"],
      ["description", "说明", "textarea"],
      ["image", "图片链接"],
      ["button_text", "按钮文字"],
      ["button_link", "按钮链接"],
      ["sort_order", "排序", "number"],
      ["is_public", "显示", "checkbox"]
    ]
  },
  posts: {
    title: "动态管理",
    endpoint: "/api/posts",
    listKey: "posts",
    idName: "post",
    fields: [
      ["title", "标题"],
      ["body", "正文", "textarea"],
      ["type", "类型", "select", ["文字", "图片", "视频", "文章"]],
      ["images", "图片链接，换行分隔", "textarea"],
      ["video_url", "视频链接"],
      ["tags", "标签，逗号分隔"],
      ["is_public", "显示", "checkbox"],
      ["is_pinned", "置顶", "checkbox"]
    ]
  },
  videos: {
    title: "视频入口",
    endpoint: "/api/video-links",
    listKey: "videos",
    idName: "video",
    fields: [
      ["title", "标题"],
      ["description", "说明", "textarea"],
      ["cover", "封面图"],
      ["url", "跳转链接"],
      ["tags", "标签，逗号分隔"],
      ["sort_order", "排序", "number"],
      ["is_public", "显示", "checkbox"]
    ]
  },
  projects: {
    title: "项目管理",
    endpoint: "/api/projects",
    listKey: "projects",
    idName: "project",
    fields: [
      ["title", "标题"],
      ["description", "说明", "textarea"],
      ["cover", "封面图"],
      ["url", "跳转链接"],
      ["tags", "标签，逗号分隔"],
      ["sort_order", "排序", "number"],
      ["is_public", "显示", "checkbox"]
    ]
  },
  resources: {
    title: "资源站",
    endpoint: "/api/resources",
    listKey: "resources",
    idName: "resource",
    fields: [
      ["title", "标题"],
      ["description", "说明", "textarea"],
      ["icon", "图标文字"],
      ["url", "跳转链接"],
      ["category", "分类"],
      ["sort_order", "排序", "number"],
      ["is_public", "显示", "checkbox"]
    ]
  },
  bookmarks: {
    title: "我的导航",
    endpoint: "/api/bookmarks",
    listKey: "bookmarks",
    idName: "bookmark",
    fields: [
      ["title", "标题"],
      ["description", "说明", "textarea"],
      ["icon", "图标文字"],
      ["url", "跳转链接"],
      ["category", "分类", "select", ["AI工具", "游戏", "开发", "视频", "素材", "常用"]],
      ["sort_order", "排序", "number"],
      ["is_public", "显示", "checkbox"]
    ]
  },
  friends: {
    title: "朋友空间",
    endpoint: "/api/friends",
    listKey: "friends",
    idName: "friend",
    fields: [
      ["name", "名字"],
      ["status", "状态", "textarea"],
      ["avatar", "头像链接"],
      ["tag", "标签"],
      ["sort_order", "排序", "number"],
      ["is_public", "显示", "checkbox"]
    ]
  }
};

const state = {
  active: "dashboard",
  editing: {}
};

function getToken() {
  return localStorage.getItem(tokenKey) || "";
}

function setHint(el, text, type = "") {
  if (!el) return;
  el.textContent = text;
  el.className = `hint ${type}`.trim();
}

function notify(text, type = "ok") {
  setHint($("#globalHint"), text, type);
}

async function withButtonLoading(button, loadingText, task) {
  const oldText = button.textContent;
  button.disabled = true;
  button.textContent = loadingText;
  try {
    return await task();
  } finally {
    button.disabled = false;
    button.textContent = oldText;
  }
}

function showLoggedIn(loggedIn) {
  $("#loginHero").classList.toggle("hidden", loggedIn);
  $("#loginPanel").classList.toggle("hidden", loggedIn);
  $("#cmsApp").classList.toggle("hidden", !loggedIn);
  if (loggedIn) {
    renderNav();
    renderSection(state.active);
  }
}

async function apiJson(url, options = {}) {
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  if (getToken()) headers.Authorization = `Bearer ${getToken()}`;
  const res = await fetch(url, { ...options, headers, cache: "no-store" });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `请求失败：${res.status}`);
  return data;
}

async function apiForm(url, formData) {
  const headers = {};
  if (getToken()) headers.Authorization = `Bearer ${getToken()}`;
  const res = await fetch(url, { method: "POST", headers, body: formData, cache: "no-store" });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `请求失败：${res.status}`);
  return data;
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function normalizeArray(value) {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return String(value).split(",").map((item) => item.trim()).filter(Boolean);
  }
}

function getMediaFieldMeta(name, sectionKey = "") {
  if (name === "images") return { category: "post", multi: true };
  if (name === "hero_background_image") return { category: "hero", multi: false };
  if (name === "image") return { category: "slide", multi: false };
  if (name === "cover") return { category: sectionKey === "videos" ? "gallery" : "project", multi: false };
  if (name === "icon") return { category: "resource", multi: false };
  if (name === "avatar") return { category: "avatar", multi: false };
  return null;
}

function renderMediaTools(name, sectionKey = "") {
  const meta = getMediaFieldMeta(name, sectionKey);
  if (!meta) return "";
  return `
    <div class="media-tools" data-field="${escapeHtml(name)}" data-category="${escapeHtml(meta.category)}" data-multi="${meta.multi ? "1" : "0"}">
      <button class="tiny-btn" type="button" data-media-action="upload">上传图片</button>
      <button class="tiny-btn ghost-btn" type="button" data-media-action="pick">从媒体库选择</button>
      <input class="media-file" type="file" accept="image/jpeg,image/png,image/webp,image/gif" hidden />
    </div>
  `;
}

function setMediaFieldValue(fieldName, url, multi = false) {
  const field = $(`[name="${fieldName}"]`);
  if (!field) return;
  if (multi) {
    const current = field.value.trim();
    field.value = current ? `${current}\n${url}` : url;
  } else {
    field.value = url;
  }
  field.dispatchEvent(new Event("input", { bubbles: true }));
}

function formatBytes(size = 0) {
  const value = Number(size) || 0;
  if (value >= 1024 * 1024) return `${(value / 1024 / 1024).toFixed(1)} MB`;
  if (value >= 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${value} B`;
}

async function copyText(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const input = document.createElement("textarea");
  input.value = text;
  input.style.position = "fixed";
  input.style.opacity = "0";
  document.body.appendChild(input);
  input.select();
  document.execCommand("copy");
  input.remove();
}


function renderCategoryOptions(active = "", includeAll = false) {
  return `${includeAll ? '<option value="">全部分类</option>' : ""}${mediaCategories.map((category) => `
    <option value="${category}" ${active === category ? "selected" : ""}>${mediaCategoryLabels[category]}</option>
  `).join("")}`;
}

async function uploadMediaFile(file, category = "other", alt = "", caption = "") {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("category", category);
  formData.append("alt", alt);
  formData.append("caption", caption);
  return apiForm("/api/upload", formData);
}

function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString("zh-CN");
}

function renderNav() {
  $("#cmsNav").innerHTML = navItems.map(([key, label]) => `
    <button class="nav-btn ${state.active === key ? "active" : ""}" type="button" data-nav="${key}">${label}</button>
  `).join("");
}

function setActive(key) {
  if (key === "front") {
    window.location.href = "/";
    return;
  }
  if (key === "logout") {
    localStorage.removeItem(tokenKey);
    showLoggedIn(false);
    return;
  }
  state.active = key;
  renderNav();
  renderSection(key);
}

function sectionShell(kicker, title, body) {
  $("#cmsMain").innerHTML = `
    <section class="cms-section">
      <div class="section-title">
        <div>
          <p>${kicker}</p>
          <h2>${title}</h2>
        </div>
      </div>
      <p class="hint" id="globalHint"></p>
      ${body}
    </section>
  `;
}

async function fetchList(config, admin = true, limit = 200) {
  const data = await apiJson(`${config.endpoint}?admin=${admin ? "1" : "0"}&limit=${limit}`);
  return data[config.listKey] || [];
}

async function renderDashboard() {
  sectionShell("DASHBOARD", "仪表盘", `
    <div class="dashboard-grid" id="statsGrid"></div>
    <div class="two-col">
      <div class="card"><div class="panel-head"><p>RECENT POSTS</p><h2>最近 5 条动态</h2></div><div class="list" id="recentPosts"></div></div>
      <div class="card"><div class="panel-head"><p>RECENT MESSAGES</p><h2>最近 5 条留言</h2></div><div class="list" id="recentMessages"></div></div>
    </div>
  `);

  const [posts, messages, slides, projects, bookmarks] = await Promise.all([
    fetchList(configs.posts),
    apiJson("/api/messages?admin=1&limit=200").then((data) => data.messages || []),
    fetchList(configs.heroSlides),
    fetchList(configs.projects),
    fetchList(configs.bookmarks)
  ]);

  const stats = [
    ["动态数量", posts.length],
    ["留言数量", messages.length],
    ["轮播数量", slides.length],
    ["项目数量", projects.length],
    ["导航数量", bookmarks.length]
  ];
  $("#statsGrid").innerHTML = stats.map(([label, value]) => `
    <div class="stat-card"><span>${label}</span><strong>${value}</strong></div>
  `).join("");
  $("#recentPosts").innerHTML = posts.slice(0, 5).map(renderListItem).join("") || "<p class='hint'>暂无动态</p>";
  $("#recentMessages").innerHTML = messages.slice(0, 5).map(renderMessageItem).join("") || "<p class='hint'>暂无留言</p>";
}

async function renderSiteSettings() {
  const data = await apiJson("/api/site-settings").catch(() => ({ settings: {} }));
  const s = data.settings || {};
  const fields = [
    ["hero_kicker", "Hero Kicker"],
    ["hero_title", "Hero 标题"],
    ["hero_description", "Hero 描述", "textarea"],
    ["hero_primary_button_text", "主按钮文字"],
    ["hero_primary_button_link", "主按钮链接"],
    ["hero_secondary_button_text", "副按钮文字"],
    ["hero_secondary_button_link", "副按钮链接"],
    ["hero_status_title", "状态标题"],
    ["hero_status_description", "状态说明"],
    ["hero_background_image", "背景图链接"]
  ];
  sectionShell("HOME", "首页设置", `
    <form class="stack-form" id="siteForm">
      <div class="form-grid">
        ${fields.map(([name, label, type]) => renderField({ name, label, type, value: s[name] || "", sectionKey: "site" })).join("")}
      </div>
      <button type="submit">保存首页设置</button>
      <p class="hint" id="siteHint"></p>
    </form>
  `);
  $("#siteForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const button = event.submitter || $("#siteForm button[type='submit']");
    const payload = {};
    fields.forEach(([name]) => payload[name] = getInputValue(name));
    await withButtonLoading(button, "保存中...", async () => {
      try {
      await apiJson("/api/site-settings", { method: "PUT", body: JSON.stringify(payload) });
      setHint($("#siteHint"), "首页设置已保存，刷新前台可查看效果。", "ok");
      notify("首页设置保存成功。", "ok");
      } catch (error) {
      setHint($("#siteHint"), error.message, "bad");
      notify(`请求失败：${error.message}`, "bad");
      }
    });
  });
  bindMediaTools();
}

function renderField({ name, label, type = "text", value = "", options = [], sectionKey = "" }) {
  const full = type === "textarea" ? " full" : "";
  const tools = renderMediaTools(name, sectionKey);
  if (type === "textarea") {
    return `<div class="field-wrap${full}"><label><span>${label}</span><textarea name="${name}" rows="4">${escapeHtml(value)}</textarea></label>${tools}</div>`;
  }
  if (type === "select") {
    return `<div class="field-wrap"><label><span>${label}</span><select name="${name}">${options.map((option) => `
      <option value="${escapeHtml(option)}" ${String(value) === option ? "selected" : ""}>${escapeHtml(option)}</option>
    `).join("")}</select></label>${tools}</div>`;
  }
  if (type === "checkbox") {
    return `<div class="field-wrap"><label><span>${label}</span><input name="${name}" type="checkbox" ${Number(value ?? 1) ? "checked" : ""} /></label>${tools}</div>`;
  }
  return `<div class="field-wrap"><label><span>${label}</span><input name="${name}" type="${type}" value="${escapeHtml(value ?? "")}" /></label>${tools}</div>`;
}

function getInputValue(name) {
  const input = $(`[name="${name}"]`);
  if (!input) return "";
  if (input.type === "checkbox") return input.checked ? 1 : 0;
  return input.value;
}

function itemTitle(item) {
  return item.title || item.name || item.nickname || `#${item.id}`;
}

function itemBody(item) {
  return item.description || item.body || item.status || item.content || item.url || "";
}

function renderListItem(item) {
  const tags = normalizeArray(item.tags);
  return `
    <article class="list-item">
      <div class="list-top">
        <div>
          <h3>${escapeHtml(itemTitle(item))}</h3>
          <p>${escapeHtml(itemBody(item))}</p>
        </div>
        <span class="pill">${item.is_public === 0 ? "隐藏" : "显示"}</span>
      </div>
      <div class="pill-row">
        ${item.is_pinned ? '<span class="pill">置顶</span>' : ""}
        ${item.type ? `<span class="pill">${escapeHtml(item.type)}</span>` : ""}
        ${item.category ? `<span class="pill">${escapeHtml(item.category)}</span>` : ""}
        ${tags.map((tag) => `<span class="pill">${escapeHtml(tag)}</span>`).join("")}
        ${item.created_at ? `<span class="pill">${formatDate(item.created_at)}</span>` : ""}
      </div>
    </article>
  `;
}

function renderMessageItem(item) {
  return `
    <article class="list-item">
      <div class="list-top">
        <div>
          <h3>${escapeHtml(item.nickname || "访客")}</h3>
          <p>${escapeHtml(item.content || "")}</p>
        </div>
        <span class="pill">${item.is_public === 0 ? "隐藏" : "显示"}</span>
      </div>
      <div class="pill-row">${item.created_at ? `<span class="pill">${formatDate(item.created_at)}</span>` : ""}</div>
    </article>
  `;
}

function renderForm(config, item = {}, sectionKey = "") {
  return `
    <form class="stack-form" id="resourceForm">
      <input type="hidden" name="id" value="${escapeHtml(item.id || "")}" />
      <div class="form-grid">
        ${config.fields.map(([name, label, type, options]) => {
          let value = item[name];
          if (name === "tags" || name === "images") value = normalizeArray(value).join(name === "images" ? "\n" : ", ");
          return renderField({ name, label, type, value, options, sectionKey });
        }).join("")}
      </div>
      <div class="action-row">
        <button type="submit">${item.id ? "保存修改" : "新增"}</button>
        ${item.id ? '<button class="ghost-btn" type="button" id="cancelEdit">取消编辑</button>' : ""}
      </div>
      <p class="hint" id="resourceHint"></p>
    </form>
  `;
}

async function renderResourceManager(key) {
  const config = configs[key];
  const editing = state.editing[key] || null;
  sectionShell("CMS", config.title, `
    <div class="card">${renderForm(config, editing || {}, key)}</div>
    <div class="list" id="resourceList"></div>
  `);
  bindResourceForm(key);
  bindMediaTools();
  await refreshResourceList(key);
}

function bindResourceForm(key) {
  const config = configs[key];
  $("#resourceForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const button = event.submitter || $("#resourceForm button[type='submit']");
    const id = getInputValue("id");
    const payload = {};
    config.fields.forEach(([name]) => payload[name] = getInputValue(name));
    await withButtonLoading(button, "保存中...", async () => {
      try {
      const url = id ? `${config.endpoint}?id=${encodeURIComponent(id)}` : config.endpoint;
      await apiJson(url, {
        method: id ? "PUT" : "POST",
        body: JSON.stringify(payload)
      });
      state.editing[key] = null;
      await renderResourceManager(key);
      notify(id ? "保存成功，列表已刷新。" : "新增成功，列表已刷新。", "ok");
      } catch (error) {
      setHint($("#resourceHint"), error.message, "bad");
      notify(`请求失败：${error.message}`, "bad");
      }
    });
  });
  $("#cancelEdit")?.addEventListener("click", () => {
    state.editing[key] = null;
    renderResourceManager(key);
  });
}

async function refreshResourceList(key) {
  const config = configs[key];
  const items = await fetchList(config);
  $("#resourceList").innerHTML = items.map((item) => `
    <article class="list-item">
      <div class="list-top">
        <div>
          <h3>${escapeHtml(itemTitle(item))}</h3>
          <p>${escapeHtml(itemBody(item))}</p>
        </div>
        <span class="pill">${item.is_public === 0 ? "隐藏" : "显示"}</span>
      </div>
      <div class="pill-row">
        ${item.sort_order !== undefined ? `<span class="pill">排序 ${item.sort_order}</span>` : ""}
        ${item.is_pinned ? '<span class="pill">置顶</span>' : ""}
        ${item.created_at ? `<span class="pill">${formatDate(item.created_at)}</span>` : ""}
      </div>
      <div class="action-row">
        <button class="tiny-btn" type="button" data-action="edit" data-id="${item.id}">编辑</button>
        <button class="tiny-btn" type="button" data-action="toggle" data-id="${item.id}" data-value="${item.is_public === 0 ? 1 : 0}">${item.is_public === 0 ? "显示" : "隐藏"}</button>
        ${key === "posts" ? `<button class="tiny-btn" type="button" data-action="pin" data-id="${item.id}" data-value="${item.is_pinned ? 0 : 1}">${item.is_pinned ? "取消置顶" : "置顶"}</button>` : ""}
        <button class="tiny-btn danger-btn" type="button" data-action="delete" data-id="${item.id}">删除</button>
      </div>
    </article>
  `).join("") || "<p class='hint'>暂无数据</p>";

  $("#resourceList").onclick = async (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;
    const id = Number(button.dataset.id);
    const action = button.dataset.action;
    const item = items.find((row) => row.id === id);
    if (action === "edit") {
      state.editing[key] = item;
      await renderResourceManager(key);
      return;
    }
    try {
      if (action === "delete") {
        if (!confirm("确认删除？此操作不可恢复。")) return;
        await withButtonLoading(button, "删除中...", async () => {
          await apiJson(`${config.endpoint}?id=${encodeURIComponent(id)}`, { method: "DELETE" });
          notify("删除成功，列表已刷新。", "ok");
        });
      }
      if (action === "toggle") {
        await withButtonLoading(button, "保存中...", async () => {
          await apiJson(`${config.endpoint}?id=${encodeURIComponent(id)}`, { method: "PUT", body: JSON.stringify({ is_public: Number(button.dataset.value) }) });
          notify(Number(button.dataset.value) ? "已设为显示。" : "已隐藏。", "ok");
        });
      }
      if (action === "pin") {
        await withButtonLoading(button, "保存中...", async () => {
          await apiJson(`${config.endpoint}?id=${encodeURIComponent(id)}`, { method: "PUT", body: JSON.stringify({ is_pinned: Number(button.dataset.value) }) });
          notify(Number(button.dataset.value) ? "已置顶。" : "已取消置顶。", "ok");
        });
      }
    } catch (error) {
      notify(`请求失败：${error.message}`, "bad");
      return;
    }
    await refreshResourceList(key);
  };
}

function bindMediaTools(root = $("#cmsMain")) {
  root?.querySelectorAll(".media-tools").forEach((tools) => {
    const fileInput = tools.querySelector(".media-file");
    const field = tools.dataset.field;
    const category = tools.dataset.category || "other";
    const multi = tools.dataset.multi === "1";

    tools.querySelector('[data-media-action="upload"]')?.addEventListener("click", () => fileInput.click());
    tools.querySelector('[data-media-action="pick"]')?.addEventListener("click", () => {
      openMediaPicker({ field, category, multi }).catch((error) => notify(`媒体库打开失败：${error.message}`, "bad"));
    });
    fileInput?.addEventListener("change", async () => {
      const file = fileInput.files?.[0];
      if (!file) return;
      try {
        notify("图片上传中...");
        const data = await uploadMediaFile(file, category);
        setMediaFieldValue(field, data.url || data.key, multi);
        notify(data.needs_public_base_url ? "上传成功，但还需要配置 PUBLIC_ASSET_BASE_URL 才能公开访问。" : "图片上传成功，已填入表单。", "ok");
      } catch (error) {
        notify(`上传失败：${error.message}`, "bad");
      } finally {
        fileInput.value = "";
      }
    });
  });
}

async function openMediaPicker({ field, category = "", multi = false }) {
  const old = $(".media-modal");
  if (old) old.remove();
  const data = await apiJson(`/api/media?category=${encodeURIComponent(category)}&limit=120`);
  const assets = data.media || [];
  document.body.insertAdjacentHTML("beforeend", `
    <div class="media-modal" role="dialog" aria-modal="true">
      <div class="media-dialog">
        <div class="section-title">
          <div>
            <p>MEDIA PICKER</p>
            <h2>选择图片</h2>
          </div>
          <button class="tiny-btn ghost-btn" type="button" data-close-media>关闭</button>
        </div>
        <div class="media-grid picker-grid">
          ${assets.map((asset) => renderMediaCard(asset, true)).join("") || "<p class='hint'>这个分类还没有图片。</p>"}
        </div>
      </div>
    </div>
  `);

  const modal = $(".media-modal");
  modal.addEventListener("click", (event) => {
    if (event.target === modal || event.target.closest("[data-close-media]")) {
      modal.remove();
      return;
    }
    const button = event.target.closest("[data-pick-url]");
    if (!button) return;
    setMediaFieldValue(field, button.dataset.pickUrl, multi);
    notify("已从媒体库填入图片。", "ok");
    modal.remove();
  });
}

function renderMediaCard(asset, picker = false) {
  const imageAlt = asset.alt || asset.original_name || asset.filename || "media";
  return `
    <article class="media-card">
      <div class="media-thumb">
        <img src="${escapeHtml(asset.url)}" alt="${escapeHtml(imageAlt)}" loading="lazy" onerror="this.parentElement.classList.add('broken')" />
      </div>
      <div class="media-info">
        <strong>${escapeHtml(asset.caption || asset.original_name || asset.filename || asset.key || "未命名图片")}</strong>
        <span>${escapeHtml(mediaCategoryLabels[asset.category] || asset.category || "其他")} / ${escapeHtml(asset.source || "")}</span>
        <span>${formatBytes(asset.size)} / ${formatDate(asset.created_at)}</span>
      </div>
      <div class="action-row">
        ${picker ? `<button class="tiny-btn" type="button" data-pick-url="${escapeHtml(asset.url)}">选择</button>` : ""}
        <button class="tiny-btn ghost-btn" type="button" data-copy-url="${escapeHtml(asset.url)}">复制 URL</button>
        ${picker ? "" : `<button class="tiny-btn danger-btn" type="button" data-delete-media="${asset.id}">删除</button>`}
      </div>
    </article>
  `;
}

async function renderMediaManager() {
  sectionShell("MEDIA", "媒体库", `
    <div class="two-col">
      <div class="card">
        <div class="panel-head"><p>UPLOAD</p><h2>上传图片到 R2</h2></div>
        <form class="stack-form" id="uploadForm">
          <input name="file" type="file" accept="image/jpeg,image/png,image/webp,image/gif" required />
          <select name="category">${renderCategoryOptions("other")}</select>
          <input name="alt" placeholder="alt 文本" />
          <textarea name="caption" rows="2" placeholder="图片说明"></textarea>
          <button type="submit">上传图片</button>
          <p class="hint" id="uploadHint"></p>
        </form>
      </div>
      <div class="card">
        <div class="panel-head"><p>EXTERNAL</p><h2>添加外链图片</h2></div>
        <form class="stack-form" id="externalMediaForm">
          <input name="url" placeholder="https://..." required />
          <select name="category">${renderCategoryOptions("other")}</select>
          <input name="alt" placeholder="alt 文本" />
          <textarea name="caption" rows="2" placeholder="图片说明"></textarea>
          <button type="submit">保存外链图片</button>
          <p class="hint" id="externalMediaHint"></p>
        </form>
      </div>
    </div>
    <div class="card">
      <div class="media-toolbar">
        <div class="panel-head"><p>LIBRARY</p><h2>图片列表</h2></div>
        <select id="mediaCategoryFilter">${renderCategoryOptions("", true)}</select>
      </div>
      <div class="media-grid" id="mediaList"></div>
    </div>
  `);

  $("#uploadForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const button = event.submitter || $("#uploadForm button[type='submit']");
    const form = event.currentTarget;
    const file = form.elements.file.files?.[0];
    if (!file) return;
    await withButtonLoading(button, "上传中...", async () => {
      try {
        const data = await uploadMediaFile(file, form.elements.category.value, form.elements.alt.value, form.elements.caption.value);
        setHint($("#uploadHint"), data.needs_public_base_url ? "上传成功，但需要配置 PUBLIC_ASSET_BASE_URL 才能公开访问。" : "上传成功。", "ok");
        form.reset();
        await refreshMediaList();
      } catch (error) {
        setHint($("#uploadHint"), error.message, "bad");
      }
    });
  });

  $("#externalMediaForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const button = event.submitter || $("#externalMediaForm button[type='submit']");
    const form = event.currentTarget;
    const payload = {
      url: form.elements.url.value,
      category: form.elements.category.value,
      alt: form.elements.alt.value,
      caption: form.elements.caption.value
    };
    await withButtonLoading(button, "保存中...", async () => {
      try {
        await apiJson("/api/media", { method: "POST", body: JSON.stringify(payload) });
        setHint($("#externalMediaHint"), "外链图片已保存。", "ok");
        form.reset();
        await refreshMediaList();
      } catch (error) {
        setHint($("#externalMediaHint"), error.message, "bad");
      }
    });
  });

  $("#mediaCategoryFilter").addEventListener("change", () => {
    refreshMediaList().catch((error) => notify(`媒体库读取失败：${error.message}`, "bad"));
  });
  await refreshMediaList().catch((error) => notify(`媒体库读取失败：${error.message}`, "bad"));
}

async function refreshMediaList() {
  const category = $("#mediaCategoryFilter")?.value || "";
  const data = await apiJson(`/api/media?category=${encodeURIComponent(category)}&limit=200`);
  const assets = data.media || [];
  $("#mediaList").innerHTML = assets.map((asset) => renderMediaCard(asset)).join("") || "<p class='hint'>暂无图片</p>";
  $("#mediaList").onclick = async (event) => {
    const copyButton = event.target.closest("[data-copy-url]");
    if (copyButton) {
      await copyText(copyButton.dataset.copyUrl);
      notify("URL 已复制。", "ok");
      return;
    }
    const deleteButton = event.target.closest("[data-delete-media]");
    if (!deleteButton) return;
    if (!confirm("确认删除这张图片？R2 图片会同时删除文件。")) return;
    await withButtonLoading(deleteButton, "删除中...", async () => {
      try {
        await apiJson(`/api/media?id=${encodeURIComponent(deleteButton.dataset.deleteMedia)}`, { method: "DELETE" });
        notify("图片已删除。", "ok");
        await refreshMediaList();
      } catch (error) {
        notify(`删除失败：${error.message}`, "bad");
      }
    });
  };
}

async function renderMessagesManager() {
  sectionShell("CMS", "留言管理", '<div class="list" id="messageList"></div>');
  const data = await apiJson("/api/messages?admin=1&limit=200");
  const messages = data.messages || [];
  $("#messageList").innerHTML = messages.map((item) => `
    <article class="list-item">
      <div class="list-top">
        <div>
          <h3>${escapeHtml(item.nickname)}</h3>
          <p>${escapeHtml(item.content)}</p>
        </div>
        <span class="pill">${item.is_public === 0 ? "隐藏" : "显示"}</span>
      </div>
      <div class="pill-row">${item.created_at ? `<span class="pill">${formatDate(item.created_at)}</span>` : ""}</div>
      <div class="action-row">
        <button class="tiny-btn" type="button" data-action="toggle" data-id="${item.id}" data-value="${item.is_public === 0 ? 1 : 0}">${item.is_public === 0 ? "显示" : "隐藏"}</button>
        <button class="tiny-btn danger-btn" type="button" data-action="delete" data-id="${item.id}">删除</button>
      </div>
    </article>
  `).join("") || "<p class='hint'>暂无留言</p>";

  $("#messageList").onclick = async (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;
    const id = Number(button.dataset.id);
    try {
      if (button.dataset.action === "delete") {
        if (!confirm("确认删除这条留言？")) return;
        await withButtonLoading(button, "删除中...", async () => {
          await apiJson(`/api/messages?id=${encodeURIComponent(id)}`, { method: "DELETE" });
          notify("留言已删除。", "ok");
        });
      } else {
        await withButtonLoading(button, "保存中...", async () => {
          await apiJson(`/api/messages?id=${encodeURIComponent(id)}`, {
            method: "PUT",
            body: JSON.stringify({ is_public: Number(button.dataset.value) })
          });
          notify(Number(button.dataset.value) ? "留言已显示。" : "留言已隐藏。", "ok");
        });
      }
    } catch (error) {
      notify(`请求失败：${error.message}`, "bad");
      return;
    }
    await renderMessagesManager();
  };
}

async function renderSection(key) {
  try {
    if (key === "dashboard") return renderDashboard();
    if (key === "site") return renderSiteSettings();
    if (key === "messages") return renderMessagesManager();
    if (key === "media") return renderMediaManager();
    return renderResourceManager(key);
  } catch (error) {
    sectionShell("ERROR", "读取失败", `<p class="hint bad">${escapeHtml(error.message)}</p>`);
  }
}

$("#loginForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const hint = $("#loginHint");
  setHint(hint, "正在登录...");
  try {
    const data = await apiJson("/api/login", {
      method: "POST",
      body: JSON.stringify({ password: $("#adminPassword").value })
    });
    localStorage.setItem(tokenKey, data.token);
    $("#adminPassword").value = "";
    setHint(hint, "登录成功。", "ok");
    showLoggedIn(true);
  } catch (error) {
    setHint(hint, error.message, "bad");
  }
});

$("#cmsNav").addEventListener("click", (event) => {
  const button = event.target.closest("button[data-nav]");
  if (!button) return;
  setActive(button.dataset.nav);
});

showLoggedIn(Boolean(getToken()));
