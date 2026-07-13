/* =========================================================
   GAMIFICATION — XP, niveaux, étoiles, badges, série de jours.
   But : que l'enfant soit fier et ait envie de revenir.
   ========================================================= */
window.CV = window.CV || {};

CV.Game = (function () {
  /* Étoiles selon la réussite (0 si mal réussi, jusqu'à 3) :
     ≥90% → 3 · ≥65% → 2 · ≥40% → 1 · sinon 0. */
  function starsForScore(correct, total) {
    if (total <= 0) return 0;
    const r = correct / total;
    if (r >= 0.9) return 3;
    if (r >= 0.65) return 2;
    if (r >= 0.4) return 1;
    return 0;
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
    { id: "stars15",   emoji: "⭐", name: "15 étoiles",       check: (s) => (s.stars || 0) >= 15 },
    { id: "stars40",   emoji: "✨", name: "40 étoiles",       check: (s) => (s.stars || 0) >= 40 },
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

    state.stars = (state.stars || 0) + (firstTime ? stars : Math.max(0, stars - prev.bestStars));

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

    return { stars, newBadges };
  }

  /* ---- Récompense d'une journée terminée (toutes ses étapes) ----
     skipped = le niveau a été « passé » sans être joué. On le retient : Pluton exige les
     8 planètes JOUÉES. Un niveau déjà joué pour de vrai ne redevient jamais « passé ». */
  function completeDay(state, dayObj, stars, skipped) {
    state.dayProgress = state.dayProgress || {};
    const prev = state.dayProgress[dayObj.day];
    const firstTime = !prev;
    const playedBefore = prev && prev.done && !prev.skipped;
    state.dayProgress[dayObj.day] = {
      done: true,
      stars: Math.max(prev ? prev.stars : 0, stars),
      skipped: !!skipped && !playedBefore
    };

    if (firstTime) {
      state.stats.sessions = (state.stats.sessions || 0) + 1;
    }
    // Avance le jour courant si on vient de finir le jour courant.
    // Monde en ordre libre (l'Espace) : les planètes se jouent dans le désordre, le curseur
    // ne bouge donc pas — il ne saute sur le boss que quand les 8 sont jouées.
    const wi = CV.worldIndexOfLevel(dayObj.day);
    const freeLesson = CV.worldByIndex(wi).freeOrder && CV.nodeIndexOfLevel(dayObj.day) < CV.BOSS_NODE;
    if (freeLesson) {
      if (CV.plutonUnlocked(state)) state.currentDay = CV.levelNumber(wi, CV.BOSS_NODE);
    } else if (dayObj.day >= (state.currentDay || 1) && dayObj.day < CV.TOTAL_DAYS) {
      state.currentDay = dayObj.day + 1;
    }
    state.flags = state.flags || {};
    if (dayObj.type === "boss") state.flags["boss_" + dayObj.world] = true;

    touchStreak(state);
    const newBadges = evaluateBadges(state);
    return { newBadges };
  }

  return { starsForScore, touchStreak, evaluateBadges, badgeList, awardModule, completeDay };
})();
