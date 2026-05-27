const KICKERS = [
  "The arcade dice say…",
  "Today's lucky spin:",
  "A wild game appears!",
  "Button mashers approve:",
  "Level up your break with:",
  "RNG gods have spoken:",
];

const $loading = document.getElementById("loading");
const $game = document.getElementById("game");
const $error = document.getElementById("error");
const $kicker = document.getElementById("kicker");

const $title = document.getElementById("game-title");
const $poster = document.getElementById("poster");
const $posterFallback = document.getElementById("poster-fallback");
const $excerpt = document.getElementById("intro-excerpt");
const $full = document.getElementById("intro-full");
const $toggle = document.getElementById("toggle-intro");
const $play = document.getElementById("play-link");
const $url = document.getElementById("game-url");

function pickKicker() {
  return KICKERS[Math.floor(Math.random() * KICKERS.length)];
}

function show(state) {
  $loading.classList.toggle("hidden", state !== "loading");
  $game.classList.toggle("hidden", state !== "game");
  $error.classList.toggle("hidden", state !== "error");
}

function setImage(url, title) {
  if (url) {
    $poster.src = url;
    $poster.alt = `${title} cover art`;
    $poster.classList.remove("hidden");
    $posterFallback.classList.add("hidden");
    $poster.onerror = () => {
      $poster.classList.add("hidden");
      $posterFallback.classList.remove("hidden");
    };
  } else {
    $poster.removeAttribute("src");
    $poster.classList.add("hidden");
    $posterFallback.classList.remove("hidden");
  }
}

function setupIntro(game) {
  const full = game.description || game.excerpt || "";
  const excerpt = game.excerpt || makeLocalExcerpt(full);
  const hasMore = full.length > (excerpt.length + 40);

  $excerpt.textContent = excerpt;
  $full.textContent = full;
  $full.classList.add("hidden");
  $toggle.classList.toggle("hidden", !hasMore);
  $toggle.textContent = "Read full intro";

  $toggle.onclick = () => {
    const open = !$full.classList.contains("hidden");
    $full.classList.toggle("hidden", open);
    $excerpt.classList.toggle("hidden", !open);
    $toggle.textContent = open ? "Read full intro" : "Show less";
  };
}

function makeLocalExcerpt(text) {
  if (!text) return "A free browser game waiting for you on EasyHub — hit play to jump in.";
  if (text.length <= 320) return text;
  return text.slice(0, 300).trim() + "…";
}

function render(game) {
  $kicker.textContent = pickKicker();
  $title.textContent = game.title;
  $play.href = game.url;
  $play.textContent = `Play ${game.title} on EasyHub →`;
  $url.href = game.url;
  $url.textContent = game.url;

  setImage(game.image, game.title);
  setupIntro(game);
  show("game");
}

async function loadRandom() {
  show("loading");
  $loading.classList.add("shuffling");
  $kicker.textContent = "Rolling the arcade dice…";

  try {
    const res = await fetch("/api/random", { cache: "no-store" });
    if (!res.ok) throw new Error("API error");
    const game = await res.json();
    if (!game?.url) throw new Error("Invalid game");
    render(game);
  } catch {
    show("error");
  } finally {
    $loading.classList.remove("shuffling");
  }
}

document.getElementById("shuffle-btn").addEventListener("click", loadRandom);
document.getElementById("retry-btn").addEventListener("click", loadRandom);

loadRandom();
