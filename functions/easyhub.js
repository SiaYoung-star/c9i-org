const EASYHUB_HOME = "https://easyhub.games/en";
const PARTNER_JSON = "https://easyhub.games/api/partner/random.json";
const USER_AGENT = "c9i.org/1.0 (+https://c9i.org)";
const EXCERPT_LEN = 320;

function slugToTitle(slug) {
  return slug
    .replace(/^[a-z]{2}-/, "")
    .split("-")
    .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join(" ");
}

/** Fix odd fragments from EasyHub titles (e.g. "Raidfield 2 Pjc") */
function cleanTitle(title) {
  return String(title)
    .replace(/\s*\|.*$/, "")
    .replace(/\s+on\s+EasyHub\.?games?$/i, "")
    .replace(/\s+Pjc$/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function decodeHtml(s) {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function metaContent(html, property) {
  const re = new RegExp(
    `<meta[^>]+(?:property|name)=["']${property}["'][^>]+content=["']([^"']+)["']`,
    "i"
  );
  const m = html.match(re);
  if (m) return decodeHtml(m[1]);
  const re2 = new RegExp(
    `<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${property}["']`,
    "i"
  );
  const m2 = html.match(re2);
  return m2 ? decodeHtml(m2[1]) : "";
}

function parseGamesFromHtml(html) {
  const games = new Map();

  const linkRe = new RegExp(
    '<a[^>]+href="(?:https://easyhub\\.games)?/en/games/([a-z0-9-]+)"[^>]*>([^<]*)<',
    "gi"
  );
  let m;
  while ((m = linkRe.exec(html))) {
    const slug = m[1];
    const title = decodeHtml(m[2]);
    if (!slug || slug.length < 4) continue;
    if (!games.has(slug) || (title && title.length > 1)) {
      games.set(slug, {
        slug,
        title: cleanTitle(title || slugToTitle(slug)),
        url: `https://easyhub.games/en/games/${slug}`,
      });
    }
  }

  const slugRe = /\/en\/games\/([a-z0-9-]+)/gi;
  while ((m = slugRe.exec(html))) {
    const slug = m[1];
    if (!games.has(slug) && slug.length >= 4) {
      games.set(slug, {
        slug,
        title: slugToTitle(slug),
        url: `https://easyhub.games/en/games/${slug}`,
      });
    }
  }

  return [...games.values()];
}

function extractDescription(html) {
  const og = metaContent(html, "og:description");
  if (og && og.length > 40) return og;

  const h1 = html.match(/<h1[^>]*>([^<]+)</i);
  let afterH1 = "";
  if (h1) {
    const idx = html.indexOf(h1[0]);
    afterH1 = html.slice(idx + h1[0].length, idx + 8000);
  }

  const pRe = /<p[^>]*>([\s\S]*?)<\/p>/gi;
  let pm;
  while ((pm = pRe.exec(afterH1 || html))) {
    const text = decodeHtml(pm[1].replace(/<[^>]+>/g, ""));
    if (text.length > 80 && !text.startsWith("Q:")) return text;
  }

  return "";
}

function extractImage(html) {
  const og = metaContent(html, "og:image");
  if (og) return og;

  const tw = metaContent(html, "twitter:image");
  if (tw) return tw;

  const img = html.match(
    /https:\/\/imgs\.f0c\.org\/[a-zA-Z0-9-]+\.(?:png|jpg|webp|svg)/i
  );
  return img ? img[0] : "";
}

function makeExcerpt(text, max = EXCERPT_LEN) {
  if (!text) return "";
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const last = cut.lastIndexOf(" ");
  return (last > 120 ? cut.slice(0, last) : cut).trim() + "…";
}

async function fetchHtml(url) {
  const res = await fetch(url, {
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "text/html,application/xhtml+xml",
    },
  });
  if (!res.ok) return null;
  return res.text();
}

export async function fetchGameDetails(slug, base = {}) {
  const url = base.url || `https://easyhub.games/en/games/${slug}`;
  const html = await fetchHtml(url);
  if (!html) {
    return {
      slug,
      title: base.title || slugToTitle(slug),
      url,
      description: "",
      excerpt: "Jump in and discover this free browser game on EasyHub.",
      image: "",
      source: "https://easyhub.games/",
    };
  }

  const ogTitle = metaContent(html, "og:title");
  const title = cleanTitle(
    base.title ||
      (ogTitle ? ogTitle.replace(/\s*\|.*$/, "") : "") ||
      slugToTitle(slug)
  );

  const description = extractDescription(html);
  const image = extractImage(html);

  return {
    slug,
    title,
    url,
    description,
    excerpt: makeExcerpt(description) || description,
    image,
    source: "https://easyhub.games/",
  };
}

async function fetchGameList() {
  const html = await fetchHtml(EASYHUB_HOME);
  if (!html) return [];
  return parseGamesFromHtml(html);
}

function normalizeGame(raw) {
  if (!raw?.url) return null;
  const url = String(raw.url);
  if (!url.includes("easyhub.games") || !url.includes("/games/")) return null;
  return {
    title: raw.title || slugToTitle(raw.slug || ""),
    url,
    slug: raw.slug || url.split("/games/")[1]?.replace(/\/$/, ""),
    source: "https://easyhub.games/",
  };
}

async function fetchJsonRandom(url) {
  const res = await fetch(url, {
    headers: { Accept: "application/json", "User-Agent": USER_AGENT },
  });
  if (!res.ok) return null;
  const data = await res.json();
  if (data?.url) return normalizeGame(data);
  if (Array.isArray(data?.games) && data.games.length > 0) {
    const pick = data.games[Math.floor(Math.random() * data.games.length)];
    return normalizeGame(pick);
  }
  return null;
}

async function pickBaseGame(env) {
  const customUrl = env.EASYHUB_RANDOM_JSON_URL;
  const sources = [customUrl, PARTNER_JSON].filter(Boolean);

  for (const url of sources) {
    try {
      const game = await fetchJsonRandom(url);
      if (game) return game;
    } catch {
      /* try next */
    }
  }

  const list = await fetchGameList();
  if (list.length === 0) return null;
  return list[Math.floor(Math.random() * list.length)];
}

export async function getRandomGame(env = {}) {
  const base = await pickBaseGame(env);
  if (!base) return null;
  return fetchGameDetails(base.slug, base);
}

export async function listGamesWithPreview(limit = 24) {
  const list = await fetchGameList();
  const shuffled = [...list].sort(() => Math.random() - 0.5).slice(0, limit);

  const details = await Promise.all(
    shuffled.map((g) => fetchGameDetails(g.slug, g))
  );

  return details.map((d) => ({
    slug: d.slug,
    title: d.title,
    url: d.url,
    excerpt: d.excerpt,
    image: d.image,
  }));
}
