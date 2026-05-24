const CATEGORIES = new Set(["post", "hero", "slide", "project", "resource", "avatar", "gallery", "other"]);

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });
}

function getToken(request) {
  const auth = request.headers.get("Authorization") || "";
  return auth.toLowerCase().startsWith("bearer ") ? auth.slice(7).trim() : "";
}

function requireAdmin(request, env) {
  if (!env.ADMIN_PASSWORD || getToken(request) !== env.ADMIN_PASSWORD) {
    return json({ error: "Unauthorized" }, 401);
  }
  return null;
}

function requireDb(env) {
  if (!env.DB) return json({ error: "D1 binding DB is missing" }, 500);
  return null;
}

function toInt(value, fallback = 0) {
  const num = Number(value);
  return Number.isFinite(num) ? Math.trunc(num) : fallback;
}

function normalizeCategory(value) {
  const category = String(value || "").trim();
  return CATEGORIES.has(category) ? category : "other";
}

function normalizeError(error) {
  const message = error?.message || String(error);
  return message.includes("no such table") && message.includes("media_assets")
    ? "no such table: media_assets"
    : message;
}

export async function onRequestGet(context) {
  try {
    const dbError = requireDb(context.env);
    if (dbError) return dbError;

    const url = new URL(context.request.url);
    const category = String(url.searchParams.get("category") || "").trim();
    const limit = Math.min(toInt(url.searchParams.get("limit"), 120), 300);
    const sql = category
      ? "SELECT id, url, key, filename, original_name, mime_type, size, source, category, alt, caption, created_at FROM media_assets WHERE category = ? ORDER BY datetime(created_at) DESC, id DESC LIMIT ?"
      : "SELECT id, url, key, filename, original_name, mime_type, size, source, category, alt, caption, created_at FROM media_assets ORDER BY datetime(created_at) DESC, id DESC LIMIT ?";
    const stmt = context.env.DB.prepare(sql);
    const { results } = category ? await stmt.bind(category, limit).all() : await stmt.bind(limit).all();
    return json({ media: results || [] });
  } catch (error) {
    return json({ error: normalizeError(error) }, 500);
  }
}

export async function onRequestPost(context) {
  try {
    const dbError = requireDb(context.env);
    if (dbError) return dbError;
    const authError = requireAdmin(context.request, context.env);
    if (authError) return authError;

    const body = await context.request.json().catch(() => ({}));
    const url = String(body.url || "").trim();
    const category = normalizeCategory(body.category);
    const alt = String(body.alt || "").trim();
    const caption = String(body.caption || "").trim();
    if (!url) return json({ error: "Image URL is required" }, 400);

    const filename = url.split("/").pop().split("?")[0] || "external-image";
    const result = await context.env.DB.prepare(`
      INSERT INTO media_assets (url, key, filename, original_name, mime_type, size, source, category, alt, caption)
      VALUES (?, '', ?, ?, '', 0, 'external', ?, ?, ?)
    `).bind(url, filename, filename, category, alt, caption).run();

    return json({ ok: true, id: result.meta.last_row_id });
  } catch (error) {
    return json({ error: normalizeError(error) }, 500);
  }
}

export async function onRequestDelete(context) {
  try {
    const dbError = requireDb(context.env);
    if (dbError) return dbError;
    const authError = requireAdmin(context.request, context.env);
    if (authError) return authError;

    const url = new URL(context.request.url);
    const id = toInt(url.searchParams.get("id"), 0);
    if (!id) return json({ error: "Missing id" }, 400);

    const asset = await context.env.DB.prepare("SELECT id, key, source FROM media_assets WHERE id = ?").bind(id).first();
    if (!asset) return json({ error: "Media asset not found" }, 404);
    if (asset.source === "r2" && asset.key) {
      if (!context.env.ASSETS) return json({ error: "R2 binding ASSETS is missing" }, 500);
      await context.env.ASSETS.delete(asset.key);
    }

    await context.env.DB.prepare("DELETE FROM media_assets WHERE id = ?").bind(id).run();
    return json({ ok: true });
  } catch (error) {
    return json({ error: normalizeError(error) }, 500);
  }
}
