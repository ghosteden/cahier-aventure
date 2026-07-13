/* =========================================================
   MONDE 5 — ESPACE : mini-jeux des planètes.
   Une entrée par pierre du monde (index 0..8, la 9e = Pluton).

   points : appuis de l'astronaute en % de la scène [x, y] (y = où il pose les pieds),
            dans l'ordre du parcours. Relevés avec /planet-tool.html.
   moves  : comment aller du point i au point i+1 → "jump" (saut) ou "walk" (marche).
            moves.length doit valoir points.length - 1.
   gen    : mélange de générateurs pour les questions (révision français + maths).

   Tant qu'une planète n'a pas de `points`, elle retombe sur la journée classique.
   ========================================================= */
window.CV = window.CV || {};

/* Répartit n appuis réguliers entre deux extrémités relevées (une passerelle, une piste…). */
function span(a, b, n) {
  return Array.from({ length: n }, (_, i) => {
    const t = i / (n - 1);
    return [+(a[0] + (b[0] - a[0]) * t).toFixed(1), +(a[1] + (b[1] - a[1]) * t).toFixed(1)];
  });
}

/* Rééchantillonne un tracé (suite de points relevés à la main) en n étapes RÉGULIÈREMENT
   espacées le long de la courbe. Sert à la piste des anneaux de Saturne. */
function along(pts, n) {
  const seg = [], d = [];
  let total = 0;
  for (let i = 1; i < pts.length; i++) {
    const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    seg.push(l); total += l; d.push(total);
  }
  const out = [];
  for (let k = 0; k < n; k++) {
    const target = total * k / (n - 1);
    let i = d.findIndex((x) => x >= target);
    if (i < 0) i = d.length - 1;
    const before = i === 0 ? 0 : d[i - 1];
    const t = seg[i] ? (target - before) / seg[i] : 0;
    const a = pts[i], b = pts[i + 1];
    out.push([+(a[0] + (b[0] - a[0]) * t).toFixed(1), +(a[1] + (b[1] - a[1]) * t).toFixed(1)]);
  }
  return out;
}

/* Nuages de Vénus : 5 variantes, planches de dissipation.
   Image 1 = nuage intact (état de repos) → dernière image = dissipé.
   Les planches d'origine n'étaient PAS sur une grille régulière (les dessins débordaient de leur
   cellule) : elles ont été reconstruites, chaque image recentrée dans une cellule propre.
   D'où des largeurs de cellule différentes d'un nuage à l'autre — la hauteur, elle, fait foi. */
const VENUS_CLOUDS = [
  { strip: "assets/cloud-venus-1.png", frames: 7, dur: 0.9, cell: [272, 154] },
  { strip: "assets/cloud-venus-2.png", frames: 7, dur: 0.9, cell: [322, 154] },
  { strip: "assets/cloud-venus-3.png", frames: 7, dur: 0.9, cell: [299, 154] },
  { strip: "assets/cloud-venus-4.png", frames: 7, dur: 0.9, cell: [308, 154] },
  { strip: "assets/cloud-venus-5.png", frames: 6, dur: 0.9, cell: [336, 154] }
];

/* Plateformes de la Lune : 3 variantes, planches d'effondrement (reconstruites de la même façon).
   Image 1 = plateforme intacte → dernière image = éclats dispersés. */
const LUNE_PLATFORMS = [
  { strip: "assets/platform-lune-1.png", frames: 6, dur: 0.8, cell: [239, 150] },
  { strip: "assets/platform-lune-2.png", frames: 5, dur: 0.8, cell: [237, 177] },
  { strip: "assets/platform-lune-3.png", frames: 5, dur: 0.8, cell: [221, 145] }
];

/* Rover martien : cellules 413×178 (et non 368 : 3304 / 8 images = 413).
   idle = à l'arrêt · move = il roule · scan = il déploie sa parabole (fin de mission). */
const ROVER = {
  idle: { strip: "assets/rover-idle.png",  frames: 8, dur: 1.0, cell: [413, 178] },
  walk: { strip: "assets/rover-move.png",  frames: 6, dur: 0.6, cell: [413, 178] },
  jump: { strip: "assets/rover-move.png",  frames: 6, dur: 0.6, cell: [413, 178] },
  scan: { strip: "assets/rover-scan.png",  frames: 7, dur: 0.9, cell: [413, 178] },
  death:{ strip: "assets/rover-death.png", frames: 8, dur: 1.2, cell: [413, 178] }
};

/* Objets du jeu de Pluton (récompense). Les cellules diffèrent : certaines planches ont dû être
   reconstruites, leur dessin touchait le bord (il aurait été rogné à l'affichage). */
