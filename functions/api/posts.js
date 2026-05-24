const POST_TYPES = new Set(["文字", "图片", "视频", "文章"]);

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8"
    }
  });
}

function getToken(request) {
  const auth = request.headers.get("Authorization") || "";
  if (auth.toLowerCase().startsWith("bearer ")) {
    return auth.slice(7).trim();
  }
  return request.headers.get("x-admin-token") || "";
}

function requireAdmin(request, env) {
  return Boolean(env.ADMIN_PASSWORD && getToken(request) === env.ADMIN_PASSWORD);
}

function splitLines(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }
  return String(value || "")
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function splitTags(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseJsonArray(value) {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function normalizePost(row) {
  return {
    ...row,
    images: parseJsonArray(row.images),
    tags: parseJsonArray(row.tags)
  };
}

export async function onRequestGet({ request, env }) {
  if (!env.DB) {
    return json({ error: "D1 数据库未绑定，请绑定变量 DB" }, 500);
  }

  const url = new URL(request.url);
  const limit = Math.min(Number(url.searchParams.get("limit") || 20), 50);
  const { results } = await env.DB.prepare(
    "SELECT id, title, body, type, images, video_url, tags, created_at FROM posts ORDER BY datetime(created_at) DESC, id DESC LIMIT ?"
  ).bind(limit).all();

  return json({ posts: (results || []).map(normalizePost) });
}

export async function onRequestPost({ request, env }) {
  if (!env.DB) {
    return json({ error: "D1 数据库未绑定，请绑定变量 DB" }, 500);
  }
  if (!requireAdmin(request, env)) {
    return json({ error: "未登录或 token 无效" }, 401);
  }

  const body = await request.json().catch(() => ({}));
  const title = String(body.title || "").trim();
  const content = String(body.body || body.content || "").trim();
  const type = String(body.type || "文字").trim();
  const videoUrl = String(body.video_url || body.videoUrl || "").trim();
  const images = splitLines(body.images);
  const tags = splitTags(body.tags);

  if (!title || !content) {
    return json({ error: "标题和正文不能为空" }, 400);
  }
  if (!POST_TYPES.has(type)) {
    return json({ error: "动态类型不正确" }, 400);
  }

  const result = await env.DB.prepare(
    "INSERT INTO posts (title, body, type, images, video_url, tags) VALUES (?, ?, ?, ?, ?, ?)"
  ).bind(title, content, type, JSON.stringify(images), videoUrl || null, JSON.stringify(tags)).run();

  return json({
    ok: true,
    id: result.meta.last_row_id
  }, 201);
}

export function onRequestOptions() {
  return json({ ok: true });
}
