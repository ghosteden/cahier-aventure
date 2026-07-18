/* =========================================================
   FICHES DE CONNAISSANCE
   Chaque leçon terminée débloque une fiche : un résumé « à retenir » de la notion.
   Chaque boss vaincu débloque en plus une fiche de MONDE (le fait marquant du thème).
   Les fiches se consultent dans l'écran Trophées (collection).
   ========================================================= */
window.CV = window.CV || {};

/* Fait marquant débloqué après le boss de chaque monde (index = ordre des mondes). */
CV.WORLD_FICHES = [
  { id: "world-dino",   emoji: "🦖", title: "Le monde des dinosaures",
    text: "Les dinosaures ont vécu il y a des millions d'années, bien avant les humains. Une énorme météorite les a fait disparaître il y a 66 millions d'années." },
  { id: "world-ulysse", emoji: "⚡", title: "Les dieux et les héros",
    text: "Les Grecs et les Vikings racontaient des mythes : des histoires de dieux comme Zeus ou Thor, et de héros comme Ulysse, pour expliquer le monde." },
  { id: "world-chevaliers", emoji: "🏰", title: "Le temps des chevaliers",
    text: "Au Moyen Âge, les chevaliers vivaient dans des châteaux forts. Ils portaient une armure et juraient fidélité à leur seigneur." },
  { id: "world-pirate", emoji: "🏴‍☠️", title: "L'âge des pirates",
    text: "Les pirates naviguaient sur toutes les mers pour chercher des trésors. Ils suivaient des cartes et hissaient un drapeau noir pour faire peur." },
  { id: "world-espace", emoji: "🚀", title: "Le système solaire",
    text: "Huit planètes tournent autour du Soleil : Mercure, Vénus, la Terre, Mars, Jupiter, Saturne, Uranus et Neptune. Pluton est une planète naine." }
];

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

/* Les notions RÉELLEMENT enseignées (leçons des journées) : ce sont les seules dont la fiche
   peut se débloquer. Les modules de sciences/culture ne sont jamais des leçons → pas de fiche
   fantôme impossible à obtenir. */
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

/* Toutes les fiches de la collection (débloquées + à découvrir). */
CV._allFiches = null;
CV.allFiches = function () {
  if (CV._allFiches) return CV._allFiches;
  const out = [];
  CV.WORLD_FICHES.forEach((f) => out.push(Object.assign({ kind: "world" }, f)));
  const taught = CV.taughtModuleIds();
  (CV.allModules ? CV.allModules() : []).forEach((m) => {
    if (!taught.has(m.id)) return;                 // seulement les notions vraiment enseignées
    const f = CV.ficheForModule(m);
    if (f) out.push(Object.assign({ kind: "module" }, f));
  });
  CV._allFiches = out;
  return out;
};

CV.ficheById = function (id) { return CV.allFiches().find((f) => f.id === id) || null; };

/* Fiches débloquées quand on termine un niveau donné (les modules-leçon de la journée). */
CV.fichesForLevel = function (level) {
  const plan = CV.dayPlan ? CV.dayPlan(level) : null;
  if (!plan) return [];
  const ids = [];
  plan.steps.forEach((s) => {
    if (s.moduleId) { const f = CV.ficheForModule(CV.getModule(s.moduleId)); if (f) ids.push(f.id); }
  });
  return ids;
};
