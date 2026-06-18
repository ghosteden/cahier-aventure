/* =========================================================
   STORE — état du joueur, sauvegarde locale, multi-joueurs.
   La sauvegarde locale (localStorage) est la source de vérité
   sur l'appareil ; sync.js la synchronise avec le cloud.
   ========================================================= */
window.CV = window.CV || {};

CV.Store = (function () {
  const K_PLAYERS = "cv:players";   // annuaire local des joueurs de cet appareil
  const K_CURRENT = "cv:current";   // id du joueur connecté
  const K_STATE   = (id) => "cv:state:" + id;

  let state = null;
  const listeners = [];

  /* Identifiant stable à partir du prénom (+ code classe) :
     minuscules, sans accents, sans espaces. */
  function normId(name, classCode) {
    const slug = (s) => (s || "")
      .toString().trim().toLowerCase()
      .normalize("NFD").replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const n = slug(name);
    const c = slug(classCode);
    return c ? c + "__" + n : n;
  }

  function defaultState(name, classCode) {
    return {
      version: 1,
      player: normId(name, classCode),
      displayName: (name || "Explorateur").trim(),
      classCode: (classCode || "").trim(),
      theme: "espace",
      grade: "CE2",
      xp: 0,
      level: 1,
      stars: 0,
      streak: { count: 0, lastDate: null },
      badges: [],
      progress: {},      // moduleId -> { done:true, bestStars, lastScore }
      dayProgress: {},   // numéro de jour -> { done:true, stars }
      currentDay: 1,
      settings: { minMin: 20, maxMin: 35, sound: true, cloud: true },
      stats: { totalCorrect: 0, totalAnswered: 0, sessions: 0, modulesDone: 0 },
      createdAt: nowISO(),
      updatedAt: Date.now()
    };
  }

  // Date.now() est disponible ici (hors workflow).
  function nowISO() { return new Date().toISOString().slice(0, 10); }

  function readJSON(key, fallback) {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
    catch (e) { return fallback; }
  }
  function writeJSON(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {}
  }

  function listPlayers() { return readJSON(K_PLAYERS, []); }

  function rememberPlayer(s) {
    const players = listPlayers().filter((p) => p.player !== s.player);
    players.unshift({ player: s.player, displayName: s.displayName, classCode: s.classCode, theme: s.theme });
    writeJSON(K_PLAYERS, players.slice(0, 12));
  }

  function emit() { listeners.forEach((cb) => { try { cb(state); } catch (e) {} }); }

  /* ---- API publique ---- */
  return {
    normId,

    onChange(cb) { listeners.push(cb); return () => { const i = listeners.indexOf(cb); if (i >= 0) listeners.splice(i, 1); }; },

    listPlayers,

    current() { return state; },

    isLoggedIn() { return !!state; },

    /* Connexion : charge le joueur existant ou en crée un nouveau.
       opts.cloud (true/false) fixe la préférence de sauvegarde. */
    login(name, classCode, opts) {
      const id = normId(name, classCode);
      let s = readJSON(K_STATE(id), null);
      if (!s) s = defaultState(name, classCode);
      if (!s.settings) s.settings = { minMin: 20, maxMin: 35, sound: true, cloud: true };
      if (opts && typeof opts.cloud === "boolean") s.settings.cloud = opts.cloud;
      // si le joueur existe déjà mais qu'on a changé l'affichage du prénom
      if (name && name.trim()) s.displayName = name.trim();
      state = s;
      writeJSON(K_CURRENT, id);
      rememberPlayer(state);
      this.save({ silent: true });
      // Récupère la sauvegarde cloud et fusionne (la plus récente gagne)
      if (CV.Sync && state.settings.cloud) CV.Sync.pull(state).then((remote) => {
        if (remote && remote.updatedAt && remote.updatedAt > state.updatedAt) {
          state = Object.assign(state, remote);
          writeJSON(K_STATE(state.player), state);
          emit();
        }
      }).catch(() => {});
      emit();
      return state;
    },

    /* Reconnexion automatique du dernier joueur de cet appareil. */
    autoLogin() {
      const id = readJSON(K_CURRENT, null);
      if (!id) return null;
      const s = readJSON(K_STATE(id), null);
      if (!s) return null;
      state = s;
      if (CV.Sync && state.settings && state.settings.cloud) CV.Sync.pull(state).then((remote) => {
        if (remote && remote.updatedAt && remote.updatedAt > state.updatedAt) {
          state = Object.assign(state, remote);
          writeJSON(K_STATE(state.player), state);
          emit();
        }
      }).catch(() => {});
      emit();
      return state;
    },

    /* Active ou désactive la sauvegarde cloud.
       En désactivant, on EFFACE la sauvegarde stockée en ligne. */
    setCloud(enabled) {
      if (!state) return;
      state.settings.cloud = !!enabled;
      this.save();
      if (enabled) {
        if (CV.Sync) CV.Sync.push(state);
      } else {
        if (CV.Sync) CV.Sync.remove(state.player);
      }
    },

    logout() {
      state = null;
      try { localStorage.removeItem(K_CURRENT); } catch (e) {}
      emit();
    },

    /* Modifie l'état avec une fonction, puis sauvegarde. */
    update(fn, opts) {
      if (!state) return;
      fn(state);
      this.save(opts);
    },

    set(patch, opts) {
      if (!state) return;
      Object.assign(state, patch);
      this.save(opts);
    },

    save(opts) {
      if (!state) return;
      opts = opts || {};
      state.updatedAt = Date.now();
      writeJSON(K_STATE(state.player), state);
      rememberPlayer(state);
      if (!opts.silent) emit();
      if (CV.Sync && state.settings && state.settings.cloud) CV.Sync.pushDebounced(state);
    },

    /* Applique un état distant reçu du cloud. */
    applyRemote(remote) {
      if (!state || !remote) return;
      if (remote.updatedAt && remote.updatedAt >= state.updatedAt) {
        state = Object.assign(state, remote);
        writeJSON(K_STATE(state.player), state);
        emit();
      }
    },

    /* Réinitialise la progression du joueur courant (garde le compte). */
    resetProgress() {
      if (!state) return;
      const fresh = defaultState(state.displayName, state.classCode);
      fresh.theme = state.theme;
      state = fresh;
      this.save();
    }
  };
})();
