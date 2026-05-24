export function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8"
    }
  });
}

export function methodNotAllowed() {
  return json({ error: "Method Not Allowed" }, 405);
}

export function getToken(request) {
  const auth = request.headers.get("Authorization") || "";
  if (auth.toLowerCase().startsWith("bearer ")) {
    return auth.slice(7).trim();
  }
  return request.headers.get("x-admin-token") || "";
}

export function isAdmin(request, env) {
  return Boolean(env.ADMIN_PASSWORD && getToken(request) === env.ADMIN_PASSWORD);
}

export function requireAdmin(request, env) {
  if (!isAdmin(request, env)) {
    return json({ error: "未登录或 token 无效" }, 401);
  }
  return null;
}

export function requireDb(env) {
  if (!env.DB) {
    return json({ error: "D1 数据库未绑定，请绑定变量 DB" }, 500);
  }
  return null;
}

export async function readJson(request) {
  return request.json().catch(() => ({}));
}

export function toInt(value, fallback = 0) {
  const num = Number(value);
  return Number.isFinite(num) ? Math.trunc(num) : fallback;
}

export function boolInt(value, fallback = 1) {
  if (value === undefined || value === null || value === "") return fallback;
  return value === true || value === "true" || value === 1 || value === "1" ? 1 : 0;
}

export function splitLines(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }
  return String(value || "")
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function splitTags(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function parseArray(value) {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function normalizeJsonArrays(row, fields = []) {
  const out = { ...row };
  fields.forEach((field) => {
    out[field] = parseArray(out[field]);
  });
  return out;
}

export function getId(request, body = {}) {
  const url = new URL(request.url);
  return toInt(body.id ?? url.searchParams.get("id"), 0);
}

export function pickBody(body, fields, transforms = {}) {
  const out = {};
  fields.forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(body, field)) {
      out[field] = transforms[field] ? transforms[field](body[field]) : body[field];
    }
  });
  return out;
}

export async function createItem(env, table, fields, values) {
  const placeholders = fields.map(() => "?").join(", ");
  const sql = `INSERT INTO ${table} (${fields.join(", ")}) VALUES (${placeholders})`;
  return env.DB.prepare(sql).bind(...fields.map((field) => values[field])).run();
}

export async function updateItem(env, table, id, values) {
  const fields = Object.keys(values);
  if (!fields.length) return null;
  const sets = fields.map((field) => `${field} = ?`).join(", ");
  const sql = `UPDATE ${table} SET ${sets}, updated_at = datetime('now') WHERE id = ?`;
  return env.DB.prepare(sql).bind(...fields.map((field) => values[field]), id).run();
}

export async function deleteItem(env, table, id) {
  return env.DB.prepare(`DELETE FROM ${table} WHERE id = ?`).bind(id).run();
}

export async function listItems(env, table, options = {}) {
  const {
    admin = false,
    publicOnly = true,
    order = "sort_order ASC, id DESC",
    limit = 100,
    jsonFields = []
  } = options;
  const where = !admin && publicOnly ? "WHERE COALESCE(is_public, 1) = 1" : "";
  const { results } = await env.DB.prepare(
    `SELECT * FROM ${table} ${where} ORDER BY ${order} LIMIT ?`
  ).bind(limit).all();
  return (results || []).map((row) => normalizeJsonArrays(row, jsonFields));
}
