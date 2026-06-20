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
    anim: {
      idle:  { strip: "assets/hero-dinosaure-idle.png",  frames: 6, dur: 0.9 },
      walk:  { strip: "assets/hero-dinosaure-walk.png",  frames: 8, dur: 0.8 },
      happy: { strip: "assets/hero-dinosaure-happy.png", frames: 4, dur: 0.6 },
      sad:   { strip: "assets/hero-dinosaure-sad.png",   frames: 3, dur: 0.8 },
      jump:  { strip: "assets/hero-dinosaure-jump.png",  frames: 4, dur: 0.7 }
    },
    nodes: [[35.6, 47.9], [18, 55], [26, 68.2], [57.3, 76.6], [46.7, 43.6], [64.6, 25.8], [69.7, 43.2], [77.2, 55.7], [84.7, 32.4]],
    // Chemins entre pierres : paths[i] = tracé du nœud i au nœud i+1. "jump" = saut vers le point suivant.
    // Le dernier point de chaque tracé = position de repos du dino à côté de la pierre d'arrivée.
    paths: [
      [[31.6, 49.7], [28.1, 51.6], "jump", [24.2, 52.2], [20.7, 53.5]],
      [[16.3, 57.7], [20.1, 64.6], "jump", [24.1, 67.1]],
      [[28, 71.7], [32.7, 84.3], [40.4, 88.3], [48.4, 84], [54, 78.8], [55.4, 77.6]],
      [[61.1, 71.8], [51.2, 63.4], [48.1, 56.5], [43.3, 51.9], [45.8, 45.7]],
      [[47.9, 40.9], [50.3, 30.7], [57.7, 25], "jump", [61.7, 26.2]],
      [[69.7, 30.5], [68.6, 40.4]],
      [[70.7, 46.4], [71.7, 51], [74.7, 55.3]],
      [[80.6, 57.9], [85.4, 56.2], [82.6, 48], [79.9, 44.4], [81.5, 37.8]]
    ]
  },
  {
    key: "ulysse", theme: "ulysse", emoji: "🏛️",
    name: "L'Alliance des Dieux et des Héros",
    intro: "Voyage de la Grèce antique jusqu'au royaume gelé !",
    map: "assets/map-ulysse.png", sprite: "assets/sprite-ulysse.png",
    grid: { cols: 6, rows: 4, col: 0, row: 0 },
    anim: {
      idle:  { strip: "assets/hero-ulysse-idle.png",  frames: 6, dur: 0.9 },
      walk:  { strip: "assets/hero-ulysse-walk.png",  frames: 8, dur: 0.8 },
      happy: { strip: "assets/hero-ulysse-happy.png", frames: 4, dur: 0.6 },
      sad:   { strip: "assets/hero-ulysse-sad.png",   frames: 3, dur: 0.8 },
      jump:  { strip: "assets/hero-ulysse-jump.png",  frames: 4, dur: 0.7 }
    },
    nodes: [[12, 55], [20, 40], [25, 68], [34, 76], [46, 55], [58, 44], [67, 70], [78, 55], [88, 33]]
  },
  {
    key: "chevaliers", theme: "chevaliers", emoji: "⚔️",
    name: "Le Royaume des Chevaliers",
    intro: "Mène ta quête jusqu'au grand château !",
    map: "assets/map-chevalier.png", sprite: "assets/sprite-chevalier.png",
    grid: { cols: 6, rows: 4, col: 0, row: 0 },
    anim: {
      idle:  { strip: "assets/hero-chevalier-idle.png",  frames: 6, dur: 0.9 },
      walk:  { strip: "assets/hero-chevalier-walk.png",  frames: 8, dur: 0.8 },
      happy: { strip: "assets/hero-chevalier-happy.png", frames: 4, dur: 0.6 },
      sad:   { strip: "assets/hero-chevalier-sad.png",   frames: 3, dur: 0.8 },
      jump:  { strip: "assets/hero-chevalier-jump.png",  frames: 4, dur: 0.7 }
    },
    nodes: [[10, 60], [18, 44], [27, 70], [37, 60], [46, 78], [56, 55], [65, 70], [76, 50], [88, 27]]
  },
  {
    key: "pirate", theme: "pirates", emoji: "🏴‍☠️",
    name: "Le Domaine des Pirates",
    intro: "Vogue d'île en île jusqu'au trésor maudit !",
    map: "assets/map-pirate.png", sprite: "assets/sprite-pirate.png",
    grid: { cols: 6, rows: 4, col: 0, row: 0 },
    anim: {
      idle:  { strip: "assets/hero-pirate-idle.png",  frames: 6, dur: 0.9 },
      walk:  { strip: "assets/hero-pirate-walk.png",  frames: 7, dur: 0.75 },
      happy: { strip: "assets/hero-pirate-happy.png", frames: 3, dur: 0.6 },
      sad:   { strip: "assets/hero-pirate-sad.png",   frames: 3, dur: 0.8 },
      jump:  { strip: "assets/hero-pirate-jump.png",  frames: 2, dur: 0.6 }
    },
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
  // Pour chaque module du monde, on génère un petit lot de questions (variété).
  let bank = [];
  sources.forEach((mod) => {
    const exs = (CV.exercisesFor ? CV.exercisesFor(mod) : (mod.exercises || []))
      .filter((e) => e.type !== "dictee");
    exs.slice(0, 3).forEach((e) => bank.push(Object.assign({ _from: mod.title }, e)));
  });
  // mélange
  for (let k = bank.length - 1; k > 0; k--) { const j = Math.floor(Math.random() * (k + 1)); [bank[k], bank[j]] = [bank[j], bank[k]]; }
  const seen = {};
  for (const e of bank) { if (out.length >= count) break; if (!seen[e.q]) { seen[e.q] = 1; out.push(e); } }
  return out;
};
