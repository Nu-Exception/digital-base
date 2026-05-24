import { json, readJson } from "../_lib/cms.js";

export async function onRequestPost({ request, env }) {
  if (!env.ADMIN_PASSWORD) {
    return json({ error: "ADMIN_PASSWORD 未配置" }, 500);
  }

  const body = await readJson(request);
  if (!body.password || body.password !== env.ADMIN_PASSWORD) {
    return json({ error: "管理员密码错误" }, 401);
  }

  return json({
    ok: true,
    token: body.password
  });
}

export function onRequestGet() {
  return json({ error: "Method Not Allowed" }, 405);
}
