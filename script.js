const $ = (selector) => document.querySelector(selector);

let siteData = {};
let bookmarkCategory = "全部";
let carouselTimer = null;
const BOOKMARK_CATEGORIES = ["AI工具", "游戏", "开发", "视频", "素材", "常用"];

async function getData() {
  const res = await fetch("./data/site.json", { cache: "no-store" });
  if (!res.ok) throw new Error(`读取 data/site.json 失败：${res.status}`);
  return res.json();
}

async function apiJson(url, options) {
  const res = await fetch(url, {
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

function renderStatus(data) {
  const status = data.status || {};
  $("#statusTitle").textContent = status.title || "";
  $("#statusText").textContent = status.text || "";
  $("#statusList").innerHTML = (status.lines || []).map((item) => `
    <div><strong>${escapeHtml(item.label)}</strong>${escapeHtml(item.value)}</div>
  `).join("");

  $("#updates").innerHTML = (data.updates || []).map((item) => `
    <div class="update-item">
      <div class="update-top">
        <strong>${escapeHtml(item.time)}</strong>
        <span>${escapeHtml(item.title || item.text || "")}</span>
      </div>
      <p>${escapeHtml(item.description || item.text || "")}</p>
    </div>
  `).join("");
}

function renderQuickLinks(data) {
  $("#quickLinks").innerHTML = (data.quickLinks || []).map((item) => `
    <a href="${attr(item.url)}"${item.external ? ' target="_blank" rel="noreferrer"' : ""}>
      <span>${escapeHtml(item.name)}</span>
      <b>${escapeHtml(item.label || "OPEN")}</b>
    </a>
  `).join("");
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

function normalizeApiMessage(message) {
  return {
    name: message.nickname || message.name || "访客",
    text: message.content || message.text || "",
    created_at: message.created_at || ""
  };
}

function renderMessageList(messages) {
  $("#messages").innerHTML = messages.length ? messages.map((message) => `
    <div class="message">
      <strong>${escapeHtml(message.name)}</strong>
      <p>${escapeHtml(message.text)}</p>
      ${message.created_at ? `<time>${formatDate(message.created_at)}</time>` : ""}
    </div>
  `).join("") : '<div class="empty-state">还没有留言，来抢第一条。</div>';
}

async function loadMessages(data) {
  const messages = await tryApi("/api/messages", data.messages || [], (result) => {
    const rows = (result.messages || []).map(normalizeApiMessage);
    return rows.length ? rows : data.messages || [];
  });
  renderMessageList(messages);
}

function renderProjectsList(projects) {
  $("#projectsGrid").innerHTML = projects.map((project) => {
    const tags = normalizeArray(project.tags);
    const title = project.title || project.name;
    return `
      <article class="project-card">
        <h3>${escapeHtml(title)}</h3>
        <p>${escapeHtml(project.description)}</p>
        <div class="meta">${tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}</div>
        <a class="btn ghost" href="${attr(project.url)}"${project.url?.startsWith("#") ? "" : ' target="_blank" rel="noreferrer"'}>打开</a>
      </article>
    `;
  }).join("");
}

async function loadProjects(data) {
  const projects = await tryApi("/api/projects", data.projects || [], (result) => {
    const rows = result.projects || [];
    return rows.length ? rows : data.projects || [];
  });
  renderProjectsList(projects);
}

function renderVideoList(videos, data) {
  $("#mainVideoLink").href = data.videoSiteUrl || videos[0]?.url || "#portal";
  $("#videoRow").innerHTML = videos.slice(0, 6).map((video) => {
    const tags = normalizeArray(video.tags);
    const tagA = tags[0] || video.game || "PORTAL";
    const tagB = tags[1] || video.length || "LINK";
    return `
      <a class="video-card" href="${attr(video.url)}" target="_blank" rel="noreferrer" style='--cover:url("${attr(video.cover)}")'>
        <div class="video-card-content">
          <h3>${escapeHtml(video.title)}</h3>
          <p>${escapeHtml(video.description)}</p>
          <div class="meta">
            <span class="tag">${escapeHtml(tagA)}</span>
            <span class="tag">${escapeHtml(tagB)}</span>
          </div>
        </div>
      </a>
    `;
  }).join("");
}

async function loadVideos(data) {
  const videos = await tryApi("/api/video-links", data.videos || [], (result) => {
    const rows = result.videos || [];
    return rows.length ? rows : data.videos || [];
  });
  renderVideoList(videos, data);
}

function renderResourcesList(resources) {
  $("#resourceDock").innerHTML = resources.map((resource) => {
    const title = resource.title || resource.name;
    return `
      <a class="resource-card" href="${attr(resource.url)}"${resource.url?.startsWith("#") ? "" : ' target="_blank" rel="noreferrer"'}>
        <div class="icon">${escapeHtml(resource.icon || "IN")}</div>
        <h3>${escapeHtml(title)}</h3>
        <p>${escapeHtml(resource.description)}</p>
      </a>
    `;
  }).join("");
}

async function loadResources(data) {
  const resources = await tryApi("/api/resources", data.resources || [], (result) => {
    const rows = result.resources || [];
    return rows.length ? rows : data.resources || [];
  });
  renderResourcesList(resources);
}

function renderBookmarkFilter(bookmarks) {
  const present = new Set(bookmarks.map((item) => item.category).filter(Boolean));
  const categories = ["全部", ...BOOKMARK_CATEGORIES.filter((category) => present.has(category))];
  if (!categories.includes(bookmarkCategory)) bookmarkCategory = "全部";

  $("#bookmarkFilter").innerHTML = categories.map((category) => `
    <button type="button" class="${category === bookmarkCategory ? "active" : ""}" data-category="${attr(category)}">${escapeHtml(category)}</button>
  `).join("");
}

function renderBookmarkList(bookmarks) {
  const visible = bookmarkCategory === "全部"
    ? bookmarks
    : bookmarks.filter((item) => item.category === bookmarkCategory);

  $("#bookmarkGrid").innerHTML = visible.map((bookmark) => {
    const title = bookmark.title || bookmark.name;
    return `
      <a class="bookmark-card" href="${attr(bookmark.url)}"${bookmark.url?.startsWith("#") ? "" : ' target="_blank" rel="noreferrer"'}>
        <small>${escapeHtml(bookmark.category)}</small>
        <h3>${escapeHtml(title)}</h3>
        <p>${escapeHtml(bookmark.description)}</p>
      </a>
    `;
  }).join("");
}

async function loadBookmarks(data) {
  const bookmarks = await tryApi("/api/bookmarks", data.bookmarks || [], (result) => {
    const rows = result.bookmarks || [];
    return rows.length ? rows : data.bookmarks || [];
  });
  siteData.bookmarks = bookmarks;
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
    images: normalizeArray(post.images).filter(Boolean),
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
        ${post.images.length ? `<div class="feed-media">${post.images.map((image) => `<img src="${attr(image)}" alt="${escapeHtml(post.title)}" loading="lazy" />`).join("")}</div>` : ""}
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
      await loadMessages(siteData);
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
    renderQuickLinks(siteData);
    await Promise.all([
      loadFriends(siteData),
      loadPosts(siteData),
      loadMessages(siteData),
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
