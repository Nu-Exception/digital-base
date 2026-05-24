import { createResourceHandlers } from "../_lib/resource.js";
import { json, requireDb, toInt } from "../_lib/cms.js";

const handlers = createResourceHandlers({
  table: "projects",
  listKey: "projects",
  fields: ["title", "description", "cover", "url", "tags", "sort_order", "is_public"],
  required: ["title", "url"],
  jsonFields: ["tags"],
  order: "sort_order ASC, id DESC"
});

function parseArray(value) {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return String(value)
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
}

function normalizeProject(row) {
  return {
    ...row,
    tags: parseArray(row.tags)
  };
}

async function getProjectColumns(env) {
  const { results } = await env.DB.prepare("PRAGMA table_info(projects)").all();
  return (results || []).map((column) => column.name);
}

function buildVisibilityWhere(columns) {
  const visibilityFields = ["is_public", "visible", "is_visible"].filter((field) => columns.includes(field));
  if (!visibilityFields.length) return "";
  return `WHERE (${visibilityFields.map((field) => `CAST(COALESCE(${field}, 0) AS INTEGER) = 1`).join(" OR ")})`;
}

function buildOrderBy(columns) {
  const parts = [];
  if (columns.includes("sort_order")) parts.push("CAST(COALESCE(sort_order, 0) AS INTEGER) ASC");
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
    const limit = Math.min(toInt(url.searchParams.get("limit"), 100), 500);
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
    const orderBy = buildOrderBy(columns);

    if (debug) {
      const recent = await env.DB.prepare(`SELECT * FROM projects ORDER BY ${orderBy} LIMIT 5`).all();
      return json({
        table_exists,
        columns,
        total_projects: total?.count ?? 0,
        recent_projects: recent.results || []
      });
    }

    const where = buildVisibilityWhere(columns);
    const { results } = await env.DB.prepare(
      `SELECT * FROM projects ${where} ORDER BY ${orderBy} LIMIT ?`
    ).bind(limit).all();

    return json({ projects: (results || []).map(normalizeProject) });
  } catch (error) {
    return json({ error: error.message || String(error) }, 500);
  }
}

export const onRequestPost = handlers.post;
export const onRequestPut = handlers.put;
export const onRequestPatch = handlers.put;
export const onRequestDelete = handlers.delete;
