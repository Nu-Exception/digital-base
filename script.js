const $ = (selector) => document.querySelector(selector);

let siteData = {};
let bookmarkCategory = "全部";
const BOOKMARK_CATEGORIES = ["AI工具", "游戏", "开发", "视频", "素材", "常用"];

async function getData() {
  const res = await fetch("./data/site.json", { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`读取 data/site.json 失败：${res.status}`);
  }
  return res.json();
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

function setCarousel(data) {
  const slides = data.heroSlides || [];
  const track = $("#carouselTrack");
  const dots = $("#dots");

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

  function render(next) {
    current = next;
    slideEls.forEach((slide, index) => slide.classList.toggle("active", index === current));
    dotEls.forEach((dot, index) => dot.classList.toggle("active", index === current));
  }

  dotEls.forEach((dot, index) => {
    dot.addEventListener("click", () => render(index));
  });

  render(0);
  window.setInterval(() => render((current + 1) % slides.length), 5600);
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

async function apiJson(url, options) {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `请求失败：${res.status}`);
  }
  return data;
}

function renderQuickLinks(data) {
  $("#quickLinks").innerHTML = (data.quickLinks || []).map((item) => `
    <a href="${attr(item.url)}"${item.external ? ' target="_blank" rel="noreferrer"' : ""}>
      <span>${escapeHtml(item.name)}</span>
      <b>${escapeHtml(item.label || "OPEN")}</b>
    </a>
  `).join("");
}

function renderFriends(data) {
  $("#friendStatus").innerHTML = (data.friendStatus || []).map((item) => `<div>${escapeHtml(item)}</div>`).join("");
  $("#friendCards").innerHTML = (data.friends || []).map((friend) => `
    <article class="friend-card">
      <div class="avatar">${escapeHtml(friend.name || "?").slice(0, 1)}</div>
      <h3>${escapeHtml(friend.name)}</h3>
      <p>${escapeHtml(friend.status)}</p>
      <span class="tag">${escapeHtml(friend.tag)}</span>
    </article>
  `).join("");
}

