/* =========================================================
   FICHES DE CONNAISSANCE
   - Mondes 1 à 4 : chaque journée de leçon débloque la fiche « français » et « maths » de la
     notion du jour ; le BOSS du monde débloque en plus une fiche de SCIENCES et une de CULTURE
     en rapport avec le thème (préhistoire, mythologie, Moyen Âge, pirates).
   - Monde 5 (Espace) : chaque planète visitée débloque sa fiche, avec un lien pour aller en
     apprendre davantage sur Internet.
   Les fiches se consultent dans l'écran Trophées (collection).
   ========================================================= */
window.CV = window.CV || {};

/* Sciences + culture débloquées au boss de chaque monde (par clé de monde). */
CV.WORLD_BONUS = {
  dinosaure:  ["sc-vivant", "sc-corps", "cu-temps", "cu-frise"],
  ulysse:     ["sc-systeme-solaire", "sc-saisons", "cu-geo", "cu-anglais"],
  chevaliers: ["sc-matiere", "sc-electricite", "cu-carte", "cu-emc"],
  pirate:     ["sc-eau", "sc-alimentation", "cu-logique"]
};

/* Construit la fiche d'un module de leçon (résumé + exemple tirés de la leçon). */
CV.ficheForModule = function (mod) {
  if (!mod || mod.isDictee || !mod.lesson) return null;
  const L = mod.lesson;
  return {
    id: "mod-" + mod.id,
    icon: mod.icon || "📘",
    title: mod.title,
    subject: mod.subject,
    retenir: (L.points && L.points[0]) || L.intro || "",
    exemple: L.example || "",
    astuce: L.tip || ""
  };
};

/* Fiche d'une planète (Espace) : le fait marquant + un lien pour en apprendre plus. */
CV.planetFiche = function (pl) {
  return {
    id: "planet-" + pl.key,
    kind: "planet",
    icon: pl.emoji,
    title: pl.name,
    subject: "espace",
    text: pl.fact,
    link: "https://www.google.com/search?q=" + encodeURIComponent(pl.name + " planète espace")
  };
};

/* Les notions fr/maths RÉELLEMENT enseignées (leçons des journées des mondes 1-4). */
CV._taughtIds = null;
CV.taughtModuleIds = function () {
  if (CV._taughtIds) return CV._taughtIds;
  const set = new Set();
  if (CV.buildProgram && CV.dayPlan) {
    CV.buildProgram().forEach((lv) => {
      if (lv.isBoss) return;
      const plan = CV.dayPlan(lv.level);
      if (!plan) return;
      plan.steps.forEach((s) => {
        if (s.moduleId) { const m = CV.getModule(s.moduleId); if (m && !m.isDictee) set.add(s.moduleId); }
      });
    });
  }
  CV._taughtIds = set;
  return set;
};

/* Toute la collection (débloquées + à découvrir) : fr/maths enseignés + sciences/culture des
   boss + une fiche par planète. */
CV._allFiches = null;
CV.allFiches = function () {
  if (CV._allFiches) return CV._allFiches;
  const out = [], seen = {};
  const addModule = (id, kind) => {
    if (seen[id]) return;
    const f = CV.ficheForModule(CV.getModule(id));
    if (f) { seen[id] = 1; out.push(Object.assign({ kind: kind }, f)); }
  };
  CV.taughtModuleIds().forEach((id) => addModule(id, "module"));               // fr / maths
  Object.values(CV.WORLD_BONUS).forEach((ids) => ids.forEach((id) => addModule(id, "bonus")));  // sciences / culture
  (CV.PLANETS || []).forEach((pl) => out.push(CV.planetFiche(pl)));            // planètes
  CV._allFiches = out;
  return out;
};

CV.ficheById = function (id) { return CV.allFiches().find((f) => f.id === id) || null; };

/* Fiches débloquées quand on termine un niveau :
   - planète (Espace) → la fiche de la planète ;
   - journée classique → les modules-leçon (fr + maths) du jour. */
CV.fichesForLevel = function (level) {
  const pl = CV.planetForLevel ? CV.planetForLevel(level) : null;
  if (pl) return ["planet-" + pl.key];
  const plan = CV.dayPlan ? CV.dayPlan(level) : null;
  if (!plan) return [];
  const ids = [];
  plan.steps.forEach((s) => {
    if (s.moduleId) { const f = CV.ficheForModule(CV.getModule(s.moduleId)); if (f) ids.push(f.id); }
  });
  return ids;
};

/* Fiches débloquées quand on bat le boss d'un monde (sciences + culture du thème). */
CV.fichesForBoss = function (level) {
  const w = CV.worldByIndex(CV.worldIndexOfLevel(level));
  const ids = (w && CV.WORLD_BONUS[w.key]) || [];
  return ids.map((id) => "mod-" + id);
};
