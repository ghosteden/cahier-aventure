/* =========================================================
   GAMIFICATION — XP, niveaux, étoiles, badges, série de jours.
   But : que l'enfant soit fier et ait envie de revenir.
   ========================================================= */
window.CV = window.CV || {};

CV.Game = (function () {
  const XP_PER_LEVEL = 150;

  function levelInfo(xp) {
    const level = Math.floor(xp / XP_PER_LEVEL) + 1;
    const into = xp % XP_PER_LEVEL;
    return { level, into, need: XP_PER_LEVEL, pct: Math.round((into / XP_PER_LEVEL) * 100) };
  }

  function starsForScore(correct, total) {
    if (total <= 0) return 1;
    const r = correct / total;
    if (r >= 0.9) return 3;
    if (r >= 0.6) return 2;
    return 1;
  }

  /* ---- Dates locales pour la série ---- */
  function dStr(d) { return d.toISOString().slice(0, 10); }
  function todayStr() { return dStr(new Date()); }
  function yesterdayStr() { const d = new Date(); d.setDate(d.getDate() - 1); return dStr(d); }

  function touchStreak(state) {
    const t = todayStr();
    if (!state.streak) state.streak = { count: 0, lastDate: null };
    if (state.streak.lastDate === t) return false; // déjà compté aujourd'hui
    state.streak.count = state.streak.lastDate === yesterdayStr() ? state.streak.count + 1 : 1;
    state.streak.lastDate = t;
    return true;
  }

  /* ---- Badges ---- */
  const BADGES = [
    { id: "first",     emoji: "🌟", name: "Premier pas",     check: (s) => (s.stats.modulesDone || 0) >= 1 },
    { id: "five",      emoji: "🖐️", name: "Cinq défis",      check: (s) => (s.stats.modulesDone || 0) >= 5 },
    { id: "ten",       emoji: "🔟", name: "Dix défis",       check: (s) => (s.stats.modulesDone || 0) >= 10 },
    { id: "streak3",   emoji: "🔥", name: "3 jours d'affilée", check: (s) => (s.streak.count || 0) >= 3 },
    { id: "streak7",   emoji: "🚀", name: "Une semaine !",   check: (s) => (s.streak.count || 0) >= 7 },
    { id: "perfect",   emoji: "💯", name: "Sans-faute",      check: (s) => Object.values(s.progress).some((p) => p.bestStars === 3) },
    { id: "speller",   emoji: "🎧", name: "As de la dictée",  check: (s) => !!s.flags && s.flags.dicteeDone },
    { id: "explorer",  emoji: "🔬", name: "Explorateur",      check: (s) => !!s.flags && s.flags.funDone },
    { id: "level5",    emoji: "⭐", name: "Niveau 5",         check: (s) => levelInfo(s.xp).level >= 5 },
    { id: "level10",   emoji: "✨", name: "Niveau 10",        check: (s) => levelInfo(s.xp).level >= 10 },
    { id: "boss_dino", emoji: "🦖", name: "Maître des Dinos",  check: (s) => !!s.flags && s.flags.boss_dinosaure },
    { id: "boss_uly",  emoji: "🏛️", name: "Héros de l'Olympe", check: (s) => !!s.flags && s.flags.boss_ulysse },
    { id: "boss_chev", emoji: "⚔️", name: "Grand Chevalier",  check: (s) => !!s.flags && s.flags.boss_chevaliers },
    { id: "boss_pir",  emoji: "🏴‍☠️", name: "Roi des Pirates", check: (s) => !!s.flags && s.flags.boss_pirate },
    { id: "boss_esp",  emoji: "🚀", name: "Héros de l'Espace", check: (s) => !!s.flags && s.flags.boss_espace },
    { id: "cm1",       emoji: "🎓", name: "Prêt pour le CM1",  check: (s) => Object.keys(s.dayProgress || {}).length >= CV.TOTAL_DAYS }
  ];

  function evaluateBadges(state) {
    if (!state.badges) state.badges = [];
    const earned = [];
    BADGES.forEach((b) => {
      if (!state.badges.includes(b.id) && b.check(state)) {
        state.badges.push(b.id);
        earned.push(b);
      }
    });
    return earned;
  }

  function badgeList() { return BADGES; }

  /* ---- Récompense d'un module terminé ---- */
  function awardModule(state, mod, correct, total) {
    const stars = starsForScore(correct, total);
    const firstTime = !state.progress[mod.id];
    const prev = state.progress[mod.id] || { bestStars: 0 };

    // XP : 8 par bonne réponse + bonus étoiles ; un peu moins en rejouant.
    let xpGained = correct * 8 + stars * 10;
    if (!firstTime) xpGained = Math.round(xpGained * 0.4);

    const before = levelInfo(state.xp).level;
    state.xp += xpGained;
    state.stars = (state.stars || 0) + (firstTime ? stars : Math.max(0, stars - prev.bestStars));
    const after = levelInfo(state.xp).level;

    state.progress[mod.id] = {
      done: true,
      bestStars: Math.max(prev.bestStars || 0, stars),
      lastScore: correct + "/" + total
    };
    if (firstTime) state.stats.modulesDone = (state.stats.modulesDone || 0) + 1;
    state.stats.totalCorrect = (state.stats.totalCorrect || 0) + correct;
    state.stats.totalAnswered = (state.stats.totalAnswered || 0) + total;

    // Drapeaux pour les badges
    state.flags = state.flags || {};
    if (mod.isDictee) state.flags.dicteeDone = true;
    if (mod.subject === "sciences" || mod.subject === "culture") state.flags.funDone = true;

    touchStreak(state);
    const newBadges = evaluateBadges(state);

    return { xpGained, stars, leveledUp: after > before, newLevel: after, newBadges };
  }

  /* ---- Récompense d'une journée terminée (toutes ses étapes) ---- */
  function completeDay(state, dayObj, stars) {
    state.dayProgress = state.dayProgress || {};
    const prev = state.dayProgress[dayObj.day];
    const firstTime = !prev;
    state.dayProgress[dayObj.day] = { done: true, stars: Math.max(prev ? prev.stars : 0, stars) };

    if (firstTime) {
      state.xp += dayObj.reward || 0;
      state.stats.sessions = (state.stats.sessions || 0) + 1;
    }
    // Avance le jour courant si on vient de finir le jour courant
    if (dayObj.day >= (state.currentDay || 1) && dayObj.day < CV.TOTAL_DAYS) {
      state.currentDay = dayObj.day + 1;
    }
    state.flags = state.flags || {};
    if (dayObj.type === "boss") state.flags["boss_" + dayObj.world] = true;

    touchStreak(state);
    const newBadges = evaluateBadges(state);
    return { newBadges };
  }

  return { levelInfo, starsForScore, touchStreak, evaluateBadges, badgeList, awardModule, completeDay };
})();
