const $ = (selector) => document.querySelector(selector);

let siteData = {};
let bookmarkCategory = "全部";
let carouselTimer = null;
let recentLogItems = [];
let recentLogIndex = 0;
let recentLogTimer = null;
const BOOKMARK_CATEGORIES = ["AI工具", "游戏", "开发", "视频", "素材", "常用"];
const STATUS_STATS = [
  { key: "posts", label: "动态", url: "/api/posts" },
  { key: "projects", label: "项目", url: "/api/projects" },
  { key: "resources", label: "资源", url: "/api/resources" },
  { key: "bookmarks", label: "导航", url: "/api/bookmarks" },
  { key: "messages", label: "留言", url: "/api/messages" }
];

async function getData() {
  const res = await fetch("./data/site.json", { cache: "no-store" });
  if (!res.ok) throw new Error(`读取 data/site.json 失败：${res.status}`);
  return res.json();
}

async function apiJson(url, options) {
  const res = await fetch(url, {
    cache: "no-store",
    headers: { "Content-Type": "application/json", ...(options?.headers || {}) },
    ...options
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `请求失败：${res.status}`);
  return data;
}

async function tryApi(url, fallback, mapper = (value) => value) {
  try {
    return mapper(await apiJson(url));
  } catch (error) {
    console.warn(`${url} 暂不可用，使用静态回退。`, error);
    return fallback;
  }
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function attr(value = "") {
  return escapeHtml(value);
}

function normalizeUrl(value = "") {
  const url = String(value || "").trim();
  return url === "#" ? "" : url;
}

function isExternalUrl(url = "") {
  return /^https?:\/\//i.test(url);
}

function isImageUrl(value = "") {
  return /^https?:\/\//i.test(String(value)) || String(value).startsWith("/");
}

function isVisibleItem(item = {}) {
  const status = String(item.status || "").trim().toLowerCase();
  if (["hidden", "private", "draft", "隐藏"].includes(status)) return false;
  const fields = ["is_public", "visible", "is_visible"];
  const present = fields.filter((field) => item[field] !== undefined && item[field] !== null && item[field] !== "");
  if (!present.length) return true;
  return present.some((field) => Number(item[field]) === 1 || item[field] === true || item[field] === "true");
}

function sortCmsItems(items = []) {
  return [...items].sort(compareCmsItems);
}

function compareCmsItems(a, b) {
  const orderDiff = Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0);
  if (orderDiff) return orderDiff;
  return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
}

function normalizeArray(value) {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return String(value)
      .split(/[\n,]/)
      .map((item) => item.trim())
      .filter(Boolean);
  }
}

function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function applySiteSettings(data, settings = {}) {
  const hero = data.hero || {};
  return {
    ...data,
    hero: {
      ...hero,
      eyebrow: settings.hero_kicker || hero.eyebrow,
      title: settings.hero_title || hero.title,
      lead: settings.hero_description || hero.lead,
      primaryLabel: settings.hero_primary_button_text || hero.primaryLabel,
      primaryUrl: settings.hero_primary_button_link || hero.primaryUrl,
      secondaryLabel: settings.hero_secondary_button_text || hero.secondaryLabel,
      secondaryUrl: settings.hero_secondary_button_link || hero.secondaryUrl
    },
    mini: {
      ...(data.mini || {}),
      current: settings.hero_status_title || data.mini?.current,
      next: settings.hero_status_description || data.mini?.next
    },
    status: {
      ...(data.status || {}),
      title: settings.hero_status_title || data.status?.title,
      text: settings.hero_status_description || data.status?.text
    },
    heroBackgroundImage: settings.hero_background_image || ""
  };
}

async function loadSiteSettings(data) {
  return tryApi("/api/site-settings", data, (result) => applySiteSettings(data, result.settings || {}));
}

