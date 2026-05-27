import { listGamesWithPreview } from "../easyhub.js";

export async function onRequest(context) {
  const url = new URL(context.request.url);
  const limit = Math.min(
    60,
    Math.max(12, parseInt(url.searchParams.get("limit") || "24", 10) || 24)
  );

  try {
    const games = await listGamesWithPreview(limit);
    return Response.json(
      { games, source: "https://easyhub.games/" },
      {
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "public, max-age=600",
        },
      }
    );
  } catch (err) {
    return Response.json(
      { error: err?.message || "fetch failed" },
      { status: 500 }
    );
  }
}
