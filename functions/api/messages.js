import {
  boolInt,
  deleteItem,
  getId,
  json,
  listItems,
  methodNotAllowed,
  readJson,
  requireAdmin,
  requireDb,
  toInt,
} from "../_lib/cms.js";

export async function onRequestGet({ request, env }) {
  const dbError = requireDb(env);
  if (dbError) return dbError;

  const url = new URL(request.url);
  const admin = url.searchParams.get("admin") === "1";
  if (admin) {
    const authError = requireAdmin(request, env);
    if (authError) return authError;
  }
  const limit = Math.min(toInt(url.searchParams.get("limit"), 12), admin ? 200 : 30);
  const messages = await listItems(env, "messages", {
    admin,
    limit,
    order: "datetime(created_at) DESC, id DESC",
    jsonFields: []
  });
  return json({ messages });
}

export async function onRequestPost({ request, env }) {
  const dbError = requireDb(env);
  if (dbError) return dbError;

  const body = await readJson(request);
  const nickname = String(body.nickname || "").trim().slice(0, 24);
  const content = String(body.content || "").trim().slice(0, 500);
  if (!nickname || !content) return json({ error: "昵称和留言不能为空" }, 400);

  const result = await env.DB.prepare(
    "INSERT INTO messages (nickname, content, is_public) VALUES (?, ?, 1)"
  ).bind(nickname, content).run();
  return json({ ok: true, id: result.meta.last_row_id }, 201);
}

export async function onRequestPut({ request, env }) {
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
}

export async function onRequestDelete({ request, env }) {
  const dbError = requireDb(env);
  if (dbError) return dbError;
  const authError = requireAdmin(request, env);
  if (authError) return authError;

  const body = await readJson(request);
  const id = getId(request, body);
  if (!id) return json({ error: "缺少 id" }, 400);
  await deleteItem(env, "messages", id);
  return json({ ok: true });
}

export function onRequestPatch(context) {
  return onRequestPut(context);
}

export function onRequestOptions() {
  return methodNotAllowed();
}
