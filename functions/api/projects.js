import { createResourceHandlers } from "../_lib/resource.js";

const handlers = createResourceHandlers({
  table: "projects",
  listKey: "projects",
  fields: ["title", "description", "cover", "url", "tags", "sort_order", "is_public"],
  required: ["title", "url"],
  jsonFields: ["tags"],
  order: "sort_order ASC, id DESC"
});

export const onRequestGet = handlers.get;
export const onRequestPost = handlers.post;
export const onRequestPut = handlers.put;
export const onRequestPatch = handlers.put;
export const onRequestDelete = handlers.delete;
