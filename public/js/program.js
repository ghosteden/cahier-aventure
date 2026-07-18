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
      jump:  { strip: "assets/hero-dinosaure-jump.png",  frames: 4, dur: 0.7 },
      attack:{ strip: "assets/hero-dinosaure-attack.png", frames: 5, dur: 0.6 }
    },
    bossBg: "assets/boss-bg-dinosaure.png",
    bossAnim: {
      idle:   { strip: "assets/boss-dinosaure-idle.png",   frames: 8, dur: 0.9 },
      attack: { strip: "assets/boss-dinosaure-attack.png", frames: 8, dur: 0.7 },
      hit:    { strip: "assets/boss-dinosaure-hit.png",    frames: 8, dur: 0.5 },
      death:  { strip: "assets/boss-dinosaure-death.png",  frames: 5, dur: 1.0 }
    },
    nodes: [[35.6, 47.9], [18, 55], [26, 68.2], [57.3, 76.6], [46.7, 43.6], [64.6, 25.8], [69.7, 43.2], [77.2, 55.7], [84.7, 32.4]],
    // Chemins entre pierres : paths[i] = tracé du nœud i au nœud i+1. "jump" = saut vers le point suivant.
    // Le dernier point de chaque tracé = position de repos du dino à côté de la pierre d'arrivée.
    paths: [
      [[33.9, 48], [28.1, 51.6], "jump", [24.2, 52.2], [20.7, 53.5]],
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
      jump:  { strip: "assets/hero-ulysse-jump.png",  frames: 4, dur: 0.7 },
      attack:{ strip: "assets/hero-ulysse-attack.png", frames: 5, dur: 0.6 }
    },
    bossBg: "assets/boss-bg-ulysse.png",
    bossAnim: {
      idle:   { strip: "assets/boss-ulysse-idle.png",   frames: 7, dur: 0.9 },
      attack: { strip: "assets/boss-ulysse-attack.png", frames: 7, dur: 0.7 },
      hit:    { strip: "assets/boss-ulysse-hit.png",    frames: 7, dur: 0.5 },
      death:  { strip: "assets/boss-ulysse-death.png",  frames: 6, dur: 1.0 }
    },
    nodes: [[27.4, 41.6], [15.4, 51.1], [28.5, 71.3], [37.9, 78.5], [57, 76.6], [55.1, 56.9], [59.9, 30.9], [79.7, 46.4], [85.5, 17.5]],
    paths: [
      [[28.3, 45.8], [29.3, 50.4], [27.8, 51.9], "jump", [24.6, 52.2], [18.7, 51.9]],
      [[16.7, 57.2], [20.4, 64.1], "jump", [23.6, 66.7], [27.1, 70.3]],
      [[29.6, 74.4], [32.2, 83.5], [42.2, 87.5], [41.3, 81.7]],
      [[45.6, 86.4], [51.5, 80.5], [55.5, 77.9]],
      [[58.3, 75.1], [62.2, 68.1], [63.2, 62.7], [57.3, 58.8]],
      [[54.7, 54.1], [54.1, 50.8], [53.5, 41.8], [57, 38.3]],
      [[56.7, 41.7], [60.7, 44.6], "jump", [65.4, 39.3], [68.4, 40.2], [70.5, 47.6], [78, 48.7]],
      [[81, 44], [82, 40], [78.7, 33], [79.4, 30.5], [82.5, 27.5]]
    ]
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
      jump:  { strip: "assets/hero-chevalier-jump.png",  frames: 4, dur: 0.7 },
      attack:{ strip: "assets/hero-chevalier-attack.png", frames: 5, dur: 0.6 }
    },
    bossBg: "assets/boss-bg-chevalier.png",
    // Dragon : cellule TRÈS large (484×212) — la place à droite du dragon sert à déployer sa flamme.
    // Toutes les poses partagent la même cellule, il ne bouge donc pas d'une animation à l'autre.
    // hit = les 2 premières images de death (l'encaissement), découpées dans leur propre planche.
    bossAnim: {
      idle:   { strip: "assets/dragon-idle.png",   frames: 6, dur: 0.9, cell: [484, 212] },
      attack: { strip: "assets/dragon-attack.png", frames: 5, dur: 0.7, cell: [484, 212] },
      hit:    { strip: "assets/dragon-hit.png",    frames: 2, dur: 0.4, cell: [484, 212] },
      death:  { strip: "assets/dragon-death.png",  frames: 6, dur: 1.1, cell: [484, 212] }
    },
    nodes: [[28.9, 42.1], [15, 50.2], [27, 70], [41.3, 81.2], [57, 76.6], [65, 64.4], [57.1, 40.9], [62.3, 30.1], [81.8, 33.8]],
    paths: [
      [[29.5, 50], [20.3, 53.2]],
      [[16.7, 56.5], [16.7, 61.2], [19.9, 64.4], "jump", [23.7, 65.9]],
      [[28.7, 72.9], [32.3, 83.8], [36.2, 86.5], [41.5, 87.4]],
      [[41.9, 87.2], [51.5, 80.8], [54.9, 78.5]],
      [[58.7, 74.8], [63.9, 66.8]],
      [[63.9, 57.7], [59.5, 52.1], [58.3, 46.2], [58.6, 42.9]],
      [[57.5, 38], [58.7, 34.5], [60.8, 32.3]],
      [[61.9, 33], [58.2, 34.7], [56.9, 40.8], [60.1, 42.5], [63.4, 41.3], [65.7, 39.2], [68.3, 41.1], [69.9, 46.8], [73, 48.8], [77.1, 48.5], [79.6, 44.2]]
    ]
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
      jump:  { strip: "assets/hero-pirate-jump.png",  frames: 2, dur: 0.6 },
      attack:{ strip: "assets/hero-pirate-attack.png", frames: 4, dur: 0.5 }
    },
    bossBg: "assets/boss-bg-pirate.png",
    bossAnim: {
      idle:   { strip: "assets/boss-pirate-idle.png",   frames: 8, dur: 1.0 },
      attack: { strip: "assets/boss-pirate-attack.png", frames: 6, dur: 0.7 },
      hit:    { strip: "assets/boss-pirate-hit.png",    frames: 7, dur: 0.5 },
      death:  { strip: "assets/boss-pirate-death.png",  frames: 6, dur: 1.0 }
    },
    nodes: [[28.1, 44.7], [16.6, 51.5], [28.3, 71.7], [40, 73.6], [49.2, 56.4], [61, 62], [75.4, 75.4], [86, 63], [83.3, 26.4]],
    paths: [
      [[29.1, 48.1], [27.9, 51.3], [24.6, 52.4], [19.1, 53.8]],
      [[17.9, 54.8], [16.4, 59.3], [20.2, 64.7], "jump", [23.4, 66.4], [26.7, 70.2]],
      [[29.6, 73.7], [31.9, 81.6], [33.9, 81.7], [40.2, 78]],
      [[40.1, 78.2], [42.6, 87.2], [47.1, 84.3], [49.4, 81.6], [49.9, 74.6], [51.1, 68.2], [45.4, 63.8]],
      [[45.6, 64], [50.9, 68], [57.1, 63.1], [59.5, 63.5]],
      [[61.2, 65], [62.5, 66.6], [62.6, 70.1], [63.5, 71.2], [63.1, 75.5], [64.4, 79.4], [66.3, 81.4], [69.2, 82.4], [72.6, 80.3]],
      [[76.4, 73.9], [73.8, 62.3], [77.7, 58.1], [80.8, 57.3], [83.3, 60.4]],
      [[83, 59.8], [80, 53.2], [78.1, 48.1], [76.7, 46.8], [84.2, 39.3], [85.4, 34.8], [84, 29.8]]
    ]
  },
  {
    key: "espace", theme: "espace", emoji: "🚀",
    name: "L'Odyssée Cosmique des Savoirs",
    intro: "Explore le système solaire jusqu'à Pluton !",
    map: "assets/map-espace.png", sprite: "assets/sprite-espace.png",
    grid: { cols: 6, rows: 4, col: 0, row: 0 },
    // Monde en ORDRE LIBRE : les 8 planètes se jouent dans n'importe quel ordre, il n'y a pas de
    // chemin tracé. Pluton (la 9e case) ne s'ouvre que lorsque les 8 ont été JOUÉES (skip exclu).
    freeOrder: true,
    // Sur la CARTE du monde, c'est la fusée qui voyage d'une planète à l'autre.
    // (cellules 229×111, pas carrées → le ratio est conservé par heroToken)
    // mapRotate : la pointe de la fusée suit sa trajectoire (rotation 360° : paraboles et orbites).
    mapRotate: true,
    mapAnim: (function () {
      const fusee = { strip: "assets/sprite-fusée.png", frames: 6, dur: 0.6, cell: [229, 111] };
      return { idle: fusee, walk: fusee, jump: fusee, happy: fusee, sad: fusee };
    })(),
    // L'astronaute, lui, sert dans les mini-jeux des planètes.
    anim: {
      idle:  { strip: "assets/hero-espace-idle-sol.png", frames: 8, dur: 0.9 },  // debout (au sol)
      float: { strip: "assets/hero-espace-idle.png",     frames: 8, dur: 1.0 },  // flottant (apesanteur)
      walk:  { strip: "assets/hero-espace-walk.png",     frames: 8, dur: 0.8 },
      jump:  { strip: "assets/hero-espace-jump.png",     frames: 8, dur: 0.7 },
      surf:  { strip: "assets/hero-espace-surf.png",     frames: 7, dur: 0.8 }   // mini-jeu Saturne
    },
    // Ici les « pierres » sont invisibles : elles sont posées SUR les planètes du dessin, qui
    // deviennent les zones à cliquer. Ordre : Terre/Lune · Vénus · Mercure · Mars · Jupiter ·
    // Saturne · Uranus · Neptune · Pluton.
    nodes: [[30.6, 72.5], [22.7, 66.9], [22, 77.7], [31.2, 58.5], [47.4, 50.1], [61.2, 41.7], [73.2, 54.2], [78.7, 39.7], [89.4, 33.5]],
    // Diamètre de la zone cliquable de chaque planète, en % de la LARGEUR de la carte
    // (Jupiter et Saturne sont énormes, Mercure et Pluton minuscules).
    hits: [3.8, 3.8, 3.0, 3.6, 9.0, 9.6, 5.6, 5.6, 3.2],
    paths: null
  }
];

