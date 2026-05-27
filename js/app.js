const $ = (id) => document.getElementById(id);

const els = {
  frameLoading: $("frame-loading"),
  heroImage: $("hero-image"),
  heroFallback: $("hero-fallback"),
  playHero: $("play-hero"),
  aboutTitle: $("about-title"),
  aboutDesc: $("about-desc"),
  tags: $("tags"),
  statDifficulty: $("stat-difficulty"),
  error: $("error"),
};

let currentGame = null;

function guessTags(title, desc) {
  const text = `${title} ${desc}`.toLowerCase();
  const pool = [
    { re: /race|car|drive|moto|bike|drift/, tag: "Racing" },
    { re: /puzzle|brain|match|word/, tag: "Puzzle" },
    { re: /shoot|fps|gun|sniper|war/, tag: "Action" },
    { re: /zombie|horror|scary/, tag: "Horror" },
    { re: /soccer|football|basket|sport/, tag: "Sports" },
    { re: /jump|run|parkour|obby/, tag: "Jump & Run" },
    { re: /click|idle|merge/, tag: "Casual" },
    { re: /multi|2 player|two player/, tag: "Multiplayer" },
  ];
  const tags = [];
  for (const p of pool) {
    if (p.re.test(text) && !tags.includes(p.tag)) tags.push(p.tag);
  }
  const defaults = ["Arcade", "Casual", "Fun", "Browser"];
  for (const d of defaults) {
    if (tags.length >= 4) break;
    if (!tags.includes(d)) tags.push(d);
  }
  return tags.slice(0, 4);
}

function guessDifficulty(desc) {
  const t = (desc || "").toLowerCase();
  if (/hard|difficult|challenge|expert/.test(t)) return "Hard";
  if (/easy|casual|relax|simple/.test(t)) return "Easy";
  return "Easy to Medium";
}

function setFrameLoading(on) {
  els.frameLoading.classList.toggle("hidden", !on);
}

function setHeroImage(url, title) {
  const img = els.heroImage;
  const fb = els.heroFallback;
  if (!url) {
    img.classList.add("hidden");
    fb.classList.remove("hidden");
    return;
  }
  img.onload = () => {
    img.classList.remove("hidden");
    fb.classList.add("hidden");
    setFrameLoading(false);
  };
  img.onerror = () => {
    img.classList.add("hidden");
    fb.classList.remove("hidden");
    setFrameLoading(false);
  };
  img.src = url;
  img.alt = `${title} cover art`;
}

function render(game) {
  currentGame = game;
  const title = game.title || "Random Game";
  const desc = game.description || game.excerpt || "A free browser game from EasyHub.";
  const excerpt = game.excerpt || desc;

  els.playHero.href = game.url;
  els.playHero.textContent = "PLAY NOW →";

  els.aboutTitle.textContent = title;
  els.aboutDesc.textContent = excerpt;

  els.tags.innerHTML = guessTags(title, desc)
    .map((t) => `<span class="tag">${escapeHtml(t)}</span>`)
    .join("");

  els.statDifficulty.textContent = guessDifficulty(desc);

  setFrameLoading(true);
  setHeroImage(game.image, title);

  document.title = `${title} · PLAY RANDOM`;
  els.error.classList.add("hidden");
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function loadRandom() {
  setFrameLoading(true);
  els.error.classList.add("hidden");

  try {
    const res = await fetch("/api/random", { cache: "no-store" });
    if (!res.ok) throw new Error("api");
    const game = await res.json();
    if (!game?.url) throw new Error("empty");
    render(game);
  } catch {
    els.error.classList.remove("hidden");
    setFrameLoading(false);
  }
}

function bindSurpriseButtons() {
  for (const id of ["header-surprise", "cta-surprise", "prev-game", "next-game"]) {
    const el = $(id);
    if (el) el.addEventListener("click", loadRandom);
  }
}

$("retry-btn")?.addEventListener("click", loadRandom);

bindSurpriseButtons();
loadRandom();
