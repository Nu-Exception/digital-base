import { createResourceHandlers } from "../_lib/resource.js";
import { json, requireAdmin, requireDb } from "../_lib/cms.js";

const handlers = createResourceHandlers({
  table: "projects",
  listKey: "projects",
  fields: ["title", "description", "cover", "url", "tags", "sort_order", "is_public"],
  required: ["title", "url"],
  jsonFields: ["tags"],
  order: "sort_order ASC, id DESC"
});

async function getProjectColumns(env) {
  const { results } = await env.DB.prepare("PRAGMA table_info(projects)").all();
  return (results || []).map((column) => column.name);
}

function buildWhere(columns) {
  const fields = ["is_public", "visible", "is_visible"].filter((field) => columns.includes(field));
  if (!fields.length) return "";
  const anyVisible = fields.map((field) => `${field} = 1`).join(" OR ");
  const allUnset = fields.map((field) => `${field} IS NULL`).join(" AND ");
  return `WHERE (${anyVisible} OR (${allUnset}))`;
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
    const table = await env.DB.prepare(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'projects'"
    ).first();
    const table_exists = Boolean(table);

    if (!table_exists) {
      return debug
        ? json({ table_exists, columns: [], total: 0, recent: [], total_projects: 0, recent_projects: [] })
        : json({ error: "projects table does not exist" }, 500);
    }

    const columns = await getProjectColumns(env);
    const total = await env.DB.prepare("SELECT COUNT(*) AS count FROM projects").first();

    if (debug) {
      const recent = await env.DB.prepare("SELECT * FROM projects ORDER BY sort_order ASC, id DESC LIMIT 5").all();
      return json({
        table_exists,
        columns,
        total: total?.count ?? 0,
        recent: recent.results || [],
        total_projects: total?.count ?? 0,
        recent_projects: recent.results || []
      });
    }

    const where = admin ? "" : buildWhere(columns);
    const { results } = await env.DB.prepare(
      `SELECT * FROM projects ${where} ORDER BY sort_order ASC, id DESC`
    ).all();

    return json({ projects: results || [] });
  } catch (error) {
    return json({ error: error.message || String(error) }, 500);
  }
}

export const onRequestPost = handlers.post;
export const onRequestPut = handlers.put;
export const onRequestPatch = handlers.put;
export const onRequestDelete = handlers.delete;
