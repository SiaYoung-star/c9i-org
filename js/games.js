const $loading = document.getElementById("loading");
const $catalog = document.getElementById("catalog");
const $error = document.getElementById("error");

function cardHtml(game) {
  const img = game.image
    ? `<img src="${escapeAttr(game.image)}" alt="" loading="lazy" />`
    : `<div class="thumb-fallback" aria-hidden="true">🎮</div>`;

  return `
    <a class="game-card" href="${escapeAttr(game.url)}" target="_blank" rel="noopener noreferrer">
      ${img}
      <div class="card-body">
        <h2>${escapeHtml(game.title)}</h2>
        <p>${escapeHtml(game.excerpt || "Play free in your browser on EasyHub.")}</p>
        <span class="play-hint">Play on EasyHub →</span>
      </div>
    </a>
  `;
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAttr(s) {
  return escapeHtml(s).replace(/'/g, "&#39;");
}

async function loadCatalog() {
  try {
    const res = await fetch("/api/games?limit=24", { cache: "default" });
    if (!res.ok) throw new Error("fail");
    const data = await res.json();
    const games = data.games || [];
    if (!games.length) throw new Error("empty");

    $catalog.innerHTML = games.map(cardHtml).join("");
    $loading.classList.add("hidden");
    $catalog.classList.remove("hidden");
  } catch {
    $loading.classList.add("hidden");
    $error.classList.remove("hidden");
  }
}

loadCatalog();
