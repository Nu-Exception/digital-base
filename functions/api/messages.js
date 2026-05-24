function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8"
    }
  });
}

function normalizeMessage(row) {
  return {
    id: row.id,
    nickname: row.nickname,
    content: row.content,
    created_at: row.created_at
  };
}

export async function onRequestGet({ request, env }) {
  if (!env.DB) {
    return json({ error: "D1 数据库未绑定，请绑定变量 DB" }, 500);
  }

  const url = new URL(request.url);
  const limit = Math.min(Number(url.searchParams.get("limit") || 12), 30);
  const { results } = await env.DB.prepare(
    "SELECT id, nickname, content, created_at FROM messages ORDER BY datetime(created_at) DESC, id DESC LIMIT ?"
  ).bind(limit).all();

  return json({ messages: (results || []).map(normalizeMessage) });
}

export async function onRequestPost({ request, env }) {
  if (!env.DB) {
    return json({ error: "D1 数据库未绑定，请绑定变量 DB" }, 500);
  }

  const body = await request.json().catch(() => ({}));
  const nickname = String(body.nickname || "").trim().slice(0, 24);
  const content = String(body.content || "").trim().slice(0, 500);

  if (!nickname || !content) {
    return json({ error: "昵称和留言不能为空" }, 400);
  }

  const result = await env.DB.prepare(
    "INSERT INTO messages (nickname, content) VALUES (?, ?)"
  ).bind(nickname, content).run();

  return json({
    ok: true,
    id: result.meta.last_row_id
  }, 201);
}

export function onRequestOptions() {
  return json({ ok: true });
}