function renderMessages(data) {
  renderMessageList(data.messages || []);
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

function normalizeApiMessage(message) {
  return {
    name: message.nickname || message.name || "访客",
    text: message.content || message.text || "",
    created_at: message.created_at || ""
  };
}

async function loadMessages(data) {
  try {
    const result = await apiJson("/api/messages");
    renderMessageList((result.messages || []).map(normalizeApiMessage));
  } catch (error) {
    console.warn("留言接口暂不可用，使用静态数据。", error);
    renderMessages(data);
  }
}

function renderProjects(data) {
  $("#projectsGrid").innerHTML = (data.projects || []).map((project) => `
    <article class="project-card">
      <h3>${escapeHtml(project.name)}</h3>
      <p>${escapeHtml(project.description)}</p>
      <div class="meta">${(project.tags || []).map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}</div>
      <a class="btn ghost" href="${attr(project.url)}"${project.url?.startsWith("#") ? "" : ' target="_blank" rel="noreferrer"'}>打开</a>
    </article>
  `).join("");
}

function renderVideos(data) {
  $("#mainVideoLink").href = data.videoSiteUrl || "#portal";
  $("#videoRow").innerHTML = (data.videos || []).slice(0, 6).map((video) => `
    <a class="video-card" href="${attr(video.url)}" target="_blank" rel="noreferrer" style='--cover:url("${attr(video.cover)}")'>
      <div class="video-card-content">
        <h3>${escapeHtml(video.title)}</h3>
        <p>${escapeHtml(video.description)}</p>
        <div class="meta">
          <span class="tag">${escapeHtml(video.game)}</span>
          <span class="tag">${escapeHtml(video.length)}</span>
        </div>
      </div>
    </a>
  `).join("");
}

function renderResources(data) {
  $("#resourceDock").innerHTML = (data.resources || []).map((resource) => `
    <a class="resource-card" href="${attr(resource.url)}"${resource.url?.startsWith("#") ? "" : ' target="_blank" rel="noreferrer"'}>
      <div class="icon">${escapeHtml(resource.icon)}</div>
      <h3>${escapeHtml(resource.name)}</h3>
      <p>${escapeHtml(resource.description)}</p>
    </a>
  `).join("");
}

function renderBookmarkFilter(data) {
  const present = new Set((data.bookmarks || []).map((item) => item.category).filter(Boolean));
  const categories = ["全部", ...BOOKMARK_CATEGORIES.filter((category) => present.has(category))];
  if (!categories.includes(bookmarkCategory)) {
    bookmarkCategory = "全部";
  }

  $("#bookmarkFilter").innerHTML = categories.map((category) => `
    <button type="button" class="${category === bookmarkCategory ? "active" : ""}" data-category="${attr(category)}">${escapeHtml(category)}</button>
  `).join("");

  $("#bookmarkFilter").onclick = (event) => {
    const button = event.target.closest("button");
    if (!button) return;
    bookmarkCategory = button.dataset.category;
    renderBookmarks(siteData);
    renderBookmarkFilter(siteData);
  };
}

function renderBookmarks(data) {
  const bookmarks = data.bookmarks || [];
  const visible = bookmarkCategory === "全部"
    ? bookmarks
    : bookmarks.filter((item) => item.category === bookmarkCategory);

  $("#bookmarkGrid").innerHTML = visible.map((bookmark) => `
    <a class="bookmark-card" href="${attr(bookmark.url)}"${bookmark.url?.startsWith("#") ? "" : ' target="_blank" rel="noreferrer"'}>
      <small>${escapeHtml(bookmark.category)}</small>
      <h3>${escapeHtml(bookmark.name)}</h3>
      <p>${escapeHtml(bookmark.description)}</p>
    </a>
  `).join("");
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

function normalizeArray(value) {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function renderFeed(posts) {
  const feed = $("#dynamicFeed");
  if (!feed) return;
  feed.innerHTML = posts.length ? posts.map((post) => {
    const images = normalizeArray(post.images).filter(Boolean);
    const tags = normalizeArray(post.tags).filter(Boolean);
    return `
      <article class="feed-card">
        <time>${escapeHtml(formatDate(post.created_at))}</time>
        <h3>${escapeHtml(post.title)}</h3>
        <p>${escapeHtml(post.body || post.description || "")}</p>
        ${images.length ? `<div class="feed-media">${images.map((image) => `<img src="${attr(image)}" alt="${escapeHtml(post.title)}" loading="lazy" />`).join("")}</div>` : ""}
        ${post.video_url ? `<a class="feed-video" href="${attr(post.video_url)}" target="_blank" rel="noreferrer">打开视频链接</a>` : ""}
        ${tags.length ? `<div class="meta">${tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}</div>` : ""}
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
    const result = await apiJson("/api/posts");
    renderFeed(result.posts || []);
  } catch (error) {
    console.warn("动态接口暂不可用，使用静态数据。", error);
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

  if (missing.length) {
    console.warn("这些锚点没有对应元素：", [...new Set(missing)]);
  }
}

getData()
  .then((data) => {
    siteData = data;
    setHero(data);
    setCarousel(data);
    renderStatus(data);
    renderQuickLinks(data);
    renderFriends(data);
    loadPosts(data);
    loadMessages(data);
    renderProjects(data);
    renderVideos(data);
    renderResources(data);
    renderBookmarkFilter(data);
    renderBookmarks(data);
    setFloatMenu();
    bindMobileMenu();
    bindMessageForm();
    bindBaseMode();
    setActiveAnchors();
    checkLocalLinks();
  })
  .catch((error) => {
    console.error(error);
    document.body.insertAdjacentHTML("afterbegin", `<div class="data-error">页面数据读取失败，请检查 data/site.json。</div>`);
  });