const SPACE_JUNK = {
  asteroids: [
    { strip: "assets/asteroid-1.png", frames: 6, dur: 0.5, cell: [229, 154] },
    { strip: "assets/asteroid-2.png", frames: 6, dur: 0.5, cell: [229, 154] },
    { strip: "assets/asteroid-3.png", frames: 6, dur: 0.5, cell: [229, 154] },
    { strip: "assets/asteroid-4.png", frames: 6, dur: 0.5, cell: [224, 154] },
    { strip: "assets/asteroid-5.png", frames: 5, dur: 0.5, cell: [206, 154] }
  ],
  // idle = l'objet flotte en boucle · collect = il est ramassé (joué une fois, puis il disparaît)
  loot: [
    { pts: 1, idle: { strip: "assets/gem-blue-idle.png",      frames: 4, dur: 1.0, cell: [176, 192] },
              collect: { strip: "assets/gem-blue-collect.png",  frames: 4, dur: 0.5, cell: [176, 192] } },
    { pts: 1, idle: { strip: "assets/gem-pink-idle.png",      frames: 4, dur: 1.0, cell: [176, 192] },
              collect: { strip: "assets/gem-pink-collect.png",  frames: 3, dur: 0.5, cell: [176, 192] } },
    { pts: 2, idle: { strip: "assets/star-gold-idle.png",     frames: 4, dur: 1.0, cell: [176, 192] },
              collect: { strip: "assets/star-gold-collect.png", frames: 4, dur: 0.5, cell: [176, 192] } },
    { pts: 3, idle: { strip: "assets/star-rainbow-idle.png",  frames: 4, dur: 1.0, cell: [176, 192] },
              collect: { strip: "assets/star-rainbow-collect.png", frames: 4, dur: 0.5, cell: [374, 192] } }
  ]
};

/* L'ordre suit les PIERRES de la carte de l'espace :
   1 Terre/Lune · 2 Vénus · 3 Mercure · 4 Mars · 5 Jupiter · 6 Saturne · 7 Uranus · 8 Neptune · 9 Pluton */
