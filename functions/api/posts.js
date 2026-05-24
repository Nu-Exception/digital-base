import {
  boolInt,
  createItem,
  deleteItem,
  getId,
  json,
  methodNotAllowed,
  normalizeJsonArrays,
  pickBody,
  readJson,
  requireAdmin,
  requireDb,
  splitLines,
  splitTags,
  toInt,
  updateItem
} from "../_lib/cms.js";

const POST_TYPES = new Set(["文字", "图片", "视频", "文章"]);

const transforms = {
  images: (value) => JSON.stringify(splitLines(value)),
  tags: (value) => JSON.stringify(splitTags(value)),
  is_public: (value) => boolInt(value, 1),
  is_pinned: (value) => boolInt(value, 0)
};

function normalizeInput(body) {
  const values = pickBody(body, [
    "title",
    "body",
    "type",
    "images",
    "video_url",
    "tags",
    "is_public",
    "is_pinned"
  ], transforms);

  if (values.title !== undefined) values.title = String(values.title).trim();
  if (values.body !== undefined) values.body = String(values.body).trim();
  if (values.type !== undefined) values.type = String(values.type).trim();
  if (values.video_url !== undefined) values.video_url = String(values.video_url || "").trim() || null;
  return values;
}

export async function onRequestGet({ request, env }) {
  const dbError = requireDb(env);
  if (dbError) return dbError;

  try {
    const url = new URL(request.url);
    const admin = url.searchParams.get("admin") === "1";
    if (admin) {
      const authError = requireAdmin(request, env);
      if (authError) return authError;
    }

    const limit = Math.min(toInt(url.searchParams.get("limit"), 30), admin ? 200 : 50);
    const where = admin ? "" : "WHERE COALESCE(is_public, 1) = 1";
    const order = admin
      ? "ORDER BY id DESC"
      : "ORDER BY COALESCE(is_pinned, 0) DESC, datetime(created_at) DESC, id DESC";

    const { results } = await env.DB.prepare(`
      SELECT
        id,
        title,
        body,
        type,
        images,
        video_url,
        tags,
        COALESCE(is_public, 1) AS is_public,
        COALESCE(is_pinned, 0) AS is_pinned,
        created_at,
        updated_at
      FROM posts
      ${where}
      ${order}
      LIMIT ?
    `).bind(limit).all();

    return json({
      posts: (results || []).map((row) => normalizeJsonArrays(row, ["images", "tags"]))
    });
  } catch (error) {
    return json({ error: error.message || String(error) }, 500);
  }
}

export async function onRequestPost({ request, env }) {
  const dbError = requireDb(env);
  if (dbError) return dbError;
  const authError = requireAdmin(request, env);
  if (authError) return authError;

  const body = await readJson(request);
  const values = normalizeInput({
    ...body,
    images: body.images ?? "",
    tags: body.tags ?? "",
    video_url: body.video_url ?? "",
    type: body.type || "文字",
    is_public: body.is_public ?? 1,
    is_pinned: body.is_pinned ?? 0
  });

  if (!values.title || !values.body) return json({ error: "标题和正文不能为空" }, 400);
  if (!POST_TYPES.has(values.type)) return json({ error: "动态类型不正确" }, 400);

  const fields = ["title", "body", "type", "images", "video_url", "tags", "is_public", "is_pinned"];
  const result = await createItem(env, "posts", fields, values);
  return json({ ok: true, id: result.meta.last_row_id }, 201);
}

export async function onRequestPut({ request, env }) {
  const dbError = requireDb(env);
  if (dbError) return dbError;
  const authError = requireAdmin(request, env);
  if (authError) return authError;

  const body = await readJson(request);
  const id = getId(request, body);
  if (!id) return json({ error: "缺少 id" }, 400);

  const values = normalizeInput(body);
  if (values.type && !POST_TYPES.has(values.type)) return json({ error: "动态类型不正确" }, 400);
  await updateItem(env, "posts", id, values);
  return json({ ok: true });
}

export async function onRequestDelete({ request, env }) {
  const dbError = requireDb(env);
  if (dbError) return dbError;
  const authError = requireAdmin(request, env);
  if (authError) return authError;

  const body = await readJson(request);
  const id = getId(request, body);
  if (!id) return json({ error: "缺少 id" }, 400);
  await deleteItem(env, "posts", id);
  return json({ ok: true });
}

export function onRequestPatch(context) {
  return onRequestPut(context);
}

export function onRequestOptions() {
  return methodNotAllowed();
}