function setHero(data) {
  const hero = data.hero || {};
  $("#heroEyebrow").textContent = hero.eyebrow || "";
  $("#heroTitle").textContent = hero.title || "";
  $("#heroLead").textContent = hero.lead || "";
  $("#heroPrimary").textContent = hero.primaryLabel || "进入导航页";
  $("#heroPrimary").href = hero.primaryUrl || "#bookmarks";
  $("#heroSecondary").textContent = hero.secondaryLabel || "打开视频入口";
  $("#heroSecondary").href = hero.secondaryUrl || "#portal";
  $("#miniCurrent").textContent = data.mini?.current || "Digital Base";
  $("#miniNext").textContent = data.mini?.next || "Cloudflare Pages";
}

function normalizeSlide(slide) {
  return {
    image: slide.image,
    title: slide.title || "",
    subtitle: slide.subtitle || "",
    description: slide.description || "",
    button_text: slide.button_text || "",
    button_link: slide.button_link || ""
  };
}

async function loadSlides(data) {
  const fallback = data.heroBackgroundImage
    ? [{ image: data.heroBackgroundImage }, ...(data.heroSlides || [])]
    : (data.heroSlides || []);
  return tryApi("/api/hero-slides", fallback, (result) => {
    const slides = (result.slides || []).map(normalizeSlide).filter((slide) => slide.image);
    return slides.length ? slides : fallback;
  });
}

function setCarousel(slides) {
  const track = $("#carouselTrack");
  const dots = $("#dots");
  if (carouselTimer) window.clearInterval(carouselTimer);

  if (!slides.length) {
    track.innerHTML = '<div class="carousel-slide active"></div>';
    dots.innerHTML = "";
    return;
  }

  let current = 0;
  track.innerHTML = slides.map((slide, index) => `
    <div class="carousel-slide${index === 0 ? " active" : ""}" style='--image:url("${attr(slide.image)}")'></div>
  `).join("");
  dots.innerHTML = slides.map((_, index) => `
    <button type="button" aria-label="切换到第 ${index + 1} 张轮播"></button>
  `).join("");

  const slideEls = [...document.querySelectorAll(".carousel-slide")];
  const dotEls = [...document.querySelectorAll(".dots button")];
  const render = (next) => {
    current = next;
    slideEls.forEach((slide, index) => slide.classList.toggle("active", index === current));
    dotEls.forEach((dot, index) => dot.classList.toggle("active", index === current));
  };

  dotEls.forEach((dot, index) => dot.addEventListener("click", () => render(index)));
  render(0);
  carouselTimer = window.setInterval(() => render((current + 1) % slides.length), 5600);
}

function renderStatus() {
  $("#statusTitle").textContent = "基地在线";
  $("#statusText").innerHTML = '<span class="hud-pulse" aria-hidden="true"></span><span>ONLINE</span>';
  renderStatusStats();
}

