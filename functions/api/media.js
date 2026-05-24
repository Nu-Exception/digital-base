import { deleteItem, getId, json, readJson, requireAdmin, requireDb, toInt } from "../_lib/cms.js";

const CATEGORIES = new Set(["post", "hero", "slide", "project", "resource", "avatar", "gallery", "other"]);

function normalizeCategory(value) {
  const category = String(value || "").trim();
  return CATEGORIES.has(category) ? category : "other";
}

async function handleGet({ request, env }) {
  const dbError = requireDb(env);
  if (dbError) return dbError;

  const url = new URL(request.url);
  const category = String(url.searchParams.get("category") || "").trim();
  const limit = Math.min(toInt(url.searchParams.get("limit"), 120), 300);
  const sql = category
    ? "SELECT id, url, key, filename, original_name, mime_type, size, source, category, alt, caption, created_at FROM media_assets WHERE category = ? ORDER BY datetime(created_at) DESC, id DESC LIMIT ?"
    : "SELECT id, url, key, filename, original_name, mime_type, size, source, category, alt, caption, created_at FROM media_assets ORDER BY datetime(created_at) DESC, id DESC LIMIT ?";
  const stmt = env.DB.prepare(sql);
  const { results } = category ? await stmt.bind(category, limit).all() : await stmt.bind(limit).all();
  return json({ media: results || [] });
}

async function handlePost({ request, env }) {
  const dbError = requireDb(env);
  if (dbError) return dbError;
  const authError = requireAdmin(request, env);
  if (authError) return authError;

  const body = await readJson(request);
  const url = String(body.url || "").trim();
  const category = normalizeCategory(body.category);
  const alt = String(body.alt || "").trim();
  const caption = String(body.caption || "").trim();
  if (!url) return json({ error: "Image URL is required" }, 400);

  const filename = url.split("/").pop().split("?")[0] || "external-image";
  const result = await env.DB.prepare(`
    INSERT INTO media_assets (url, key, filename, original_name, mime_type, size, source, category, alt, caption)
    VALUES (?, '', ?, ?, '', 0, 'external', ?, ?, ?)
  `).bind(url, filename, filename, category, alt, caption).run();

  return json({ ok: true, id: result.meta.last_row_id });
}

async function handleDelete({ request, env }) {
  const dbError = requireDb(env);
  if (dbError) return dbError;
  const authError = requireAdmin(request, env);
  if (authError) return authError;

  const body = await readJson(request);
  const id = getId(request, body);
  if (!id) return json({ error: "Missing id" }, 400);

  const asset = await env.DB.prepare("SELECT id, key, source FROM media_assets WHERE id = ?").bind(id).first();
  if (!asset) return json({ error: "Media asset not found" }, 404);
  if (asset.source === "r2" && asset.key) {
    if (!env.ASSETS) return json({ error: "R2 binding ASSETS is missing" }, 500);
    await env.ASSETS.delete(asset.key);
  }
  await deleteItem(env, "media_assets", id);
  return json({ ok: true });
}

export async function onRequest(context) {
  try {
    const method = context.request.method.toUpperCase();
    if (method === "GET") return handleGet(context);
    if (method === "POST") return handlePost(context);
    if (method === "DELETE") return handleDelete(context);
    return json({ error: "Method Not Allowed" }, 405);
  } catch (error) {
    const message = error.message || String(error);
    if (message.includes("no such table") && message.includes("media_assets")) {
      return json({ error: "no such table: media_assets" }, 500);
    }
    return json({ error: message }, 500);
  }
}