CV.PLANETS = [
  {
    key: "lune", name: "La Lune", emoji: "🌙",
    fact: "Sur la Lune, on pèse 6 fois moins que sur Terre : on peut sauter très haut !",
    bg: "assets/planet-lune.png",
    intro: "Grimpe de plateforme en plateforme jusqu'au sommet !",
    vertical: true, stepWord: "Plateforme",
    // De bas en haut : chaque bonne réponse = un bond, et la plateforme quittée s'effondre.
    points: [[20, 93], [68, 84], [30, 74], [74, 64], [34, 53], [72, 42], [32, 31], [60, 20]],
    moves: ["jump", "jump", "jump", "jump", "jump", "jump", "jump"],
    heroSize: 93,   // la scène défile : on peut se permettre un astronaute et des plateformes plus grands
    // Bonne réponse : il monte d'une plateforme (elles restent en place).
    // Mauvaise réponse : celle sous ses pieds se brise, il retombe d'un cran, et une neuve
    // arrive en glissant du bord le plus proche.
    props: LUNE_PLATFORMS, propSize: 116, propAnchor: 34, breakOnWrong: true,
    gen: [["add", 4], ["conjug", 3], ["numeration", 3], ["contraire", 2]]
  },
  {
    key: "venus", name: "Vénus", emoji: "🌕",
    fact: "Vénus est la planète la plus chaude : ses nuages épais gardent la chaleur comme une couverture.",
    bg: "assets/planet-venus.png",
    intro: "Dissipe les nuages pour découvrir la surface de Vénus !",
    // Mode « dégagement » : pas d'astronaute. Les nuages recouvrent tout l'écran ; chaque bonne
    // réponse en dissipe un et laisse voir un peu plus du paysage.
    mode: "reveal", stepWord: "Nuage",
    points: [[13, 26], [38, 20], [63, 24], [88, 22], [12, 62], [37, 70], [63, 64], [88, 70],
             [25, 44], [50, 46], [76, 44]],
    props: VENUS_CLOUDS, propPct: 74,
    gen: [["sub", 4], ["homophone", 3], ["compare", 3], ["nature", 2]]
  },
  {
    key: "mercure", name: "Mercure", emoji: "☄️",
    fact: "Mercure est la planète la plus proche du Soleil. Le jour il y fait plus de 400 °C, la nuit −170 °C !",
    bg: "assets/planet-mercure.png",
    intro: "Traverse la lave en sautant de dalle en dalle !",
    points: [[4.9, 75.3], [26.1, 82.8], [36.3, 73.1], [61.6, 71.8], [75.3, 76.8], [92.3, 74.3]],
    moves: ["jump", "jump", "walk", "jump", "jump"],
    gen: [["mul", 4], ["conjug", 3], ["add", 3], ["pluriel", 2]]
  },
  {
    key: "mars", name: "Mars", emoji: "🔴",
    fact: "Mars est la planète rouge : sa poussière est pleine de fer rouillé. Des robots s'y promènent !",
    bg: "assets/planet-mars.png",
    intro: "Pilote le rover jusqu'au bout du désert, puis lance le scan !",
    // Le rover roule vers la droite à chaque bonne réponse ; la scène défile horizontalement.
    // Arrivé au bout, il déploie sa parabole (scan) : mission accomplie.
    vehicle: ROVER, hscroll: true, stepWord: "Étape", heroSize: 76,
    points: [[6, 84], [19, 82], [32, 85], [45, 83], [58, 86], [71, 83], [84, 85], [95, 83]],
    moves: ["drive", "drive", "drive", "drive", "drive", "drive", "drive"],
    winMode: "scan",
    gen: [["mesures", 4], ["etreAvoir", 3], ["probleme", 2], ["mul", 3]]
  },
  {
    key: "jupiter", name: "Jupiter", emoji: "🟠",
    fact: "Jupiter est la plus grosse planète. Sa Grande Tache rouge est une tempête plus large que la Terre !",
    bg: "assets/planet-jupiter.png",
    intro: "Traverse la passerelle : sur Jupiter, la gravité écrase tout, impossible de sauter !",
    // La passerelle fait toute la largeur : les 8 étapes sont réparties entre les deux bouts
    // relevés (3,3 % → 95,3 %). Gravité énorme → il MARCHE, il ne saute jamais.
    points: span([3.3, 79.6], [95.3, 79.9], 8),
    moves: ["walk", "walk", "walk", "walk", "walk", "walk", "walk"],
    stepWord: "Étape",
    gen: [["addBig", 3], ["subBig", 3], ["pluriel", 3], ["numeration", 3]]
  },
  {
    key: "saturne", name: "Saturne", emoji: "🪐",
    fact: "Les anneaux de Saturne sont faits de milliards de blocs de glace, du grain de sable à la maison !",
    bg: "assets/planet-saturne.png",
    intro: "Surfe sur les anneaux jusqu'au bout de la boucle !",
    // La piste des anneaux est une COURBE : le tracé relevé à la main est rééchantillonné en
    // 8 étapes régulières, et l'astronaute s'incline dans la pente (comme la fusée sur la carte).
    stepWord: "Virage", idleMode: "surf", followAngle: true,
    points: along([[99.1, 11.7], [93.2, 14.2], [83, 18.9], [73.2, 23], [64.4, 28.3], [57.6, 32.1],
                   [49.6, 38], [45.4, 45.5], [42.6, 51.8], [40.5, 61.2], [44.3, 73.4], [53.9, 87.1], [64.6, 97.5]], 8),
    moves: ["surf", "surf", "surf", "surf", "surf", "surf", "surf"],
    gen: [["mul", 4], ["monnaie", 3], ["homophone", 3], ["suite", 2]]
  },
  {
    key: "uranus", name: "Uranus", emoji: "🩵",
    fact: "Uranus est couchée sur le côté : elle roule autour du Soleil au lieu de tourner comme une toupie !",
    bg: "assets/planet-uranus.png",
    intro: "Glisse sur la banquise d'un bout à l'autre !",
    // La banquise fait toute la largeur : 8 étapes réparties entre les deux bouts relevés.
    points: span([2.8, 80.9], [97.2, 82.5], 8),
    moves: ["walk", "walk", "walk", "walk", "walk", "walk", "walk"],
    stepWord: "Étape",
    gen: [["compare", 4], ["nature", 3], ["sub", 3], ["contraire", 2]]
  },
  {
    key: "neptune", name: "Neptune", emoji: "💙",
    fact: "Sur Neptune soufflent les vents les plus violents du système solaire : plus de 2 000 km/h !",
    bg: "assets/planet-neptune.png",
    intro: "Lutte contre le vent : une erreur et il te repousse en arrière !",
    // Trajet tracé DANS le trapèze relevé (la zone praticable de la banquise) :
    // à y = 88 %, ses bords tombent à x = 18 % et x = 84 %.
    // Vents les plus violents du système solaire → une erreur ne bloque pas, elle FAIT RECULER.
    points: span([18, 88], [84, 88], 8),
    moves: ["walk", "walk", "walk", "walk", "walk", "walk", "walk"],
    stepWord: "Étape", pushBackOnWrong: true,
    gen: [["probleme", 3], ["conjug", 3], ["mesures", 3], ["numeration", 3]]
  },
  {
    key: "pluton", name: "Pluton", emoji: "🚀",
    fact: "Pluton n'est plus une planète depuis 2006 : c'est une « planète naine », tout au bout du système solaire.",
    bg: "assets/planet-pluton.png",
    intro: "Ta récompense ! Pilote la fusée : ramasse les gemmes et pulvérise les astéroïdes.",
    // Jeu de récompense : AUCUNE question, on ne peut pas perdre.
    mode: "reward", junk: SPACE_JUNK, duration: 45,
    points: null,
    moves: null,
    gen: null
  }
];

/* Renvoie la config de planète d'un niveau, ou null si ce n'est pas le monde Espace. */
CV.planetForLevel = function (level) {
  if (CV.worldIndexOfLevel(level) !== 4) return null;
  return CV.PLANETS[CV.nodeIndexOfLevel(level)] || null;
};
