import {
  boolInt,
  createItem,
  deleteItem,
  getId,
  json,
  listItems,
  pickBody,
  readJson,
  requireAdmin,
  requireDb,
  splitTags,
  toInt,
  updateItem
} from "./cms.js";

const baseTransforms = {
  tags: (value) => JSON.stringify(splitTags(value)),
  sort_order: (value) => toInt(value, 0),
  is_public: (value) => boolInt(value, 1)
};

export function createResourceHandlers(config) {
  const {
    table,
    listKey,
    fields,
    required = [],
    jsonFields = [],
    order = "sort_order ASC, id DESC",
    transforms = {}
  } = config;
  const allTransforms = { ...baseTransforms, ...transforms };

  function normalize(body, defaults = {}) {
    const source = { ...defaults, ...body };
    const values = pickBody(source, fields, allTransforms);
    Object.keys(values).forEach((key) => {
      if (typeof values[key] === "string" && key !== "tags") {
        values[key] = values[key].trim();
      }
    });
    return values;
  }

  function validate(values) {
    const missing = required.filter((field) => !String(values[field] || "").trim());
    return missing.length ? `${missing.join(", ")} 不能为空` : "";
  }

  return {
    async get({ request, env }) {
      try {
        const dbError = requireDb(env);
        if (dbError) return dbError;

        const url = new URL(request.url);
        const admin = url.searchParams.get("admin") === "1";
        if (admin) {
          const authError = requireAdmin(request, env);
          if (authError) return authError;
        }
        const limit = Math.min(toInt(url.searchParams.get("limit"), 100), admin ? 500 : 100);
        const rows = await listItems(env, table, { admin, limit, order, jsonFields });
        return json({ [listKey]: rows });
      } catch (error) {
        return json({ error: error.message || String(error) }, 500);
      }
    },

    async post({ request, env }) {
      try {
        const dbError = requireDb(env);
        if (dbError) return dbError;
        const authError = requireAdmin(request, env);
        if (authError) return authError;

        const body = await readJson(request);
        const defaults = fields.reduce((acc, field) => {
          acc[field] = "";
          if (field === "sort_order") acc[field] = 0;
          if (field === "is_public") acc[field] = 1;
          return acc;
        }, {});
        const values = normalize(body, defaults);
        const error = validate(values);
        if (error) return json({ error }, 400);
        const result = await createItem(env, table, fields, values);
        return json({ ok: true, id: result.meta.last_row_id }, 201);
      } catch (error) {
        return json({ error: error.message || String(error) }, 500);
      }
    },

    async put({ request, env }) {
      try {
        const dbError = requireDb(env);
        if (dbError) return dbError;
        const authError = requireAdmin(request, env);
        if (authError) return authError;

        const body = await readJson(request);
        const id = getId(request, body);
        if (!id) return json({ error: "缺少 id" }, 400);
        const values = normalize(body);
        const error = validate({ ...body, ...values });
        if (required.some((field) => Object.prototype.hasOwnProperty.call(values, field)) && error) {
          return json({ error }, 400);
        }
        await updateItem(env, table, id, values);
        return json({ ok: true });
      } catch (error) {
        return json({ error: error.message || String(error) }, 500);
      }
    },

    async delete({ request, env }) {
      try {
        const dbError = requireDb(env);
        if (dbError) return dbError;
        const authError = requireAdmin(request, env);
        if (authError) return authError;

        const body = await readJson(request);
        const id = getId(request, body);
        if (!id) return json({ error: "缺少 id" }, 400);
        await deleteItem(env, table, id);
        return json({ ok: true });
      } catch (error) {
        return json({ error: error.message || String(error) }, 500);
      }
    }
  };
}
