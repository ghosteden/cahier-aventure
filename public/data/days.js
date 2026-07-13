/* =========================================================
   JOURNÉES — composition d'une case (jour) : étapes dans l'ordre
   Français → Maths → Problème/logique → Dictée.
   Le contenu est piloté ici (monde 1 détaillé ; mondes 2-5 = plan générique
   en attendant qu'on les peaufine).
   ========================================================= */
window.CV = window.CV || {};

/* Dictée : toujours UNE phrase courte, quel que soit le niveau. */
CV.dicteeCountFor = function (level) {
  return 1;
};

/* Programme détaillé du MONDE 1 (8 journées de leçons).
   fr/ma = [moduleId (pour la leçon), spec de générateurs (pour les exos)]. */
CV.CURRICULUM = [
  [ // ---- Monde 1 : Dinosaures ----
    { fr: ["fr-natures",     [["nature", 11]]],                 ma: ["ma-numeration",   [["numeration", 8], ["suite", 5]]], prob: 2 },
    { fr: ["fr-phrase",      [["ponctuation", 11]]],            ma: ["ma-addition",     [["add", 9], ["addBig", 4]]],        prob: 2 },
    { fr: ["fr-sujet-verbe", [["sujetVerbe", 11]]],             ma: ["ma-soustraction", [["sub", 9], ["subBig", 4]]],        prob: 2 },
    { fr: ["fr-present",     [["conjug", 11]]],                 ma: ["ma-tables",       [["mul", 16], ["mul10", 4]]],        prob: 1 },
    { fr: ["fr-homophones",  [["homophone", 11]]],              ma: ["ma-comparer",     [["compare", 12]]],                  prob: 2 },
    { fr: ["fr-pluriel",     [["pluriel", 11]]],                ma: ["ma-mesures",      [["mesures", 12]]],                  prob: 2 },
    { fr: ["fr-synonymes",   [["synonyme", 7], ["contraire", 5]]], ma: ["ma-monnaie",   [["monnaie", 12]]],                  prob: 2 },
    { fr: ["fr-present",     [["etreAvoir", 11]]],              ma: ["ma-tables",       [["mul", 15]]],                      prob: 2 }
  ],
  [ // ---- Monde 2 : Ulysse (conjugaison, homophones, calcul) ----
    { fr: "fr-imparfait",  ma: "ma-comparer",             prob: 2 },
    { fr: "fr-futur",      ma: "ma-multiplication-posee", prob: 2 },
    { fr: "fr-onont",      ma: "ma-division",             prob: 2 },
    { fr: "fr-present3",   ma: "ma-doubles-moities",      prob: 1 },
    { fr: "fr-pluriel",    ma: "ma-pairs-impairs",        prob: 2 },
    { fr: "fr-accord-adj", ma: "ma-calcul-mental",        prob: 2 },
    { fr: "fr-synonymes",  ma: "ma-fractions",            prob: 2 },
    { fr: "fr-alphabet",   ma: "ma-numeration",           prob: 2 }
  ],
  [ // ---- Monde 3 : Chevaliers (orthographe, géométrie, mesures) ----
    { fr: "fr-passecompose",  ma: "ma-geometrie-droites", prob: 2 },
    { fr: "fr-mbp",           ma: "ma-angle-droit",       prob: 2 },
    { fr: "fr-homophones2",   ma: "ma-symetrie",          prob: 2 },
    { fr: "fr-types-phrases", ma: "ma-solides",           prob: 1 },
    { fr: "fr-familles",      ma: "ma-masses",            prob: 2 },
    { fr: "fr-natures",       ma: "ma-contenances",       prob: 2 },
    { fr: "fr-phrase",        ma: "ma-heure",             prob: 2 },
    { fr: "fr-sujet-verbe",   ma: "ma-calendrier",        prob: 2 }
  ],
  [ // ---- Monde 4 : Pirate (révisions + lecture, repérage) ----
    { fr: "fr-homophones",    ma: "ma-addition",     prob: 2 },
    { fr: "fr-present",       ma: "ma-soustraction", prob: 2 },
    { fr: "fr-lecture",       ma: "ma-tables",       prob: 1 },
    { fr: "fr-imparfait",     ma: "ma-quadrillage",  prob: 2 },
    { fr: "fr-futur",         ma: "ma-problemes",    prob: 2 },
    { fr: "fr-passecompose",  ma: "ma-monnaie",      prob: 2 },
    { fr: "fr-accord-adj",    ma: "ma-mesures",      prob: 2 },
    { fr: "fr-types-phrases", ma: "ma-fractions",    prob: 2 }
  ]
];

