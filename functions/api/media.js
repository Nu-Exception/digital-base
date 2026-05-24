export async function onRequestGet() {
  return new Response(
    JSON.stringify({
      ok: true,
      media: []
    }),
    {
      headers: {
        "content-type": "application/json"
      }
    }
  );
}