// L'Espace est passé en ordre libre : ses anciennes pierres/chemins sauvegardés sur l'appareil
// ne valent plus rien (les pierres sont maintenant sur les planètes). On les efface une fois.
try {
  if (!localStorage.getItem("cv_espace_free_v1")) {
    ["cv_paths_override", "cv_nodes_override"].forEach((k) => {
      const ov = JSON.parse(localStorage.getItem(k) || "{}");
      if (ov.espace) { delete ov.espace; localStorage.setItem(k, JSON.stringify(ov)); }
    });
    localStorage.setItem("cv_espace_free_v1", "1");
  }
} catch (e) {}

// Surcharge locale des chemins (éditeur de l'outil de placement). Persiste sur l'appareil
// jusqu'à ce qu'on les recopie en dur ici. Appliquée au chargement.
// (Les mondes en ordre libre n'ont pas de chemin : on ignore la surcharge.)
try {
  const ov = JSON.parse(localStorage.getItem("cv_paths_override") || "{}");
  CV.WORLDS.forEach((w) => { if (ov[w.key] && !w.freeOrder) w.paths = ov[w.key]; });
} catch (e) {}
CV.savePathsOverride = function (worldKey, paths) {
  let ov = {};
  try { ov = JSON.parse(localStorage.getItem("cv_paths_override") || "{}"); } catch (e) {}
  ov[worldKey] = paths;
  try { localStorage.setItem("cv_paths_override", JSON.stringify(ov)); } catch (e) {}
};
// Idem pour la position des pierres (nodes)
try {
  const ov = JSON.parse(localStorage.getItem("cv_nodes_override") || "{}");
  CV.WORLDS.forEach((w) => { if (ov[w.key]) w.nodes = ov[w.key]; });
} catch (e) {}
CV.saveNodesOverride = function (worldKey, nodes) {
  let ov = {};
  try { ov = JSON.parse(localStorage.getItem("cv_nodes_override") || "{}"); } catch (e) {}
  ov[worldKey] = nodes;
  try { localStorage.setItem("cv_nodes_override", JSON.stringify(ov)); } catch (e) {}
};

