const tokenKey = "adminToken";
const $ = (selector) => document.querySelector(selector);

function setHint(el, text, type = "") {
  el.textContent = text;
  el.className = `hint ${type}`.trim();
}

async function apiJson(url, options) {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json", ...(options?.headers || {}) },
    ...options
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `请求失败：${res.status}`);
  }
  return data;
}

function getToken() {
  return localStorage.getItem(tokenKey) || "";
}

function setLoggedIn(loggedIn) {
  $("#loginPanel").classList.toggle("hidden", loggedIn);
  $("#editorPanel").classList.toggle("hidden", !loggedIn);
  $("#previewPanel").classList.toggle("hidden", !loggedIn);
  if (loggedIn) loadRecentPosts();
}

function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("zh-CN");
}

async function loadRecentPosts() {
  const box = $("#postList");
  box.innerHTML = '<div class="post-item">正在读取...</div>';
  try {
    const data = await apiJson("/api/posts?limit=8");
    box.innerHTML = (data.posts || []).length ? data.posts.map((post) => `
      <article class="post-item">
        <time>${formatDate(post.created_at)} / ${post.type}</time>
        <h3>${post.title}</h3>
        <p>${post.body}</p>
      </article>
    `).join("") : '<div class="post-item">还没有动态。</div>';
  } catch (error) {
    box.innerHTML = `<div class="post-item">${error.message}</div>`;
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
    setLoggedIn(true);
  } catch (error) {
    setHint(hint, error.message, "bad");
  }
});

$("#postForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const hint = $("#postHint");
  setHint(hint, "正在发布...");

  const payload = {
    title: $("#postTitle").value.trim(),
    body: $("#postBody").value.trim(),
    type: $("#postType").value,
    images: $("#postImages").value,
    video_url: $("#postVideo").value.trim(),
    tags: $("#postTags").value
  };

  try {
    await apiJson("/api/posts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getToken()}`
      },
      body: JSON.stringify(payload)
    });
    setHint(hint, "发布成功，前台动态墙会显示新内容。", "ok");
    $("#postForm").reset();
    await loadRecentPosts();
  } catch (error) {
    setHint(hint, error.message, "bad");
  }
});

$("#logoutBtn").addEventListener("click", () => {
  localStorage.removeItem(tokenKey);
  setLoggedIn(false);
});

setLoggedIn(Boolean(getToken()));
