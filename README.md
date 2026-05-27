# c9i.org — Random game discovery

Homepage shows a **random game card** (image, intro, play button). Click **Play on EasyHub** to open the game. Browse more at `/games.html`.

No local game list to maintain. Data is fetched live from [EasyHub.games](https://easyhub.games/).

## Deploy (Cloudflare Pages)

1. Upload this folder to GitHub or connect the repo in Cloudflare Pages.
2. **Build command:** `npm install` (or leave empty)  
3. **Output directory:** `.`  
4. **Deploy command:** `npm run pages:deploy` (if required)  
5. Add custom domain **c9i.org**

**Important:** Delete `functions/index.js` on GitHub if it still exists (old versions redirected `/` to EasyHub). Keep `functions/_routes.json` so only `/api/*` uses Functions.

## Live integration with EasyHub

See [docs/EASYHUB-INTEGRATION.md](docs/EASYHUB-INTEGRATION.md) for adding `GET /api/partner/random.json` on your EasyHub codebase (recommended).

## Local preview

```bash
npx wrangler pages dev .
```

Then open `http://localhost:8788` — you should be redirected to a game.

## Legacy

`npm run update-games` and `data/games.json` are optional and **not required** for production.
