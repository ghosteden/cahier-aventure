/* =========================================================
   UI — composants visuels réutilisables.
   ========================================================= */
window.CV = window.CV || {};

CV.UI = (function () {
  const h = CV.h;

  let toastTimer = null;
  function toast(msg, ms) {
    const t = document.getElementById("toast");
    if (!t) return;
    t.textContent = msg;
    t.classList.add("show");
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), ms || 2600);
  }

  function applyTheme(theme) {
    document.body.setAttribute("data-theme", theme || "espace");
    const meta = document.querySelector('meta[name="theme-color"]');
    const colors = { espace: "#1b1140", pirates: "#06303a", chevaliers: "#2a1410", dinosaure: "#14331a", ulysse: "#0d2b4a" };
    if (meta) meta.setAttribute("content", colors[theme] || "#1b1140");
  }

  function stars(n, size) {
    const s = "★★★☆☆".slice(3 - n, 6 - n); // n pleines puis vides (max 3)
    return h("span", { class: "stars-won", style: size ? { fontSize: size } : null },
      "★".repeat(n) + "☆".repeat(Math.max(0, 3 - n)));
  }

  function statusBar(state) {
    const avatar = { espace: "🧑‍🚀", pirates: "🏴‍☠️", chevaliers: "🛡️", dinosaure: "🦖", ulysse: "🏛️" }[state.theme] || "🦖";
    return h("div", { class: "status-bar" },
      h("div", { class: "status-avatar" }, avatar),
      h("div", { class: "status-info" },
        h("div", { class: "status-name" }, state.displayName + " · " + state.grade),
        h("div", { class: "status-level" }, "Aventurier des savoirs")
      ),
      h("div", { class: "status-chips" },
        h("div", { class: "chip gold" }, "⭐ " + (state.stars || 0)),
        h("div", { class: "chip fire" }, "🔥 " + (state.streak.count || 0))
      )
    );
  }

  function confetti() {
    const emojis = ["🎉", "⭐", "✨", "🎊", "🏆", "💫", "🌟"];
    for (let i = 0; i < 28; i++) {
      const c = h("div", { class: "confetti" }, emojis[i % emojis.length]);
      c.style.left = ((i * 37) % 100) + "vw";
      c.style.animationDuration = (1.6 + (i % 5) * 0.35) + "s";
      c.style.animationDelay = ((i % 7) * 0.08) + "s";
      document.body.appendChild(c);
      setTimeout(() => c.remove(), 3200);
    }
  }

  /* Écran de victoire (fin de module, de jour, de boss). */
  function victory(container, opts) {
    if (opts.stars) confetti();   // pas de feu d'artifice si 0 étoile (niveau passé / raté)
    container.innerHTML = "";
    const box = h("div", { class: "victory" },
      h("div", { class: "victory-emoji" }, opts.emoji || "🏆"),
      h("h2", {}, opts.title || "Bravo !"),
      opts.stars ? h("div", {}, stars(opts.stars)) : null,
      opts.subtitle ? h("p", { class: "muted" }, opts.subtitle) : null
    );
    if (opts.badges && opts.badges.length) {
      box.appendChild(h("p", { class: "mt" }, "Nouveau" + (opts.badges.length > 1 ? "x" : "") + " trophée" + (opts.badges.length > 1 ? "x" : "") + " !"));
      const grid = h("div", { class: "badge-grid" });
      opts.badges.forEach((b) => grid.appendChild(
        h("div", { class: "badge" }, h("div", { class: "badge-emo" }, b.emoji), h("div", { class: "badge-name" }, b.name))));
      box.appendChild(grid);
    }
    box.appendChild(h("button", { class: "btn big gold block mt", onclick: opts.onContinue }, opts.cta || "Continuer 🎈"));
    container.appendChild(box);
  }

  return { toast, applyTheme, statusBar, confetti, victory, stars };
})();
