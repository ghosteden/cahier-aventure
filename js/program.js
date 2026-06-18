/* =========================================================
   PROGRAM — construit le "Parcours d'été" sur 56 jours (8 semaines)
   3 mondes thématiques qui s'enchaînent, avec un rythme :
   travail intensif (français + maths) entrecoupé de journées "fun"
   (sciences / culture), et un BOSS à la fin de chaque monde.
   ========================================================= */
window.CV = window.CV || {};

/* ---- Accès au contenu ---- */
CV.allModules = function () {
  const all = [];
  ["francais", "maths", "sciences", "culture"].forEach((s) => {
    (CV.content[s] || []).forEach((m) => all.push(m));
  });
  return all;
};
CV._moduleIndex = null;
CV.getModule = function (id) {
  if (!CV._moduleIndex) {
    CV._moduleIndex = {};
    CV.allModules().forEach((m) => (CV._moduleIndex[m.id] = m));
  }
  return CV._moduleIndex[id] || null;
};

/* ---- Définition des 3 mondes ---- */
CV.WORLDS = [
  { key: "espace",     theme: "espace",     emoji: "🚀", name: "La Galaxie des Savoirs", hero: "astronaute", start: 1,  end: 19,
    intro: "Embarque dans ta fusée ! Chaque défi réussi éclaire une nouvelle planète." },
  { key: "pirates",    theme: "pirates",    emoji: "🏴‍☠️", name: "L'Île au Trésor",      hero: "moussaillon", start: 20, end: 38,
    intro: "Hisse les voiles, moussaillon ! Le trésor des savoirs t'attend au bout de la carte." },
  { key: "chevaliers", theme: "chevaliers", emoji: "⚔️", name: "Le Royaume des Chevaliers", hero: "chevalier", start: 39, end: 56,
    intro: "Deviens chevalier ! Relève les quêtes pour gagner ton armure et ton titre de CM1." }
];

CV.worldOfDay = function (day) {
  return CV.WORLDS.find((w) => day >= w.start && day <= w.end) || CV.WORLDS[0];
};

CV.TOTAL_DAYS = 56;

/* Durées conseillées par type de journée (minutes) */
CV.SESSION = {
  intensif: { min: 20, max: 35 },
  fun:      { min: 12, max: 25 },
  boss:     { min: 15, max: 30 }
};

/* ---- Construction du parcours ----
   Rythme sur 7 jours : I I I  F  I I  F   (5 intensifs, 2 fun)
   Les fins de monde (19, 38, 56) deviennent des BOSS.            */
CV.buildProgram = function () {
  if (CV._program) return CV._program;

  const PATTERN = ["intensif", "intensif", "intensif", "fun", "intensif", "intensif", "fun"];

  // Listes de modules par catégorie (les dictées sont séparées du français "normal")
  const frReg   = (CV.content.francais || []).filter((m) => !m.isDictee);
  const dictees = (CV.content.francais || []).filter((m) => m.isDictee);
  const maths   = CV.content.maths || [];
  const sci     = CV.content.sciences || [];
  const cul     = CV.content.culture || [];

  const cur = { fr: 0, di: 0, ma: 0, sc: 0, cu: 0 };
  const next = (arr, key) => {
    if (!arr.length) return null;
    const m = arr[cur[key] % arr.length];
    cur[key]++;
    return m;
  };

  const bossDays = CV.WORLDS.map((w) => w.end);
  const days = [];
  let intensifCount = 0;
  let funCount = 0;

  for (let d = 1; d <= CV.TOTAL_DAYS; d++) {
    const world = CV.worldOfDay(d);
    let type = PATTERN[(d - 1) % PATTERN.length];
    if (bossDays.includes(d)) type = "boss";

    const session = CV.SESSION[type];
    const dayNumInWorld = d - world.start + 1;
    let modules = [];
    let title = "";
    let emoji = world.emoji;
    let sourceModules = null;

    if (type === "intensif") {
      intensifCount++;
      // Toutes les 3 journées intensives, une DICTÉE remplace la leçon de français.
      let frModule;
      if (intensifCount % 3 === 0 && dictees.length) {
        frModule = next(dictees, "di");
      } else {
        frModule = next(frReg, "fr");
      }
      const maModule = next(maths, "ma");
      modules = [frModule, maModule].filter(Boolean).map((m) => m.id);
      title = "Entraînement : Français + Maths";
      emoji = frModule && frModule.isDictee ? "🎧" : "✏️";
    } else if (type === "fun") {
      funCount++;
      // On alterne sciences / culture
      const m = funCount % 2 === 1 ? next(sci, "sc") : next(cul, "cu");
      modules = m ? [m.id] : [];
      title = "Journée Découverte 🎉";
      emoji = m ? m.icon : "🎉";
    } else if (type === "boss") {
      // Le boss reprend tous les modules travaillés dans ce monde.
      const studied = days
        .filter((x) => x.world === world.key && x.type === "intensif")
        .flatMap((x) => x.modules);
      sourceModules = [...new Set(studied)];
      title = "BOSS — Le Grand Défi de " + world.name + " !";
      emoji = "👑";
    }

    days.push({
      day: d,
      world: world.key,
      worldName: world.name,
      worldEmoji: world.emoji,
      theme: world.theme,
      type,
      dayNumInWorld,
      title,
      emoji,
      modules,
      sourceModules,
      minMin: session.min,
      maxMin: session.max,
      reward: type === "boss" ? 120 : type === "intensif" ? 40 : 25
    });
  }

  CV._program = days;
  return days;
};

CV.getDay = function (n) {
  const p = CV.buildProgram();
  return p.find((d) => d.day === n) || null;
};

/* Construit la liste d'exercices d'un BOSS : un échantillon réparti
   sur les modules étudiés dans le monde. */
CV.buildBossExercises = function (dayObj, count) {
  count = count || 8;
  const out = [];
  const sources = (dayObj.sourceModules || []).map((id) => CV.getModule(id)).filter(Boolean);
  if (!sources.length) return out;
  let i = 0;
  // On pioche en tournant sur les modules pour varier les matières.
  while (out.length < count && i < count * sources.length) {
    const mod = sources[i % sources.length];
    const exs = (mod.exercises || []).filter((e) => e.type !== "dictee");
    if (exs.length) {
      const ex = exs[Math.floor(i / sources.length) % exs.length];
      // évite les doublons immédiats
      if (!out.some((o) => o.q === ex.q)) out.push(Object.assign({ _from: mod.title }, ex));
    }
    i++;
  }
  return out.slice(0, count);
};