/* Les modules-leçon réellement joués un jour donné (Français puis Maths).
   C'est LA source de vérité : le titre du niveau et le quiz du boss en découlent. */
CV.dayModuleIds = function (worldIndex, nodeIndex) {
  const c = (CV.CURRICULUM[worldIndex] || [])[nodeIndex];
  if (!c) return [];
  const id = (x) => (Array.isArray(x) ? x[0] : x);
  return [id(c.fr), id(c.ma)].filter(Boolean);
};

function stepLesson(subject, moduleId, gen) {
  return {
    kind: "lesson", subject, moduleId, gen,
    label: subject === "maths" ? "Maths" : "Français",
    icon: subject === "maths" ? "🔢" : "📖"
  };
}

/* Renvoie le plan d'un jour (null si c'est un boss). */
CV.dayPlan = function (level) {
  const lv = CV.getLevel(level);
  if (!lv || lv.isBoss) return null;
  const wi = CV.worldIndexOfLevel(level), ni = CV.nodeIndexOfLevel(level);
  const dictN = CV.dicteeCountFor(level);
  const c = (CV.CURRICULUM[wi] || [])[ni];

  if (c) {
    const prob = c.prob || 1;
    // Avec 2 problèmes ou plus, l'un devient un jeu de logique (lire la consigne + ranger).
    const probGen = prob >= 2 ? [["probleme", prob - 1], ["logic", 1]] : [["probleme", prob]];
    // fr/ma peuvent être "moduleId" (générateur auto) ou ["moduleId", spec].
    const np = (x) => Array.isArray(x) ? x : [x, null];
    return {
      level,
      steps: [
        stepLesson("francais", np(c.fr)[0], np(c.fr)[1]),
        stepLesson("maths", np(c.ma)[0], np(c.ma)[1]),
        { kind: "probleme", label: "Problème & logique", icon: "🧩", gen: probGen },
        { kind: "dictee", label: "Dictée", icon: "🎧", count: dictN }
      ]
    };
  }

  // Monde de l'Espace. Une planète avec mini-jeu (`points`) n'a pas d'étapes : elle se joue
  // d'un bloc (voir playPlanet). Sans mini-jeu, elle devient une journée de révision bâtie sur
  // SES questions à elle (planet.gen) — pas sur un module au hasard.
  const planet = CV.planetForLevel ? CV.planetForLevel(level) : null;
  if (planet && planet.points && planet.points.length > 1) return null;
  if (planet && planet.gen) {
    return {
      level,
      steps: [
        { kind: "revision", label: "Mission " + planet.name, icon: planet.emoji || "🛰️",
          desc: "Révision de français et de maths", gen: planet.gen },
        { kind: "probleme", label: "Problème & logique", icon: "🧩", gen: [["probleme", 1], ["logic", 1]] },
        { kind: "dictee", label: "Dictée", icon: "🎧", count: dictN }
      ]
    };
  }

  // Dernier recours : un module isolé (aucun monde n'est censé arriver ici).
  const mod = CV.getModule(lv.moduleId);
  if (!mod) return null;
  return {
    level,
    steps: [
      stepLesson(mod.subject === "maths" ? "maths" : "francais", lv.moduleId, null),
      { kind: "probleme", label: "Problème", icon: "🧩", gen: [["probleme", 1]] },
      { kind: "dictee", label: "Dictée", icon: "🎧", count: dictN }
    ]
  };
};

/* Construit la liste d'exercices d'une étape. */
CV.exercisesForStep = function (step) {
  if (step.kind === "dictee") return [CV.drawDictee(step.count || 1)];
  if (step.gen && CV.drawMix) { const ex = CV.drawMix(step.gen); if (ex.length) return ex; }
  if (step.moduleId && CV.exercisesFor) return CV.exercisesFor(CV.getModule(step.moduleId));
  return [];
};
