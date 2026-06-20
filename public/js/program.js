/* =========================================================
   PROGRAM — 5 mondes, chacun avec 8 leçons + 1 boss (9 cases).
   Ordre de progression : dinosaure → ulysse → chevaliers → pirate → espace.
   Chaque monde a sa carte (image) et son personnage (sprite).
   Les cases (nodes) sont positionnées en % le long du chemin de la carte.
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

CV.LEVELS_PER_WORLD = 9;   // 8 leçons + 1 boss
CV.TOTAL_DAYS = 45;        // 5 mondes × 9 (nom conservé pour compatibilité)

/* ---- Les 5 mondes ----
   nodes : 9 positions [x%, y%] sur la carte (la 9e = boss).
   grid  : grille de la planche d'animation pour afficher une pose fixe. */
CV.WORLDS = [
  {
    key: "dinosaure", theme: "dinosaure", emoji: "🦖",
    name: "Le Domaine des Dinosaures",
    intro: "Remonte le temps jusqu'au volcan des dinos !",
    map: "assets/map-dinosaure.png", sprite: "assets/sprite-dinosaure.png",
    grid: { cols: 6, rows: 4, col: 0, row: 0 },
    nodes: [[12, 52], [19, 72], [29, 60], [34, 40], [43, 72], [51, 55], [62, 46], [72, 57], [85, 30]]
  },
  {
    key: "ulysse", theme: "ulysse", emoji: "🏛️",
    name: "L'Alliance des Dieux et des Héros",
    intro: "Voyage de la Grèce antique jusqu'au royaume gelé !",
    map: "assets/map-ulysse.png", sprite: "assets/sprite-ulysse.png",
    grid: { cols: 6, rows: 4, col: 0, row: 0 },
    nodes: [[12, 55], [20, 40], [25, 68], [34, 76], [46, 55], [58, 44], [67, 70], [78, 55], [88, 33]]
  },
  {
    key: "chevaliers", theme: "chevaliers", emoji: "⚔️",
    name: "Le Royaume des Chevaliers",
    intro: "Mène ta quête jusqu'au grand château !",
    map: "assets/map-chevalier.png", sprite: "assets/sprite-chevalier.png",
    grid: { cols: 6, rows: 4, col: 0, row: 0 },
    nodes: [[10, 60], [18, 44], [27, 70], [37, 60], [46, 78], [56, 55], [65, 70], [76, 50], [88, 27]]
  },
  {
    key: "pirate", theme: "pirates", emoji: "🏴‍☠️",
    name: "Le Domaine des Pirates",
    intro: "Vogue d'île en île jusqu'au trésor maudit !",
    map: "assets/map-pirate.png", sprite: "assets/sprite-pirate.png",
    grid: { cols: 6, rows: 4, col: 0, row: 0 },
    nodes: [[13, 50], [20, 70], [30, 60], [40, 78], [49, 54], [58, 72], [68, 57], [78, 72], [88, 40]]
  },
  {
    key: "espace", theme: "espace", emoji: "🚀",
    name: "L'Odyssée Cosmique des Savoirs",
    intro: "Explore le système solaire jusqu'à Pluton !",
    map: "assets/map-espace.png", sprite: "assets/sprite-espace.png",
    grid: { cols: 6, rows: 4, col: 0, row: 0 },
    nodes: [[14, 80], [15, 70], [23, 75], [28, 63], [43, 57], [57, 53], [66, 62], [73, 50], [86, 40]]
  }
];

CV.worldByIndex = function (i) { return CV.WORLDS[i] || CV.WORLDS[0]; };
CV.worldIndexOfLevel = function (lvl) { return Math.floor((lvl - 1) / CV.LEVELS_PER_WORLD); };
CV.nodeIndexOfLevel = function (lvl) { return (lvl - 1) % CV.LEVELS_PER_WORLD; };
CV.levelNumber = function (worldIndex, nodeIndex) { return worldIndex * CV.LEVELS_PER_WORLD + nodeIndex + 1; };

/* ---- Construction des 45 niveaux ---- */
CV.buildProgram = function () {
  if (CV._program) return CV._program;

  // Répartition des modules sur les 40 cases-leçon en alternant les matières.
  const fr  = (CV.content.francais || []);
  const ma  = (CV.content.maths || []);
  const fun = (CV.content.sciences || []).concat(CV.content.culture || []);
  const order = [];
  const maxLen = Math.max(fr.length, ma.length, fun.length);
  for (let i = 0; i < maxLen; i++) {
    if (fr.length) order.push(fr[i % fr.length]);
    if (ma.length) order.push(ma[i % ma.length]);
    if (i % 2 === 1 && fun.length) order.push(fun[i % fun.length]);
  }
  let cur = 0;
  const nextModule = () => order[(cur++) % order.length];

  const levels = [];
  CV.WORLDS.forEach((w, wi) => {
    const lessonIds = [];
    for (let n = 0; n < CV.LEVELS_PER_WORLD; n++) {
      const level = CV.levelNumber(wi, n);
      const isBoss = n === CV.LEVELS_PER_WORLD - 1;
      if (isBoss) {
        levels.push({
          level, day: level, world: w.key, worldName: w.name, theme: w.theme, worldEmoji: w.emoji,
          indexInWorld: n, type: "boss", isBoss: true,
          moduleId: null, sourceModules: lessonIds.slice(),
          title: "BOSS — " + w.name, reward: 150
        });
      } else {
        const mod = nextModule();
        lessonIds.push(mod.id);
        levels.push({
          level, day: level, world: w.key, worldName: w.name, theme: w.theme, worldEmoji: w.emoji,
          indexInWorld: n, type: "lesson", isBoss: false,
          moduleId: mod.id, sourceModules: null,
          title: mod.title, reward: 40
        });
      }
    }
  });

  CV._program = levels;
  return levels;
};

CV.getLevel = function (n) {
  const p = CV.buildProgram();
  return p.find((l) => l.level === n) || null;
};

/* Quiz de boss : échantillon réparti sur les modules du monde. */
CV.buildBossExercises = function (levelObj, count) {
  count = count || 8;
  const out = [];
  const sources = (levelObj.sourceModules || []).map((id) => CV.getModule(id)).filter(Boolean);
  if (!sources.length) return out;
  let i = 0;
  while (out.length < count && i < count * Math.max(1, sources.length)) {
    const mod = sources[i % sources.length];
    const exs = (mod.exercises || []).filter((e) => e.type !== "dictee");
    if (exs.length) {
      const ex = exs[Math.floor(i / sources.length) % exs.length];
      if (!out.some((o) => o.q === ex.q)) out.push(Object.assign({ _from: mod.title }, ex));
    }
    i++;
  }
  return out.slice(0, count);
};
