export async function onRequestGet(context) {
  try {
    const { env } = context;

    const result = await env.DB.prepare(`
      SELECT *
      FROM media_assets
      ORDER BY id DESC
    `).all();

    return Response.json({
      media: result.results || []
    });

  } catch (err) {
    return Response.json({
      error: err.message
    }, {
      status: 500
    });
  }
}
