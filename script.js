const $ = (selector) => document.querySelector(selector);

let siteData = {};
let bookmarkCategory = "全部";

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
    <div><strong>${escapeHtml(item.time)}</strong><p>${escapeHtml(item.text)}</p></div>
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
  $("#messages").innerHTML = (data.messages || []).map((message) => `
    <div class="message">
      <strong>${escapeHtml(message.name)}</strong>
      <p>${escapeHtml(message.text)}</p>
    </div>
  `).join("");
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
  $("#videoRow").innerHTML = (data.videos || []).map((video) => `
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
  const categories = ["全部", ...new Set((data.bookmarks || []).map((item) => item.category).filter(Boolean))];
  $("#bookmarkFilter").innerHTML = categories.map((category) => `
    <button type="button" class="${category === bookmarkCategory ? "active" : ""}" data-category="${attr(category)}">${escapeHtml(category)}</button>
  `).join("");

  $("#bookmarkFilter").addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button) return;
    bookmarkCategory = button.dataset.category;
    renderBookmarks(siteData);
    renderBookmarkFilter(siteData);
  }, { once: true });
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
    renderMessages(data);
    renderProjects(data);
    renderVideos(data);
    renderResources(data);
    renderBookmarkFilter(data);
    renderBookmarks(data);
    setFloatMenu();
    bindMobileMenu();
    bindBaseMode();
    setActiveAnchors();
    checkLocalLinks();
  })
  .catch((error) => {
    console.error(error);
    document.body.insertAdjacentHTML("afterbegin", `<div class="data-error">页面数据读取失败，请检查 data/site.json。</div>`);
  });
