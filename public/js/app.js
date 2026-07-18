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
    // Service worker (hors-ligne).
    // En local (dev), on le DÉSINSTALLE et on vide ses caches : sinon un vieux worker
    // continue de servir d'anciens js/css et les modifications n'apparaissent jamais.
    if ("serviceWorker" in navigator) {
      const dev = location.hostname === "localhost" || location.hostname === "127.0.0.1";
      if (dev) {
        navigator.serviceWorker.getRegistrations()
          .then((rs) => rs.forEach((r) => r.unregister())).catch(() => {});
        if (window.caches) caches.keys().then((ks) => ks.forEach((k) => caches.delete(k))).catch(() => {});
      } else {
        navigator.serviceWorker.register("sw.js").catch(() => {});
      }
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
    if (tab === "revisions") return renderRevisions();
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
    const classInput = h("select", { id: "login-class" }, h("option", { value: "CE2" }, "CE2 → CM1"));

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
  let plutonAnnounce = false;  // les 8 planètes viennent d'être jouées → annonce à l'ouverture de la carte

  /* Jeton du héros :
     - si le monde a une planche d'animation (w.anim) → sprite animé (idle/walk/happy/sad/jump) ;
     - sinon image hero-*.png fixe si présente (fond transparent), sinon emoji. */
  /* Précharge toutes les planches d'un jeu d'animations.
     Sans ça, la 1re fois qu'on passe sur une pose encore jamais affichée (la marche, par ex.),
     l'image n'est pas encore téléchargée et le sprite clignote — il disparaît une frame. */
  const preloaded = [];
  function preloadAnim(anim) {
    if (!anim || anim._preloaded) return;
    anim._preloaded = true;
    Object.keys(anim).forEach((mode) => {
      const a = anim[mode];
      if (!a || !a.strip) return;
      const im = new Image(); im.src = a.strip; preloaded.push(im);   // gardé en vie : sinon le GC peut l'oublier
    });
  }

  /* Objet animé des mini-jeux (nuage qui se dissipe, astéroïde qui explose, étoile qu'on ramasse).
     a = { strip, frames, dur, cell:[larg, haut] }. Au repos il reste figé sur la 1re image ;
     ._play({freeze:true}) joue l'animation UNE fois et la fige sur la dernière. */
  function propToken(a, height) {
    preloadAnim({ o: a });
    const ratio = a.cell ? a.cell[0] / a.cell[1] : 1;
    const wrap = h("div", { class: "prop-token", style: { width: Math.round(height * ratio) + "px", height: height + "px" } });
    const strip = h("div", { class: "hero-strip" });
    strip.style.width = (a.frames * 100) + "%";
    strip.style.backgroundImage = "url(" + a.strip + ")";
    wrap.appendChild(strip);
    wrap._play = (opts) => setSpriteMode(wrap, strip, { idle: a }, "idle", opts || {});
    // Remet l'objet intact (1re image, aucune animation) — une plateforme qui repousse, par ex.
    wrap._reset = () => { clearTimeout(wrap._animT); strip.style.animation = "none"; strip.style.transform = ""; };
    wrap._dur = a.dur;
    return wrap;
  }

  /* Jeton d'un véhicule des mini-jeux (le rover de Mars) : mêmes poses qu'un héros,
     mais son jeu d'animations vient de la planète, pas du monde. size = HAUTEUR. */
  function vehicleToken(anim, size) {
    preloadAnim(anim);
    const cell = anim.idle && anim.idle.cell;
    const wide = cell ? Math.round(size * cell[0] / cell[1]) : size;
    const wrap = h("div", { class: "hero-token", style: { width: wide + "px", height: size + "px" } });
    const strip = h("div", { class: "hero-strip" });
    wrap.appendChild(strip);
    wrap._setMode = (mode, o) => setSpriteMode(wrap, strip, anim, mode, o || {});
    wrap._setMode("idle");
    return wrap;
  }

  /* opts.map = true → utilise w.mapAnim si le monde en a une (l'espace se déplace en fusée
     sur la carte, mais en astronaute dans les mini-jeux des planètes). */
  function heroToken(w, size, opts) {
    opts = opts || {};
    const anim = (opts.map && w.mapAnim) || w.anim;
    // Les cellules ne sont pas toujours carrées (la fusée fait 229×111) : on garde le ratio.
    const cell = anim && anim.idle && anim.idle.cell;
    const wide = cell ? Math.round(size * cell[0] / cell[1]) : size;
    const wrap = h("div", { class: "hero-token", style: { width: wide + "px", height: size + "px" } });
    if (anim) {
      preloadAnim(anim);
      const strip = h("div", { class: "hero-strip" });
      const emo = h("div", { class: "hero-emo", style: { fontSize: Math.round(size * 0.82) + "px", display: "none" } }, w.emoji);
      wrap.appendChild(strip); wrap.appendChild(emo);
      // si une planche est introuvable, on retombe sur l'emoji
      const probe = new Image();
      probe.onerror = () => { strip.style.display = "none"; emo.style.display = "block"; };
      probe.src = anim.idle.strip;
      wrap._setMode = (mode, o) => setSpriteMode(wrap, strip, anim, mode, o || {});
      wrap._setMode("idle");
      setHeroFacing(wrap, true);   // par défaut le sprite regarde à droite (vers l'avant du parcours)
      return wrap;
    }
    const img = h("img", { class: "hero-img", src: w.sprite.replace("sprite-", "hero-"), alt: "" });
    const emo = h("div", { class: "hero-emo", style: { fontSize: Math.round(size * 0.82) + "px", display: "none" } }, w.emoji);
    img.addEventListener("error", () => { img.style.display = "none"; emo.style.display = "block"; });
    wrap.appendChild(img); wrap.appendChild(emo);
    return wrap;
  }

  /* Oriente le sprite. Le dessin regarde à DROITE par défaut : faceRight=true => pas de miroir. */
  function setHeroFacing(tok, faceRight) {
    tok.style.transform = faceRight ? "scaleX(1)" : "scaleX(-1)";
  }

  /* Oriente un sprite qui suit la courbe du chemin : la pointe de la fusée pointe vers là où elle va,
     sur 360° (elle suit les orbites, y compris vers le haut et vers le bas).
     dxPx/dyPx = direction en PIXELS (pas en %) : la carte n'est pas carrée, l'angle serait faux sinon.
     On accumule l'angle au lieu de le remettre à plat, pour qu'elle tourne par le plus court chemin
     et ne fasse jamais de tête-à-queue à la traversée de ±180°. */
  function setHeroAngle(tok, dxPx, dyPx, upright) {
    if (Math.hypot(dxPx, dyPx) < 1) return;                 // tronçon trop court : on garde l'angle courant
    const target = Math.atan2(dyPx, dxPx) * 180 / Math.PI;
    // Un personnage (le surfeur de Saturne) ne doit JAMAIS se retrouver la tête en bas :
    // quand la pente le fait partir vers la gauche, on le retourne au lieu de continuer à pivoter.
    if (upright) {
      const flip = target > 90 || target < -90;
      tok.style.transform = "rotate(" + target.toFixed(1) + "deg)" + (flip ? " scaleY(-1)" : "");
      return;
    }
    // La fusée, elle, tourne bien sur 360° : on cumule l'angle pour qu'elle prenne toujours
    // le plus court chemin et ne fasse pas de tête-à-queue au passage de ±180°.
    const prev = tok._deg || 0;
    let delta = (target - prev) % 360;
    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;
    tok._deg = prev + delta;
    tok.style.transform = "rotate(" + tok._deg.toFixed(1) + "deg)";
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
    // À l'ouverture, on revient sur le monde où se trouve le héros (sauvegardé), pas forcément
    // le dernier débloqué : si on rejoue un ancien monde, la carte y reste.
    if (mapViewIndex === null) {
      const hw = state.heroWorld;
      mapViewIndex = (hw != null && hw <= curWorldIndex) ? hw : curWorldIndex;
    }
    if (mapViewIndex > curWorldIndex) mapViewIndex = curWorldIndex;
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

    if (plutonAnnounce) { plutonAnnounce = false; setTimeout(showPlutonUnlocked, 500); }
  }

  /* Les 8 planètes ont été jouées : Pluton s'ouvre. */
  function showPlutonUnlocked() {
    UI.confetti();
    const backdrop = h("div", { class: "sheet-backdrop", onclick: closeSheet });
    const sheet = h("div", { class: "node-sheet center" },
      h("div", { style: { fontSize: "62px" } }, "🪐"),
      h("h2", {}, "Pluton est débloquée !"),
      h("p", { class: "muted" }, "Tu as exploré les 8 planètes du système solaire. Le dernier voyage t'attend, tout au bout : Pluton !"),
      h("button", { class: "btn big gold block mt", onclick: closeSheet }, "En route ! 🚀"));
    appEl.appendChild(backdrop);
    appEl.appendChild(sheet);
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
    // Monde en ordre libre (l'Espace) : pas de pierres ni de chemins — ce sont les planètes
    // dessinées sur la carte qu'on clique, et la fusée y va en parabole.
    const freeOrder = !!w.freeOrder;
    // Diamètre de la zone cliquable d'une planète, en px (jamais moins que le doigt d'un enfant).
    const hitPx = (i) => Math.max(46, ((w.hits && w.hits[i]) || 5) / 100 * lw);

    // Pierres (mondes classiques) / planètes cliquables (Espace)
    w.nodes.forEach((n, i) => {
      const level = CV.levelNumber(worldIndex, i);
      const isBoss = i === CV.BOSS_NODE;
      const dp = (state.dayProgress || {})[level];
      const done = dp && dp.done;
      const skipped = !!(done && dp.skipped);
      const stars = done ? (dp.stars || 0) : 0;
      const isCurrent = !freeOrder && level === curLevel;
      const locked = !CV.levelUnlocked(state, level);
      // En mode repositionnement, les pierres sont remplacées par des poignées déplaçables.
      if (placeMode && editNodes) return;

      if (freeOrder) {
        // Halo transparent posé sur la planète : on voit la planète, pas une pierre.
        // Pluton verrouillée reste visible (cadenas) pour montrer l'objectif.
        const d = hitPx(i);
        const cls = "planet-hit" + (locked ? " locked" : (done && !skipped ? " done" : "")) + (skipped ? " skipped" : "");
        const hit = h("div", { class: cls, style: { left: n[0] + "%", top: n[1] + "%", width: d + "px", height: d + "px" } });
        if (locked) hit.appendChild(h("div", { class: "ph-badge" }, "🔒"));
        else if (skipped) hit.appendChild(h("div", { class: "ph-badge" }, "⏭️"));
        else if (done) hit.appendChild(h("div", { class: "ph-badge" }, stars > 0 ? "⭐".repeat(stars) : "✔️"));
        hit.addEventListener("click", (e) => {
          e.stopPropagation();
          if (mapDragged) return;
          if (locked) { UI.toast("🔒 Pluton s'ouvrira quand les 8 planètes seront jouées (" + CV.planetsPlayed(state) + "/8)", 3200); return; }
          openNodeSheet(level);
        });
        layer.appendChild(hit);
        return;
      }

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
      if (done && stars) stone.appendChild(h("div", { class: "stone-stars" }, "⭐".repeat(stars)));
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
    const restPos = (i) => {
      const inc = (w.paths && i - 1 >= 0) ? parsePts(w.paths[i - 1]) : [];
      if (inc.length) return inc[inc.length - 1].pt;           // point de repos = fin du chemin entrant
      const out = (w.paths && w.paths[i]) ? parsePts(w.paths[i]) : [];
      if (out.length) return out[0].pt;                        // sinon (1re pierre) : 1er point du chemin sortant, à côté de la pierre
      return w.nodes[i];
    };
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

    // Personnage : posé à sa position de repos (à côté de la pierre où il se tient).
    // Cette position est SAUVEGARDÉE (state.heroNode) : si on rejoue une vieille pierre,
    // le héros y revient et y reste, au lieu de sauter sur la dernière pierre atteinte.
    const savedNode = (state.heroNode || {})[worldIndex];
    const heroNodeIdx = savedNode != null ? savedNode : (curNodeIdx >= 0 ? curNodeIdx : 0);
    const heroStart = restPos(heroNodeIdx);
    const tok = heroToken(w, freeOrder ? 46 : 64, { map: true });   // monde Espace : c'est la fusée qui voyage sur la carte
    const mapAnim = w.mapAnim || w.anim || {};     // la fusée n'a ni « happy » ni « sad » : on lit la bonne planche
    const hero = h("div", { class: "hero-sprite" + (w.anim ? " anim" : "") + (freeOrder ? " rocket" : ""),
      style: { left: heroStart[0] + "%", top: heroStart[1] + "%" } }, tok);
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
        // La fusée garde l'inclinaison de sa dernière trajectoire ; les autres héros se remettent face à droite.
        if (idx >= legs.length) { if (!w.mapRotate) setHeroFacing(tok, true); tok._setMode("idle"); return; }
        const pt = legs[idx].to, dx = pt[0] - cur[0], dy = pt[1] - cur[1];
        if (w.mapRotate) setHeroAngle(tok, dx / 100 * lw, dy / 100 * lh);
        else if (Math.abs(dx) > 0.3) setHeroFacing(tok, dx > 0);
        const next = () => { cur = pt; step(idx + 1); };
        if (legs[idx].jump) {
          // Saut : le dino s'accroupit (s'arrête) puis bondit en suivant une parabole.
          tok._setMode("jump", { once: true, then: "walk" });
          hero.style.transition = "none";
          const durMs = (mapAnim.jump && mapAnim.jump.dur ? mapAnim.jump.dur : 0.7) * 1000;
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
    let userDragging = false;          // pendant qu'on fait glisser la carte, la caméra ne suit plus la fusée

    if (freeOrder) {
      /* ---- ESPACE : la fusée ne s'arrête jamais. ----
         Au repos elle ORBITE autour de sa planète ; pour en rejoindre une autre elle décrit une
         PARABOLE d'une orbite à l'autre. Réacteurs toujours allumés, pointe toujours dans le sens
         de la marche. Tout est piloté image par image (requestAnimationFrame) : les transitions CSS
         ne savent pas suivre une courbe. */
      const aspect = lw / lh;   // la carte n'est pas carrée : 1 % en x ≠ 1 % en y
      const ORB_FLAT = 0.55;    // orbite un peu écrasée : ça donne de la perspective
      const SPIN = 1.15;        // vitesse d'orbite (rad/s)

      // Orbite : un anneau juste au-delà du bord de la planète.
      const orbRx = (i) => Math.max(3.6, hitPx(i) / lw * 100 * 0.85);          // en % de largeur
      const orbRy = (i) => orbRx(i) * aspect * ORB_FLAT;                        // en % de hauteur
      const orbPos = (i, a) => [w.nodes[i][0] + orbRx(i) * Math.cos(a), w.nodes[i][1] - orbRy(i) * Math.sin(a)];
      // Tangente à l'orbite, en PIXELS (l'angle du sprite se calcule en pixels, pas en %).
      const orbTan = (i, a) => [-orbRx(i) * Math.sin(a) / 100 * lw, -orbRy(i) * Math.cos(a) / 100 * lh];

      /* Les deux bouts de la fronde. On balaie l'orbite et on garde l'angle qui aligne le mieux la
         TANGENTE avec la direction du voyage — l'ellipse est aplatie, il n'y a pas de formule simple.
         · éjection : la tangente vise la planète d'en face → la fusée est lâchée dans l'axe.
         · capture  : la tangente prolonge la direction d'approche → elle s'enroule sans crocheter.
         Sans ça, elle arriverait à contresens de l'orbite et devrait faire demi-tour. */
      const bestAngle = (i, score) => {
        let best = 0, bestDot = -2;
        for (let k = 0; k < 180; k++) {
          const a = k / 180 * Math.PI * 2;
          const t = orbTan(i, a), tn = Math.hypot(t[0], t[1]) || 1;
          const v = score(orbPos(i, a)), vn = Math.hypot(v[0], v[1]) || 1;
          const dot = (t[0] / tn) * (v[0] / vn) + (t[1] / tn) * (v[1] / vn);
          if (dot > bestDot) { bestDot = dot; best = a; }
        }
        return best;
      };
      const pctToPx = (a, b) => [(b[0] - a[0]) / 100 * lw, (b[1] - a[1]) / 100 * lh];
      // Où quitter l'orbite i pour filer vers la planète target.
      const launchAngle = (i, target) => bestAngle(i, (p) => pctToPx(p, w.nodes[target]));
      // Où raccrocher l'orbite de la planète i quand on arrive du point `from`.
      const captureAngle = (i, from) => bestAngle(i, (p) => pctToPx(from, p));

      const WINDUP = 2.3;       // pendant qu'elle prend son élan, l'orbite s'accélère (effet fronde)

      let node = heroNodeIdx;   // planète autour de laquelle elle tourne
      let ang = 0;              // position sur l'orbite
      let flight = null;        // vol en cours, ou null
      let pending = null;       // { to, launchAt } : élan en cours avant l'éjection
      let heading = [1, 0];     // cap actuel (vecteur unitaire, en PIXELS) — sert à repartir sans à-coup

      // La caméra suit la fusée — sauf si le joueur fait glisser la carte, ou s'il édite les pierres.
      const camSnap = (pt) => { if (userDragging || placeMode) return; [tx, ty] = camFor(pt); layer.style.transition = "none"; apply(); mapCam = [tx, ty]; };
      const place = (pt, dxPx, dyPx) => {
        hero.style.left = pt[0] + "%"; hero.style.top = pt[1] + "%";
        const n = Math.hypot(dxPx, dyPx);
        if (n > 0.001) heading = [dxPx / n, dyPx / n];       // on retient le cap : le prochain décollage part de là
        setHeroAngle(tok, dxPx, dyPx);
      };
      // Un vecteur unitaire de pixels, exprimé en % de la carte (x et y n'ont pas la même échelle).
      const pxDirToPct = (v, len) => [v[0] * len / lw * 100, v[1] * len / lh * 100];

      hero.style.transition = "none";
      tok._setMode("walk");     // réacteurs allumés en permanence — jamais d'« idle »
      if (placeMode && mapCam) { tx = clamp(mapCam[0], minTx, 0); ty = clamp(mapCam[1], minTy, 0); apply(); }
      else camSnap(w.nodes[node]);

      let last = 0;
      const frame = (now) => {
        if (!hero.isConnected) return;                       // écran quitté : la boucle s'éteint
        const dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
        last = now;
        if (flight) {
          flight.t = Math.min(1, flight.t + (flight.dur ? dt / flight.dur : 1));
          // Accélération au décollage / décélération à l'approche, mais SANS arrêt : la vitesse
          // d'arrivée reste celle de l'orbite, sinon la fusée « pilerait » avant de tourner.
          const t = flight.t, e = t * t * (3 - 2 * t) * 0.85 + t * 0.15;
          const u = 1 - e, p0 = flight.p0, p1 = flight.p1, p2 = flight.p2, p3 = flight.p3;
          // Bézier CUBIQUE : ses deux tangentes sont imposées (celle de l'orbite de départ et
          // celle de l'orbite d'arrivée). La fusée s'échappe et s'insère sans jamais pivoter sur place.
          const bez = (a, b, c, d) => u * u * u * a + 3 * u * u * e * b + 3 * u * e * e * c + e * e * e * d;
          const der = (a, b, c, d) => 3 * u * u * (b - a) + 6 * u * e * (c - b) + 3 * e * e * (d - c);
          const pt = [bez(p0[0], p1[0], p2[0], p3[0]), bez(p0[1], p1[1], p2[1], p3[1])];
          const dx = der(p0[0], p1[0], p2[0], p3[0]), dy = der(p0[1], p1[1], p2[1], p3[1]);
          place(pt, dx / 100 * lw, dy / 100 * lh);
          camSnap([flight.c0[0] + (flight.c1[0] - flight.c0[0]) * e,
                   flight.c0[1] + (flight.c1[1] - flight.c0[1]) * e]);
          if (flight.t >= 1) { node = flight.to; ang = flight.ang; flight = null; }
        } else {
          // En orbite. Si une planète est visée, on tourne PLUS VITE jusqu'à l'angle d'éjection :
          // la fusée prend son élan et part dans l'axe, sans jamais pivoter sur place.
          ang += SPIN * (pending ? WINDUP : 1) * dt;
          const t = orbTan(node, ang);
          place(orbPos(node, ang), t[0], t[1]);
          if (pending && ang >= pending.launchAt) { const to = pending.to; pending = null; beginFlight(to); }
        }
        requestAnimationFrame(frame);
      };
      requestAnimationFrame(frame);

      /* L'éjection elle-même. Elle part dans le CAP ACTUEL de la fusée — qui, grâce à l'élan pris
         ci-dessus, vise déjà la planète — et arrive dans le SENS DE L'ORBITE d'accueil : aucune
         rotation sur place, ni au départ ni à l'arrivée. */
      const beginFlight = (target) => {
        const from = flight ? [parseFloat(hero.style.left), parseFloat(hero.style.top)] : orbPos(node, ang);
        const aIn = captureAngle(target, from);            // on raccroche l'orbite dans son sens de rotation
        const p3 = orbPos(target, aIn);
        const dist = Math.hypot((p3[0] - from[0]) / 100 * lw, (p3[1] - from[1]) / 100 * lh) || 1;
        // Poignées de la cubique : une partie du trajet dans le cap de départ, puis dans le cap
        // d'arrivée. Plus elles sont longues, plus la courbe est ample.
        const pull = dist * 0.55;
        const tIn = orbTan(target, aIn);                    // tangente de l'orbite d'accueil (px)
        const tn = Math.hypot(tIn[0], tIn[1]) || 1;
        const d0 = pxDirToPct(heading, pull);
        const d1 = pxDirToPct([tIn[0] / tn, tIn[1] / tn], pull);
        flight = { p0: from, p1: [from[0] + d0[0], from[1] + d0[1]],
                   p2: [p3[0] - d1[0], p3[1] - d1[1]], p3: p3, to: target, ang: aIn, t: 0,
                   dur: clamp(dist / 380, 1.0, 2.4),
                   c0: (flight ? flight.c1 : w.nodes[node]), c1: w.nodes[target] };
        heroVisualIdx = target;
      };

      /* Viser une planète : la fusée ne pique pas droit dessus. Elle continue de tourner (plus vite)
         jusqu'au point de son orbite d'où elle est lancée pile dans la bonne direction — la fronde. */
      mapAPI = {
        walkTo: (target) => {
          if (target < 0 || target === (flight ? flight.to : node)) return;
          if (flight) { beginFlight(target); return; }       // déjà en vol : on redirige tout de suite
          const aOut = launchAngle(node, target);
          // Combien de tour reste-t-il à faire avant d'y être ? (l'angle n'est jamais remis à plat)
          let wait = (aOut - ang) % (Math.PI * 2);
          if (wait < 0.12) wait += Math.PI * 2;              // trop court pour s'aligner : un tour de plus
          pending = { to: target, launchAt: ang + wait };
        }
      };

      // Elle vient de terminer une planète alors qu'elle tournait autour d'une autre :
      // on la remet sur son ancienne orbite et on la fait décoller (le voyage se voit).
      const prevN = lastHeroNode[worldIndex];
      lastHeroNode[worldIndex] = heroNodeIdx;
      if (prevN != null && prevN >= 0 && prevN !== heroNodeIdx && w.nodes[prevN]) {
        node = prevN;
        // On la place déjà en position de tir : le voyage démarre sans faire poireauter l'enfant.
        ang = launchAngle(prevN, heroNodeIdx);
        const t0 = orbTan(prevN, ang), n0 = Math.hypot(t0[0], t0[1]) || 1;
        heading = [t0[0] / n0, t0[1] / n0];
        camSnap(w.nodes[prevN]);
        beginFlight(heroNodeIdx);
      }
    } else {

    // Le héros vient-il de changer de pierre ? -> il parcourt le chemin (en avant comme en arrière,
    // pour revenir sur une pierre qu'on rejoue).
    const prev = lastHeroNode[worldIndex];
    const moved = tok._setMode && prev != null && prev >= 0 && prev !== heroNodeIdx && w.nodes[prev];
    lastHeroNode[worldIndex] = heroNodeIdx;
    if (moved) {
      const startPt = restPos(prev);
      hero.style.transition = "none"; hero.style.left = startPt[0] + "%"; hero.style.top = startPt[1] + "%";
      setCam(startPt, 0); void hero.offsetWidth;
      tok._setMode("happy", { once: true });
      const legs = buildRoute(prev, heroNodeIdx);
      setTimeout(() => walkLegs(legs, startPt), ((mapAnim.happy && mapAnim.happy.dur) || 0.6) * 1000);
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

    }

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
        captured = true; mapDragged = true; userDragging = true;   // la fusée cesse d'entraîner la caméra
        viewport.classList.add("dragging");
        try { viewport.setPointerCapture(e.pointerId); } catch (_) {}
      }
      if (captured) { tx = clamp(stx + dx, minTx, 0); ty = clamp(sty + dy, minTy, 0); apply(); mapCam = [tx, ty]; }
    });
    const end = () => { dragging = false; captured = false; userDragging = false; viewport.classList.remove("dragging"); };
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
    const dp = (state.dayProgress || {})[level];
    const done = dp && dp.done;
    const pl = CV.planetForLevel ? CV.planetForLevel(level) : null;
    const reward = !!(pl && pl.mode === "reward");

    const backdrop = h("div", { class: "sheet-backdrop", onclick: closeSheet });
    // Le sous-titre énumère les étapes réellement au programme de la journée.
    const plan = lv.isBoss ? null : CV.dayPlan(level);
    const etapes = plan ? plan.steps.map((s) => s.label).join(" · ") : "";
    const sheet = h("div", { class: "node-sheet" },
      // Pluton occupe la case du boss mais n'est pas un combat : c'est la récompense finale.
      h("div", { class: "ns-head" },
        h("div", { class: "ns-emoji" }, reward ? "🚀" : (lv.icon || "✏️")),
        h("div", { style: { flex: "1" } },
          h("div", { class: "pill" }, reward ? "RÉCOMPENSE" : (lv.isBoss ? "BOSS du monde" : (etapes || lv.subtitle || ""))),
          h("div", { style: { fontWeight: "bold", fontSize: "17px", marginTop: "4px" } },
            reward ? "Pluton — vol libre" : (lv.isBoss ? "Le Grand Défi" : (lv.title || "Niveau")))),
        reward ? null
          : h("button", { class: "skip-mini", title: "Passer sans faire (0 étoile)", onclick: () => { closeSheet(); skipLevel(level); } }, "Passer ⏭️")),
      done && !reward ? h("p", { class: "muted" }, "Déjà réussi " + "⭐".repeat(dp.stars || 1) + " — tu peux rejouer pour faire mieux.") : null,
      h("button", { class: "btn big block mt", onclick: () => { closeSheet(); openLevel(level); } },
        reward ? "🚀 C'est parti !" : (lv.isBoss ? "⚔️ Affronter le boss" : (done ? "↻ Rejouer" : "▶️ Jouer")))
    );
    appEl.appendChild(backdrop);
    appEl.appendChild(sheet);
  }
  function closeSheet() {
    appEl.querySelectorAll(".node-sheet, .sheet-backdrop").forEach((e) => e.remove());
  }

  /* Passer un niveau sans le faire : il compte comme terminé mais SANS étoile.
     (On pourra le rejouer plus tard pour gagner ses étoiles.) */
  function skipLevel(level) {
    if (!confirm("Passer ce niveau sans le faire ?\nTu ne gagneras aucune étoile (tu pourras le refaire plus tard pour les gagner).")) return;
    const lv = CV.getLevel(level);
    if (lv.isBoss) { finishLevel(lv, 0, null, null, true); return; }
    daySession = null;
    finishDay(lv, 0, null, null, true);
  }

  /* ---------- Ouvrir un niveau ---------- */
  function openLevel(level) {
    const lv = CV.getLevel(level);
    if (!lv) return goto("#/carte");
    const state = Store.current();
    if (!CV.levelUnlocked(state, level)) { goto("#/carte"); return; }
    UI.applyTheme(lv.theme);
    // Monde Espace : mini-jeu de la planète. À tester AVANT le boss : Pluton occupe la case du
    // boss, mais ce n'est pas un combat — c'est le jeu de récompense.
    const planet = CV.planetForLevel ? CV.planetForLevel(level) : null;
    if (planet && planet.mode === "reward") return playReward(lv, planet);
    if (lv.isBoss) return playBoss(lv);
    if (planet && planet.points && planet.points.length > 1) return playPlanet(lv, planet);
    renderDayProgram(level);
  }

  /* ---------- Pluton : jeu de récompense (aucune question, aucun échec) ----------
     La fusée suit le doigt (ou les flèches). Les objets arrivent par la droite : les gemmes et
     les étoiles se ramassent, les astéroïdes explosent au contact. À la fin : 3 étoiles. */
  function playReward(lv, p) {
    const w = CV.worldByIndex(4);
    const c = screen();
    c.appendChild(backBar("#/carte", "Carte"));
    c.appendChild(h("h2", { class: "section-title" }, p.emoji + " " + p.name));

    const rocket = vehicleToken(w.mapAnim, 40);
    const ship = h("div", { class: "reward-ship" }, rocket);
    const stage = h("div", { class: "planet-stage reward-stage", style: { backgroundImage: "url(" + p.bg + ")" } }, ship);
    c.appendChild(h("div", { class: "planet-scene" }, stage));

    const hud = h("div", { class: "planet-steps" });
    c.appendChild(hud);
    c.appendChild(h("p", { class: "center muted planet-fact" }, "💡 " + p.fact));
    c.appendChild(h("p", { class: "center muted", style: { marginTop: "-4px", fontSize: "13px" } },
      "Glisse ton doigt (ou les flèches ↑ ↓) pour piloter."));

    let shipY = 50, shipV = 0, score = 0, running = true, last = 0, spawnAt = 0;
    const items = [];                       // { el, x, y, speed, kind, spec, dead }
    const remaining = () => Math.max(0, Math.ceil(p.duration - elapsed / 1000));
    let elapsed = 0;

    const place = () => { ship.style.top = shipY + "%"; };
    place();

    // ---- Pilotage « Flappy » : la fusée TOMBE en permanence ; tant qu'on reste appuyé, elle monte. ----
    let thrusting = false;
    const setThrust = (v) => { thrusting = v; ship.classList.toggle("thrust", v); };
    const onDown = (e) => { setThrust(true); if (e.cancelable) e.preventDefault(); };
    const onUp = () => setThrust(false);
    stage.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    stage.addEventListener("pointerleave", onUp);
    const onKey = (e) => { if (e.key === " " || e.key === "ArrowUp") { setThrust(true); e.preventDefault(); } };
    const onKeyUp = (e) => { if (e.key === " " || e.key === "ArrowUp") setThrust(false); };
    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", onKeyUp);

    function spawn() {
      const isRock = Math.random() < 0.45;
      const spec = isRock
        ? pick(p.junk.asteroids)
        : pick(p.junk.loot);
      const size = isRock ? 44 : 40;
      const el = propToken(isRock ? spec : spec.idle, size);
      el.classList.add("reward-item");
      if (!isRock) el._play({});                       // les gemmes scintillent en boucle
      const it = { el, x: 104, y: 10 + Math.random() * 78, speed: 0.020 + Math.random() * 0.016, isRock, spec };
      el.style.left = it.x + "%"; el.style.top = it.y + "%";
      stage.appendChild(el);
      items.push(it);
    }

    function boom(it) {
      it.dead = true;
      if (it.isRock) {
        it.el._play({ freeze: true });                 // l'astéroïde se pulvérise
        score += 1;
      } else {
        const s = it.spec.collect;
        const el2 = propToken(s, 40);
        el2.classList.add("reward-item");
        el2.style.left = it.x + "%"; el2.style.top = it.y + "%";
        stage.appendChild(el2);
        el2._play({ freeze: true });
        it.el.remove();
        it.el = el2;
        score += it.spec.pts;
      }
      setTimeout(() => it.el.remove(), 700);
      hud.textContent = "⭐ " + score + " · ⏱️ " + remaining() + " s";
    }

    function frame(t) {
      if (!running) return;
      if (!last) last = t;
      const dt = Math.min(50, t - last); last = t; elapsed += dt;
      if (elapsed >= p.duration * 1000) return end();

      // Gravité constante vers le bas ; la poussée (appui maintenu) la fait remonter.
      const s = dt / 1000;
      shipV += (thrusting ? -190 : 105) * s;             // %/s² : chute lente, poussée plus forte
      shipV = clamp(shipV, -60, 60);
      shipY += shipV * s;
      if (shipY < 6) { shipY = 6; shipV = 0; }
      if (shipY > 94) { shipY = 94; shipV = 0; }
      place();
      // nez qui pointe vers le haut en montée, vers le bas en chute
      rocket.style.transform = "rotate(" + clamp(shipV * 0.5, -22, 28) + "deg)";

      spawnAt -= dt;
      if (spawnAt <= 0) { spawn(); spawnAt = 480 + Math.random() * 420; }

      for (const it of items) {
        if (it.dead) continue;
        it.x -= it.speed * dt;
        it.el.style.left = it.x + "%";
        // collision : la fusée est à x = 18 %, on tolère large (c'est une récompense)
        if (it.x < 24 && it.x > 10 && Math.abs(it.y - shipY) < 11) boom(it);
        else if (it.x < -12) { it.dead = true; it.el.remove(); }
      }
      hud.textContent = "⭐ " + score + " · ⏱️ " + remaining() + " s";
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);

    function unbind() {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("pointerup", onUp);
    }
    function end() {
      running = false; unbind();
      UI.confetti();
      UI.toast("Score : " + score + " ! 🚀");
      setTimeout(() => finishDay(lv, 3, score, score), 900);   // récompense : toujours 3 étoiles
    }

    // si on quitte l'écran, on coupe la boucle
    window.addEventListener("hashchange", () => { running = false; unbind(); }, { once: true });
  }

  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }

  /* ---------- Espace : mini-jeu d'une planète ----------
     Deux mécaniques, selon p.mode :
     · parcours (défaut) : bonne réponse = l'astronaute franchit un appui, mauvaise = il reste bloqué ;
     · "reveal" (Vénus)  : pas d'astronaute — les nuages recouvrent le paysage et chaque bonne
       réponse en dissipe un, découvrant le fond petit à petit. */
  function playPlanet(lv, p) {
    const w = CV.worldByIndex(CV.worldIndexOfLevel(lv.level));
    const pool = CV.drawMix(p.gen || []);
    const reveal = p.mode === "reveal";
    const c = screen();
    c.appendChild(backBar("#/carte", "Carte"));
    c.appendChild(h("h2", { class: "section-title" }, p.emoji + " " + p.name));
    if (!pool.length) { c.appendChild(h("div", { class: "card" }, h("p", {}, "Questions indisponibles."))); return; }

    const last = p.points.length - 1;
    let at = 0, correct = 0, total = 0, qi = 0;

    // L'astronaute… ou le rover de Mars, qui a son propre jeu d'animations.
    const tok = p.vehicle ? vehicleToken(p.vehicle, p.heroSize || 76) : heroToken(w, p.heroSize || 62);
    const hop = h("div", { class: "planet-hop" }, tok);
    const astro = h("div", { class: "planet-hero" }, hop);
    const stage = h("div", { class: "planet-stage", style: { backgroundImage: "url(" + p.bg + ")" } });
    if (!reveal) stage.appendChild(astro);
    if (p.vertical) stage.classList.add("vertical");
    if (p.hscroll) stage.classList.add("wide");
    const scene = h("div", { class: "planet-scene" + (p.vertical ? " scroll" : "") + (p.hscroll ? " hscroll" : "") }, stage);
    c.appendChild(scene);

    // Objets posés dans la scène : appuis (nuages, plateformes) ou couverture nuageuse.
    // propPct = taille en % de la HAUTEUR de la scène (les nuages de Vénus doivent tout couvrir,
    // quelle que soit la taille de l'écran) ; propSize = taille fixe en px.
    const props = [];
    if (p.props) {
      const stageH = stage.getBoundingClientRect().height || 210;
      const size = p.propPct ? Math.round(stageH * p.propPct / 100) : (p.propSize || 52);
      p.points.forEach((pt, i) => {
        const el = propToken(p.props[i % p.props.length], size);
        el.classList.add("planet-prop");
        if (reveal) el.classList.add("cover");
        if (p.propAnchor) el.style.transform = "translate(-50%, -" + p.propAnchor + "%)";
        el.style.left = pt[0] + "%"; el.style.top = pt[1] + "%";
        if (reveal) stage.appendChild(el); else stage.insertBefore(el, astro);
        props.push(el);
      });
    }

    const steps = h("div", { class: "planet-steps" });
    c.appendChild(steps);
    c.appendChild(h("p", { class: "center muted planet-fact" }, "💡 " + p.fact));
    const qbox = h("div", { class: "card" });
    c.appendChild(qbox);
    c.appendChild(h("button", { class: "btn ghost small block mt", onclick: () => skipLevel(lv.level) },
      "⏭️ Passer la planète (0 étoile)"));

    function place(i, instant) {
      if (i > 0) {
        const a = p.points[i - 1], b = p.points[i];
        // Saturne : la piste des anneaux est une courbe → l'astronaute s'incline dans la pente.
        // Ailleurs : il se contente de regarder du bon côté.
        if (p.followAngle) {
          const r = stage.getBoundingClientRect();
          setHeroAngle(tok, (b[0] - a[0]) / 100 * r.width, (b[1] - a[1]) / 100 * r.height, true);
        } else setHeroFacing(tok, b[0] >= a[0]);
      }
      astro.style.transition = instant ? "none" : "";
      astro.style.left = p.points[i][0] + "%";
      astro.style.top = p.points[i][1] + "%";
      steps.textContent = (p.stepWord || "Appui") + " " + (i + 1) + " / " + p.points.length;
      if (p.vertical || p.hscroll) followHero(i, instant);
    }

    /* Scène plus grande que la fenêtre : elle défile pour garder le héros au centre.
       Lune = verticalement (il grimpe), Mars = horizontalement (le rover roule). */
    function followHero(i, instant) {
      const behavior = instant ? "auto" : "smooth";
      if (p.vertical) {
        const top = stage.scrollHeight * p.points[i][1] / 100 - scene.clientHeight / 2;
        scene.scrollTo({ top: Math.max(0, top), behavior });
      } else {
        const left = stage.scrollWidth * p.points[i][0] / 100 - scene.clientWidth / 2;
        scene.scrollTo({ left: Math.max(0, left), behavior });
      }
    }
    // Pose de repos : "idle" partout, sauf sur Saturne où il reste sur sa planche ("surf").
    const REST = p.idleMode || "idle";
    function anim(mode, opts) { if (tok._setMode) tok._setMode(mode === "idle" ? REST : mode, opts || {}); }
    function fx(emo) { const f = h("div", { class: "combat-hitfx" }, emo); stage.appendChild(f); setTimeout(() => f.remove(), 600); }

    function showRemaining() {
      const left = props.length - at;
      steps.textContent = left > 0 ? (p.stepWord || "Nuage") + "s restants : " + left : "Ciel dégagé ! 🌤️";
    }

    if (reveal) showRemaining(); else { place(0, true); anim("idle"); }
    nextQ();

    /* Neptune : une rafale de vent le repousse d'un cran en arrière (il reste tourné vers l'avant).
       Chronologie synchronisée : le vent se lève D'ABORD, souffle pendant tout le recul, puis retombe. */
    function gust() {
      const g = h("div", { class: "wind-fx" });
      for (let i = 0; i < 9; i++) g.appendChild(h("span", { class: "wind-streak", style: { top: (8 + i * 10) + "%", animationDelay: (i * 45) + "ms" } }));
      stage.appendChild(g);
      setTimeout(() => g.remove(), 1500);          // le vent dure plus longtemps que le déplacement
    }
    function pushBack() {
      gust();
      if (at <= 0) {                               // déjà au départ : il résiste mais n'avance pas
        hop.classList.add("blocked"); setTimeout(() => hop.classList.remove("blocked"), 600); return;
      }
      // le vent est déjà en train de souffler ~280 ms avant qu'il ne cède du terrain
      setTimeout(() => { at--; anim("sad", { once: true }); place(at); setTimeout(() => anim("idle"), 700); }, 280);
    }

    /* Parcours : il franchit un appui (saut, marche, surf, ou roulage pour le rover). */
    function advance() {
      const move = (p.moves && p.moves[at]) || "jump";
      const from = at;
      at++;
      if (move === "jump") { hop.classList.add("hopping"); anim("jump", { once: true }); }
      else if (move === "surf") { anim("surf"); }  // il reste sur sa planche
      else { anim("walk"); }                       // marche, ou roues + poussière pour le rover
      place(at);
      // L'appui quitté se dissipe une fois qu'il a décollé (et reste dissipé : pas de retour possible).
      if (p.propsVanish && props[from]) setTimeout(() => props[from]._play({ freeze: true }), 320);
      setTimeout(() => { hop.classList.remove("hopping"); anim("idle"); }, 750);
    }

    /* Dégagement : un nuage de plus s'évapore, on voit un peu plus du paysage. */
    function dissipate() {
      const el = props[at];
      at++;
      if (el) el._play({ freeze: true });
      showRemaining();
    }

    /* Lune : mauvaise réponse → la plateforme sous ses pieds se brise, il retombe d'un cran,
       puis une NOUVELLE plateforme arrive en glissant du bord le plus proche. */
    function breakUnder() {
      const i = at, el = props[i];
      if (el) {
        el._play({ freeze: true });                          // elle se brise, éclats figés
        setTimeout(() => {
          el.style.transition = "opacity .25s"; el.style.opacity = "0";   // les éclats s'effacent
          setTimeout(() => respawn(i), 260);
        }, (el._dur || 0.8) * 1000);
      }
      if (at > 0) {                                          // il retombe sur la plateforme du dessous
        at--;
        hop.classList.add("hopping"); anim("jump", { once: true });
        place(at);
        setTimeout(() => { hop.classList.remove("hopping"); anim("idle"); }, 750);
      } else {
        hop.classList.add("blocked"); setTimeout(() => hop.classList.remove("blocked"), 500);
      }
    }

    /* Une plateforme neuve entre en glissant, par le bord dont elle est le plus proche. */
    function respawn(i) {
      const el = props[i];
      if (!el) return;
      const x = p.points[i][0], fromLeft = x < 50;
      el._reset();
      el.style.transition = "none";
      el.style.left = (fromLeft ? -25 : 125) + "%";
      el.style.opacity = "1";
      void el.offsetWidth;
      el.style.transition = "left .65s cubic-bezier(.2,.7,.3,1)";
      el.style.left = x + "%";
    }

    function nextQ() {
      if (at >= (reveal ? props.length : last)) return win();
      const ex = pool[qi % pool.length]; qi++;
      CV.Engine.run(qbox, [ex], {
        compact: true,
        onComplete: ({ correct: ok }) => {
          total++;
          if (ok) { correct++; fx("⭐"); reveal ? dissipate() : advance(); }
          else {
            fx("❌");
            if (reveal) { /* Vénus : rien ne bouge */ }
            else if (p.breakOnWrong) breakUnder();          // Lune : la plateforme cède
            else if (p.pushBackOnWrong) pushBack();         // Neptune : le vent le repousse
            else { hop.classList.add("blocked"); setTimeout(() => hop.classList.remove("blocked"), 500); }
          }
          setTimeout(nextQ, ok ? 950 : (p.breakOnWrong ? 1700 : (p.pushBackOnWrong ? 1100 : 700)));
        }
      });
    }

    function win() {
      const stars = Game.starsForScore(correct, total);
      // Mars : arrivé au bout, le rover déploie sa parabole avant qu'on annonce la victoire.
      // Il la garde déployée (freeze sur la dernière image) au lieu de la replier : c'est sa pose
      // de victoire. On laisse le déploiement finir (0,9 s) PUIS une seconde entière sur la pose
      // figée — sinon on quitte l'écran avant d'avoir eu le temps de la voir.
      const scan = p.vehicle && p.vehicle.scan;
      const wait = p.winMode === "scan" ? Math.round((scan ? scan.dur : 0.9) * 1000) + 1000 : 800;
      if (p.winMode === "scan") { anim("scan", { freeze: true }); fx("📡"); }
      if (stars > 0) UI.confetti();
      UI.toast(p.name + " est explorée ! " + p.emoji);
      setTimeout(() => finishDay(lv, stars, correct, total), wait);
    }
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
          h("div", { class: "muted", style: { fontSize: "13px" } }, stepDesc(s)),
          isCurrent ? h("button", { class: "skip-mini", style: { marginTop: "8px" }, title: "Passer cette étape (0 étoile)", onclick: (e) => { e.stopPropagation(); skipStep(i); } }, "Passer sans faire ⏭️") : null),
        res ? h("div", { style: { fontSize: "18px" } }, res.skipped ? "⏭️" : ("✅ " + res.correct + "/" + res.total))
            : isCurrent ? h("div", { class: "btn small" }, "Jouer →")
            : h("div", { style: { fontSize: "20px" } }, "🔒"));
      c.appendChild(card);
    });

    if (daySession.done.every(Boolean)) {
      c.appendChild(h("button", { class: "btn big gold block mt", onclick: () => {
        finishDay(lv, computeDayStars(daySession), daySession.correct, daySession.total);
      } }, "🏁 Terminer la journée"));
    }
  }

  /* Passer une seule étape : comptée comme faite mais sans points. */
  function skipStep(i) {
    if (!confirm("Passer cette étape sans la faire ?\nTu perdras les étoiles de cette partie.")) return;
    daySession.done[i] = { correct: 0, total: 0, skipped: true };
    renderDayProgram(daySession.level);
  }

  /* Étoiles de la journée : basées sur la réussite, moins 1 par étape passée. */
  function computeDayStars(ds) {
    const skipped = ds.done.filter((d) => d && d.skipped).length;
    const base = ds.total > 0 ? Game.starsForScore(ds.correct, ds.total) : 0;
    return Math.max(0, base - skipped);
  }

  function stepDesc(s) {
    if (s.desc) return s.desc;
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

  /* Où le héros doit-il se tenir après avoir joué ce niveau ?
     - il vient de débloquer la suite → sur la nouvelle pierre courante (il avance) ;
     - il rejouait une vieille pierre → il reste sur celle-là ;
     - monde en ordre libre (l'Espace) → la fusée reste en orbite autour de la planète qu'il
       vient de jouer : il n'y a pas de « case suivante ». */
  function saveHeroSpot(state, lv) {
    const cur = state.currentDay || 1;
    const free = CV.worldByIndex(CV.worldIndexOfLevel(lv.level)).freeOrder;
    const advanced = !free && cur > lv.level;
    const wi = CV.worldIndexOfLevel(advanced ? cur : lv.level);
    const ni = CV.nodeIndexOfLevel(advanced ? cur : lv.level);
    state.heroNode = state.heroNode || {};
    state.heroNode[wi] = ni;
    state.heroWorld = wi;              // on rouvre la carte sur le monde où il se trouve
    mapViewIndex = wi;
  }

  /* Débloque des fiches et renvoie celles qui sont NOUVELLES (pour l'annonce de fin). */
  function unlockFiches(state, ids) {
    state.fiches = state.fiches || {};
    const fresh = [];
    (ids || []).forEach((id) => { if (!state.fiches[id]) { state.fiches[id] = true; fresh.push(id); } });
    return fresh;
  }

  function finishDay(lv, stars, correct, total, skipped) {
    const state = Store.current();
    const plutonWasLocked = !CV.plutonUnlocked(state);
    const r = Game.completeDay(state, lv, stars, skipped);
    saveHeroSpot(state, lv);
    // Une journée réussie (au moins 1 étoile) débloque les fiches de ses leçons.
    const newFiches = stars > 0 && CV.fichesForLevel ? unlockFiches(state, CV.fichesForLevel(lv.level)) : [];
    // Les 8 planètes viennent d'être bouclées → on annonce Pluton en arrivant sur la carte.
    if (plutonWasLocked && CV.plutonUnlocked(state)) plutonAnnounce = true;
    Store.save();
    daySession = null;
    const low = stars === 0;
    const c = screen();
    UI.victory(c, {
      emoji: low ? "💪" : (stars === 3 ? "🌟" : "🎉"),
      title: low ? "Niveau terminé" : "Journée réussie !",
      stars: stars,
      subtitle: low ? "Pas d'étoile cette fois — rejoue-le pour les gagner ! 💪"
        : (correct != null ? (correct + " / " + total + " bonnes réponses sur la journée") : "Bravo, champion !"),
      badges: r.newBadges || [],
      extra: newFiches.length ? ("📇 " + newFiches.length + " nouvelle" + (newFiches.length > 1 ? "s" : "") + " fiche" + (newFiches.length > 1 ? "s" : "") + " de connaissance !") : null,
      cta: "Retour à la carte 🗺️",
      onContinue: () => goto("#/carte")
    });
  }

  /* ---------- Boss : combat héros vs boss ---------- */
  /* scale : les cellules des boss ne font pas toutes la même taille (197 à 235 px) et le halo
     du fantôme occupe une bonne partie de la sienne — à taille d'affichage égale il paraîtrait
     plus petit. On rattrape planche par planche. */
  const BOSS = {
    dinosaure:  { emoji: "🦖", name: "le T-Rex", hp: 6, scale: 1.15 },
    ulysse:     { emoji: "⚡", name: "Thor", hp: 6, scale: 0.8 },
    chevaliers: { emoji: "🐉", name: "le Dragon", hp: 7, scale: 1.25 },
    pirate:     { emoji: "☠️", name: "le Capitaine Fantôme", hp: 7, scale: 1 },
    espace:     { emoji: "👾", name: "l'Alien", hp: 8, scale: 1 }
  };

  /* Anime une planche de sprite (même mécanisme que le héros).
     opts.once  = jouer une fois puis revenir sur opts.then (déf. idle)
     opts.freeze = jouer une fois et rester figé sur la dernière image (mort). */
  function setSpriteMode(wrap, strip, anim, mode, opts) {
    const a = anim[mode] || anim.idle;
    strip.style.width = (a.frames * 100) + "%";
    strip.style.backgroundImage = "url(" + a.strip + ")";
    strip.style.animation = "none";
    // Sous l'animation, on pose la position de repos : image 0, ou dernière image si on gèle.
    // Sans animation-fill-mode, le transform inline reprend la main dès la fin → aucun clignotement.
    strip.style.transform = opts.freeze
      ? "translateX(" + (-100 * (a.frames - 1) / a.frames) + "%)"
      : "";
    void strip.offsetWidth;                       // redémarre l'animation proprement
    const single = opts.once || opts.freeze;
    const dir = (!single && (mode === "idle" || a.yoyo)) ? " alternate" : "";
    strip.style.animation = "spritestep " + a.dur + "s steps(" + a.frames + ") " + (single ? "1" : "infinite") + dir;
    clearTimeout(wrap._animT);
    if (opts.once) {
      wrap._animT = setTimeout(() => setSpriteMode(wrap, strip, anim, opts.then || "idle", {}), a.dur * 1000);
    }
  }

  /* Jeton du boss : planche animée si le monde en a une, sinon emoji.
     size = HAUTEUR du jeton. Les cellules ne sont pas toujours carrées (le dragon fait 484×212 :
     la largeur en trop sert à déployer sa flamme) → on respecte le ratio, sinon il est écrasé. */
  function bossToken(w, cfg, size) {
    const cell = w.bossAnim && w.bossAnim.idle && w.bossAnim.idle.cell;
    const wide = cell ? Math.round(size * cell[0] / cell[1]) : size;
    const wrap = h("div", { class: "hero-token boss-token", style: { width: wide + "px", height: size + "px" } });
    const emoStyle = { fontSize: Math.round(size * 0.75) + "px" };
    if (!w.bossAnim) { wrap.appendChild(h("div", { class: "hero-emo", style: emoStyle }, cfg.emoji)); return wrap; }
    preloadAnim(w.bossAnim);
    const strip = h("div", { class: "hero-strip" });
    const emo = h("div", { class: "hero-emo", style: Object.assign({ display: "none" }, emoStyle) }, cfg.emoji);
    wrap.appendChild(strip); wrap.appendChild(emo);
    const probe = new Image();
    probe.onerror = () => { strip.style.display = "none"; emo.style.display = "block"; };
    probe.src = w.bossAnim.idle.strip;
    wrap._setMode = (mode, opts) => setSpriteMode(wrap, strip, w.bossAnim, mode, opts || {});
    wrap._setMode("idle");
    return wrap;
  }

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
    const heroTok = heroToken(w, 70);
    const heroEl = h("div", { class: "fighter hero" }, heroTok);
    const heroAnim = (mode, opts) => { if (heroTok._setMode) heroTok._setMode(mode, opts); };
    const bossTok = bossToken(w, cfg, Math.round(86 * (cfg.scale || 1)));
    const bossEl = h("div", { class: "fighter boss" }, bossTok);
    const bossAnim = (mode, opts) => { if (bossTok._setMode) bossTok._setMode(mode, opts); };
    const heroHpEl = h("div", { class: "hp hp-left" });
    const bossHpEl = h("div", { class: "hp hp-right" });
    // Combattants posés dans le décor : cœurs dans les coins hauts, personnages remontés
    // vers le centre pour qu'ils ne se retrouvent pas plantés dans un tonneau ou un rocher.
    const scene = h("div", {
      class: "combat-scene" + (w.bossBg ? " has-bg" : ""),
      style: w.bossBg ? { backgroundImage: "url(" + w.bossBg + ")" } : {}
    }, heroHpEl, bossHpEl, heroEl, bossEl);
    c.appendChild(scene);
    const intro = h("p", { class: "center muted", style: { marginTop: "-4px" } }, "Réponds juste pour attaquer ! Une erreur et c'est toi qui prends un coup. 3 erreurs = recommencer.");
    c.appendChild(intro);
    const qbox = h("div", { class: "card" });
    c.appendChild(qbox);
    c.appendChild(h("button", { class: "btn ghost small block mt", onclick: () => skipLevel(lv.level) }, "⏭️ Passer le boss (0 étoile)"));

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
          if (correct) {
            bossHP--;
            heroEl.classList.add("attack-r"); bossEl.classList.add("hit"); fx("💥");
            heroAnim("attack", { once: true });     // happy est gardé pour la victoire
            if (bossHP <= 0) bossAnim("death", { freeze: true }); else bossAnim("hit", { once: true });
          } else {
            heroHP--;
            bossEl.classList.add("attack-l"); heroEl.classList.add("hit"); fx("💢");
            heroAnim("sad", { once: true }); bossAnim("attack", { once: true });
          }
          updateHP();
          const wait = bossHP <= 0 ? 1200 : 850;   // laisse l'animation de mort se jouer
          setTimeout(() => {
            heroEl.className = "fighter hero";
            bossEl.className = "fighter boss" + (bossHP <= 0 ? " dead" : "");
            nextQ();
          }, wait);
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
    Game.completeDay(state, lv, stars, isSkip);
    saveHeroSpot(state, lv);
    // Boss vaincu (au moins 1 étoile) → fiche du monde.
    if (lv.isBoss && stars > 0 && CV.WORLD_FICHES) {
      const wf = CV.WORLD_FICHES[CV.worldIndexOfLevel(lv.level)];
      if (wf) unlockFiches(state, [wf.id]);
    }
    Store.save();
    if (lv.isBoss) return worldCleared(lv, stars, correct, total);
    goto("#/carte");
  }

  /* ---------- Monde terminé → monde suivant ---------- */
  function worldCleared(lv, stars, correct, total) {
    const state = Store.current();
    const fullyDone = Object.keys(state.dayProgress).length >= CV.TOTAL_DAYS;
    const c = screen();
    if (stars > 0) UI.confetti();   // pas de feu d'artifice si le boss est passé (0 étoile)
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

    // ---- Fiches de connaissance ----
    const all = CV.allFiches ? CV.allFiches() : [];
    if (all.length) {
      const owned = state.fiches || {};
      const nOwned = all.filter((f) => owned[f.id]).length;
      c.appendChild(h("h3", { style: { margin: "18px 0 6px" } }, "📇 Fiches de connaissance"));
      c.appendChild(h("p", { class: "muted", style: { marginTop: "-4px" } }, nOwned + " / " + all.length + " découvertes — réussis une leçon pour gagner sa fiche."));
      const fg = h("div", { class: "fiche-grid" });
      all.forEach((f) => {
        const has = !!owned[f.id];
        const cell = h("div", { class: "fiche-cell" + (has ? "" : " locked") + (f.kind === "world" ? " world" : "") },
          h("div", { class: "fiche-ico" }, has ? (f.icon || f.emoji) : "🔒"),
          h("div", { class: "fiche-t" }, has ? f.title : "À découvrir"));
        if (has) cell.addEventListener("click", () => openFiche(f.id));
        fg.appendChild(cell);
      });
      c.appendChild(fg);
    }

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

  /* Ouvre une fiche en grand (fenêtre modale). */
  function openFiche(id) {
    const f = CV.ficheById(id);
    if (!f) return;
    const backdrop = h("div", { class: "sheet-backdrop", onclick: (e) => { if (e.target === backdrop) backdrop.remove(); } });
    const SUBJ = { francais: "Français", maths: "Maths", sciences: "Sciences", culture: "Culture" };
    const card = h("div", { class: "fiche-sheet" },
      h("div", { class: "fiche-sheet-head" },
        h("div", { class: "fiche-ico big" }, f.icon || f.emoji),
        h("div", {},
          h("div", { class: "fiche-kicker" }, f.kind === "world" ? "Fiche du monde" : (SUBJ[f.subject] || "Leçon")),
          h("h3", { style: { margin: "2px 0 0" } }, f.title))),
      f.kind === "world"
        ? h("p", { class: "fiche-body" }, f.text)
        : h("div", {},
            h("div", { class: "fiche-block retenir" }, h("strong", {}, "À retenir : "), f.retenir),
            f.exemple ? h("div", { class: "fiche-block exemple" }, h("strong", {}, "Exemple : "), f.exemple) : null,
            f.astuce ? h("div", { class: "fiche-block astuce" }, h("strong", {}, "💡 Astuce : "), f.astuce) : null),
      h("button", { class: "btn block mt", onclick: () => backdrop.remove() }, "Fermer")
    );
    backdrop.appendChild(card);
    appEl.appendChild(backdrop);
  }

  function statLine(label, val) {
    return h("div", { class: "row", style: { padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,.08)" } },
      h("span", {}, label), h("span", { class: "spacer" }), h("strong", {}, String(val)));
  }

  /* ---------- Révisions libres (s'entraîner sur n'importe quelle notion) ---------- */
  function renderRevisions() {
    const state = Store.current();
    UI.applyTheme(state.theme || "dinosaure");
    const c = screen();
    c.appendChild(UI.statusBar(state));
    c.appendChild(h("h2", { class: "section-title" }, "📚 Révisions libres"));
    c.appendChild(h("p", { class: "muted", style: { marginTop: "-8px" } }, "Choisis une notion à réviser. Les questions changent à chaque fois !"));

    [["francais", "📖 Français"], ["maths", "🔢 Maths"], ["sciences", "🔬 Sciences"], ["culture", "🌍 Culture"]].forEach(([key, label]) => {
      const mods = (CV.content[key] || []).filter((m) => !m.isDictee);
      if (!mods.length) return;
      c.appendChild(h("h3", { style: { margin: "16px 0 6px" } }, label));
      const grid = h("div", { class: "rev-grid" });
      mods.forEach((m) => grid.appendChild(
        h("button", { class: "rev-chip", onclick: () => practiceModule(m) },
          h("span", { style: { fontSize: "20px" } }, m.icon), h("span", {}, m.title))));
      c.appendChild(grid);
    });

    c.appendChild(h("h3", { style: { margin: "16px 0 6px" } }, "🎯 Spécial"));
    c.appendChild(h("div", { class: "rev-grid" },
      h("button", { class: "rev-chip", onclick: () => practiceDictee() }, h("span", { style: { fontSize: "20px" } }, "🎧"), h("span", {}, "Dictée")),
      h("button", { class: "rev-chip", onclick: () => practiceLogic() }, h("span", { style: { fontSize: "20px" } }, "🧩"), h("span", {}, "Jeux de logique"))));
  }

  function practiceModule(mod) {
    practiceRun(mod.icon + " " + mod.title, () => (CV.exercisesFor ? CV.exercisesFor(mod) : mod.exercises).slice(0, 10), mod.lesson);
  }
  function practiceDictee() { practiceRun("🎧 Dictée", () => [CV.drawDictee(1)], null); }
  function practiceLogic() { practiceRun("🧩 Jeux de logique", () => { const a = []; for (let i = 0; i < 5; i++) a.push(CV.gen.logic()); return a; }, null); }

  function practiceRun(title, makeEx, lesson) {
    const c = screen();
    c.appendChild(h("div", { class: "h-row" },
      h("button", { class: "btn ghost small", onclick: () => goto("#/revisions") }, "← Révisions"),
      h("span", { class: "pill" }, "Entraînement")));
    c.appendChild(h("h2", { class: "section-title" }, title));
    if (lesson) {
      const box = h("div", { class: "card glass", style: { display: "none" } });
      box.appendChild(h("p", {}, lesson.intro));
      const ul = h("ul", { class: "lesson-points" }); lesson.points.forEach((p) => ul.appendChild(h("li", { html: p }))); box.appendChild(ul);
      if (lesson.example) box.appendChild(h("div", { class: "lesson-example", html: "📌 " + lesson.example }));
      c.appendChild(h("button", { class: "btn ghost small", onclick: () => { box.style.display = box.style.display === "none" ? "block" : "none"; } }, "📖 Revoir la leçon"));
      c.appendChild(box);
    }
    const qbox = h("div", { class: "card" });
    c.appendChild(qbox);
    CV.Engine.run(qbox, makeEx(), {
      onComplete: ({ correct, total }) => {
        const cc = screen();
        const good = total > 0 && correct / total >= 0.9;
        cc.appendChild(h("div", { class: "card center" },
          h("div", { style: { fontSize: "52px" } }, good ? "🌟" : "💪"),
          h("h2", {}, "Entraînement terminé"),
          h("p", {}, correct + " / " + total + " bonnes réponses"),
          h("button", { class: "btn big block mt", onclick: () => practiceRun(title, makeEx, lesson) }, "↻ Encore (nouvelles questions)"),
          h("button", { class: "btn ghost block mt", onclick: () => goto("#/revisions") }, "← Choisir une autre notion")));
      }
    });
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

    // Outils test (visible seulement pour un joueur « test »)
    if ((state.displayName || "").toLowerCase().indexOf("test") >= 0) {
      const expTa = h("textarea", { id: "export-ta", readonly: "", style: { display: "none", width: "100%", height: "130px", marginTop: "8px", fontFamily: "monospace", fontSize: "11px", background: "#0c0a18", color: "#9effa0", borderRadius: "8px", border: "1px solid rgba(255,255,255,.2)", padding: "6px" } });
      c.appendChild(h("div", { class: "card glass" },
        h("strong", {}, "🔧 Outils test"),
        h("button", { class: "btn ghost small mt block", onclick: () => {
          Store.update((s) => { s.currentDay = CV.TOTAL_DAYS; });
          UI.toast("🔓 Tous les mondes débloqués !");
          mapViewIndex = null; goto("#/carte");
        } }, "🔓 Débloquer tous les mondes"),
        h("button", { class: "btn ghost small mt block", onclick: () => {
          let nodes = {}, paths = {};
          try { nodes = JSON.parse(localStorage.getItem("cv_nodes_override") || "{}"); } catch (e) {}
          try { paths = JSON.parse(localStorage.getItem("cv_paths_override") || "{}"); } catch (e) {}
          expTa.value = JSON.stringify({ nodes, paths });
          expTa.style.display = "block"; expTa.select();
          try { document.execCommand("copy"); UI.toast("📋 Copié ! Colle-le-moi ici."); } catch (e) { UI.toast("Sélectionne et copie le texte 👇"); }
        } }, "📤 Exporter pierres & chemins"),
        expTa));
    }

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
