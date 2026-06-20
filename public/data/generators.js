/* =========================================================
   GÉNÉRATEURS DE QUESTIONS — banque quasi infinie, aléatoire.
   Chaque générateur renvoie une question compatible avec le moteur :
   { type, q, choices?, answer, explain }
   CV.draw(id, n) tire n questions fraîches (sans doublon immédiat).
   ========================================================= */
window.CV = window.CV || {};

(function () {
  const R = (a, b) => a + Math.floor(Math.random() * (b - a + 1)); // entier [a,b]
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const PRENOMS = ["Léa", "Tom", "Gabi", "Noé", "Jade", "Lina", "Hugo", "Manon", "Sacha"];
  const OBJETS = ["billes", "bonbons", "images", "cartes", "gâteaux", "crayons", "coquillages"];

  const G = {};

  /* ---------------- MATHS ---------------- */
  G.add = () => {
    const a = R(11, 89), b = R(11, 99);
    return { type: "calcul", q: a + " + " + b + " = ?", answer: a + b, explain: a + " + " + b + " = " + (a + b) };
  };
  G.addBig = () => {
    const a = R(101, 899), b = R(101, 899);
    return { type: "calcul", q: a + " + " + b + " = ?", answer: a + b, explain: a + " + " + b + " = " + (a + b) };
  };
  G.sub = () => {
    const a = R(30, 99), b = R(10, a);
    return { type: "calcul", q: a + " − " + b + " = ?", answer: a - b, explain: a + " − " + b + " = " + (a - b) + " (vérif : " + (a - b) + " + " + b + " = " + a + ")" };
  };
  G.subBig = () => {
    const a = R(200, 950), b = R(50, a - 10);
    return { type: "calcul", q: a + " − " + b + " = ?", answer: a - b, explain: a + " − " + b + " = " + (a - b) };
  };
  G.mul = () => {
    const a = R(2, 9), b = R(2, 9);
    return { type: "calcul", q: a + " × " + b + " = ?", answer: a * b, explain: "La table de " + a + " : " + a + " × " + b + " = " + (a * b) };
  };
  G.mul10 = () => {
    const a = R(2, 9), b = pick([10, 100]);
    return { type: "calcul", q: a + " × " + b + " = ?", answer: a * b, explain: "× " + b + " : on ajoute " + (b === 10 ? "un zéro" : "deux zéros") + " → " + (a * b) };
  };
  G.compare = () => {
    const a = R(10, 9999), b = R(10, 9999);
    const ans = a < b ? 0 : (a > b ? 1 : 2);
    return { type: "qcm", q: "Quel signe entre " + a + " et " + b + " ?  " + a + " … " + b, choices: ["<", ">", "="], answer: ans, explain: a + (a < b ? " < " : a > b ? " > " : " = ") + b };
  };
  G.numeration = () => {
    const n = R(1000, 9999);
    const s = String(n);
    const rangs = [["unités", 3], ["dizaines", 2], ["centaines", 1], ["milliers", 0]];
    const r = pick(rangs);
    return { type: "qcm", q: "Dans " + n + ", quel est le chiffre des " + r[0] + " ?",
      choices: [s[0], s[1], s[2], s[3]].filter((v, i, a) => a.indexOf(v) === i).slice(0, 3).length >= 3 ? [s[3], s[2], s[1]] : [s[0], s[1], s[2], s[3]].slice(0, 3),
      answer: 0, explain: "" }; // remplacé ci-dessous par version fiable
  };
  // Version fiable de numération (QCM avec 3 choix distincts)
  G.numeration = () => {
    const n = R(1000, 9999);
    const s = String(n);
    const map = { milliers: 0, centaines: 1, dizaines: 2, unités: 3 };
    const noms = Object.keys(map);
    const nom = pick(noms);
    const good = s[map[nom]];
    const others = "0123456789".split("").filter((d) => d !== good);
    const choices = [good, pick(others), pick(others.filter((d) => d !== good))];
    // mélange
    for (let i = choices.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [choices[i], choices[j]] = [choices[j], choices[i]]; }
    return { type: "qcm", q: "Dans " + n + ", quel est le chiffre des " + nom + " ?",
      choices, answer: choices.indexOf(good),
      explain: "milliers=" + s[0] + ", centaines=" + s[1] + ", dizaines=" + s[2] + ", unités=" + s[3] };
  };
  G.suite = () => {
    const d = pick([2, 5, 10, 3]); const start = R(2, 9);
    const seq = [start, start + d, start + 2 * d, start + 3 * d];
    return { type: "calcul", q: "Continue la suite : " + seq.join(", ") + ", … ?", answer: start + 4 * d, explain: "On ajoute " + d + " à chaque fois → " + (start + 4 * d) };
  };
  G.mesures = () => {
    const variants = [
      () => ({ q: "Combien de centimètres dans " + (() => { const m = R(2, 9); G._m = m; return m; })() + " mètres ?", answer: G._m * 100, explain: "1 m = 100 cm" }),
      () => { const km = R(2, 9); return { q: "Combien de mètres dans " + km + " kilomètres ?", answer: km * 1000, explain: "1 km = 1000 m" }; },
      () => { const hh = R(2, 5); return { q: "Combien de minutes dans " + hh + " heures ?", answer: hh * 60, explain: "1 h = 60 min" }; }
    ];
    const v = pick(variants)();
    return { type: "calcul", q: v.q, answer: v.answer, explain: v.explain };
  };
  G.monnaie = () => {
    const variants = [
      () => { const prix = R(3, 18), paye = pick([20, 50, prix + R(1, 10)]); const p = Math.max(paye, prix + 1); return { q: "Un jouet coûte " + prix + " €. Tu paies avec " + p + " €. Combien te rend-on ?", answer: p - prix, explain: p + " − " + prix + " = " + (p - prix) + " €" }; },
      () => { const a = R(2, 9), b = R(2, 9); return { q: a + " BD à " + b + " € chacune. Prix total ?", answer: a * b, explain: a + " × " + b + " = " + (a * b) + " €" }; }
    ];
    const v = pick(variants)();
    return { type: "calcul", q: v.q, answer: v.answer, explain: v.explain };
  };
  /* Problèmes à LIRE (compréhension de consigne) */
  G.probleme = () => {
    const nom = pick(PRENOMS), obj = pick(OBJETS);
    const templates = [
      () => { const a = R(8, 40), b = R(3, 20); return { q: nom + " a " + a + " " + obj + ". " + nom + " en gagne " + b + ". Combien en a-t-" + (Math.random() < .5 ? "il" : "elle") + " maintenant ?", answer: a + b, explain: a + " + " + b + " = " + (a + b) }; },
      () => { const a = R(20, 60), b = R(5, a - 1); return { q: nom + " avait " + a + " " + obj + ". " + nom + " en perd " + b + ". Combien lui en reste-t-il ?", answer: a - b, explain: a + " − " + b + " = " + (a - b) }; },
      () => { const a = R(2, 8), b = R(2, 9); return { q: "Il y a " + a + " boîtes de " + b + " " + obj + ". Combien de " + obj + " en tout ?", answer: a * b, explain: a + " × " + b + " = " + (a * b) }; },
      () => { const total = R(15, 30), g = R(5, total - 3); return { q: "Dans la classe il y a " + total + " élèves. " + g + " sont des garçons. Combien y a-t-il de filles ?", answer: total - g, explain: total + " − " + g + " = " + (total - g) }; }
    ];
    const v = pick(templates)();
    return { type: "calcul", q: v.q, answer: v.answer, explain: v.explain };
  };

  /* ---------------- FRANÇAIS ---------------- */
  G.homophone = () => {
    const sets = [
      { q: "___ frère mange une pomme.", choices: ["Mon", "Mont"], answer: 0, explain: "" },
      { q: "Il ___ un vélo rouge.", choices: ["a", "à"], answer: 0, explain: "On peut dire « avait » → a." },
      { q: "Je vais ___ la piscine.", choices: ["a", "à"], answer: 1, explain: "Ce n'est pas le verbe avoir → à." },
      { q: "Le chien ___ content.", choices: ["est", "et"], answer: 0, explain: "On peut dire « était » → est." },
      { q: "Tom ___ Léa jouent dehors.", choices: ["et", "est"], answer: 0, explain: "On peut dire « et puis » → et." },
      { q: "Elle ___ partie à l'école.", choices: ["est", "et"], answer: 0, explain: "verbe être → est." },
      { q: "Papa ___ deux voitures.", choices: ["a", "à"], answer: 0, explain: "« avait » → a." }
    ];
    return Object.assign({ type: "qcm" }, pick(sets));
  };
  G.pluriel = () => {
    const mots = [
      ["un chat", "des chats"], ["un gâteau", "des gâteaux"], ["un cheval", "des chevaux"],
      ["un jeu", "des jeux"], ["une fleur", "des fleurs"], ["un bateau", "des bateaux"],
      ["un journal", "des journaux"], ["un oiseau", "des oiseaux"], ["une table", "des tables"],
      ["un feu", "des feux"], ["un animal", "des animaux"], ["un château", "des châteaux"]
    ];
    const m = pick(mots);
    const pl = m[1].split(" ")[1];
    return { type: "fill", q: "Mets au pluriel : " + m[0] + " → des ___", answer: [pl], explain: m[0] + " → " + m[1] };
  };
  G.nature = () => {
    const mots = [
      ["maison", "nom"], ["courir", "verbe"], ["joli", "adjectif"], ["chat", "nom"],
      ["manger", "verbe"], ["rapide", "adjectif"], ["école", "nom"], ["sauter", "verbe"],
      ["rouge", "adjectif"], ["bonheur", "nom"], ["chanter", "verbe"], ["grand", "adjectif"]
    ];
    const m = pick(mots);
    const choices = ["nom", "verbe", "adjectif"];
    return { type: "qcm", q: "Quelle est la nature du mot « " + m[0] + " » ?", choices, answer: choices.indexOf(m[1]), explain: "« " + m[0] + " » est un " + m[1] + "." };
  };
  G.conjug = () => {
    const verbes = [["chanter", "chant"], ["jouer", "jou"], ["manger", "mang"], ["danser", "dans"], ["regarder", "regard"]];
    const term = { je: "e", tu: "es", il: "e", elle: "e", nous: "ons", vous: "ez", ils: "ent", elles: "ent" };
    const pronoms = Object.keys(term);
    const v = pick(verbes), p = pick(pronoms);
    let rad = v[1]; let fin = term[p];
    // petite exception : manger → mangeons
    if (v[0] === "manger" && p === "nous") { return { type: "fill", q: "Conjugue au présent : « Nous (manger) ___ ». ", answer: ["mangeons"], explain: "nous mangeons" }; }
    return { type: "fill", q: "Conjugue au présent : « " + (p.charAt(0).toUpperCase() + p.slice(1)) + " (" + v[0] + ") ___ ». ", answer: [rad + fin], explain: p + " " + rad + fin };
  };
  G.etreAvoir = () => {
    const sets = [
      { q: "Tu ___ content. (être)", a: "es" }, { q: "Je ___ huit ans. (avoir)", a: "ai" },
      { q: "Nous ___ à l'école. (être)", a: "sommes" }, { q: "Ils ___ un chien. (avoir)", a: "ont" },
      { q: "Vous ___ gentils. (être)", a: "êtes" }, { q: "Elle ___ une amie. (avoir)", a: "a" },
      { q: "Il ___ grand. (être)", a: "est" }, { q: "Nous ___ faim. (avoir)", a: "avons" }
    ];
    const s = pick(sets);
    return { type: "fill", q: "Complète : « " + s.q + " »", answer: [s.a], explain: "→ " + s.a };
  };
  G.contraire = () => {
    const paires = [["grand", "petit"], ["chaud", "froid"], ["jour", "nuit"], ["content", "triste"],
      ["ouvrir", "fermer"], ["rapide", "lent"], ["monter", "descendre"], ["propre", "sale"]];
    const m = pick(paires);
    const flip = Math.random() < .5;
    const mot = flip ? m[1] : m[0], rep = flip ? m[0] : m[1];
    return { type: "fill", q: "Donne le contraire de « " + mot + " » : ___", answer: [rep], explain: "contraire de " + mot + " = " + rep };
  };

  CV.gen = G;

  /* Tire n questions fraîches d'un générateur (en évitant les doublons). */
  CV.draw = function (id, n) {
    const fn = G[id];
    if (!fn) return [];
    const out = [], seen = {};
    let tries = 0;
    while (out.length < n && tries < n * 12) {
      tries++;
      const q = fn();
      if (q && !seen[q.q]) { seen[q.q] = 1; out.push(q); }
    }
    return out;
  };

  /* Tire un mélange depuis plusieurs générateurs : spec = [["add",4],["probleme",2]] */
  CV.drawMix = function (spec) {
    let out = [];
    spec.forEach(([id, n]) => { out = out.concat(CV.draw(id, n)); });
    return out;
  };

  function shuffle(a) {
    a = a.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }

  /* Quels modules utilisent des questions générées (et en quelle quantité).
     Les autres gardent leurs exercices écrits à la main. */
  CV.GEN_MAP = {
    "ma-numeration":   [["numeration", 5], ["suite", 3]],
    "ma-comparer":     [["compare", 8]],
    "ma-addition":     [["add", 6], ["addBig", 3]],
    "ma-soustraction": [["sub", 6], ["subBig", 3]],
    "ma-tables":       [["mul", 7], ["mul10", 2]],
    "ma-problemes":    [["probleme", 6]],
    "ma-mesures":      [["mesures", 6]],
    "ma-monnaie":      [["monnaie", 6]],
    "fr-homophones":   [["homophone", 8]],
    "fr-present":      [["conjug", 5], ["etreAvoir", 4]],
    "fr-pluriel":      [["pluriel", 8]],
    "fr-natures":      [["nature", 8]],
    "fr-synonymes":    [["contraire", 6]]
  };

  /* Renvoie les exercices d'un module : générés+mélangés si mappé, sinon les écrits. */
  CV.exercisesFor = function (mod) {
    if (!mod) return [];
    const spec = CV.GEN_MAP[mod.id];
    if (spec) { const ex = CV.drawMix(spec); if (ex.length) return shuffle(ex); }
    return mod.exercises || [];
  };
})();
