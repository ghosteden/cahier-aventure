/* =========================================================
   JOURNÉES — composition d'une case (jour) : étapes dans l'ordre
   Français → Maths → Problème/logique → Dictée.
   Le contenu est piloté ici (monde 1 détaillé ; mondes 2-5 = plan générique
   en attendant qu'on les peaufine).
   ========================================================= */
window.CV = window.CV || {};

/* Nombre de phrases de dictée selon l'avancement (1 au début → 6 à la fin). */
CV.dicteeCountFor = function (level) {
  return Math.min(6, 1 + Math.floor((level - 1) / 8));
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
  ]
];

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
    return {
      level,
      steps: [
        stepLesson("francais", c.fr[0], c.fr[1]),
        stepLesson("maths", c.ma[0], c.ma[1]),
        { kind: "probleme", label: "Problème", icon: "🧩", gen: [["probleme", c.prob || 1]] },
        { kind: "dictee", label: "Dictée", icon: "🎧", count: dictN }
      ]
    };
  }

  // Plan générique (mondes pas encore détaillés) : à partir du module du niveau.
  const mod = CV.getModule(lv.moduleId);
  const subj = mod ? mod.subject : "francais";
  return {
    level,
    steps: [
      stepLesson(subj === "maths" ? "maths" : "francais", lv.moduleId, null),
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
