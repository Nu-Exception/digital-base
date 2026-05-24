import { json, readJson, requireAdmin, requireDb } from "../_lib/cms.js";

const SETTING_KEYS = [
  "hero_kicker",
  "hero_title",
  "hero_description",
  "hero_primary_button_text",
  "hero_primary_button_link",
  "hero_secondary_button_text",
  "hero_secondary_button_link",
  "hero_status_title",
  "hero_status_description",
  "hero_background_image"
];

export async function onRequestGet({ env }) {
  try {
    const dbError = requireDb(env);
    if (dbError) return dbError;

    const { results } = await env.DB.prepare("SELECT key, value FROM site_settings").all();
    const settings = {};
    (results || []).forEach((row) => {
      settings[row.key] = row.value;
    });
    return json({ settings });
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
    const statements = SETTING_KEYS
      .filter((key) => Object.prototype.hasOwnProperty.call(body, key))
      .map((key) => env.DB.prepare(
        "INSERT INTO site_settings (key, value, updated_at) VALUES (?, ?, datetime('now')) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')"
      ).bind(key, String(body[key] || "")));

    if (!statements.length) return json({ error: "没有可保存的设置" }, 400);
    await env.DB.batch(statements);
    return json({ ok: true });
  } catch (error) {
    return json({ error: error.message || String(error) }, 500);
  }
}

export function onRequestPost(context) {
  return onRequestPut(context);
}

export function onRequestPatch(context) {
  return onRequestPut(context);
}