function formatSyncTime(date = new Date()) {
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getFullYear()}/${pad(date.getMonth() + 1)}/${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function renderStatusStats(stats = {}) {
  $("#statusList").innerHTML = `
    <div class="hud-metrics">
      ${STATUS_STATS.map((item) => `
        <span>${item.label}：<strong>${Number(stats[item.key] || 0)}</strong></span>
      `).join("")}
    </div>
    <div class="hud-row">
      <span>最后同步</span>
      <strong>${escapeHtml(stats.syncedAt || formatSyncTime())}</strong>
    </div>
  `;
}

async function countStatusCollection(item) {
  try {
    const result = await apiJson(`${item.url}?t=${Date.now()}`);
    return Array.isArray(result[item.key]) ? result[item.key].length : 0;
  } catch (error) {
    console.warn(`${item.url} 统计读取失败，显示 0。`, error);
    return 0;
  }
}

async function loadStatusStats() {
  const counts = await Promise.all(STATUS_STATS.map(countStatusCollection));
  const stats = STATUS_STATS.reduce((next, item, index) => {
    next[item.key] = counts[index] || 0;
    return next;
  }, { syncedAt: formatSyncTime() });
  renderStatusStats(stats);
}

function normalizeRecentItem(item = {}) {
  return {
    time: item.created_at || item.time || "",
    title: item.title || item.text || "动态",
    body: item.body || item.description || item.text || ""
  };
}

function stopRecentLogCarousel() {
  if (recentLogTimer) window.clearInterval(recentLogTimer);
  recentLogTimer = null;
}

function startRecentLogCarousel() {
  stopRecentLogCarousel();
  if (recentLogItems.length > 1) {
    recentLogTimer = window.setInterval(() => {
      renderRecentSlide((recentLogIndex + 1) % recentLogItems.length, false);
    }, 4000);
  }
}

function renderRecentSlide(index = 0, restart = true) {
  const target = $("#updates");
  if (!target) return;
  if (!recentLogItems.length) {
    stopRecentLogCarousel();
    target.innerHTML = '<div class="empty-state">暂无动态</div>';
    return;
  }

  recentLogIndex = (index + recentLogItems.length) % recentLogItems.length;
  const item = recentLogItems[recentLogIndex];
  const hasMultiple = recentLogItems.length > 1;
  target.innerHTML = `
    <div class="recent-carousel">
      <article class="update-item recent-slide">
      <div class="update-top">
          <strong>${escapeHtml(formatDate(item.time))}</strong>
          <span>${escapeHtml(item.title)}</span>
      </div>
        <p>${escapeHtml(item.body)}</p>
      </article>
      ${hasMultiple ? `
        <div class="recent-controls" aria-label="最近动态轮播控制">
          <button type="button" class="recent-nav" data-recent-prev aria-label="上一条动态">‹</button>
          <div class="recent-dots" aria-label="最近动态指示器">
            ${recentLogItems.map((_, dotIndex) => `
              <button type="button" class="recent-dot${dotIndex === recentLogIndex ? " active" : ""}" data-recent-index="${dotIndex}" aria-label="第 ${dotIndex + 1} 条动态"></button>
            `).join("")}
          </div>
          <button type="button" class="recent-nav" data-recent-next aria-label="下一条动态">›</button>
    </div>
      ` : ""}
    </div>
  `;

  target.querySelector("[data-recent-prev]")?.addEventListener("click", () => {
    renderRecentSlide(recentLogIndex - 1);
  });
  target.querySelector("[data-recent-next]")?.addEventListener("click", () => {
    renderRecentSlide(recentLogIndex + 1);
  });
  target.querySelectorAll("[data-recent-index]").forEach((dot) => {
    dot.addEventListener("click", () => renderRecentSlide(Number(dot.dataset.recentIndex || 0)));
  });

  target.onmouseenter = stopRecentLogCarousel;
  target.onmouseleave = startRecentLogCarousel;
  if (restart) startRecentLogCarousel();
}

function renderRecentLog(items) {
  recentLogItems = items.slice(0, 5).map(normalizeRecentItem);
  recentLogIndex = 0;
  renderRecentSlide(0);
}

async function loadRecentLog(data) {
  try {
    const result = await apiJson(`/api/posts?t=${Date.now()}`, { headers: { Accept: "application/json" } });
    const rows = Array.isArray(result.posts) ? result.posts : [];
    const posts = rows
      .filter((post) => Number(post.is_public ?? 1) === 1)
      .sort((a, b) => {
        const pinnedDiff = Number(b.is_pinned || 0) - Number(a.is_pinned || 0);
        if (pinnedDiff) return pinnedDiff;
        return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
      });
    renderRecentLog(posts);
  } catch (error) {
    console.warn("/api/posts 暂不可用，最近动态显示空状态。", error);
    renderRecentLog([]);
  }
}

function normalizeQuickLink(item = {}) {
  const url = normalizeUrl(item.url || item.link);
  return {
    title: item.title || item.name || "快捷入口",
    label: item.label || item.category || "OPEN",
    url,
    sort_order: Number(item.sort_order ?? 0),
    created_at: item.created_at || "",
    is_public: isVisibleItem(item) ? 1 : 0
  };
}

function renderQuickLinks(items) {
  const links = items.map(normalizeQuickLink).filter((item) => item.url).slice(0, 4);
  $("#quickLinks").innerHTML = links.length ? links.map((item) => `
    <a href="${attr(item.url)}"${isExternalUrl(item.url) ? ' target="_blank" rel="noreferrer"' : ""}>
      <span>${escapeHtml(item.title)}</span>
      <b>${escapeHtml(item.label || "OPEN")}</b>
    </a>
  `).join("") : '<div class="empty-state">暂无快捷入口</div>';
}

async function loadQuickLinks() {
  let bookmarkRows = [];
  try {
    const bookmarks = await apiJson("/api/bookmarks");
    bookmarkRows = bookmarks.bookmarks || [];
  } catch (error) {
    console.warn("/api/bookmarks 暂不可用，快捷入口继续尝试 /api/resources。", error);
  }

  if (bookmarkRows.length) {
    renderQuickLinks(sortCmsItems(bookmarkRows.map(normalizeQuickLink).filter((item) => item.is_public === 1)));
    return;
  }

  try {
    const resources = await apiJson("/api/resources");
    const resourceRows = resources.resources || [];
    renderQuickLinks(sortCmsItems(resourceRows.map(normalizeQuickLink).filter((item) => item.is_public === 1)));
  } catch (error) {
    console.warn("/api/resources 暂不可用，快捷入口显示空状态。", error);
    renderQuickLinks([]);
  }
}

function renderFriendsList(friends) {
  $("#friendCards").innerHTML = friends.map((friend) => `
    <article class="friend-card">
      <div class="avatar">${friend.avatar ? `<img src="${attr(friend.avatar)}" alt="${escapeHtml(friend.name)}" />` : escapeHtml(friend.name || "?").slice(0, 1)}</div>
      <h3>${escapeHtml(friend.name)}</h3>
      <p>${escapeHtml(friend.status)}</p>
      <span class="tag">${escapeHtml(friend.tag || "FRIEND")}</span>
    </article>
  `).join("");
}

async function loadFriends(data) {
  $("#friendStatus").innerHTML = (data.friendStatus || []).map((item) => `<div>${escapeHtml(item)}</div>`).join("");
  const friends = await tryApi("/api/friends", data.friends || [], (result) => {
    const rows = result.friends || [];
    return rows.length ? rows : data.friends || [];
  });
  renderFriendsList(friends);
}

function hideFriendsSection() {
  $("#friends")?.setAttribute("hidden", "");
  document.querySelectorAll('a[href="#friends"]').forEach((link) => {
    link.hidden = true;
  });
}

function normalizeApiMessage(message) {
  return {
    name: message.nickname || message.name || message.author || "访客",
    text: message.content || message.message || message.body || message.text || "",
    created_at: message.created_at || message.createdAt || ""
  };
}

function renderMessageList(messages) {
  $("#messages").innerHTML = messages.length ? messages.map((message) => `
    <div class="message">
      <strong>${escapeHtml(message.name)}</strong>
      <p>${escapeHtml(message.text)}</p>
      ${message.created_at ? `<time>${formatDate(message.created_at)}</time>` : ""}
    </div>
  `).join("") : '<div class="empty-state">暂无留言</div>';
}

function pickMessageRows(result = {}) {
  if (Array.isArray(result.messages)) return result.messages;
  if (Array.isArray(result.recent)) return result.recent;
  if (Array.isArray(result.data)) return result.data;
  if (Array.isArray(result.results)) return result.results;
  return [];
}

async function loadMessages() {
  try {
    const result = await apiJson(`/api/messages?t=${Date.now()}`);
    let rows = pickMessageRows(result);

    // 兼容旧部署：如果正式接口暂时返回空，但 debug 能读到 recent，就用 recent 渲染。
    if (!rows.length) {
      try {
        const debugResult = await apiJson(`/api/messages?debug=1&t=${Date.now()}`);
        rows = pickMessageRows(debugResult);
      } catch (debugError) {
        console.warn("/api/messages?debug=1 暂不可用。", debugError);
      }
    }

    const messages = rows
      .filter(isVisibleItem)
      .map(normalizeApiMessage)
      .filter((message) => message.text);
    renderMessageList(messages);
  } catch (error) {
    console.warn("/api/messages 暂不可用，留言板显示空状态。", error);
    renderMessageList([]);
  }
}

function normalizeProject(project = {}) {
  const url = normalizeUrl(project.url || project.link);
  return {
    id: project.id,
    title: project.title || project.name || "未命名项目",
    description: project.description || project.body || "",
    cover: project.cover || project.image || "",
    url,
    tags: normalizeArray(project.tags),
    sort_order: Number(project.sort_order ?? 0),
    is_public: isVisibleItem(project) ? 1 : 0,
    created_at: project.created_at || ""
  };
}

function renderProjectsList(projects) {
  $("#projectsGrid").innerHTML = projects.map((rawProject) => {
    const project = normalizeProject(rawProject);
    const external = isExternalUrl(project.url);
    return `
      <article class="project-card">
        ${project.cover ? `<img class="project-cover" src="${attr(project.cover)}" alt="${escapeHtml(project.title)}" loading="lazy" onerror="this.remove()" />` : ""}
        <h3>${escapeHtml(project.title)}</h3>
        <p>${escapeHtml(project.description)}</p>
        <div class="meta">${project.tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}</div>
        ${project.url ? `<a class="btn ghost" href="${attr(project.url)}"${external ? ' target="_blank" rel="noreferrer"' : ""}>打开</a>` : ""}
      </article>
    `;
  }).join("");
}

async function loadProjects(data) {
  try {
    const result = await apiJson("/api/projects");
    const rows = Array.isArray(result) ? result : (result.projects || []);
    const projects = rows
      .map(normalizeProject)
      .filter((project) => project.is_public === 1)
      .sort(compareCmsItems);
    renderProjectsList(rows.length ? projects : (data.projects || []));
  } catch (error) {
    console.warn("/api/projects 暂不可用，项目控制台使用 data/site.json 静态回退。", error);
    renderProjectsList(data.projects || []);
  }
}

function normalizeVideo(video = {}) {
  return {
    title: video.title || video.name || "视频入口",
    description: video.description || video.body || "",
    url: normalizeUrl(video.url || video.link || video.video_url),
    cover: video.cover || video.image || "",
    tags: normalizeArray(video.tags),
    category: video.category || "",
    game: video.game || "",
    length: video.length || "",
    sort_order: Number(video.sort_order ?? 0),
    created_at: video.created_at || "",
    is_public: isVisibleItem(video) ? 1 : 0
  };
}

function renderVideoList(videos) {
  const normalized = videos.map(normalizeVideo);
  const mainUrl = normalizeUrl(normalized.find((video) => video.url)?.url || "");
  const mainLink = $("#mainVideoLink");
  if (mainUrl) {
    mainLink.href = mainUrl;
  } else {
    mainLink.removeAttribute("href");
  }
  mainLink.hidden = !mainUrl;
  $("#videoRow").innerHTML = normalized.length ? normalized.slice(0, 6).map((video) => {
    const tagA = video.tags[0] || video.category || video.game || "PORTAL";
    const tagB = video.tags[1] || video.length || "LINK";
    const external = isExternalUrl(video.url);
    return `
      <article class="video-card">
        ${video.cover ? `<img class="video-cover" src="${attr(video.cover)}" alt="${escapeHtml(video.title)}" loading="lazy" onerror="this.remove()" />` : ""}
        <div class="video-card-content">
          <h3>${escapeHtml(video.title)}</h3>
          <p>${escapeHtml(video.description)}</p>
          <div class="meta">
            <span class="tag">${escapeHtml(tagA)}</span>
            <span class="tag">${escapeHtml(tagB)}</span>
          </div>
          ${video.url ? `<a class="btn compact video-open" href="${attr(video.url)}"${external ? ' target="_blank" rel="noreferrer"' : ""}>打开</a>` : ""}
        </div>
      </article>
    `;
  }).join("") : '<div class="empty-state">暂无视频入口</div>';
}

async function loadVideos(data) {
  try {
    const result = await apiJson("/api/video-links");
    const rows = result.videoLinks || result.videos || [];
    const videos = sortCmsItems(rows.map(normalizeVideo).filter((video) => video.is_public === 1));
    renderVideoList(rows.length ? videos : []);
  } catch (error) {
    console.warn("/api/video-links 暂不可用，视频入口显示空状态。", error);
    renderVideoList([]);
  }
}

function normalizeResource(resource = {}) {
  const cover = resource.cover || resource.image || "";
  const icon = resource.icon || "";
  return {
    title: resource.title || resource.name || "资源",
    description: resource.description || resource.body || "",
    url: normalizeUrl(resource.url || resource.link),
    cover,
    icon,
    tags: normalizeArray(resource.tags),
    category: resource.category || "",
    sort_order: Number(resource.sort_order ?? 0),
    created_at: resource.created_at || "",
    is_public: isVisibleItem(resource) ? 1 : 0
  };
}

function renderResourcesList(resources) {
  $("#resourceDock").innerHTML = resources.map((rawResource) => {
    const resource = normalizeResource(rawResource);
    const external = isExternalUrl(resource.url);
    const iconIsImage = isImageUrl(resource.icon);
    return `
      <article class="resource-card">
        ${resource.cover ? `<img class="resource-cover" src="${attr(resource.cover)}" alt="${escapeHtml(resource.title)}" loading="lazy" onerror="this.remove()" />` : ""}
        ${resource.icon ? `<div class="icon resource-media">${iconIsImage ? `<img src="${attr(resource.icon)}" alt="${escapeHtml(resource.title)}" loading="lazy" onerror="this.remove()" />` : escapeHtml(resource.icon)}</div>` : ""}
        <h3>${escapeHtml(resource.title)}</h3>
        <p>${escapeHtml(resource.description)}</p>
        ${resource.category ? `<div class="meta"><span class="tag">${escapeHtml(resource.category)}</span></div>` : ""}
        ${resource.url ? `<a class="btn compact" href="${attr(resource.url)}"${external ? ' target="_blank" rel="noreferrer"' : ""}>打开</a>` : ""}
      </article>
    `;
  }).join("");
}

async function loadResources(data) {
  try {
    const result = await apiJson("/api/resources");
    const rows = result.resources || [];
    const resources = sortCmsItems(rows.map(normalizeResource).filter((resource) => resource.is_public === 1));
    renderResourcesList(rows.length ? resources : (data.resources || []));
  } catch (error) {
    console.warn("/api/resources 暂不可用，资源站使用 data/site.json 静态回退。", error);
    renderResourcesList(data.resources || []);
  }
}

function renderBookmarkFilter(bookmarks) {
  const present = new Set(bookmarks.map((item) => item.category).filter(Boolean));
  const dynamicCategories = [...present].filter((category) => !BOOKMARK_CATEGORIES.includes(category));
  const categories = ["全部", ...BOOKMARK_CATEGORIES.filter((category) => present.has(category)), ...dynamicCategories];
  if (!categories.includes(bookmarkCategory)) bookmarkCategory = "全部";

  $("#bookmarkFilter").innerHTML = bookmarks.length ? categories.map((category) => `
    <button type="button" class="${category === bookmarkCategory ? "active" : ""}" data-category="${attr(category)}">${escapeHtml(category)}</button>
  `).join("") : "";
}

function normalizeBookmark(bookmark = {}) {
  return {
    title: bookmark.title || bookmark.name || "书签",
    description: bookmark.description || bookmark.body || "",
    url: normalizeUrl(bookmark.url || bookmark.link),
    category: bookmark.category || "常用",
    tags: normalizeArray(bookmark.tags),
    sort_order: Number(bookmark.sort_order ?? 0),
    created_at: bookmark.created_at || "",
    is_public: isVisibleItem(bookmark) ? 1 : 0
  };
}

function renderBookmarkList(bookmarks) {
  const visible = bookmarkCategory === "全部"
    ? bookmarks
    : bookmarks.filter((item) => item.category === bookmarkCategory);

  if (!bookmarks.length) {
    $("#bookmarkGrid").innerHTML = '<div class="empty-state">暂无导航数据</div>';
    return;
  }

  $("#bookmarkGrid").innerHTML = visible.map((rawBookmark) => {
    const bookmark = normalizeBookmark(rawBookmark);
    const external = isExternalUrl(bookmark.url);
    return `
      <article class="bookmark-card">
        <small>${escapeHtml(bookmark.category)}</small>
        <h3>${escapeHtml(bookmark.title)}</h3>
        <p>${escapeHtml(bookmark.description)}</p>
        ${bookmark.tags.length ? `<div class="meta">${bookmark.tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}</div>` : ""}
        ${bookmark.url ? `<a class="btn compact" href="${attr(bookmark.url)}"${external ? ' target="_blank" rel="noreferrer"' : ""}>打开</a>` : ""}
      </article>
    `;
  }).join("") || '<div class="empty-state">这个分类还没有书签。</div>';
}

async function loadBookmarks(data) {
  let bookmarks = [];
  try {
    const result = await apiJson("/api/bookmarks");
    const rows = result.bookmarks || [];
    bookmarks = sortCmsItems(rows.map(normalizeBookmark).filter((bookmark) => bookmark.is_public === 1));
  } catch (error) {
    console.warn("/api/bookmarks 暂不可用，我的导航显示空状态。", error);
    bookmarks = [];
  }
  siteData.bookmarks = bookmarks.map(normalizeBookmark);
  renderBookmarkFilter(bookmarks);
  renderBookmarkList(bookmarks);
  $("#bookmarkFilter").onclick = (event) => {
    const button = event.target.closest("button");
    if (!button) return;
    bookmarkCategory = button.dataset.category;
    renderBookmarkFilter(siteData.bookmarks || []);
    renderBookmarkList(siteData.bookmarks || []);
  };
}

function normalizePostForFeed(post) {
  return {
    id: post.id,
    title: post.title || "未命名动态",
    body: post.body || "",
    type: post.type || "文字",
    images: normalizeArray(post.images).map((image) => String(image).trim()).filter(Boolean),
    video_url: post.video_url || "",
    tags: normalizeArray(post.tags).filter(Boolean),
    is_public: Number(post.is_public ?? 1),
    is_pinned: Number(post.is_pinned || 0),
    created_at: post.created_at || "",
    updated_at: post.updated_at || ""
  };
}

function renderFeed(posts) {
  const feed = $("#dynamicFeed");
  if (!feed) return;
  const normalizedPosts = Array.isArray(posts) ? posts.map(normalizePostForFeed) : [];
  feed.innerHTML = normalizedPosts.length ? normalizedPosts.map((post) => {
    return `
      <article class="feed-card">
        <time>${escapeHtml(formatDate(post.created_at))}${post.is_pinned ? " / 置顶" : ""}</time>
        <h3>${escapeHtml(post.title)}</h3>
        <p>${escapeHtml(post.body)}</p>
        ${post.images.length ? `<div class="feed-media">${post.images.map((image) => `<img src="${attr(image)}" alt="${escapeHtml(post.title)}" loading="lazy" onerror="this.remove()" />`).join("")}</div>` : ""}
        ${post.video_url ? `<a class="feed-video" href="${attr(post.video_url)}" target="_blank" rel="noreferrer">打开视频链接</a>` : ""}
        <div class="meta">
          <span class="tag">${escapeHtml(post.type)}</span>
          ${post.tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}
        </div>
      </article>
    `;
  }).join("") : '<div class="empty-state">还没有发布动态。登录后台后，可以先发第一条。</div>';
}

function fallbackPosts(data) {
  return (data.updates || []).map((item, index) => ({
    id: `fallback-${index}`,
    title: item.title || item.time || "动态",
    body: item.description || item.text || "",
    type: "文字",
    images: [],
    tags: ["本地预览"],
    created_at: item.time || ""
  }));
}

async function loadPosts(data) {
  try {
    const res = await fetch(`/api/posts?t=${Date.now()}`, {
      cache: "no-store",
      headers: {
        "Accept": "application/json"
      }
    });
    const result = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(result.error || `请求失败：${res.status}`);
    }
    const posts = Array.isArray(result.posts) ? result.posts : [];
    const visiblePosts = posts
      .filter((post) => Number(post.is_public ?? 1) === 1)
      .sort((a, b) => {
        const pinnedDiff = Number(b.is_pinned || 0) - Number(a.is_pinned || 0);
        if (pinnedDiff) return pinnedDiff;
        return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
      });
    renderFeed(visiblePosts);
  } catch (error) {
    console.warn("/api/posts 请求失败，动态墙使用 data/site.json 静态回退。", error);
    renderFeed(fallbackPosts(data));
  }
}

