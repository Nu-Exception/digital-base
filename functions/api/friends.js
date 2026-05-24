import { createResourceHandlers } from "../_lib/resource.js";

const handlers = createResourceHandlers({
  table: "friends",
  listKey: "friends",
  fields: ["name", "status", "avatar", "tag", "sort_order", "is_public"],
  required: ["name"],
  order: "sort_order ASC, id DESC"
});

export const onRequestGet = handlers.get;
export const onRequestPost = handlers.post;
export const onRequestPut = handlers.put;
export const onRequestPatch = handlers.put;
export const onRequestDelete = handlers.delete;
