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

  function screen() {
    appEl.innerHTML = "";
    appEl.classList.remove("carte-mode");
    document.querySelectorAll(".place-panel").forEach((e) => e.remove());
    appEl.scrollTop = 0; window.scrollTo(0, 0);
    return appEl;
  }

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
    const loginInstall = installBanner();
    if (loginInstall) c.appendChild(loginInstall);
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
  let placeMode = false;       // outil de placement des pierres
  let placePoints = [];        // coordonnées relevées en mode placement
  let daySession = null;       // progression de la journée en cours (étapes)
  let lastHeroNode = {};       // { [worldIndex]: nodeIdx } pour détecter une avancée du héros
  let mapAPI = null;           // API de la carte courante (ex. walkTo) pour piloter le héros depuis ailleurs
  // --- Éditeur de chemins (dans l'outil de placement) ---
  let editSeg = null;          // index du segment de chemin en édition (paths[editSeg]) ou null
  let editPath = null;         // copie de travail : [{x,y,jump}]
  let editNodes = null;        // copie de travail des pierres : [{x,y}] (mode repositionnement) ou null
  let selPoint = -1;           // point sélectionné dans editPath
  let mapCam = null;           // dernière position caméra (px) — évite de recentrer pendant l'édition
  let curMapW = null;          // monde actuellement affiché (pour les actions de l'éditeur)

  /* Jeton du héros :
     - si le monde a une planche d'animation (w.anim) → sprite animé (idle/walk/happy/sad/jump) ;
     - sinon image hero-*.png fixe si présente (fond transparent), sinon emoji. */
  function heroToken(w, size) {
    const wrap = h("div", { class: "hero-token", style: { width: size + "px", height: size + "px" } });
    if (w.anim) {
      const strip = h("div", { class: "hero-strip" });
      const emo = h("div", { class: "hero-emo", style: { fontSize: Math.round(size * 0.82) + "px", display: "none" } }, w.emoji);
      wrap.appendChild(strip); wrap.appendChild(emo);
      // si une planche est introuvable, on retombe sur l'emoji
      const probe = new Image();
      probe.onerror = () => { strip.style.display = "none"; emo.style.display = "block"; };
      probe.src = w.anim.idle.strip;
      wrap._setMode = (mode, opts) => setHeroMode(wrap, strip, w, mode, opts || {});
      wrap._setMode("idle");
      setHeroFacing(wrap, true);   // par défaut le dino regarde à droite (vers l'avant du parcours)
      return wrap;
    }
    const img = h("img", { class: "hero-img", src: w.sprite.replace("sprite-", "hero-"), alt: "" });
    const emo = h("div", { class: "hero-emo", style: { fontSize: Math.round(size * 0.82) + "px", display: "none" } }, w.emoji);
    img.addEventListener("error", () => { img.style.display = "none"; emo.style.display = "block"; });
    wrap.appendChild(img); wrap.appendChild(emo);
    return wrap;
  }

  /* Applique une animation au sprite. opts.once = jouer une fois puis revenir à opts.then (def. idle). */
  function setHeroMode(wrap, strip, w, mode, opts) {
    const a = w.anim[mode] || w.anim.idle;
    strip.style.width = (a.frames * 100) + "%";
    strip.style.backgroundImage = "url(" + a.strip + ")";
    strip.style.animation = "none";
    void strip.offsetWidth;                       // redémarre l'animation proprement
    const count = opts.once ? "1" : "infinite";
    // idle (ou anim avec yoyo:true) joué en aller-retour pour éviter le saut de la dernière à la première frame
    const dir = (!opts.once && (mode === "idle" || a.yoyo)) ? " alternate" : "";
    strip.style.animation = "spritestep " + a.dur + "s steps(" + a.frames + ") " + count + dir;
    clearTimeout(wrap._animT);
    if (opts.once) {
      wrap._animT = setTimeout(() => setHeroMode(wrap, strip, w, opts.then || "idle", {}), a.dur * 1000);
    }
  }

  /* Oriente le sprite. Le dessin regarde à DROITE par défaut : faceRight=true => pas de miroir. */
  function setHeroFacing(tok, faceRight) {
    tok.style.transform = faceRight ? "scaleX(1)" : "scaleX(-1)";
  }

  function updatePlacePanel() {
    const ta = document.getElementById("place-ta");
    if (ta) ta.value = "[" + placePoints.map((p) => "[" + p[0] + ", " + p[1] + "]").join(", ") + "]";
  }
  function makeDraggable(el, handle) {
    let dragging = false, sx = 0, sy = 0, ox = 0, oy = 0;
    handle.addEventListener("pointerdown", (e) => {
      dragging = true;
      const r = el.getBoundingClientRect();
      el.style.left = r.left + "px"; el.style.top = r.top + "px";
      el.style.right = "auto"; el.style.bottom = "auto";
      sx = e.clientX; sy = e.clientY; ox = r.left; oy = r.top;
      try { handle.setPointerCapture(e.pointerId); } catch (_) {}
      e.preventDefault();
    });
    handle.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      let nx = ox + (e.clientX - sx), ny = oy + (e.clientY - sy);
      nx = Math.max(0, Math.min(window.innerWidth - 60, nx));
      ny = Math.max(0, Math.min(window.innerHeight - 40, ny));
      el.style.left = nx + "px"; el.style.top = ny + "px";
    });
    const end = () => { dragging = false; };
    handle.addEventListener("pointerup", end);
    handle.addEventListener("pointercancel", end);
  }

  /* ---------- Éditeur de chemins ---------- */
  // Sérialise editPath en tableau JS (avec les "jump") prêt à coller dans program.js
  function pathToArray(ep) {
    const parts = [];
    ep.forEach((p) => { if (p.jump) parts.push('"jump"'); parts.push("[" + p.x + ", " + p.y + "]"); });
    return "[" + parts.join(", ") + "]";
  }
  // Charge le segment n de curMapW dans editPath (n=null pour quitter l'édition)
  function loadSegment(n) {
    editSeg = n; editNodes = null; selPoint = -1;
    if (n == null) { editPath = null; return; }
    const raw = (curMapW && curMapW.paths && curMapW.paths[n]) ? curMapW.paths[n] : [];
    editPath = []; let j = false;
    raw.forEach((it) => { if (it === "jump") { j = true; return; } editPath.push({ x: it[0], y: it[1], jump: j }); j = false; });
  }
  // Mode repositionnement des pierres : copie les nodes dans editNodes
  function loadNodes() {
    editSeg = null; editPath = null; selPoint = -1;
    editNodes = (curMapW ? curMapW.nodes : []).map((n) => ({ x: n[0], y: n[1] }));
  }
  function nodesToArray(en) { return "[" + en.map((p) => "[" + p.x + ", " + p.y + "]").join(", ") + "]"; }
  function ndSave() {
    if (!editNodes || !curMapW) return;
    curMapW.nodes = editNodes.map((p) => [p.x, p.y]);
    if (CV.saveNodesOverride) CV.saveNodesOverride(curMapW.key, curMapW.nodes);
    UI.toast("💾 Position des pierres enregistrée !");
  }
  function edToggleJump() { if (selPoint >= 0) { editPath[selPoint].jump = !editPath[selPoint].jump; renderCarte(); } }
  function edDelete() { if (selPoint >= 0) { editPath.splice(selPoint, 1); selPoint = Math.min(selPoint, editPath.length - 1); renderCarte(); } }
  function edInsert() {
    const i = selPoint >= 0 ? selPoint : editPath.length - 1;
    const a = editPath[i], b = editPath[i + 1];
    let np;
    if (a && b) np = { x: Math.round((a.x + b.x) / 2 * 10) / 10, y: Math.round((a.y + b.y) / 2 * 10) / 10, jump: false };
    else if (a) np = { x: Math.round((a.x + 3) * 10) / 10, y: a.y, jump: false };
    else np = { x: 50, y: 50, jump: false };
    editPath.splice(i + 1, 0, np); selPoint = i + 1; renderCarte();
  }
  function edAddEnd(x, y) { editPath.push({ x: x, y: y, jump: false }); selPoint = editPath.length - 1; renderCarte(); }
  // editPath -> format brut stocké dans paths[] (avec les "jump")
  function edToRaw(ep) { const raw = []; ep.forEach((p) => { if (p.jump) raw.push("jump"); raw.push([p.x, p.y]); }); return raw; }
  // Enregistre le chemin édité (persiste sur l'appareil via localStorage)
  function edSave() {
    if (editSeg == null || !editPath || !curMapW) return;
    if (!curMapW.paths) curMapW.paths = [];
    curMapW.paths[editSeg] = edToRaw(editPath);
    if (CV.savePathsOverride) CV.savePathsOverride(curMapW.key, curMapW.paths);
    UI.toast("💾 Chemin " + (editSeg + 1) + "→" + (editSeg + 2) + " enregistré !");
  }
  // Tous les chemins du monde, formatés pour coller dans program.js
  function pathsToText(paths) {
    return "[\n" + (paths || []).map((raw) => {
      const parts = []; (raw || []).forEach((it) => { if (it === "jump") parts.push('"jump"'); else parts.push("[" + it[0] + ", " + it[1] + "]"); });
      return "      [" + parts.join(", ") + "]";
    }).join(",\n") + "\n    ]";
  }

  function renderPlacePanel() {
    document.querySelectorAll(".place-panel").forEach((e) => e.remove());
    const handle = h("div", { class: "pp-handle" },
      h("span", {}, "⠿ Déplace ce panneau"),
      h("span", { class: "pp-mini", onclick: (e) => { e.stopPropagation(); document.querySelector(".place-panel").classList.toggle("mini"); } }, "▽"));

    // Sélecteur : placement libre / repositionner les pierres / éditer un chemin
    const nPaths = (curMapW && curMapW.paths) ? curMapW.paths.length : 0;
    const sel = h("select", { id: "seg-sel", onchange: (e) => {
      const v = e.target.value;
      if (v === "nodes") loadNodes();
      else loadSegment(v === "" ? null : +v);
      renderCarte();
    } });
    sel.appendChild(h("option", { value: "" }, "— Placement libre des pierres —"));
    { const o = h("option", { value: "nodes" }, "🪨 Repositionner les pierres"); if (editNodes) o.selected = true; sel.appendChild(o); }
    for (let i = 0; i < nPaths; i++) { const o = h("option", { value: String(i) }, "Chemin " + (i + 1) + "→" + (i + 2)); if (i === editSeg) o.selected = true; sel.appendChild(o); }

    let body;
    if (editNodes) {
      const ta = h("textarea", { id: "nodes-ta", readonly: "" }); ta.value = nodesToArray(editNodes);
      body = h("div", { class: "pp-body" },
        h("div", {}, "Éditer : "), sel,
        h("div", { class: "pp-hint" }, "Glisse les pierres pour les repositionner, puis Enregistre."),
        ta,
        h("div", { class: "btn-row", style: { marginTop: "6px" } },
          h("button", { class: "btn good small", onclick: ndSave }, "💾 Enregistrer"),
          h("button", { class: "btn ghost small", onclick: () => { const t = document.getElementById("nodes-ta"); t.select(); document.execCommand("copy"); } }, "📋 Copier"),
          h("button", { class: "btn small", onclick: () => { placeMode = false; editNodes = null; renderCarte(); } }, "✅ Fini")));
    } else if (editSeg != null && editPath) {
      const actions = selPoint >= 0
        ? h("div", { class: "btn-row", style: { marginTop: "6px" } },
            h("button", { class: "btn small", onclick: edToggleJump }, editPath[selPoint] && editPath[selPoint].jump ? "❌ retirer saut" : "🦘 saut"),
            h("button", { class: "btn ghost small", onclick: edInsert }, "➕ point après"),
            h("button", { class: "btn ghost small", onclick: edDelete }, "🗑️ supprimer"))
        : h("div", { class: "pp-hint" }, "Clique un point pour le sélectionner.");
      const ta = h("textarea", { id: "path-ta", readonly: "" }); ta.value = pathToArray(editPath);
      body = h("div", { class: "pp-body" },
        h("div", {}, "Éditer : "), sel,
        h("div", { class: "pp-hint" }, "Glisse les points • clique pour sélectionner • double-clic sur la carte = ajouter à la fin."),
        actions, ta,
        h("div", { class: "btn-row", style: { marginTop: "6px" } },
          h("button", { class: "btn good small", onclick: edSave }, "💾 Enregistrer"),
          h("button", { class: "btn ghost small", onclick: () => { const t = document.getElementById("path-ta"); t.select(); document.execCommand("copy"); } }, "📋 Ce chemin"),
          h("button", { class: "btn ghost small", onclick: () => { navigator.clipboard && navigator.clipboard.writeText(pathsToText(curMapW.paths)); UI.toast("📋 Tous les chemins copiés"); } }, "📋 Tous")),
        h("div", { class: "btn-row", style: { marginTop: "6px" } },
          h("button", { class: "btn small", onclick: () => { placeMode = false; loadSegment(null); renderCarte(); } }, "✅ Fini")));
    } else {
      body = h("div", { class: "pp-body" },
        h("div", {}, "Éditer : "), sel,
        h("div", {}, "📍 Double-clique sur la carte, dans l'ordre des 9 cases (la 9ᵉ = boss). Copie-moi cette ligne :"),
        h("textarea", { id: "place-ta", readonly: "" }),
        h("div", { class: "btn-row", style: { marginTop: "6px" } },
          h("button", { class: "btn ghost small", onclick: () => { placePoints.pop(); renderCarte(); } }, "↩️ Annuler"),
          h("button", { class: "btn ghost small", onclick: () => { placePoints = []; renderCarte(); } }, "🗑️ Effacer"),
          h("button", { class: "btn small", onclick: () => { placeMode = false; renderCarte(); } }, "✅ Fini")));
    }
    const panel = h("div", { class: "place-panel" }, handle, body);
    document.body.appendChild(panel);
    makeDraggable(panel, handle);
    if (editSeg == null) updatePlacePanel();
  }

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
    curMapW = w;
    UI.applyTheme(w.theme);
    // garde l'avatar de la barre de statut en phase avec le monde courant
    const curTheme = CV.worldByIndex(curWorldIndex).theme;
    if (state.theme !== curTheme) { state.theme = curTheme; Store.save({ silent: true }); }

    const c = screen();
    appEl.classList.add("carte-mode");

    const wrap = h("div", { class: "carte-screen" });
    const top = h("div", { class: "carte-top" });
    // Une seule barre, tout sur une ligne : avatar + prénom, navigation du monde, ⭐, 🔥.
    const avatar = { espace: "🧑‍🚀", pirates: "🏴‍☠️", chevaliers: "🛡️", dinosaure: "🦖", ulysse: "🏛️" }[state.theme] || "🦖";
    top.appendChild(h("div", { class: "carte-bar one" },
      h("div", { class: "cb-avatar" }, avatar),
      h("div", { class: "cb-name" }, state.displayName),
      h("button", { class: "world-arrow", disabled: mapViewIndex <= 0 ? "" : null,
        onclick: () => { if (mapViewIndex > 0) { mapViewIndex--; renderCarte(); } } }, "‹"),
      h("div", { class: "cb-world" },
        h("span", { class: "cb-wname" }, w.name),
        h("span", { class: "cb-wsub" }, mapViewIndex < curWorldIndex ? "✅" : (mapViewIndex + 1) + "/5")),
      h("button", { class: "world-arrow", disabled: mapViewIndex >= curWorldIndex ? "" : null,
        onclick: () => { if (mapViewIndex < curWorldIndex) { mapViewIndex++; renderCarte(); } } }, "›"),
      h("button", { class: "world-arrow", style: placeMode ? { background: "var(--gold)", color: "#000" } : null,
        title: "Placer les pierres", onclick: () => { placeMode = !placeMode; placePoints = []; editSeg = null; editPath = null; editNodes = null; selPoint = -1; mapCam = null; renderCarte(); } }, "📍"),
      h("div", { class: "chip gold" }, "⭐" + (state.stars || 0)),
      h("div", { class: "chip fire" }, "🔥" + (state.streak.count || 0))));
    const banner = installBanner();
    if (banner) top.appendChild(banner);
    wrap.appendChild(top);

    const viewport = h("div", { class: "map-viewport" });
    const layer = h("div", { class: "map-layer" });
    layer.appendChild(h("img", { class: "map-img", src: w.map, alt: w.name }));
    viewport.appendChild(layer);
    wrap.appendChild(viewport);
    c.appendChild(wrap);

    setupMap(viewport, layer, w, mapViewIndex, curLevel, curWorldIndex, state);
  }

  function setupMap(viewport, layer, w, worldIndex, curLevel, curWorldIndex, state) {
    // Carte agrandie (≈ ×2) pour plus de détail et de scroll.
    const vw = viewport.clientWidth || Math.min(window.innerWidth, 720);
    const vh = viewport.clientHeight || (window.innerHeight - 140);
    const ratio = 1408 / 768;
    const zoom = 1.6;
    const lh = Math.round(vh * zoom);
    const lw = Math.round(lh * ratio);
    layer.style.width = lw + "px";
    layer.style.height = lh + "px";

    const worldDone = worldIndex < curWorldIndex;
    const curNodeIdx = worldIndex === curWorldIndex ? CV.nodeIndexOfLevel(curLevel) : (worldDone ? 8 : -1);

    // Pierres
    w.nodes.forEach((n, i) => {
      const level = CV.levelNumber(worldIndex, i);
      const isBoss = i === 8;
      const dp = (state.dayProgress || {})[level];
      const done = dp && dp.done;
      const stars = done ? (dp.stars || 1) : 0;
      const isCurrent = level === curLevel;
      const locked = level > curLevel;
      // En mode repositionnement, les pierres sont remplacées par des poignées déplaçables.
      if (placeMode && editNodes) return;
      // Hors outil de placement : on n'affiche que les pierres déverrouillées.
      // En mode placement : on affiche TOUT (repère pour tracer les chemins).
      if (locked && !placeMode) return;
      let kind = "open";
      if (locked) kind = "locked";
      else if (isBoss) kind = "boss";
      else if (done) kind = stars <= 1 ? "cracked" : "done";
      const cls = "stone" + (locked ? " locked" : "") + (isBoss ? " boss" : "") + (isCurrent ? " current" : "");
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

    // ---- Chemins entre les pierres (w.paths[i] = tracé du nœud i au nœud i+1) ----
    // Le DERNIER point d'un tracé = la position de repos du dino à côté de la pierre d'arrivée.
    const parsePts = (raw) => { const out = []; let pend = false; (raw || []).forEach((it) => {
      if (it === "jump") { pend = true; return; } out.push({ pt: it, jump: pend }); pend = false; }); return out; };
    const restPos = (i) => { const pp = (w.paths && i - 1 >= 0) ? parsePts(w.paths[i - 1]) : []; return pp.length ? pp[pp.length - 1].pt : w.nodes[i]; };
    const segForward = (a) => { const pp = parsePts(w.paths && w.paths[a]); return pp.length ? pp.map((e) => ({ to: e.pt, jump: e.jump })) : [{ to: w.nodes[a + 1], jump: false }]; };
    const segBackward = (a) => { const pp = parsePts(w.paths && w.paths[a - 1]); if (!pp.length) return [{ to: w.nodes[a - 1], jump: false }];
      // On rejoint d'abord le DERNIER point du chemin (juste avant l'obstacle), puis on parcourt à l'envers.
      const legs = [{ to: pp[pp.length - 1].pt, jump: false }];
      for (let k = pp.length - 1; k >= 1; k--) legs.push({ to: pp[k - 1].pt, jump: pp[k].jump });
      return legs; };
    const buildRoute = (fromIdx, toIdx) => { const legs = [];
      if (toIdx > fromIdx) for (let a = fromIdx; a < toIdx; a++) legs.push.apply(legs, segForward(a));
      else for (let a = fromIdx; a > toIdx; a--) legs.push.apply(legs, segBackward(a));
      return legs; };

    // Personnage : posé à sa position de repos (à côté de la pierre courante)
    const heroNodeIdx = curNodeIdx >= 0 ? curNodeIdx : 0;
    const heroStart = restPos(heroNodeIdx);
    const tok = heroToken(w, 64);
    const hero = h("div", { class: "hero-sprite" + (w.anim ? " anim" : ""), style: { left: heroStart[0] + "%", top: heroStart[1] + "%" } }, tok);
    layer.appendChild(hero);

    // ---- Caméra : translation de la map (centrée sur un point, avec pan animé possible) ----
    const minTx = Math.min(0, vw - lw), minTy = Math.min(0, vh - lh);
    let tx = 0, ty = 0;
    const apply = () => { layer.style.transform = "translate(" + tx + "px," + ty + "px)"; };
    const camFor = (pt) => { const cx = (pt[0] / 100) * lw, cy = (pt[1] / 100) * lh; return [clamp(vw / 2 - cx, minTx, 0), clamp(vh / 2 - cy, minTy, 0)]; };
    const setCam = (pt, sec) => { [tx, ty] = camFor(pt); layer.style.transition = sec ? ("transform " + sec + "s linear") : "none"; apply(); };

    // Anime le héros le long d'une liste de tronçons {to:[x,y], jump:bool}. La caméra suit.
    const walkLegs = (legs, fromPt) => {
      let cur = fromPt;
      const step = (idx) => {
        if (idx >= legs.length) { setHeroFacing(tok, true); tok._setMode("idle"); return; }
        const pt = legs[idx].to, dx = pt[0] - cur[0], dy = pt[1] - cur[1];
        if (Math.abs(dx) > 0.3) setHeroFacing(tok, dx > 0);
        const next = () => { cur = pt; step(idx + 1); };
        if (legs[idx].jump) {
          // Saut : le dino s'accroupit (s'arrête) puis bondit en suivant une parabole.
          tok._setMode("jump", { once: true, then: "walk" });
          hero.style.transition = "none";
          const durMs = (w.anim.jump && w.anim.jump.dur ? w.anim.jump.dur : 0.7) * 1000;
          const crouchMs = Math.min(180, durMs * 0.3), arcMs = durMs - crouchMs;
          const peak = Math.max(5, Math.min(11, Math.hypot(dx, dy) * 1.2));  // hauteur de la cloche
          setTimeout(() => {
            const frames = [];
            for (let k = 0; k <= 16; k++) { const t = k / 16; frames.push({
              left: (cur[0] + dx * t) + "%", top: (cur[1] + dy * t - peak * 4 * t * (1 - t)) + "%" }); }
            const anim = hero.animate(frames, { duration: arcMs, easing: "linear" });
            setCam(pt, arcMs / 1000);
            anim.onfinish = () => { hero.style.left = pt[0] + "%"; hero.style.top = pt[1] + "%"; try { anim.cancel(); } catch (_) {} next(); };
          }, crouchMs);
        } else {
          if (Math.hypot(dx, dy) < 0.25) { next(); return; }   // tronçon quasi nul : on passe
          tok._setMode("walk");
          const dur = Math.max(0.28, Math.min(1.4, Math.hypot(dx, dy) * 0.06));
          hero.style.transition = "left " + dur + "s linear, top " + dur + "s linear";
          void hero.offsetWidth;
          hero.style.left = pt[0] + "%"; hero.style.top = pt[1] + "%";
          setCam(pt, dur);
          setTimeout(next, dur * 1000);
        }
      };
      step(0);
    };

    let heroVisualIdx = heroNodeIdx;   // nœud où se trouve visuellement le héros

    // Le héros vient-il d'avancer d'une pierre (niveau réussi) ? -> joie puis marche le long du chemin
    const prev = lastHeroNode[worldIndex];
    const advanced = tok._setMode && prev != null && prev >= 0 && curNodeIdx > prev && w.nodes[prev];
    lastHeroNode[worldIndex] = curNodeIdx;
    if (advanced) {
      const startPt = restPos(prev);
      hero.style.transition = "none"; hero.style.left = startPt[0] + "%"; hero.style.top = startPt[1] + "%";
      setCam(startPt, 0); void hero.offsetWidth;
      tok._setMode("happy", { once: true });
      const legs = buildRoute(prev, curNodeIdx);
      setTimeout(() => walkLegs(legs, startPt), (w.anim.happy.dur || 0.6) * 1000);
    } else if (placeMode && mapCam) {
      // en mode édition, on garde la position de caméra (pas de recentrage à chaque retouche)
      tx = clamp(mapCam[0], minTx, 0); ty = clamp(mapCam[1], minTy, 0); apply();
    } else {
      setCam(heroStart, 0);
    }

    // API : rejoindre une pierre en suivant les chemins (à contresens si elle est derrière)
    mapAPI = {
      walkTo: (targetIdx) => {
        if (!tok._setMode || targetIdx < 0 || targetIdx === heroVisualIdx) return;
        const fromPt = [parseFloat(hero.style.left), parseFloat(hero.style.top)];
        const legs = buildRoute(heroVisualIdx, targetIdx);
        heroVisualIdx = targetIdx;
        walkLegs(legs, fromPt);
      }
    };

    // Outil de placement / éditeur de chemins
    if (placeMode) {
      const PC = ["#ff5c7c", "#ffd23f", "#2ec4b6", "#7c5cff", "#ff9f1c", "#48b1c4", "#9eff5c", "#ff7ce0"];
      const pctOf = (e) => { const r = layer.getBoundingClientRect();
        return [Math.max(0, Math.min(100, Math.round((e.clientX - r.left) / r.width * 1000) / 10)),
                Math.max(0, Math.min(100, Math.round((e.clientY - r.top) / r.height * 1000) / 10))]; };

      // Chemins existants en lecture seule (on saute celui en cours d'édition)
      if (w.paths) {
        let svg = '<svg class="path-lines" viewBox="0 0 100 100" preserveAspectRatio="none">';
        w.paths.forEach((raw, pi) => { if (pi === editSeg) return;
          const chain = [w.nodes[pi]].concat(parsePts(raw).map((p) => p.pt), [w.nodes[pi + 1]]);
          svg += '<path d="' + chain.map((p, k) => (k ? "L" : "M") + p[0] + " " + p[1]).join(" ") + '" fill="none" stroke="' + PC[pi % PC.length] + '" stroke-width="0.4" stroke-dasharray="1.2 0.8" opacity="0.75"/>';
        });
        layer.appendChild(svgEl(svg + "</svg>"));
        w.paths.forEach((raw, pi) => { if (pi === editSeg) return;
          const col = PC[pi % PC.length], pts = parsePts(raw);
          pts.forEach((p, wi) => layer.appendChild(
            h("div", { class: "path-marker" + (p.jump ? " jump" : ""), style: { left: p.pt[0] + "%", top: p.pt[1] + "%", "--pc": col } }, (p.jump ? "J" : "") + (wi + 1))));
          if (pts.length) layer.appendChild(
            h("div", { class: "path-label", style: { left: pts[0].pt[0] + "%", top: pts[0].pt[1] + "%", background: col } }, (pi + 1) + "→" + (pi + 2)));
        });
      }

      if (editSeg != null && editPath) {
        // ---- Éditeur live du segment sélectionné ----
        const col = PC[editSeg % PC.length];
        const line = svgEl('<svg class="path-lines edit-line" viewBox="0 0 100 100" preserveAspectRatio="none"><path fill="none" stroke="' + col + '" stroke-width="0.6" stroke-dasharray="1.4 0.9"/></svg>');
        const linePath = line.querySelector("path");
        const redrawLine = () => { const chain = [w.nodes[editSeg]].concat(editPath.map((p) => [p.x, p.y]), [w.nodes[editSeg + 1]]);
          linePath.setAttribute("d", chain.map((p, k) => (k ? "L" : "M") + p[0] + " " + p[1]).join(" ")); };
        layer.appendChild(line); redrawLine();
        editPath.forEach((p, i) => {
          const hd = h("div", { class: "edit-handle" + (p.jump ? " jump" : "") + (i === selPoint ? " sel" : ""), style: { left: p.x + "%", top: p.y + "%", "--pc": col } }, (p.jump ? "J" : "") + (i + 1));
          hd.addEventListener("pointerdown", (e) => {
            e.stopPropagation(); e.preventDefault();
            if (selPoint !== i) { selPoint = i; renderPlacePanel(); document.querySelectorAll(".edit-handle.sel").forEach((el) => el.classList.remove("sel")); hd.classList.add("sel"); }
            try { hd.setPointerCapture(e.pointerId); } catch (_) {}
            const move = (ev) => { const [nx, ny] = pctOf(ev); editPath[i].x = nx; editPath[i].y = ny; hd.style.left = nx + "%"; hd.style.top = ny + "%"; redrawLine(); const ta = document.getElementById("path-ta"); if (ta) ta.value = pathToArray(editPath); };
            const up = () => { try { hd.releasePointerCapture(e.pointerId); } catch (_) {} hd.removeEventListener("pointermove", move); hd.removeEventListener("pointerup", up); };
            hd.addEventListener("pointermove", move); hd.addEventListener("pointerup", up);
          });
          layer.appendChild(hd);
        });
        // double-clic sur la carte = ajouter un point à la fin du chemin édité
        viewport.addEventListener("dblclick", (e) => { const [x, y] = pctOf(e); edAddEnd(x, y); });
      } else if (editNodes) {
        // ---- Repositionnement des pierres ----
        const line = svgEl('<svg class="path-lines" viewBox="0 0 100 100" preserveAspectRatio="none"><path fill="none" stroke="rgba(255,255,255,.45)" stroke-width="0.4" stroke-dasharray="1 1"/></svg>');
        const linePath = line.querySelector("path");
        const redrawLine = () => { linePath.setAttribute("d", editNodes.map((p, k) => (k ? "L" : "M") + p.x + " " + p.y).join(" ")); };
        layer.appendChild(line); redrawLine();
        editNodes.forEach((p, i) => {
          const hd = h("div", { class: "edit-handle" + (i === selPoint ? " sel" : ""), style: { left: p.x + "%", top: p.y + "%", "--pc": "#ffd23f" } }, i === 8 ? "👑" : String(i + 1));
          hd.addEventListener("pointerdown", (e) => {
            e.stopPropagation(); e.preventDefault();
            selPoint = i; document.querySelectorAll(".edit-handle.sel").forEach((el) => el.classList.remove("sel")); hd.classList.add("sel");
            try { hd.setPointerCapture(e.pointerId); } catch (_) {}
            const move = (ev) => { const [nx, ny] = pctOf(ev); editNodes[i].x = nx; editNodes[i].y = ny; hd.style.left = nx + "%"; hd.style.top = ny + "%"; redrawLine(); const ta = document.getElementById("nodes-ta"); if (ta) ta.value = nodesToArray(editNodes); };
            const up = () => { try { hd.releasePointerCapture(e.pointerId); } catch (_) {} hd.removeEventListener("pointermove", move); hd.removeEventListener("pointerup", up); };
            hd.addEventListener("pointermove", move); hd.addEventListener("pointerup", up);
          });
          layer.appendChild(hd);
        });
      } else {
        // Placement libre des pierres (ancien comportement)
        placePoints.forEach((p, i) => layer.appendChild(h("div", { class: "place-marker", style: { left: p[0] + "%", top: p[1] + "%" } }, String(i + 1))));
        viewport.addEventListener("dblclick", (e) => { const [x, y] = pctOf(e); placePoints.push([x, y]);
          layer.appendChild(h("div", { class: "place-marker", style: { left: x + "%", top: y + "%" } }, String(placePoints.length))); updatePlacePanel(); });
      }
      renderPlacePanel();
    }

    // Glissement (drag) au doigt / souris.
    // IMPORTANT : on ne capture le pointeur QUE lorsqu'un vrai glissement
    // démarre, sinon un simple tap sur une pierre serait « avalé » par la carte.
    let dragging = false, captured = false, sx = 0, sy = 0, stx = 0, sty = 0;
    viewport.addEventListener("pointerdown", (e) => {
      dragging = true; captured = false; mapDragged = false;
      layer.style.transition = "none";            // stoppe un éventuel pan caméra en cours
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
      if (captured) { tx = clamp(stx + dx, minTx, 0); ty = clamp(sty + dy, minTy, 0); apply(); mapCam = [tx, ty]; }
    });
    const end = () => { dragging = false; captured = false; viewport.classList.remove("dragging"); };
    viewport.addEventListener("pointerup", end);
    viewport.addEventListener("pointercancel", end);
    viewport.addEventListener("pointerleave", end);
  }

  /* Petit panneau d'une pierre (au tap) */
  function openNodeSheet(level) {
    // le héros rejoint la pierre cliquée en suivant les chemins (à contresens si besoin)
    if (mapAPI && mapAPI.walkTo) mapAPI.walkTo(CV.nodeIndexOfLevel(level));
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
    const lv = CV.getLevel(level);
    if (lv.isBoss) { finishLevel(lv, 3, null, null, true); return; }
    daySession = null;
    finishDay(lv, 3, null, null);
  }

  /* ---------- Ouvrir un niveau ---------- */
  function openLevel(level) {
    const lv = CV.getLevel(level);
    if (!lv) return goto("#/carte");
    const state = Store.current();
    if (lv.level > (state.currentDay || 1)) { goto("#/carte"); return; }
    UI.applyTheme(lv.theme);
    if (lv.isBoss) return playBoss(lv);
    renderDayProgram(level);
  }

  /* ---------- Programme du jour (écran d'étapes) ---------- */
  function renderDayProgram(level) {
    const lv = CV.getLevel(level);
    const plan = CV.dayPlan(level);
    if (!plan) return goto("#/carte");
    if (!daySession || daySession.level !== level) {
      daySession = { level, plan, done: plan.steps.map(() => null), correct: 0, total: 0 };
    }
    const c = screen();
    c.appendChild(backBar("#/carte", "Carte"));
    c.appendChild(h("h2", { class: "section-title" }, "📋 Programme du jour"));
    c.appendChild(h("p", { class: "muted", style: { marginTop: "-8px" } }, lv.worldName + " · fais chaque étape dans l'ordre"));

    const firstTodo = daySession.done.findIndex((d) => !d);
    daySession.plan.steps.forEach((s, i) => {
      const res = daySession.done[i];
      const isCurrent = firstTodo === i;
      const locked = firstTodo >= 0 && i > firstTodo;
      const card = h("div", { class: "card row", style: { gap: "14px", cursor: locked ? "default" : "pointer", opacity: locked ? ".5" : "1" },
        onclick: () => { if (!locked) runStep(i); } },
        h("div", { style: { fontSize: "30px" } }, s.icon),
        h("div", { style: { flex: "1" } },
          h("div", { style: { fontWeight: "bold", color: "var(--ink)" } }, s.label),
          h("div", { class: "muted", style: { fontSize: "13px" } }, stepDesc(s))),
        res ? h("div", { style: { fontSize: "18px" } }, "✅ " + res.correct + "/" + res.total)
            : isCurrent ? h("div", { class: "btn small" }, "Jouer →")
            : h("div", { style: { fontSize: "20px" } }, "🔒"));
      c.appendChild(card);
    });

    if (daySession.done.every(Boolean)) {
      c.appendChild(h("button", { class: "btn big gold block mt", onclick: () => {
        finishDay(lv, Game.starsForScore(daySession.correct, daySession.total), daySession.correct, daySession.total);
      } }, "🏁 Terminer la journée"));
    }
    c.appendChild(h("button", { class: "btn debug block mt", onclick: () => skipLevel(level) }, "🔓 Débloquer (test)"));
  }

  function stepDesc(s) {
    if (s.kind === "dictee") { const n = s.count || 1; return n + " phrase" + (n > 1 ? "s" : "") + " à écouter et écrire"; }
    if (s.kind === "probleme") return "Lis bien la consigne et résous";
    const mod = CV.getModule(s.moduleId);
    return mod ? mod.title : "";
  }

  function programBack() {
    return h("div", { class: "h-row" },
      h("button", { class: "btn ghost small", onclick: () => renderDayProgram(daySession.level) }, "← Programme"),
      h("span", { class: "pill" }, Store.current().displayName));
  }

  function runStep(i) {
    const s = daySession.plan.steps[i];
    if (s.kind === "lesson") return runLessonStep(i, s);
    return runExerciseStep(i, s, null);
  }

  function runLessonStep(i, s) {
    const mod = CV.getModule(s.moduleId);
    const c = screen();
    c.appendChild(programBack());
    const card = h("div", { class: "card" });
    card.appendChild(h("div", { class: "lesson-icon" }, mod.icon));
    card.appendChild(h("h2", { class: "center" }, mod.title));
    card.appendChild(h("p", {}, mod.lesson.intro));
    const ul = h("ul", { class: "lesson-points" });
    mod.lesson.points.forEach((p) => ul.appendChild(h("li", { html: p })));
    card.appendChild(ul);
    if (mod.lesson.example) card.appendChild(h("div", { class: "lesson-example", html: "📌 " + mod.lesson.example }));
    if (mod.lesson.tip) card.appendChild(h("div", { class: "lesson-tip", html: mod.lesson.tip }));
    card.appendChild(h("button", { class: "btn big block mt", onclick: () => runExerciseStep(i, s, mod) }, "✏️ Au défi ! →"));
    c.appendChild(card);
  }

  function runExerciseStep(i, s, mod) {
    const c = screen();
    c.appendChild(programBack());
    c.appendChild(h("h2", { class: "section-title" }, s.icon + " " + s.label));
    const box = h("div", { class: "card" });
    c.appendChild(box);
    const exercises = CV.exercisesForStep(s);
    CV.Engine.run(box, exercises, { onComplete: ({ correct, total }) => finishStep(i, s, mod, correct, total) });
  }

  function finishStep(i, s, mod, correct, total) {
    daySession.done[i] = { correct, total };
    daySession.correct += correct; daySession.total += total;
    const state = Store.current();
    if (mod) Game.awardModule(state, mod, correct, total);
    if (s.kind === "dictee") { state.flags = state.flags || {}; state.flags.dicteeDone = true; }
    Store.save();
    renderDayProgram(daySession.level);
  }

  function finishDay(lv, stars, correct, total) {
    const state = Store.current();
    const r = Game.completeDay(state, lv, stars);
    Store.save();
    mapViewIndex = null; daySession = null;
    const c = screen();
    UI.victory(c, {
      emoji: stars === 3 ? "🌟" : "🎉",
      title: "Journée réussie !",
      stars: stars,
      subtitle: correct != null ? (correct + " / " + total + " bonnes réponses sur la journée") : "Bravo, champion !",
      badges: r.newBadges || [],
      cta: "Retour à la carte 🗺️",
      onContinue: () => goto("#/carte")
    });
  }

  /* ---------- Boss : combat héros vs boss ---------- */
  const BOSS = {
    dinosaure:  { emoji: "🦖", name: "le T-Rex", hp: 6 },
    ulysse:     { emoji: "🐲", name: "le Minotaure", hp: 6 },
    chevaliers: { emoji: "🐉", name: "le Dragon", hp: 7 },
    pirate:     { emoji: "☠️", name: "le Capitaine Fantôme", hp: 7 },
    espace:     { emoji: "👾", name: "l'Alien", hp: 8 }
  };

  function playBoss(lv) {
    const state = Store.current();
    const cfg = BOSS[lv.world] || { emoji: "👾", name: "le Boss", hp: 6 };
    const pool = CV.buildBossExercises(lv, 16);
    const c = screen();
    c.appendChild(backBar("#/carte", "Carte"));
    c.appendChild(h("h2", { class: "section-title" }, "👑 Boss — " + lv.worldName));
    if (!pool.length) { c.appendChild(h("div", { class: "card" }, h("p", {}, "Termine d'abord les leçons de ce monde !"))); return; }

    let heroHP = 3, bossHP = cfg.hp, qi = 0;
    const w = CV.worldByIndex(CV.worldIndexOfLevel(lv.level));
    const heroTok = heroToken(w, 84);
    const heroEl = h("div", { class: "fighter hero" }, heroTok);
    const heroAnim = (mode, opts) => { if (heroTok._setMode) heroTok._setMode(mode, opts); };
    const bossEl = h("div", { class: "fighter boss" }, cfg.emoji);
    const heroHpEl = h("div", { class: "hp" });
    const bossHpEl = h("div", { class: "hp" });
    const scene = h("div", { class: "combat-scene" },
      h("div", { class: "fighter-col" }, heroHpEl, heroEl, h("div", { class: "fname" }, state.displayName)),
      h("div", { class: "combat-vs" }, "⚔️"),
      h("div", { class: "fighter-col" }, bossHpEl, bossEl, h("div", { class: "fname" }, cfg.name)));
    c.appendChild(scene);
    const intro = h("p", { class: "center muted", style: { marginTop: "-4px" } }, "Réponds juste pour attaquer ! Une erreur et c'est toi qui prends un coup. 3 erreurs = recommencer.");
    c.appendChild(intro);
    const qbox = h("div", { class: "card" });
    c.appendChild(qbox);
    c.appendChild(h("button", { class: "btn debug block mt", onclick: () => skipLevel(lv.level) }, "🔓 Débloquer (test)"));

    function updateHP() {
      heroHpEl.textContent = "❤️".repeat(Math.max(0, heroHP)) + "🤍".repeat(Math.max(0, 3 - heroHP));
      bossHpEl.textContent = "💚".repeat(Math.max(0, bossHP)) + "🖤".repeat(Math.max(0, cfg.hp - bossHP));
    }
    function fx(emo) { const f = h("div", { class: "combat-hitfx" }, emo); scene.appendChild(f); setTimeout(() => f.remove(), 600); }

    updateHP();
    nextQ();

    function nextQ() {
      if (bossHP <= 0) return win();
      if (heroHP <= 0) return lose();
      const ex = pool[qi % pool.length]; qi++;
      CV.Engine.run(qbox, [ex], {
        compact: true,
        onComplete: ({ correct }) => {
          if (correct) { bossHP--; heroEl.classList.add("attack-r"); bossEl.classList.add("hit"); fx("💥"); heroAnim("happy", { once: true }); }
          else { heroHP--; bossEl.classList.add("attack-l"); heroEl.classList.add("hit"); fx("💢"); heroAnim("sad", { once: true }); }
          updateHP();
          setTimeout(() => { heroEl.className = "fighter hero"; bossEl.className = "fighter boss"; nextQ(); }, 850);
        }
      });
    }

    function win() {
      const stars = Math.max(1, heroHP);
      heroAnim("happy", { once: true });
      UI.confetti();
      UI.toast(cfg.name + " est vaincu ! 🎉");
      setTimeout(() => finishLevel(lv, stars, cfg.hp, cfg.hp, false), 700);
    }

    function lose() {
      const cc = screen();
      cc.appendChild(h("div", { class: "card center" },
        h("div", { style: { fontSize: "72px" } }, cfg.emoji),
        h("h2", {}, cfg.name + " t'a vaincu… 😵"),
        h("p", { class: "muted" }, "Pas grave, les héros réessaient toujours ! Tu vas y arriver."),
        h("button", { class: "btn big block mt", onclick: () => playBoss(lv) }, "↻ Réessayer le combat"),
        h("button", { class: "btn ghost block mt", onclick: () => goto("#/carte") }, "← Retour à la carte")));
    }
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
      statLine("Meilleure série", "🔥 " + (state.streak.count || 0) + " jours")
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
