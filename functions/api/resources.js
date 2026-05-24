import { createResourceHandlers } from "../_lib/resource.js";

const handlers = createResourceHandlers({
  table: "resources",
  listKey: "resources",
  fields: ["title", "description", "icon", "url", "category", "sort_order", "is_public"],
  required: ["title", "url"],
  order: "sort_order ASC, id DESC"
});

export const onRequestGet = handlers.get;
export const onRequestPost = handlers.post;
export const onRequestPut = handlers.put;
export const onRequestPatch = handlers.put;
export const onRequestDelete = handlers.delete;
