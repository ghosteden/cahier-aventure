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

  /* ---------- Démarrage ---------- */
  function boot() {
    // Service worker (hors-ligne)
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("sw.js").catch(() => {});
    }
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
    if (tab === "jour") {
      const n = parseInt(hash.split("/")[2], 10) || state.currentDay || 1;
      return renderDay(n);
    }
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
    UI.applyTheme("espace");
    const c = screen();
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

  /* ---------- Carte d'aventure ---------- */
  function renderCarte() {
    const state = Store.current();
    const curWorld = CV.worldOfDay(state.currentDay || 1);
    UI.applyTheme(curWorld.theme);
    const c = screen();
    c.appendChild(UI.statusBar(state));
    c.appendChild(h("div", { class: "h-row" },
      h("h2", { class: "section-title" }, "🗺️ Ta carte d'aventure"),
      h("span", { class: "pill" }, "Jour " + (state.currentDay || 1) + " / " + CV.TOTAL_DAYS)));

    CV.WORLDS.forEach((w) => {
      const unlocked = (state.currentDay || 1) >= w.start;
      const world = h("div", { class: "world world-" + w.theme + (unlocked ? "" : " locked") });
      world.appendChild(h("div", { class: "world-head" },
        h("div", { class: "world-emoji" }, w.emoji),
        h("div", {},
          h("div", { class: "world-name" }, w.name),
          h("div", { class: "world-sub" }, unlocked ? w.intro : "🔒 Se débloque au jour " + w.start))));

      const grid = h("div", { class: "daygrid" });
      for (let d = w.start; d <= w.end; d++) {
        const day = CV.getDay(d);
        const dp = (state.dayProgress || {})[d];
        const isDone = dp && dp.done;
        const isToday = d === (state.currentDay || 1);
        const locked = d > (state.currentDay || 1);
        let cls = "daynode";
        if (day.type === "boss") cls += " boss";
        else if (day.type === "fun") cls += " fun";
        if (isDone) cls += " done";
        if (isToday) cls += " today";
        if (locked) cls += " locked";
        const ico = day.type === "boss" ? "👑" : day.type === "fun" ? "🎉" : (isDone ? "✓" : day.emoji);
        const node = h("button", { class: cls, onclick: () => {
          if (locked) { UI.toast("🔒 Termine d'abord le jour " + (state.currentDay || 1) + " !"); return; }
          goto("#/jour/" + d);
        } },
          h("span", { class: "d-num" }, d),
          h("span", { class: "d-ico" }, ico),
          isDone ? h("span", { class: "d-stars" }, "⭐".repeat(dp.stars || 1)) : null
        );
        grid.appendChild(node);
      }
      world.appendChild(grid);
      c.appendChild(world);
    });
  }

  /* ---------- Vue d'une journée ---------- */
  function renderDay(n) {
    const state = Store.current();
    const day = CV.getDay(n);
    if (!day) return renderCarte();
    if (n > (state.currentDay || 1)) { goto("#/carte"); return; }
    UI.applyTheme(day.theme);
    startSession(day);

    const c = screen();
    c.appendChild(backBar("#/carte", "Carte"));

    // En-tête de la journée
    const head = h("div", { class: "world world-" + day.theme });
    head.appendChild(h("div", { class: "world-head" },
      h("div", { class: "world-emoji" }, day.type === "boss" ? "👑" : day.emoji),
      h("div", {},
        h("div", { class: "world-name" }, "Jour " + day.day + " — " + day.worldName),
        h("div", { class: "world-sub" }, day.title))));
    head.appendChild(h("div", { class: "row", style: { marginTop: "6px" } },
      h("span", { class: "pill" }, day.type === "boss" ? "👑 BOSS" : day.type === "fun" ? "🎉 Découverte" : "✏️ Entraînement"),
      h("span", { class: "pill" }, "⏱️ " + day.minMin + "–" + day.maxMin + " min"),
      h("span", { class: "timer-bar", id: "timer-label" }, "0 min")));
    c.appendChild(head);

    if (day.type === "boss") return renderBossOverview(c, day, state);

    // Étapes (modules) de la journée
    const wrap = h("div");
    let allDone = true;
    day.modules.forEach((mid) => {
      const mod = CV.getModule(mid);
      if (!mod) return;
      const done = state.progress[mid] && state.progress[mid].done;
      if (!done) allDone = false;
      const subjLabel = { francais: "Français", maths: "Maths", sciences: "Sciences", culture: "Culture" }[mod.subject] || "";
      const card = h("div", { class: "card row", style: { gap: "14px", cursor: "pointer" }, onclick: () => playModule(mod, day) },
        h("div", { style: { fontSize: "34px" } }, mod.icon),
        h("div", { style: { flex: "1" } },
          h("div", { class: "pill", style: { marginBottom: "4px" } }, subjLabel + (mod.isDictee ? " · Dictée" : "")),
          h("div", { style: { fontWeight: "bold", color: "var(--ink)" } }, mod.title)),
        done ? h("div", { style: { fontSize: "20px" } }, "⭐".repeat(state.progress[mid].bestStars || 1))
             : h("div", { class: "btn small" }, "Jouer →")
      );
      wrap.appendChild(card);
    });
    c.appendChild(wrap);

    if (allDone) {
      c.appendChild(h("button", { class: "btn big gold block mt", onclick: () => finishDay(day) },
        "🏁 Terminer la journée"));
    } else {
      c.appendChild(h("p", { class: "center muted mt" }, "Fais chaque étape : une petite leçon, puis le défi !"));
    }
  }

  function renderBossOverview(c, day, state) {
    const already = state.dayProgress && state.dayProgress[day.day] && state.dayProgress[day.day].done;
    c.appendChild(h("div", { class: "card center" },
      h("div", { class: "lesson-icon" }, "👑"),
      h("h2", {}, "Le Grand Défi !"),
      h("p", {}, "Un quiz qui mélange tout ce que tu as appris dans ce monde. Réussis-le pour devenir le héros et débloquer la suite !"),
      h("button", { class: "btn big block mt", onclick: () => playBoss(day) }, "⚔️ Affronter le défi"),
      already ? h("p", { class: "muted mt" }, "Déjà réussi — tu peux le rejouer pour gagner plus d'étoiles.") : null
    ));
  }

  /* ---------- Leçon ---------- */
  function playModule(mod, day) {
    UI.applyTheme(day.theme);
    const c = screen();
    c.appendChild(backBar("#/jour/" + day.day, "Jour " + day.day));
    const card = h("div", { class: "card" });
    card.appendChild(h("div", { class: "lesson-icon" }, mod.icon));
    card.appendChild(h("h2", { class: "center" }, mod.title));
    card.appendChild(h("p", {}, mod.lesson.intro));
    const ul = h("ul", { class: "lesson-points" });
    mod.lesson.points.forEach((p) => ul.appendChild(h("li", { html: p })));
    card.appendChild(ul);
    if (mod.lesson.example) card.appendChild(h("div", { class: "lesson-example", html: "📌 " + mod.lesson.example }));
    if (mod.lesson.tip) card.appendChild(h("div", { class: "lesson-tip", html: mod.lesson.tip }));
    card.appendChild(h("button", { class: "btn big block mt", onclick: () => playExercises(mod, day) },
      mod.isDictee ? "🎧 Commencer la dictée →" : "✏️ Au défi ! →"));
    c.appendChild(card);
  }

  /* ---------- Exercices d'un module ---------- */
  function playExercises(mod, day) {
    const c = screen();
    c.appendChild(backBar("#/jour/" + day.day, "Jour " + day.day));
    c.appendChild(h("h2", { class: "section-title" }, mod.icon + " " + mod.title));
    const box = h("div", { class: "card" });
    c.appendChild(box);
    CV.Engine.run(box, mod.exercises, {
      onComplete: ({ correct, total }) => {
        const res = Game.awardModule(Store.current(), mod, correct, total);
        Store.save();
        showModuleResult(mod, day, correct, total, res);
      }
    });
  }

  function showModuleResult(mod, day, correct, total, res) {
    const c = screen();
    const state = Store.current();
    const allDone = day.modules.every((mid) => state.progress[mid] && state.progress[mid].done);
    UI.victory(c, {
      emoji: res.stars === 3 ? "🌟" : "🎉",
      title: res.stars === 3 ? "Sans faute, incroyable !" : "Bien joué !",
      stars: res.stars,
      subtitle: correct + " / " + total + " bonnes réponses",
      xp: res.xpGained,
      badges: res.newBadges,
      cta: allDone ? "🏁 Terminer la journée" : "Étape suivante →",
      onContinue: () => {
        if (res.leveledUp) UI.toast("⬆️ Niveau " + res.newLevel + " atteint ! Bravo !");
        if (allDone) finishDay(day); else renderDay(day.day);
      }
    });
  }

  /* ---------- Boss ---------- */
  function playBoss(day) {
    const exs = CV.buildBossExercises(day, 8);
    const c = screen();
    c.appendChild(backBar("#/jour/" + day.day, "Jour " + day.day));
    c.appendChild(h("h2", { class: "section-title" }, "👑 Le Grand Défi"));
    const box = h("div", { class: "card" });
    c.appendChild(box);
    if (!exs.length) { box.appendChild(h("p", {}, "Reviens après avoir fait les journées d'entraînement de ce monde !")); return; }
    CV.Engine.run(box, exs, {
      onComplete: ({ correct, total }) => {
        const state = Store.current();
        const stars = Game.starsForScore(correct, total);
        state.xp += correct * 10;
        Store.save();
        finishDay(day, stars, correct, total);
      }
    });
  }

  /* ---------- Fin de journée ---------- */
  function finishDay(day, bossStars, bossCorrect, bossTotal) {
    stopTimer();
    const state = Store.current();
    let stars;
    if (day.type === "boss") stars = bossStars || 2;
    else {
      const arr = day.modules.map((mid) => (state.progress[mid] && state.progress[mid].bestStars) || 1);
      stars = Math.round(arr.reduce((a, b) => a + b, 0) / Math.max(1, arr.length));
    }
    const r = Game.completeDay(state, day, stars);
    Store.save();

    const finished = (state.currentDay > CV.TOTAL_DAYS) || Object.keys(state.dayProgress).length >= CV.TOTAL_DAYS;
    const c = screen();
    UI.victory(c, {
      emoji: day.type === "boss" ? "👑" : "🏁",
      title: day.type === "boss" ? "Monde terminé, tu es un héros !" : "Journée réussie !",
      stars: stars,
      subtitle: day.type === "boss"
        ? (bossCorrect != null ? bossCorrect + " / " + bossTotal + " au défi final" : "Quel champion !")
        : "Tu as gagné +" + day.reward + " XP de bonus.",
      xp: day.type === "boss" ? null : day.reward,
      badges: r.newBadges,
      cta: finished ? "🎓 Voir mes trophées" : "Retour à la carte 🗺️",
      onContinue: () => {
        if (finished) { UI.toast("🎓 Parcours terminé, prêt pour le CM1 !"); goto("#/recompenses"); }
        else goto("#/carte");
      }
    });
  }

  /* ---------- Minuteur de session ---------- */
  function startSession(day) {
    stopTimer();
    session = { start: Date.now(), min: day.minMin, max: day.maxMin, minFlag: false, maxFlag: false };
    timerInterval = setInterval(() => {
      const mins = (Date.now() - session.start) / 60000;
      const label = document.getElementById("timer-label");
      if (label) label.textContent = Math.floor(mins) + " min";
      if (!session.minFlag && mins >= session.min) {
        session.minFlag = true;
        UI.toast("👏 Temps minimum atteint ! Tu peux continuer ou faire une pause.");
      }
      if (!session.maxFlag && mins >= session.max) {
        session.maxFlag = true;
        UI.toast("⏰ Super session ! C'est le moment de faire une pause. 🧃");
      }
    }, 1000);
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
      statLine("Jours réussis", Object.keys(state.dayProgress || {}).length + " / " + CV.TOTAL_DAYS),
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

    // Choix du thème (univers)
    const themeCard = h("div", { class: "card glass" }, h("strong", {}, "Mon univers préféré"));
    const pick = h("div", { class: "theme-pick mt" });
    [["espace", "🚀 Espace", "world-espace"], ["pirates", "🏴‍☠️ Pirates", "world-pirates"], ["chevaliers", "⚔️ Chevaliers", "world-chevaliers"]]
      .forEach(([key, label, cls]) => {
        pick.appendChild(h("div", { class: "theme-opt " + cls + (state.theme === key ? " sel" : ""), onclick: () => {
          Store.set({ theme: key }); UI.applyTheme(key); renderProfil();
        } }, label));
      });
    themeCard.appendChild(pick);
    c.appendChild(themeCard);

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
