/* =========================================================
   APP — démarrage, navigation et écrans.
   ========================================================= */
window.CV = window.CV || {};

(function () {
  const h = CV.h;
  const Store = CV.Store, Game = CV.Game, UI = CV.UI;
  const appEl = document.getElementById("app");
  const navEl = document.getElementById("navbar");
  const splash = document.getElementById("splash");

  let timerInterval = null;
  let session = null; // { dayStart, min, max, minFlag, maxFlag }

  /* ---------- Installation de l'appli (PWA) ---------- */
  const Install = {
    deferred: null,
    installed: false,
    init() {
      this.installed = this.checkInstalled();
      window.addEventListener("beforeinstallprompt", (e) => {
        e.preventDefault();
        this.deferred = e;
        if (onCarteOrProfil()) route();
      });
      window.addEventListener("appinstalled", () => {
        this.installed = true; this.deferred = null;
        UI.toast("Appli installée ! 🎉 Retrouve-la sur ton écran d'accueil.");
        if (onCarteOrProfil()) route();
      });
    },
    checkInstalled() {
      return (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches)
        || window.navigator.standalone === true;
    },
    isInstalled() { return this.installed || this.checkInstalled(); },
    canPrompt() { return !!this.deferred; },
    isIOS() { return /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream; },
    async prompt() {
      if (!this.deferred) return;
      this.deferred.prompt();
      try { await this.deferred.userChoice; } catch (e) {}
      this.deferred = null;
    }
  };
  function onCarteOrProfil() {
    const hs = location.hash || "#/carte";
    return hs.indexOf("carte") >= 0 || hs.indexOf("profil") >= 0 || hs === "#/" || hs === "";
  }

  /* Bannière / bouton d'installation (null si déjà installée ou non proposable). */
  function installBanner() {
    if (Install.isInstalled()) return null;
    if (Install.canPrompt()) {
      return h("div", { class: "card glass", style: { display: "flex", alignItems: "center", gap: "12px" } },
        h("div", { style: { fontSize: "30px" } }, "📲"),
        h("div", { style: { flex: "1" } },
          h("strong", {}, "Installer l'appli"),
          h("div", { class: "muted", style: { fontSize: "13px" } }, "Comme une vraie appli, même sans internet.")),
        h("button", { class: "btn small", onclick: async () => { await Install.prompt(); route(); } }, "Installer"));
    }
    if (Install.isIOS()) {
      return h("div", { class: "card glass" },
        h("div", { class: "row", style: { gap: "10px" } },
          h("div", { style: { fontSize: "26px" } }, "📲"),
          h("strong", {}, "Ajouter à l'écran d'accueil")),
        h("p", { class: "muted", style: { fontSize: "13px", marginTop: "6px" } },
          "Sur iPhone/iPad : appuie sur Partager ⬆️ en bas, puis « Sur l'écran d'accueil »."));
    }
    return null;
  }

  /* ---------- Démarrage ---------- */
  function boot() {
    // Service worker (hors-ligne)
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("sw.js").catch(() => {});
    }
    Install.init();
    // Boutons de navigation
    navEl.querySelectorAll(".nav-btn").forEach((b) =>
      b.addEventListener("click", () => goto(b.getAttribute("data-go"))));

    // Statut de la sync (petit indicateur) + test de disponibilité du cloud
    if (CV.Sync) {
      CV.Sync.onStatus((ok) => {
        CV._syncOk = ok;
        if (typeof CV._onSyncStatus === "function") CV._onSyncStatus(ok);
      });
      CV.Sync.ping();
    }

    Store.autoLogin();
    setTimeout(() => {
      splash.setAttribute("hidden", "");
      appEl.removeAttribute("hidden");
      route();
    }, 600);

    window.addEventListener("hashchange", route);
  }

  function goto(hash) { if (location.hash === hash) route(); else location.hash = hash; }

  function stopTimer() { if (timerInterval) { clearInterval(timerInterval); timerInterval = null; } }

  /* ---------- Routeur ---------- */
  function route() {
    stopTimer();
    const state = Store.current();
    if (!state) { navEl.setAttribute("hidden", ""); return renderLogin(); }
    navEl.removeAttribute("hidden");

    const hash = location.hash || "#/carte";
    const tab = hash.split("/")[1] || "carte";
    setActiveNav(tab);

    if (tab === "carte") return renderCarte();
    if (tab === "recompenses") return renderRewards();
    if (tab === "profil") return renderProfil();
    return renderCarte();
  }

  function setActiveNav(tab) {
    navEl.querySelectorAll(".nav-btn").forEach((b) =>
      b.classList.toggle("active", b.getAttribute("data-go") === "#/" + tab));
  }

  function screen() { appEl.innerHTML = ""; appEl.scrollTop = 0; window.scrollTo(0, 0); return appEl; }

  /* ---------- Écran de connexion ---------- */
  function renderLogin() {
    UI.applyTheme("dinosaure");
    const c = screen();
    c.appendChild(h("div", { class: "login-bg", style: { backgroundImage: "url(assets/map-dinosaure.png)" } }));
    const players = Store.listPlayers();

    const nameInput = h("input", { id: "login-name", placeholder: "Ton prénom", autocomplete: "off" });
    // Pour l'instant une seule classe : CE2 (on en ajoutera d'autres plus tard).
    const classInput = h("select", { id: "login-class" }, h("option", { value: "CE2" }, "CE2"));

    // Choix de la sauvegarde (modifiable ensuite). Le Cloud n'est
    // sélectionnable que si la synchro est réellement disponible (appli en ligne).
    let cloudChoice = false;
    let userTouched = false;
    const optCloud = h("div", { class: "theme-opt world-espace disabled" }, "☁️ Cloud");
    const optLocal = h("div", { class: "theme-opt world-pirates sel" }, "📱 Local");
    const saveHint = h("p", { class: "muted", style: { fontSize: "13px", marginTop: "6px" } },
      "Vérification de la sauvegarde en ligne…");
    function selectCloud(on) {
      cloudChoice = on;
      optCloud.classList.toggle("sel", on);
      optLocal.classList.toggle("sel", !on);
      saveHint.textContent = on
        ? "Cloud : la progression suit entre le téléphone et l'ordi."
        : "Local : gardée seulement sur cet appareil (rien n'est envoyé en ligne).";
    }
    optCloud.addEventListener("click", () => { userTouched = true; selectCloud(true); });
    optLocal.addEventListener("click", () => { userTouched = true; selectCloud(false); });
    function refreshCloud() {
      const ok = CV._syncOk === true;
      optCloud.classList.toggle("disabled", !ok);
      optCloud.textContent = ok ? "☁️ Cloud" : "☁️ Cloud (indispo.)";
      if (!ok) selectCloud(false);
      else if (!userTouched) selectCloud(true);
    }
    CV._onSyncStatus = () => { if (!Store.isLoggedIn()) refreshCloud(); };
    refreshCloud();

    const card = h("div", { class: "card" },
      h("div", { class: "lesson-icon" }, "🚀"),
      h("h2", { class: "center", style: { marginTop: "6px" } }, "L'Aventure des Savoirs"),
      h("p", { class: "center muted" }, "Cahier de vacances CE2 → CM1, en mode jeu !"),
      h("div", { class: "field" }, h("label", {}, "Comment tu t'appelles ?"), nameInput),
      h("div", { class: "field" }, h("label", {}, "Ta classe"), classInput),
      h("div", { class: "field" }, h("label", {}, "Où sauvegarder ma progression ?"),
        h("div", { class: "theme-pick" }, optCloud, optLocal), saveHint),
      h("button", { class: "btn big block", onclick: () => {
        const name = nameInput.value.trim();
        if (!name) { UI.toast("Écris ton prénom pour commencer 🙂"); return; }
        Store.login(name, classInput.value.trim(), { cloud: cloudChoice });
        const s = Store.current();
        UI.applyTheme(s.theme);
        goto("#/carte");
        UI.toast("Bienvenue " + s.displayName + " ! 🎉");
      } }, "C'est parti ! 🎮")
    );
    c.appendChild(card);

    if (players.length) {
      const quick = h("div", { class: "card glass" }, h("strong", {}, "Reprendre une partie :"));
      const row = h("div", { class: "btn-row mt" });
      players.forEach((p) => row.appendChild(
        h("button", { class: "btn ghost small", onclick: () => {
          Store.login(p.displayName, p.classCode);
          UI.applyTheme(Store.current().theme);
          goto("#/carte");
        } }, "👤 " + p.displayName)));
      quick.appendChild(row);
      c.appendChild(quick);
    }

    c.appendChild(h("p", { class: "center muted mt" },
      "Astuce parent : installe l'appli sur l'écran d'accueil (menu du navigateur → « Ajouter à l'écran d'accueil »)."));
  }

  /* ---------- Carte d'aventure (map déplaçable) ---------- */
  let mapViewIndex = null;     // monde actuellement regardé
  let mapDragged = false;      // pour distinguer clic / glissement

  function svgEl(str) { const d = document.createElement("div"); d.innerHTML = str.trim(); return d.firstChild; }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  function spriteStyle(w, size) {
    const g = w.grid || { cols: 1, rows: 1, col: 0, row: 0 };
    const px = g.cols > 1 ? (g.col / (g.cols - 1)) * 100 : 0;
    const py = g.rows > 1 ? (g.row / (g.rows - 1)) * 100 : 0;
    return {
      backgroundImage: "url(" + w.sprite + ")",
      backgroundSize: (g.cols * 100) + "% " + (g.rows * 100) + "%",
      backgroundPosition: px + "% " + py + "%",
      width: size + "px", height: size + "px"
    };
  }

  function stoneSVG(kind) {
    const grad = {
      open: ["#d9cba6", "#9c8758"], done: ["#e0cf8e", "#b08a2f"],
      cracked: ["#cabca4", "#7d6f57"], locked: ["#838990", "#4c5054"],
      boss: ["#ef8b4a", "#9c2f1a"]
    }[kind] || ["#d9cba6", "#9c8758"];
    const cracks = kind === "cracked"
      ? '<path d="M50,20 L45,44 L54,62" stroke="#5b4f3d" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M45,44 L33,52" stroke="#5b4f3d" stroke-width="2.5" fill="none"/>' : "";
    const moss = kind === "locked"
      ? '<ellipse cx="37" cy="64" rx="13" ry="5" fill="#5a7d3a" opacity=".7"/><ellipse cx="64" cy="40" rx="8" ry="4" fill="#5a7d3a" opacity=".6"/>' : "";
    return svgEl('<svg class="stone-svg" viewBox="0 0 100 100">' +
      '<defs><radialGradient id="g_' + kind + '" cx="40%" cy="30%" r="78%">' +
      '<stop offset="0" stop-color="' + grad[0] + '"/><stop offset="1" stop-color="' + grad[1] + '"/>' +
      '</radialGradient></defs>' +
      '<ellipse cx="50" cy="86" rx="33" ry="8" fill="rgba(0,0,0,.35)"/>' +
      '<path d="M50,16 C73,16 85,34 83,55 C81,75 64,83 50,83 C36,83 19,75 17,55 C15,34 27,16 50,16 Z" fill="url(#g_' + kind + ')" stroke="rgba(0,0,0,.4)" stroke-width="2"/>' +
      '<path d="M50,16 C66,16 79,30 81,49 C60,40 40,40 21,50 C23,30 34,16 50,16 Z" fill="#ffffff" opacity=".2"/>' +
      moss + cracks + '</svg>');
  }

  function renderCarte() {
    const state = Store.current();
    const curLevel = state.currentDay || 1;
    const curWorldIndex = CV.worldIndexOfLevel(curLevel);
    if (mapViewIndex === null || mapViewIndex > curWorldIndex) mapViewIndex = curWorldIndex;
    const w = CV.worldByIndex(mapViewIndex);
    UI.applyTheme(w.theme);
    // garde l'avatar de la barre de statut en phase avec le monde courant
    const curTheme = CV.worldByIndex(curWorldIndex).theme;
    if (state.theme !== curTheme) { state.theme = curTheme; Store.save({ silent: true }); }

    const c = screen();
    c.appendChild(UI.statusBar(state));
    const banner = installBanner();
    if (banner) c.appendChild(banner);

    // En-tête monde + flèches
    c.appendChild(h("div", { class: "map-header" },
      h("button", { class: "world-arrow", disabled: mapViewIndex <= 0 ? "" : null,
        onclick: () => { if (mapViewIndex > 0) { mapViewIndex--; renderCarte(); } } }, "‹"),
      h("div", { class: "map-title" },
        h("div", { class: "wt-name" }, w.emoji + " " + w.name),
        h("div", { class: "wt-sub" }, mapViewIndex < curWorldIndex ? "Monde terminé ✅" : "Monde " + (mapViewIndex + 1) + " / 5")),
      h("button", { class: "world-arrow", disabled: mapViewIndex >= curWorldIndex ? "" : null,
        onclick: () => { if (mapViewIndex < curWorldIndex) { mapViewIndex++; renderCarte(); } } }, "›")));

    const viewport = h("div", { class: "map-viewport" });
    const layer = h("div", { class: "map-layer" });
    const img = h("img", { class: "map-img", src: w.map, alt: w.name });
    layer.appendChild(img);
    viewport.appendChild(layer);
    c.appendChild(viewport);
    c.appendChild(h("div", { class: "map-hint" }, "Glisse la carte • touche une pierre pour jouer"));

    setupMap(viewport, layer, w, mapViewIndex, curLevel, curWorldIndex, state);
  }

  function setupMap(viewport, layer, w, worldIndex, curLevel, curWorldIndex, state) {
    // Dimensionne la carte : hauteur = un peu plus que la fenêtre → on déplace.
    const vw = viewport.clientWidth, vh = viewport.clientHeight;
    const ratio = 1408 / 768;
    const zoom = 1.35;
    const lh = Math.round(vh * zoom);
    const lw = Math.round(lh * ratio);
    layer.style.width = lw + "px";
    layer.style.height = lh + "px";

    const worldDone = worldIndex < curWorldIndex;
    const curNodeIdx = worldIndex === curWorldIndex ? CV.nodeIndexOfLevel(curLevel) : (worldDone ? 8 : -1);

    // Chemin pointillé
    const pts = w.nodes.map((n) => n[0] + "," + n[1]).join(" ");
    layer.appendChild(svgEl('<svg class="map-path" viewBox="0 0 100 100" preserveAspectRatio="none">' +
      '<polyline points="' + pts + '" fill="none" stroke="rgba(255,248,225,.55)" stroke-width="0.7" stroke-dasharray="1.6 1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>'));

    // Brouillard de guerre (sauf monde entièrement terminé)
    if (!worldDone) {
      const revealed = [];
      w.nodes.forEach((n, i) => { if (i <= curNodeIdx) revealed.push(n); });
      let circles = "";
      revealed.forEach((n, i) => {
        const r = i === revealed.length - 1 ? 20 : 16;
        circles += '<circle cx="' + n[0] + '" cy="' + n[1] + '" r="' + r + '" fill="url(#hole)"/>';
      });
      layer.appendChild(svgEl('<svg class="map-fog" viewBox="0 0 100 100" preserveAspectRatio="none">' +
        '<defs><radialGradient id="hole"><stop offset="0" stop-color="black"/><stop offset="55%" stop-color="black"/><stop offset="100%" stop-color="white"/></radialGradient>' +
        '<mask id="fogmask"><rect width="100" height="100" fill="white"/>' + circles + '</mask></defs>' +
        '<rect width="100" height="100" fill="#0a0a14" opacity="0.8" mask="url(#fogmask)"/></svg>'));
    }

    // Pierres
    w.nodes.forEach((n, i) => {
      const level = CV.levelNumber(worldIndex, i);
      const isBoss = i === 8;
      const dp = (state.dayProgress || {})[level];
      const done = dp && dp.done;
      const stars = done ? (dp.stars || 1) : 0;
      const isCurrent = level === curLevel;
      const locked = level > curLevel;
      let kind = "open";
      if (locked) kind = "locked";
      else if (isBoss) kind = "boss";
      else if (done) kind = stars <= 1 ? "cracked" : "done";
      let cls = "stone " + (locked ? "locked" : "") + (isBoss ? " boss" : "") + (isCurrent ? " current" : "");
      const stone = h("div", { class: cls, style: { left: n[0] + "%", top: n[1] + "%" } });
      stone.appendChild(stoneSVG(kind));
      stone.appendChild(h("div", { class: "stone-num" }, locked ? "🔒" : (isBoss ? "👑" : String(i + 1))));
      if (done) stone.appendChild(h("div", { class: "stone-stars" }, "⭐".repeat(stars)));
      stone.addEventListener("click", (e) => {
        e.stopPropagation();
        if (mapDragged) return;
        if (locked) { UI.toast("🔒 Termine la pierre précédente d'abord !"); return; }
        openNodeSheet(level);
      });
      layer.appendChild(stone);
    });

    // Personnage à la case courante (ou à la fin si monde terminé)
    const heroNode = w.nodes[curNodeIdx >= 0 ? curNodeIdx : 0];
    const hero = h("div", { class: "hero-sprite", style: Object.assign(spriteStyle(w, 66), { left: heroNode[0] + "%", top: heroNode[1] + "%" }) });
    layer.appendChild(hero);

    // Position initiale : centrée sur le personnage
    const minTx = Math.min(0, vw - lw), minTy = Math.min(0, vh - lh);
    const cx = (heroNode[0] / 100) * lw, cy = (heroNode[1] / 100) * lh;
    let tx = clamp(vw / 2 - cx, minTx, 0), ty = clamp(vh / 2 - cy, minTy, 0);
    const apply = () => { layer.style.transform = "translate(" + tx + "px," + ty + "px)"; };
    apply();

    // Glissement (drag) au doigt / souris.
    // IMPORTANT : on ne capture le pointeur QUE lorsqu'un vrai glissement
    // démarre, sinon un simple tap sur une pierre serait « avalé » par la carte.
    let dragging = false, captured = false, sx = 0, sy = 0, stx = 0, sty = 0;
    viewport.addEventListener("pointerdown", (e) => {
      dragging = true; captured = false; mapDragged = false;
      sx = e.clientX; sy = e.clientY; stx = tx; sty = ty;
    });
    viewport.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      const dx = e.clientX - sx, dy = e.clientY - sy;
      if (!captured && Math.abs(dx) + Math.abs(dy) > 6) {
        captured = true; mapDragged = true;
        viewport.classList.add("dragging");
        try { viewport.setPointerCapture(e.pointerId); } catch (_) {}
      }
      if (captured) { tx = clamp(stx + dx, minTx, 0); ty = clamp(sty + dy, minTy, 0); apply(); }
    });
    const end = () => { dragging = false; captured = false; viewport.classList.remove("dragging"); };
    viewport.addEventListener("pointerup", end);
    viewport.addEventListener("pointercancel", end);
    viewport.addEventListener("pointerleave", end);
  }

  /* Petit panneau d'une pierre (au tap) */
  function openNodeSheet(level) {
    const state = Store.current();
    const lv = CV.getLevel(level);
    const mod = lv.moduleId ? CV.getModule(lv.moduleId) : null;
    const dp = (state.dayProgress || {})[level];
    const done = dp && dp.done;

    const backdrop = h("div", { class: "sheet-backdrop", onclick: closeSheet });
    const subj = mod ? ({ francais: "Français", maths: "Maths", sciences: "Sciences", culture: "Culture" }[mod.subject] || "") : "";
    const sheet = h("div", { class: "node-sheet" },
      h("div", { class: "ns-head" },
        h("div", { class: "ns-emoji" }, lv.isBoss ? "👑" : (mod ? mod.icon : "✏️")),
        h("div", { style: { flex: "1" } },
          h("div", { class: "pill" }, lv.isBoss ? "BOSS du monde" : (subj + (mod && mod.isDictee ? " · Dictée" : ""))),
          h("div", { style: { fontWeight: "bold", fontSize: "17px", marginTop: "4px" } },
            lv.isBoss ? "Le Grand Défi" : (mod ? mod.title : "Niveau")))),
      done ? h("p", { class: "muted" }, "Déjà réussi " + "⭐".repeat(dp.stars || 1) + " — tu peux rejouer pour faire mieux.") : null,
      h("button", { class: "btn big block mt", onclick: () => { closeSheet(); openLevel(level); } },
        lv.isBoss ? "⚔️ Affronter le boss" : (done ? "↻ Rejouer" : "▶️ Jouer")),
      h("button", { class: "btn debug block mt", onclick: () => { closeSheet(); skipLevel(level); } },
        "🔓 Débloquer (test)")
    );
    appEl.appendChild(backdrop);
    appEl.appendChild(sheet);
  }
  function closeSheet() {
    appEl.querySelectorAll(".node-sheet, .sheet-backdrop").forEach((e) => e.remove());
  }

  /* Termine un niveau instantanément (bouton de test). */
  function skipLevel(level) {
    const state = Store.current();
    const lv = CV.getLevel(level);
    if (lv.moduleId) {
      const mod = CV.getModule(lv.moduleId);
      Game.awardModule(state, mod, 1, 1);
    }
    finishLevel(lv, 3, null, null, true);
  }

  /* ---------- Ouvrir un niveau ---------- */
  function openLevel(level) {
    const lv = CV.getLevel(level);
    if (!lv) return goto("#/carte");
    const state = Store.current();
    if (lv.level > (state.currentDay || 1)) { goto("#/carte"); return; }
    UI.applyTheme(lv.theme);
    if (lv.isBoss) return playBoss(lv);
    playModule(CV.getModule(lv.moduleId), lv);
  }

  /* ---------- Leçon ---------- */
  function playModule(mod, lv) {
    const c = screen();
    c.appendChild(backBar("#/carte", "Carte"));
    const card = h("div", { class: "card" });
    card.appendChild(h("div", { class: "lesson-icon" }, mod.icon));
    card.appendChild(h("h2", { class: "center" }, mod.title));
    card.appendChild(h("p", {}, mod.lesson.intro));
    const ul = h("ul", { class: "lesson-points" });
    mod.lesson.points.forEach((p) => ul.appendChild(h("li", { html: p })));
    card.appendChild(ul);
    if (mod.lesson.example) card.appendChild(h("div", { class: "lesson-example", html: "📌 " + mod.lesson.example }));
    if (mod.lesson.tip) card.appendChild(h("div", { class: "lesson-tip", html: mod.lesson.tip }));
    card.appendChild(h("button", { class: "btn big block mt", onclick: () => playExercises(mod, lv) },
      mod.isDictee ? "🎧 Commencer la dictée →" : "✏️ Au défi ! →"));
    card.appendChild(h("button", { class: "btn debug block mt", onclick: () => skipLevel(lv.level) }, "🔓 Débloquer (test)"));
    c.appendChild(card);
  }

  /* ---------- Exercices d'un module ---------- */
  function playExercises(mod, lv) {
    const c = screen();
    c.appendChild(backBar("#/carte", "Carte"));
    c.appendChild(h("h2", { class: "section-title" }, mod.icon + " " + mod.title));
    const box = h("div", { class: "card" });
    c.appendChild(box);
    CV.Engine.run(box, mod.exercises, {
      onComplete: ({ correct, total }) => {
        const res = Game.awardModule(Store.current(), mod, correct, total);
        Store.save();
        showLevelResult(mod, lv, correct, total, res);
      }
    });
  }

  function showLevelResult(mod, lv, correct, total, res) {
    const state = Store.current();
    const r = Game.completeDay(state, lv, res.stars);
    Store.save();
    mapViewIndex = null;
    const badges = (res.newBadges || []).concat(r.newBadges || []);
    const c = screen();
    UI.victory(c, {
      emoji: res.stars === 3 ? "🌟" : "🎉",
      title: res.stars === 3 ? "Sans faute, incroyable !" : "Bien joué !",
      stars: res.stars,
      subtitle: correct + " / " + total + " bonnes réponses",
      xp: res.xpGained,
      badges: badges,
      cta: "Retour à la carte 🗺️",
      onContinue: () => { if (res.leveledUp) UI.toast("⬆️ Niveau " + res.newLevel + " !"); goto("#/carte"); }
    });
  }

  /* ---------- Boss ---------- */
  function playBoss(lv) {
    const exs = CV.buildBossExercises(lv, 8);
    const c = screen();
    c.appendChild(backBar("#/carte", "Carte"));
    c.appendChild(h("h2", { class: "section-title" }, "👑 Le Grand Défi — " + lv.worldName));
    const box = h("div", { class: "card" });
    c.appendChild(box);
    c.appendChild(h("button", { class: "btn debug block mt", onclick: () => skipLevel(lv.level) }, "🔓 Débloquer (test)"));
    if (!exs.length) { box.appendChild(h("p", {}, "Termine d'abord les leçons de ce monde !")); return; }
    CV.Engine.run(box, exs, {
      onComplete: ({ correct, total }) => {
        const state = Store.current();
        const stars = Game.starsForScore(correct, total);
        state.xp += correct * 10;
        Store.save();
        finishLevel(lv, stars, correct, total, false);
      }
    });
  }

  /* ---------- Fin d'un niveau ---------- */
  function finishLevel(lv, stars, correct, total, isSkip) {
    const state = Store.current();
    Game.completeDay(state, lv, stars);
    Store.save();
    mapViewIndex = null;
    if (lv.isBoss) return worldCleared(lv, stars, correct, total);
    goto("#/carte");
  }

  /* ---------- Monde terminé → monde suivant ---------- */
  function worldCleared(lv, stars, correct, total) {
    const state = Store.current();
    const fullyDone = Object.keys(state.dayProgress).length >= CV.TOTAL_DAYS;
    const c = screen();
    UI.confetti();
    if (fullyDone) {
      UI.victory(c, {
        emoji: "🎓", title: "Tu as fini toute l'aventure !",
        stars: stars, subtitle: "Bravo, tu es prêt pour le CM1 ! 🎉",
        cta: "Voir mes trophées 🏆", onContinue: () => goto("#/recompenses")
      });
      return;
    }
    const nextIdx = Math.min(CV.WORLDS.length - 1, CV.worldIndexOfLevel(state.currentDay || 1));
    const nextW = CV.worldByIndex(nextIdx);
    const box = h("div", { class: "card center world-transition" },
      h("div", { style: { fontSize: "70px" } }, "👑"),
      h("h2", {}, lv.worldName + " — terminé !"),
      UI.stars(stars),
      h("p", { class: "muted" }, correct != null ? ("Boss vaincu : " + correct + " / " + total) : "Boss vaincu !"),
      h("div", { style: { fontSize: "56px", marginTop: "12px" } }, nextW.emoji),
      h("p", {}, "Nouveau monde débloqué : " + nextW.name + " !"),
      h("button", { class: "btn big gold block mt", onclick: () => { mapViewIndex = null; goto("#/carte"); } },
        "Entrer dans le monde suivant →"));
    c.appendChild(box);
  }

  /* ---------- Trophées & statistiques ---------- */
  function renderRewards() {
    const state = Store.current();
    UI.applyTheme(state.theme);
    const c = screen();
    c.appendChild(UI.statusBar(state));
    c.appendChild(h("h2", { class: "section-title" }, "🏆 Tes trophées"));

    const grid = h("div", { class: "badge-grid" });
    Game.badgeList().forEach((b) => {
      const has = (state.badges || []).includes(b.id);
      grid.appendChild(h("div", { class: "badge" + (has ? "" : " locked") },
        h("div", { class: "badge-emo" }, has ? b.emoji : "🔒"),
        h("div", { class: "badge-name" }, b.name)));
    });
    c.appendChild(grid);

    const st = state.stats || {};
    const pct = st.totalAnswered ? Math.round((st.totalCorrect / st.totalAnswered) * 100) : 0;
    c.appendChild(h("div", { class: "card glass mt" },
      h("h3", {}, "📊 Mes progrès"),
      statLine("Niveaux réussis", Object.keys(state.dayProgress || {}).length + " / " + CV.TOTAL_DAYS),
      statLine("Défis terminés", st.modulesDone || 0),
      statLine("Bonnes réponses", (st.totalCorrect || 0) + " (" + pct + "% de réussite)"),
      statLine("Étoiles gagnées", "⭐ " + (state.stars || 0)),
      statLine("Meilleure série", "🔥 " + (state.streak.count || 0) + " jours"),
      statLine("Niveau", Game.levelInfo(state.xp).level)
    ));
  }

  function statLine(label, val) {
    return h("div", { class: "row", style: { padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,.08)" } },
      h("span", {}, label), h("span", { class: "spacer" }), h("strong", {}, String(val)));
  }

  /* ---------- Profil & réglages ---------- */
  function renderProfil() {
    const state = Store.current();
    UI.applyTheme(state.theme);
    const c = screen();
    c.appendChild(UI.statusBar(state));
    c.appendChild(h("h2", { class: "section-title" }, "🧑‍🚀 Mon profil"));
    const profBanner = installBanner();
    if (profBanner) c.appendChild(profBanner);

    // Sauvegarde : choix Local / Cloud (Cloud désactivé si indisponible)
    const cloudOn = !!(state.settings && state.settings.cloud);
    const cloudAvailable = CV._syncOk === true;
    const cloudDisabled = !cloudAvailable && !cloudOn;
    const saveCard = h("div", { class: "card glass" }, h("strong", {}, "💾 Sauvegarde de la progression"));
    const choice = h("div", { class: "theme-pick mt" },
      h("div", { class: "theme-opt world-espace" + (cloudOn ? " sel" : "") + (cloudDisabled ? " disabled" : ""), onclick: () => {
        if (cloudOn) return;
        if (!cloudAvailable) { UI.toast("Le cloud sera dispo une fois l'appli en ligne ☁️"); return; }
        Store.setCloud(true); UI.toast("Sauvegarde cloud activée ☁️"); renderProfil();
      } }, cloudDisabled ? "☁️ Cloud (indispo.)" : "☁️ Cloud"),
      h("div", { class: "theme-opt world-pirates" + (cloudOn ? "" : " sel"), onclick: () => {
        if (!cloudOn) return;
        if (confirm("Passer en sauvegarde locale ? Ta progression en ligne sera EFFACÉE (elle reste sur cet appareil).")) {
          Store.setCloud(false); UI.toast("Sauvegarde locale — données cloud effacées 📱"); renderProfil();
        }
      } }, "📱 Local"));
    saveCard.appendChild(choice);
    saveCard.appendChild(h("p", { class: "muted", style: { fontSize: "13px", marginTop: "8px" } },
      cloudOn
        ? (cloudAvailable
            ? "Cloud activé ✅ — synchro entre le téléphone et l'ordi. Identifiant : " + (state.classCode ? state.classCode + " · " : "") + state.displayName + "."
            : "Cloud activé. Hors-ligne pour l'instant : la synchro se fera dès la reconnexion.")
        : (cloudAvailable
            ? "Mode local 📱. Tu peux activer le Cloud pour synchroniser tes appareils."
            : "Mode local 📱 — la sauvegarde en ligne sera disponible une fois l'appli publiée.")));
    if (cloudOn && cloudAvailable) saveCard.appendChild(h("button", { class: "btn ghost small mt", onclick: () => {
      if (CV.Sync) { CV.Sync.push(state); UI.toast("Sauvegarde envoyée ☁️"); }
    } }, "Forcer la sauvegarde maintenant"));
    c.appendChild(saveCard);
    CV._onSyncStatus = () => { if ((location.hash || "").indexOf("profil") >= 0) renderProfil(); };

    // Réglages durée
    c.appendChild(h("div", { class: "card glass" },
      h("strong", {}, "⏱️ Durée d'une session conseillée"),
      h("p", { class: "muted" }, "Indicatif : l'appli encourage " + state.settings.minMin + " min minimum et propose une pause vers " + state.settings.maxMin + " min.")));

    // Actions
    c.appendChild(h("div", { class: "btn-row mt" },
      h("button", { class: "btn ghost", onclick: () => { Store.logout(); location.hash = "#/"; route(); } }, "Changer de joueur"),
      h("button", { class: "btn", style: { background: "var(--bad)" }, onclick: () => {
        if (confirm("Recommencer toute l'aventure à zéro ? (les trophées seront perdus)")) { Store.resetProgress(); UI.toast("Nouvelle aventure ! 🚀"); goto("#/carte"); }
      } }, "Tout recommencer")));

    c.appendChild(h("p", { class: "center muted mt" }, "L'Aventure des Savoirs · CE2 → CM1"));
  }

  /* ---------- Barre retour ---------- */
  function backBar(hash, label) {
    return h("div", { class: "h-row" },
      h("button", { class: "btn ghost small", onclick: () => goto(hash) }, "← " + (label || "Retour")),
      h("span", { class: "pill" }, Store.current().displayName));
  }

  /* Démarrage */
  boot();
})();
