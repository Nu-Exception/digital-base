import {
  boolInt,
  deleteItem,
  getId,
  json,
  methodNotAllowed,
  readJson,
  requireAdmin,
  requireDb,
  toInt
} from "../_lib/cms.js";

async function getColumns(env) {
  const { results } = await env.DB.prepare("PRAGMA table_info(messages)").all();
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
  if (columns.includes("created_at")) parts.push("datetime(created_at) DESC");
  parts.push("id DESC");
  return parts.join(", ");
}

export async function onRequestGet({ request, env }) {
  try {
    const dbError = requireDb(env);
    if (dbError) return dbError;

    const url = new URL(request.url);
    const admin = url.searchParams.get("admin") === "1";
    const debug = url.searchParams.get("debug") === "1";
    if (admin) {
      const authError = requireAdmin(request, env);
      if (authError) return authError;
    }
    const limit = Math.min(toInt(url.searchParams.get("limit"), 12), admin ? 200 : 30);
    const table = await env.DB.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'messages'").first();
    const table_exists = Boolean(table);
    if (!table_exists) return debug ? json({ table_exists, columns: [], total: 0, recent: [] }) : json({ messages: [] });

    const columns = await getColumns(env);
    const order = buildOrder(columns);
    const total = await env.DB.prepare("SELECT COUNT(*) AS count FROM messages").first();
    if (debug) {
      const recent = await env.DB.prepare(`SELECT * FROM messages ORDER BY ${order} LIMIT 5`).all();
      return json({ table_exists, columns, total: total?.count ?? 0, recent: recent.results || [] });
    }

    const where = admin ? "" : buildWhere(columns);
    const { results } = await env.DB.prepare(`SELECT * FROM messages ${where} ORDER BY ${order} LIMIT ?`).bind(limit).all();
    return json({ messages: results || [] });
  } catch (error) {
    return json({ error: error.message || String(error) }, 500);
  }
}

export async function onRequestPost({ request, env }) {
  try {
    const dbError = requireDb(env);
    if (dbError) return dbError;

    const body = await readJson(request);
    const nickname = String(body.nickname || "").trim().slice(0, 24);
    const content = String(body.content || "").trim().slice(0, 500);
    if (!nickname || !content) return json({ error: "昵称和留言不能为空" }, 400);

    const result = await env.DB.prepare(
      "INSERT INTO messages (nickname, content, is_public) VALUES (?, ?, 1)"
    ).bind(nickname, content).run();
    const id = result.meta.last_row_id;
    const message = await env.DB.prepare("SELECT * FROM messages WHERE id = ?").bind(id).first();
    return json({ ok: true, id, message }, 201);
  } catch (error) {
    return json({ error: error.message || String(error) }, 500);
  }
}

export async function onRequestPut({ request, env }) {
  try {
    const dbError = requireDb(env);
    if (dbError) return dbError;
    const authError = requireAdmin(request, env);
    if (authError) return authError;

    const body = await readJson(request);
    const id = getId(request, body);
    if (!id) return json({ error: "缺少 id" }, 400);
    await env.DB.prepare("UPDATE messages SET is_public = ? WHERE id = ?")
      .bind(boolInt(body.is_public, 1), id)
      .run();
    return json({ ok: true });
  } catch (error) {
    return json({ error: error.message || String(error) }, 500);
  }
}

export async function onRequestDelete({ request, env }) {
  try {
    const dbError = requireDb(env);
    if (dbError) return dbError;
    const authError = requireAdmin(request, env);
    if (authError) return authError;

    const body = await readJson(request);
    const id = getId(request, body);
    if (!id) return json({ error: "缺少 id" }, 400);
    await deleteItem(env, "messages", id);
    return json({ ok: true });
  } catch (error) {
    return json({ error: error.message || String(error) }, 500);
  }
}

export function onRequestPatch(context) {
  return onRequestPut(context);
}

export function onRequestOptions() {
  return methodNotAllowed();
}
