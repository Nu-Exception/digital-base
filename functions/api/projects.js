import { createResourceHandlers } from "../_lib/resource.js";
import { json, requireDb } from "../_lib/cms.js";

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

export async function onRequestGet({ request, env }) {
  try {
    const dbError = requireDb(env);
    if (dbError) return dbError;

    const url = new URL(request.url);
    const debug = url.searchParams.get("debug") === "1";
    const table = await env.DB.prepare(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'projects'"
    ).first();
    const table_exists = Boolean(table);

    if (!table_exists) {
      return debug
        ? json({ table_exists, total_projects: 0, recent_projects: [] })
        : json({ error: "projects table does not exist" }, 500);
    }

    const columns = await getProjectColumns(env);
    const total = await env.DB.prepare("SELECT COUNT(*) AS count FROM projects").first();

    if (debug) {
      const recent = await env.DB.prepare("SELECT * FROM projects ORDER BY sort_order ASC, id DESC LIMIT 5").all();
      return json({
        table_exists,
        columns,
        total_projects: total?.count ?? 0,
        recent_projects: recent.results || []
      });
    }

    const where = columns.includes("is_public") ? "WHERE (is_public = 1 OR is_public IS NULL)" : "";
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
