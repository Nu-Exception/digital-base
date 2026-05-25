import { createResourceHandlers } from "../_lib/resource.js";

const handlers = createResourceHandlers({
  table: "hero_slides",
  listKey: "slides",
  fields: ["title", "subtitle", "description", "image", "button_text", "button_link", "sort_order", "is_public"],
  required: ["image"],
  order: "sort_order ASC, id DESC"
});

export const onRequestGet = handlers.get;
export const onRequestPost = handlers.post;
export const onRequestPut = handlers.put;
export const onRequestPatch = handlers.put;
export const onRequestDelete = handlers.delete;