function bindMessageForm() {
  const form = $("#messageForm");
  if (!form) return;
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const hint = $("#messageFormHint");
    const nickname = $("#messageName").value.trim();
    const content = $("#messageText").value.trim();
    if (!nickname || !content) return;

    hint.textContent = "正在发布...";
    try {
      await apiJson("/api/messages", {
        method: "POST",
        body: JSON.stringify({ nickname, content })
      });
      hint.textContent = "留言已发布。";
      form.reset();
      await loadMessages();
    } catch (error) {
      hint.textContent = "留言接口暂不可用，请确认 D1 已绑定。";
      console.error(error);
    }
  });
}

function setFloatMenu() {
  const menu = $("#floatMenu");
  const update = () => menu.classList.toggle("visible", window.scrollY > 420 && window.innerWidth > 860);
  update();
  window.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", update);
}

function bindMobileMenu() {
  const toggle = $("#menuToggle");
  const nav = $("#siteNav");
  toggle.addEventListener("click", () => {
    const open = document.body.classList.toggle("nav-open");
    toggle.setAttribute("aria-expanded", String(open));
  });
  nav.addEventListener("click", (event) => {
    if (!event.target.closest("a")) return;
    document.body.classList.remove("nav-open");
    toggle.setAttribute("aria-expanded", "false");
  });
}

