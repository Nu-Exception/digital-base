export async function onRequestGet() {
  return Response.json({
    media: [],
    ok: true
  }, {
    headers: {
      "Cache-Control": "no-store"
    }
  });
}
