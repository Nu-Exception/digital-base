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
  ["front", "返回前台"],
  ["logout", "退出登录"]
];

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
  const res = await fetch(url, { ...options, headers });
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
        ${fields.map(([name, label, type]) => renderField({ name, label, type, value: s[name] || "" })).join("")}
      </div>
      <button type="submit">保存首页设置</button>
      <p class="hint" id="siteHint"></p>
    </form>
  `);
  $("#siteForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const payload = {};
    fields.forEach(([name]) => payload[name] = getInputValue(name));
    try {
      await apiJson("/api/site-settings", { method: "PUT", body: JSON.stringify(payload) });
      setHint($("#siteHint"), "首页设置已保存，刷新前台可查看效果。", "ok");
    } catch (error) {
      setHint($("#siteHint"), error.message, "bad");
    }
  });
}

function renderField({ name, label, type = "text", value = "", options = [] }) {
  const full = type === "textarea" ? " full" : "";
  if (type === "textarea") {
    return `<label class="${full}"><span>${label}</span><textarea name="${name}" rows="4">${escapeHtml(value)}</textarea></label>`;
  }
  if (type === "select") {
    return `<label><span>${label}</span><select name="${name}">${options.map((option) => `
      <option value="${escapeHtml(option)}" ${String(value) === option ? "selected" : ""}>${escapeHtml(option)}</option>
    `).join("")}</select></label>`;
  }
  if (type === "checkbox") {
    return `<label><span>${label}</span><input name="${name}" type="checkbox" ${Number(value ?? 1) ? "checked" : ""} /></label>`;
  }
  return `<label><span>${label}</span><input name="${name}" type="${type}" value="${escapeHtml(value ?? "")}" /></label>`;
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

function renderForm(config, item = {}) {
  return `
    <form class="stack-form" id="resourceForm">
      <input type="hidden" name="id" value="${escapeHtml(item.id || "")}" />
      <div class="form-grid">
        ${config.fields.map(([name, label, type, options]) => {
          let value = item[name];
          if (name === "tags" || name === "images") value = normalizeArray(value).join(name === "images" ? "\n" : ", ");
          return renderField({ name, label, type, value, options });
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
    <div class="card">${renderForm(config, editing || {})}</div>
    <div class="list" id="resourceList"></div>
  `);
  bindResourceForm(key);
  await refreshResourceList(key);
}

function bindResourceForm(key) {
  const config = configs[key];
  $("#resourceForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const id = getInputValue("id");
    const payload = {};
    config.fields.forEach(([name]) => payload[name] = getInputValue(name));
    try {
      await apiJson(config.endpoint, {
        method: id ? "PUT" : "POST",
        body: JSON.stringify(id ? { ...payload, id: Number(id) } : payload)
      });
      state.editing[key] = null;
      await renderResourceManager(key);
    } catch (error) {
      setHint($("#resourceHint"), error.message, "bad");
    }
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
    if (action === "delete") {
      if (!confirm("确认删除？此操作不可恢复。")) return;
      await apiJson(config.endpoint, { method: "DELETE", body: JSON.stringify({ id }) });
    }
    if (action === "toggle") {
      await apiJson(config.endpoint, { method: "PUT", body: JSON.stringify({ id, is_public: Number(button.dataset.value) }) });
    }
    if (action === "pin") {
      await apiJson(config.endpoint, { method: "PUT", body: JSON.stringify({ id, is_pinned: Number(button.dataset.value) }) });
    }
    await refreshResourceList(key);
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
    if (button.dataset.action === "delete") {
      if (!confirm("确认删除这条留言？")) return;
      await apiJson("/api/messages", { method: "DELETE", body: JSON.stringify({ id }) });
    } else {
      await apiJson("/api/messages", { method: "PUT", body: JSON.stringify({ id, is_public: Number(button.dataset.value) }) });
    }
    await renderMessagesManager();
  };
}

async function renderSection(key) {
  try {
    if (key === "dashboard") return renderDashboard();
    if (key === "site") return renderSiteSettings();
    if (key === "messages") return renderMessagesManager();
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
