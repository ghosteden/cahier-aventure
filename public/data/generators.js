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

/* =========================================================
   Générateurs supplémentaires + banque de dictées (ajout)
   ========================================================= */
(function () {
  const R = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

  /* Ponctuation : quel signe à la fin de la phrase ? */
  CV.gen.ponctuation = function () {
    const sets = [
      { q: "Comment t'appelles-tu", a: 1 }, { q: "Quel beau cadeau", a: 2 },
      { q: "Je lis un livre", a: 0 }, { q: "Où vas-tu", a: 1 },
      { q: "Attention, ça brûle", a: 2 }, { q: "Le chat dort sur le canapé", a: 0 },
      { q: "As-tu fini tes devoirs", a: 1 }, { q: "Comme c'est joli", a: 2 },
      { q: "Nous allons à la mer", a: 0 }, { q: "Quelle heure est-il", a: 1 }
    ];
    const s = pick(sets);
    return { type: "qcm", q: "Quel signe à la fin de : « " + s.q + " … » ?", choices: [".", "?", "!"], answer: s.a,
      explain: s.a === 1 ? "C'est une question → ?" : s.a === 2 ? "Une émotion → !" : "Une phrase qui raconte → ." };
  };

  /* Sujet du verbe */
  CV.gen.sujetVerbe = function () {
    const phr = [
      ["Le chien", "aboie"], ["Les oiseaux", "chantent"], ["Ma sœur", "danse"],
      ["Les enfants", "jouent"], ["Le soleil", "brille"], ["Papa", "cuisine"],
      ["Les fleurs", "poussent"], ["Mon ami", "court"], ["La maîtresse", "explique"]
    ];
    const p = pick(phr);
    const det = p[0].split(" ")[0];
    const choices = shuffleArr([p[0], p[1], det]);
    return { type: "qcm", q: "Dans « " + p[0] + " " + p[1] + " », quel est le sujet ?", choices,
      answer: choices.indexOf(p[0]), explain: "Qui est-ce qui " + p[1] + " ? → " + p[0] + "." };
  };

  /* Synonymes */
  CV.gen.synonyme = function () {
    const paires = [["beau", "joli"], ["content", "heureux"], ["rapide", "véloce"],
      ["gentil", "aimable"], ["drôle", "amusant"], ["triste", "malheureux"],
      ["grand", "immense"], ["petit", "minuscule"], ["calme", "tranquille"]];
    const m = pick(paires);
    const flip = Math.random() < .5;
    const mot = flip ? m[1] : m[0], rep = flip ? m[0] : m[1];
    return { type: "fill", q: "Donne un synonyme de « " + mot + " » : ___", answer: [rep, m[0], m[1]],
      explain: mot + " = " + rep };
  };

  function shuffleArr(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

  /* ---- Banque de dictées CE2 (progressives) ---- */
  CV.DICTEES = [
    "Le chat dort sur le canapé.",
    "Maman prépare un bon gâteau.",
    "Les oiseaux chantent dans le jardin.",
    "Je mange une pomme rouge.",
    "Le petit lapin court dans le pré.",
    "Mon frère joue avec un ballon bleu.",
    "La maîtresse écrit au tableau.",
    "Nous lisons une belle histoire.",
    "Les enfants rangent leurs cahiers.",
    "Le soleil brille dans le ciel bleu.",
    "Papa lave la voiture le samedi.",
    "Ma sœur arrose les jolies fleurs.",
    "Le chien aboie très fort la nuit.",
    "Les poissons nagent dans l'aquarium.",
    "Je mets mes chaussures et mon manteau.",
    "À la récréation, nous jouons au ballon.",
    "Le boulanger vend du pain chaud.",
    "Les feuilles tombent en automne.",
    "Le vélo de Tom est tout neuf.",
    "Nous plantons des graines dans la terre.",
    "La lune éclaire la forêt sombre.",
    "Les abeilles butinent les fleurs du jardin.",
    "Le maître raconte une aventure passionnante.",
    "En hiver, la neige recouvre les toits des maisons.",
    "Les élèves écoutent attentivement la leçon.",
    "Le renard roux traverse rapidement le chemin.",
    "Pendant les vacances, nous visitons un grand château.",
    "Les nuages gris annoncent un orage violent.",
    "Ce matin, le petit chat noir a grimpé tout en haut du grand arbre du jardin.",
    "Pendant les vacances, nous avons visité un château fort avec de hautes tours et un pont-levis.",
    "Dans la forêt, les écureuils ramassent des noisettes pour préparer leurs réserves avant l'arrivée de l'hiver.",
    "Le maître a écrit la nouvelle leçon au tableau, puis les élèves ont recopié leur cahier.",
    "Quand le soleil se couche, le ciel devient orange et les oiseaux rentrent dormir dans leurs nids.",
    "Ma grande sœur prépare une délicieuse tarte aux pommes que toute la famille mangera ce soir.",
    "Les pompiers courageux sont arrivés très vite pour éteindre l'incendie qui ravageait la vieille grange.",
    "Sur la plage, les enfants construisent un immense château de sable avec des coquillages et des drapeaux.",
    "Chaque matin, le boulanger se lève très tôt pour préparer le pain chaud et les croissants dorés.",
    "Le vieux pêcheur attendait patiemment au bord de la rivière que les poissons mordent à son hameçon.",
    "Pendant la récréation, les garçons et les filles jouent ensemble à cache-cache dans la grande cour.",
    "Au zoo, nous avons observé les singes sauter de branche en branche en poussant de grands cris.",
    "La maîtresse raconte une histoire passionnante et toute la classe écoute sans faire le moindre bruit.",
    "Hier, il a tellement plu que les rues du village se sont transformées en petites rivières.",
    "Le jardinier plante des fleurs colorées le long de l'allée pour rendre le parc plus joli.",
    "Dans le ciel d'été, un magnifique arc-en-ciel est apparu juste après la fin de l'orage.",
    "Les astronautes ont enfilé leur combinaison blanche avant de monter à bord de la fusée argentée.",
    "Mon petit frère apprend à faire du vélo sans les roulettes dans le parc près de la maison.",
    "La fermière donne du grain aux poules et ramasse les œufs frais tous les matins.",
    "Le chevalier monte fièrement sur son cheval blanc pour partir à l'aventure à travers le royaume.",
    "Nous avons ramassé des champignons dans les bois, mais maman a jeté ceux qui étaient dangereux.",
    "Le marchand installe ses fruits et ses légumes sur le marché coloré dès le lever du jour.",
    "Une petite souris grise se faufile sous la porte pour aller grignoter un morceau de fromage.",
    "Les vagues de la mer recouvrent doucement les pieds des enfants qui ramassent de jolis coquillages."
  ];

  /* Dictées : on ne garde que les phrases de 10 à 20 mots. */
  CV.DICTEE_WORDS = { min: 10, max: 20 };
  function wordCount(s) { return s.replace(/[.,!?;:«»]/g, "").split(/\s+/).filter(Boolean).length; }
  CV.drawDictee = function (n) {
    n = Math.max(1, n || 1);
    const pool = CV.DICTEES.filter((s) => { const w = wordCount(s); return w >= CV.DICTEE_WORDS.min && w <= CV.DICTEE_WORDS.max; });
    const src = pool.length >= n ? pool : CV.DICTEES;
    const idx = shuffleArr(src.map((_, i) => i)).slice(0, n);
    return { type: "dictee", q: "Écris la phrase que tu entends.", sentences: idx.map((i) => src[i]) };
  };

  /* ---- Jeux de logique (drag-and-drop : ranger/ordonner) ---- */
  const BRICK_COLORS = ["#ff5c7c", "#7c5cff", "#2ec4b6", "#ff9f1c", "#00d4ff", "#a06cd5"];

  CV.gen.logicSize = function () {
    const asc = Math.random() < 0.5;
    const sizes = shuffleArr([1, 2, 3, 4]);
    const tokens = sizes.map((s, i) => ({ id: "b" + i, label: "", w: 44 + s * 26, color: BRICK_COLORS[i % BRICK_COLORS.length], key: s }));
    const sol = tokens.map((t) => t.key).sort((a, b) => asc ? a - b : b - a);
    return { type: "logic", q: "Range les briques.", instruction: asc ? "Range les briques de la PLUS PETITE à la plus grande." : "Range les briques de la PLUS GRANDE à la plus petite.",
      tokens, solutionKeys: sol, explain: "Il fallait les classer par taille." };
  };

  CV.gen.logicNumber = function () {
    const asc = Math.random() < 0.5;
    const nums = [];
    while (nums.length < 4) { const n = R(5, 99); if (nums.indexOf(n) < 0) nums.push(n); }
    const tokens = nums.map((n, i) => ({ id: "n" + i, label: String(n), key: n }));
    const sol = nums.slice().sort((a, b) => asc ? a - b : b - a);
    return { type: "logic", q: "Range les nombres.", instruction: asc ? "Range du plus PETIT au plus grand." : "Range du plus GRAND au plus petit.",
      tokens, solutionKeys: sol, explain: "Classe les nombres par valeur." };
  };

  CV.gen.logicAlpha = function () {
    const words = shuffleArr(["banane", "abricot", "cerise", "datte", "fraise", "kiwi", "mangue", "orange", "poire", "raisin", "tomate", "salade"]).slice(0, 4);
    const tokens = words.map((w, i) => ({ id: "w" + i, label: w, key: w }));
    const sol = words.slice().sort();
    return { type: "logic", q: "Range les mots.", instruction: "Range les mots dans l'ordre ALPHABÉTIQUE (comme le dictionnaire).",
      tokens, solutionKeys: sol, explain: "On regarde la 1re lettre : a, b, c…" };
  };

  CV.gen.logicPattern = function () {
    const startBlue = Math.random() < 0.5;
    const seq = [];
    for (let i = 0; i < 4; i++) seq.push((i % 2 === 0) === startBlue ? "🔵" : "🔴");
    const tokens = seq.map((e, i) => ({ id: "p" + i, label: e, key: e }));
    return { type: "logic", q: "Place les briques.", instruction: "Range les briques pour ALTERNER les couleurs, en commençant par " + (startBlue ? "🔵 (bleu)" : "🔴 (rouge)") + ".",
      tokens, solutionKeys: seq, explain: "Une couleur sur deux, sans jamais deux pareilles côte à côte." };
  };

  /* Suite de motifs : compléter la case vide d'une suite qui se répète. */
  CV.gen.suiteMotifs = function () {
    const PAIRS = [["🔴", "🔵"], ["🟡", "🟢"], ["⭐", "🌙"], ["🔺", "🟦"], ["🍎", "🍌"], ["🐱", "🐶"]];
    const pair = pick(PAIRS);
    const patt = pick([["A", "B"], ["A", "A", "B"], ["A", "B", "B"]]);
    const map = { A: pair[0], B: pair[1] };
    const base = patt.map((x) => map[x]);
    const seq = []; for (let i = 0; i < 6; i++) seq.push(base[i % base.length]);
    const holeAt = 5;
    const answer = seq[holeAt];
    const sequence = seq.map((g, i) => (i === holeAt ? { zoneId: "z0" } : { glyph: g }));
    const distract = pick(["⚡", "🌟", "🟣", "🍒"].filter((x) => pair.indexOf(x) < 0));
    const cands = shuffleArr([answer, pair[0] === answer ? pair[1] : pair[0], distract]);
    const pieces = cands.map((g, i) => ({ id: "p" + i, key: g, glyph: g }));
    return { type: "place", layout: "sequence", q: "Continue la suite.",
      instruction: "Quelle image continue la suite ? Glisse-la dans la case vide.",
      sequence, zones: [{ id: "z0", expect: answer }], pieces,
      explain: "La suite se répète : " + base.join(" ") + " …" };
  };

  /* Tableau à double entrée : placer chaque forme (couleur en ligne, forme en colonne). */
  CV.gen.doubleEntry = function () {
    const COLORS = [{ name: "rouge", c: "#e63946" }, { name: "bleu", c: "#3a7bd5" }, { name: "vert", c: "#2a9d8f" }, { name: "orange", c: "#e8871e" }];
    const SHAPES = [{ g: "●" }, { g: "■" }, { g: "▲" }, { g: "★" }];
    const rows = shuffleArr(COLORS.slice()).slice(0, 2);
    const cols = shuffleArr(SHAPES.slice()).slice(0, 3);
    const pieces = [], zones = [];
    rows.forEach((col, ri) => cols.forEach((sh, ci) => {
      const key = ri + "-" + ci;
      pieces.push({ id: "t" + key, key, glyph: sh.g, color: col.c });
      zones.push({ id: "z" + key, row: ri, col: ci, expect: key });
    }));
    return { type: "place", layout: "grid", q: "Le tableau à double entrée.",
      instruction: "Place chaque forme dans la case de SA couleur (ligne) ET de SA forme (colonne).",
      grid: { colHeaders: cols.map((s) => ({ glyph: s.g })), rowHeaders: rows.map((c) => ({ color: c.c })) },
      zones, pieces: shuffleArr(pieces),
      explain: "On croise la ligne (couleur) et la colonne (forme)." };
  };

  /* Choisit un jeu de logique au hasard. */
  CV.gen.logic = function () {
    return pick([CV.gen.logicSize, CV.gen.logicNumber, CV.gen.logicAlpha, CV.gen.suiteMotifs, CV.gen.doubleEntry])();
  };
})();
