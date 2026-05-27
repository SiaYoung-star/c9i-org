import { getRandomGame } from "../easyhub.js";

export async function onRequest(context) {
  try {
    const game = await getRandomGame(context.env);

    if (!game) {
      return Response.json({ error: "No games found" }, { status: 502 });
    }

    return Response.json(game, {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    return Response.json(
      { error: err?.message || "fetch failed" },
      { status: 500 }
    );
  }
}
