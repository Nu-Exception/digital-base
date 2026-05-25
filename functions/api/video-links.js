import { createResourceHandlers } from "../_lib/resource.js";
import { json, requireAdmin, requireDb } from "../_lib/cms.js";

const handlers = createResourceHandlers({
  table: "video_links",
  listKey: "videos",
  fields: ["title", "description", "cover", "url", "tags", "sort_order", "is_public"],
  required: ["title", "url"],
  jsonFields: ["tags"],
  order: "sort_order ASC, id DESC"
});

async function getColumns(env) {
  const { results } = await env.DB.prepare("PRAGMA table_info(video_links)").all();
  return (results || []).map((column) => column.name);
}

function buildWhere(columns) {
  const fields = ["is_public", "visible", "is_visible"].filter((field) => columns.includes(field));
  if (!fields.length) return "";
  const anyVisible = fields.map((field) => `${field} = 1`).join(" OR ");
  const allUnset = fields.map((field) => `${field} IS NULL`).join(" AND ");
  return `WHERE (${anyVisible} OR (${allUnset}))`;
}

function buildOrder(columns) {
  const parts = [];
  if (columns.includes("sort_order")) parts.push("sort_order ASC");
  if (columns.includes("created_at")) parts.push("datetime(created_at) DESC");
  parts.push("id DESC");
  return parts.join(", ");
}

export async function onRequestGet({ request, env }) {
  try {
    const dbError = requireDb(env);
    if (dbError) return dbError;
    const url = new URL(request.url);
    const debug = url.searchParams.get("debug") === "1";
    const admin = url.searchParams.get("admin") === "1";
    if (admin) {
      const authError = requireAdmin(request, env);
      if (authError) return authError;
    }
    const table = await env.DB.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'video_links'").first();
    const table_exists = Boolean(table);
    if (!table_exists) return debug ? json({ table_exists, columns: [], total: 0, recent: [] }) : json({ videos: [], videoLinks: [] });

    const columns = await getColumns(env);
    const order = buildOrder(columns);
    const total = await env.DB.prepare("SELECT COUNT(*) AS count FROM video_links").first();
    if (debug) {
      const recent = await env.DB.prepare(`SELECT * FROM video_links ORDER BY ${order} LIMIT 5`).all();
      return json({ table_exists, columns, total: total?.count ?? 0, recent: recent.results || [] });
    }

    const where = admin ? "" : buildWhere(columns);
    const { results } = await env.DB.prepare(`SELECT * FROM video_links ${where} ORDER BY ${order}`).all();
    return json({ videos: results || [], videoLinks: results || [] });
  } catch (error) {
    return json({ error: error.message || String(error) }, 500);
  }
}

export const onRequestPost = handlers.post;
export const onRequestPut = handlers.put;
export const onRequestPatch = handlers.put;
export const onRequestDelete = handlers.delete;
