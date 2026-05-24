import { json, requireAdmin, requireDb } from "../_lib/cms.js";

const MAX_SIZE = 100 * 1024 * 1024;
const EXT_BY_MIME = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif"
};
const ALLOWED_EXT = new Set(["jpg", "jpeg", "png", "webp", "gif"]);
const CATEGORIES = new Set(["post", "hero", "slide", "project", "resource", "avatar", "gallery", "other"]);

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

async function handlePost({ request, env }) {
  const dbError = requireDb(env);
  if (dbError) return dbError;
  const authError = requireAdmin(request, env);
  if (authError) return authError;
  if (!env.ASSETS) return json({ error: "R2 binding ASSETS is missing" }, 500);

  const form = await request.formData();
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

  await env.ASSETS.put(key, bytes, {
    httpMetadata: {
      contentType: mimeType
    }
  });

  const baseUrl = cleanBaseUrl(env.PUBLIC_ASSET_BASE_URL);
  const url = baseUrl ? `${baseUrl}/${key}` : key;
  const category = normalizeCategory(form.get("category"));
  const alt = String(form.get("alt") || "").trim();
  const caption = String(form.get("caption") || "").trim();
  const filename = key.split("/").pop();

  await env.DB.prepare(`
    INSERT INTO media_assets (url, key, filename, original_name, mime_type, size, source, category, alt, caption)
    VALUES (?, ?, ?, ?, ?, ?, 'r2', ?, ?, ?)
  `).bind(url, key, filename, file.name || filename, mimeType, file.size, category, alt, caption).run();

  return json({ ok: true, url, key, needs_public_base_url: !baseUrl });
}

export async function onRequest(context) {
  try {
    if (context.request.method.toUpperCase() !== "POST") {
      return json({ error: "Method Not Allowed" }, 405);
    }
    return handlePost(context);
  } catch (error) {
    return json({ error: error.message || String(error) }, 500);
  }
}