CV.worldByIndex = function (i) { return CV.WORLDS[i] || CV.WORLDS[0]; };
CV.worldIndexOfLevel = function (lvl) { return Math.floor((lvl - 1) / CV.LEVELS_PER_WORLD); };
CV.nodeIndexOfLevel = function (lvl) { return (lvl - 1) % CV.LEVELS_PER_WORLD; };
CV.levelNumber = function (worldIndex, nodeIndex) { return worldIndex * CV.LEVELS_PER_WORLD + nodeIndex + 1; };
CV.BOSS_NODE = CV.LEVELS_PER_WORLD - 1;   // la 9e case d'un monde (Pluton pour l'Espace)

/* ---- Déverrouillage ----
   Mondes classiques : progression en file indienne (une case après l'autre).
   Monde en ordre libre (l'Espace) : les 8 planètes sont ouvertes dès l'arrivée dans le monde,
   et Pluton attend que les 8 aient été JOUÉES — un niveau « passé » (skip) ne compte pas. */
CV.freeWorldIndex = function () { return CV.WORLDS.findIndex((w) => w.freeOrder); };

/* Nombre de planètes visitées (jouées OU passées : on ne veut pas priver l'enfant de sa
   récompense sur Pluton s'il a buté sur une planète et l'a passée). */
