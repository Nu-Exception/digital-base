const MAX_SIZE = 100 * 1024 * 1024;
const EXT_BY_MIME = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif"
};
const ALLOWED_EXT = new Set(["jpg", "jpeg", "png", "webp", "gif"]);
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

function randomId() {
  return crypto.randomUUID ? crypto.randomUUID().slice(0, 8) : Math.random().toString(36).slice(2, 10);
}

function cleanBaseUrl(value = "") {
  return String(value || "").replace(/\/+$/, "");
}

function extFromName(name = "") {
  const ext = String(name).split(".").pop().toLowerCase();
  return ALLOWED_EXT.has(ext) ? ext : "";
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

export async function onRequestPost(context) {
  try {
    const dbError = requireDb(context.env);
    if (dbError) return dbError;
    const authError = requireAdmin(context.request, context.env);
    if (authError) return authError;
    if (!context.env.ASSETS) return json({ error: "R2 binding ASSETS is missing" }, 500);

    const form = await context.request.formData();
    const file = form.get("file");
    if (!file || typeof file.arrayBuffer !== "function") {
      return json({ error: "Missing upload file field: file" }, 400);
    }
    if (file.size > MAX_SIZE) {
      return json({ error: "Single file must be 100MB or smaller" }, 400);
    }

    const mimeType = file.type || "application/octet-stream";
    let ext = EXT_BY_MIME[mimeType] || extFromName(file.name);
    if (ext === "jpeg") ext = "jpg";
    if (!ext || !ALLOWED_EXT.has(ext)) {
      return json({ error: "Only jpg, jpeg, png, webp, and gif images are supported" }, 400);
    }

    const now = new Date();
    const yyyy = now.getUTCFullYear();
    const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
    const key = `uploads/${yyyy}/${mm}/${Date.now()}-${randomId()}.${ext}`;
    const bytes = await file.arrayBuffer();

    await context.env.ASSETS.put(key, bytes, {
      httpMetadata: {
        contentType: mimeType
      }
    });

    const baseUrl = cleanBaseUrl(context.env.PUBLIC_ASSET_BASE_URL);
    const url = baseUrl ? `${baseUrl}/${key}` : key;
    const category = normalizeCategory(form.get("category"));
    const alt = String(form.get("alt") || "").trim();
    const caption = String(form.get("caption") || "").trim();
    const filename = key.split("/").pop();

    await context.env.DB.prepare(`
      INSERT INTO media_assets (url, key, filename, original_name, mime_type, size, source, category, alt, caption)
      VALUES (?, ?, ?, ?, ?, ?, 'r2', ?, ?, ?)
    `).bind(url, key, filename, file.name || filename, mimeType, file.size, category, alt, caption).run();

    return json({ ok: true, url, key });
  } catch (error) {
    return json({ error: normalizeError(error) }, 500);
  }
}
