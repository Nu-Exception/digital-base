export async function onRequestPost(context) {
  return Response.json({
    ok: true,
    message: "upload api ready"
  });
}