function bindBaseMode() {
  let calm = false;
  $("#soundBtn").addEventListener("click", () => {
    calm = !calm;
    document.body.classList.toggle("calm-mode", calm);
    $("#soundBtn").textContent = calm ? "CALM MODE" : "BASE MODE";
  });
}

function setActiveAnchors() {
  const links = [...document.querySelectorAll(".site-nav a, .float-menu a")];
  const sections = links
    .map((link) => document.querySelector(link.getAttribute("href")))
    .filter(Boolean);

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const id = `#${entry.target.id}`;
      links.forEach((link) => link.classList.toggle("active", link.getAttribute("href") === id));
    });
  }, { rootMargin: "-42% 0px -48% 0px", threshold: 0 });
  sections.forEach((section) => observer.observe(section));
}

function checkLocalLinks() {
  const missing = [...document.querySelectorAll('a[href^="#"]')]
    .map((link) => link.getAttribute("href"))
    .filter((href) => href.length > 1 && !document.querySelector(href));
  if (missing.length) console.warn("这些锚点没有对应元素：", [...new Set(missing)]);
}

getData()
  .then(async (data) => {
    siteData = await loadSiteSettings(data);
    setHero(siteData);
    setCarousel(await loadSlides(siteData));
    renderStatus(siteData);
    hideFriendsSection();
    await Promise.all([
      loadStatusStats(),
      loadPosts(siteData),
      loadRecentLog(siteData),
      loadMessages(),
      loadQuickLinks(),
      loadProjects(siteData),
      loadVideos(siteData),
      loadResources(siteData),
      loadBookmarks(siteData)
    ]);
    setFloatMenu();
    bindMobileMenu();
    bindMessageForm();
    bindBaseMode();
    setActiveAnchors();
    checkLocalLinks();
  })
  .catch((error) => {
    console.error(error);
    document.body.insertAdjacentHTML("afterbegin", '<div class="data-error">页面数据读取失败，请检查 data/site.json。</div>');
  });