CV.planetsPlayed = function (state) {
  const wi = CV.freeWorldIndex();
  if (wi < 0) return 0;
  const dp = state.dayProgress || {};
  let n = 0;
  for (let i = 0; i < CV.BOSS_NODE; i++) {
    const d = dp[CV.levelNumber(wi, i)];
    if (d && d.done) n++;
  }
  return n;
};
CV.plutonUnlocked = function (state) { return CV.planetsPlayed(state) >= CV.BOSS_NODE; };

CV.levelUnlocked = function (state, level) {
  const wi = CV.worldIndexOfLevel(level);
  const w = CV.worldByIndex(wi);
  if (w.freeOrder) {
    if ((state.currentDay || 1) < CV.levelNumber(wi, 0)) return false;   // monde pas encore atteint
    return CV.nodeIndexOfLevel(level) < CV.BOSS_NODE ? true : CV.plutonUnlocked(state);
  }
  return level <= (state.currentDay || 1);
};

/* ---- Construction des 45 niveaux ----
   Chaque case tire son identité de CE QU'ELLE FAIT JOUER :
   - mondes 1-4 : les deux modules-leçon du jour (CV.CURRICULUM, dans days.js) ;
   - monde 5 (Espace) : la planète du jour (CV.PLANETS, dans planets.js).
   Ne JAMAIS réintroduire ici une distribution de modules indépendante du curriculum :
   le titre affiché ne correspondrait plus aux exercices de la journée. */
CV.buildProgram = function () {
  if (CV._program) return CV._program;

  const levels = [];
  CV.WORLDS.forEach((w, wi) => {
    const lessonIds = [];   // modules vus dans ce monde → alimentent le quiz du boss
    for (let n = 0; n < CV.LEVELS_PER_WORLD; n++) {
      const level = CV.levelNumber(wi, n);
      const planet = w.freeOrder ? (CV.PLANETS || [])[n] : null;
      const base = {
        level, day: level, world: w.key, worldName: w.name, theme: w.theme, worldEmoji: w.emoji,
        indexInWorld: n
      };

      if (n === CV.BOSS_NODE) {
        // L'Espace n'a pas de modules-leçon : son boss puise dans les questions des 8 planètes.
        const bossGen = w.freeOrder
          ? (CV.PLANETS || []).slice(0, CV.BOSS_NODE).flatMap((p) => p.gen || [])
          : null;
        levels.push(Object.assign(base, {
          type: "boss", isBoss: true, moduleId: null, modules: [],
          sourceModules: lessonIds.slice(), bossGen,
          icon: "👑", subtitle: "BOSS du monde",
          title: "BOSS — " + w.name, reward: 150
        }));
        continue;
      }

      if (planet) {
        levels.push(Object.assign(base, {
          type: "planet", isBoss: false, planetKey: planet.key,
          moduleId: null, modules: [], sourceModules: null,
          icon: planet.emoji || "🪐", subtitle: "Mission spatiale",
          title: planet.name, reward: 40
        }));
        continue;
      }

      const mods = CV.dayModuleIds(wi, n).map(CV.getModule).filter(Boolean);
      mods.forEach((m) => lessonIds.push(m.id));
      levels.push(Object.assign(base, {
        type: "lesson", isBoss: false,
        moduleId: mods[0] ? mods[0].id : null,          // module de la 1re leçon (Français)
        modules: mods.map((m) => m.id),
        sourceModules: null,
        icon: mods[0] ? mods[0].icon : "✏️",
        subtitle: mods.map((m) => (m.subject === "maths" ? "Maths" : "Français")).join(" · "),
        title: mods.map((m) => m.title).join(" · ") || "Journée " + (n + 1),
        reward: 40
      }));
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
  // Boss de l'Espace : pas de modules-leçon, on retire dans les générateurs des 8 planètes.
  if (levelObj.bossGen && levelObj.bossGen.length && CV.drawMix) {
    const ex = CV.drawMix(levelObj.bossGen);
    for (let k = ex.length - 1; k > 0; k--) { const j = Math.floor(Math.random() * (k + 1)); [ex[k], ex[j]] = [ex[j], ex[k]]; }
    const vu = {};
    for (const e of ex) { if (out.length >= count) break; if (!vu[e.q]) { vu[e.q] = 1; out.push(e); } }
    return out;
  }
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
