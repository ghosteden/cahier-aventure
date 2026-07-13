/* =========================================================
   CONTENU — MATHÉMATIQUES (programme CE2)
   ========================================================= */
window.CV = window.CV || {};
CV.content = CV.content || {};

CV.content.maths = [
  {
    id: "ma-numeration",
    subject: "maths",
    title: "Les nombres jusqu'à 9999",
    icon: "🔢",
    lesson: {
      intro: "Un grand nombre se range en colonnes : unités, dizaines, centaines, milliers.",
      points: [
        "1 dizaine = 10 unités. 1 centaine = 100 unités. 1 millier = 1000 unités.",
        "Dans 3 472 : 3 milliers, 4 centaines, 7 dizaines, 2 unités.",
        "Le chiffre des centaines dans 3 472 est 4.",
        "On lit de gauche à droite : trois-mille-quatre-cent-soixante-douze."
      ],
      example: "2 580 = 2 milliers + 5 centaines + 8 dizaines + 0 unité.",
      tip: "Le rang d'un chiffre dépend de SA place, pas de sa valeur écrite."
    },
    exercises: [
      { type: "qcm", q: "Dans 4 736, quel est le chiffre des centaines ?", choices: ["4", "7", "3"], answer: 1, explain: "milliers=4, centaines=7, dizaines=3, unités=6." },
      { type: "calcul", q: "Combien d'unités dans 6 centaines ?", answer: 600, explain: "1 centaine = 100, donc 6 × 100 = 600." },
      { type: "qcm", q: "Comment s'écrit « deux-mille-quarante » en chiffres ?", choices: ["2040", "2400", "240"], answer: 0, explain: "2 milliers, 0 centaine, 4 dizaines, 0 unité → 2040." },
      { type: "fill", q: "Quel nombre vaut 3 milliers + 5 dizaines ? ___", answer: ["3050"], explain: "3000 + 50 = 3050 (0 centaine, 0 unité)." },
      { type: "truefalse", q: "Dans 1 999, le chiffre des milliers est 9.", answer: false, explain: "Le chiffre des milliers est 1." }
    ]
  },

  {
    id: "ma-comparer",
    subject: "maths",
    title: "Comparer et ranger les nombres",
    icon: "⚖️",
    lesson: {
      intro: "Comparer, c'est dire quel nombre est le plus grand. On utilise les signes < et >.",
      points: [
        "Le signe < veut dire « plus petit que » : 12 < 20.",
        "Le signe > veut dire « plus grand que » : 35 > 30.",
        "Pour comparer, on regarde d'abord le nombre de chiffres, puis chiffre par chiffre depuis la gauche.",
        "Ranger dans l'ordre croissant = du plus petit au plus grand."
      ],
      example: "1 250 et 1 300 : même millier, même centaine ? Non : 2 < 3, donc 1 250 < 1 300.",
      tip: "La « bouche » du signe < ou > est toujours ouverte vers le plus grand nombre."
    },
    exercises: [
      { type: "qcm", q: "Quel signe entre 45 et 54 ?  45 ... 54", choices: ["<", ">", "="], answer: 0, explain: "45 est plus petit que 54 : 45 < 54." },
      { type: "qcm", q: "Quel est le plus grand ?", choices: ["1 290", "1 209", "1 092"], answer: 0, explain: "1290 > 1209 > 1092." },
      { type: "truefalse", q: "230 > 320 est vrai.", answer: false, explain: "230 est plus petit que 320." },
      { type: "fill", q: "Range du plus petit au plus grand : 50, 15, 5 → ___ , ___ , ___ (sépare par des virgules)", answer: ["5, 15, 50", "5,15,50"], explain: "Ordre croissant : 5, 15, 50." },
      { type: "calcul", q: "Quel est le plus grand nombre à 3 chiffres ?", answer: 999, explain: "Le plus grand : 999." }
    ]
  },

  {
    id: "ma-addition",
    subject: "maths",
    title: "L'addition posée",
    icon: "➕",
    lesson: {
      intro: "Pour additionner de grands nombres, on les pose en colonnes en alignant les unités.",
      points: [
        "On aligne unités sous unités, dizaines sous dizaines…",
        "On additionne colonne par colonne, en commençant par la droite (les unités).",
        "Si le total d'une colonne dépasse 9, on pose le chiffre des unités et on RETIENT la dizaine.",
        "La retenue s'ajoute à la colonne suivante."
      ],
      example: "27 + 15 : 7+5 = 12, je pose 2 et je retiens 1 ; 2+1+1 = 4 → 42.",
      tip: "N'oublie jamais d'ajouter la retenue à la colonne d'à côté !"
    },
    exercises: [
      { type: "calcul", q: "Calcule : 27 + 15 = ?", answer: 42, explain: "7+5=12 (pose 2, retiens 1), 2+1+1=4 → 42." },
      { type: "calcul", q: "Calcule : 134 + 248 = ?", answer: 382, explain: "4+8=12 (retiens 1), 3+4+1=8, 1+2=3 → 382." },
      { type: "calcul", q: "Calcule : 56 + 38 = ?", answer: 94, explain: "6+8=14 (retiens 1), 5+3+1=9 → 94." },
      { type: "calcul", q: "Calcule : 405 + 95 = ?", answer: 500, explain: "5+5=10 (retiens 1), 0+9+1=10 (retiens 1), 4+1=5 → 500." },
      { type: "qcm", q: "Dans 8 + 6 = 14, que fait-on du 1 ?", choices: ["on l'oublie", "on le retient pour la colonne suivante", "on le pose à droite"], answer: 1, explain: "Le 1 est la retenue : on l'ajoute à la colonne des dizaines." }
    ]
  },

  {
    id: "ma-soustraction",
    subject: "maths",
    title: "La soustraction posée",
    icon: "➖",
    lesson: {
      intro: "Soustraire, c'est enlever. On pose les nombres en colonnes, le plus grand en haut.",
      points: [
        "On aligne les chiffres (unités sous unités) et on commence par la droite.",
        "Si le chiffre du haut est trop petit, on emprunte une dizaine à la colonne d'à côté.",
        "Vérifie ton résultat : différence + nombre du bas = nombre du haut.",
        "Soustraire sert à calculer une différence, un reste, ce qui manque…"
      ],
      example: "52 − 17 : 2 − 7 impossible, j'emprunte → 12 − 7 = 5 ; puis 4 − 1 = 3 → 35.",
      tip: "Pour vérifier : 35 + 17 = 52. Si ça retombe, c'est juste !"
    },
    exercises: [
      { type: "calcul", q: "Calcule : 52 − 17 = ?", answer: 35, explain: "12−7=5, 4−1=3 → 35. Vérif : 35+17=52." },
      { type: "calcul", q: "Calcule : 80 − 25 = ?", answer: 55, explain: "10−5=5, 7−2=5 → 55." },
      { type: "calcul", q: "Calcule : 143 − 28 = ?", answer: 115, explain: "13−8=5, 3−2=1, 1 → 115." },
      { type: "calcul", q: "J'avais 100 billes, j'en perds 36. Combien me reste-t-il ?", answer: 64, explain: "100 − 36 = 64." },
      { type: "truefalse", q: "Pour vérifier 60 − 24 = 36, je calcule 36 + 24.", answer: true, explain: "36 + 24 = 60 : c'est juste !" }
    ]
  },

  {
    id: "ma-tables",
    subject: "maths",
    title: "Les tables de multiplication",
    icon: "✖️",
    lesson: {
      intro: "Multiplier, c'est additionner plusieurs fois le même nombre. 4 × 3 = 4 + 4 + 4 = 12.",
      points: [
        "Multiplier par 2, c'est doubler : 7 × 2 = 14.",
        "Multiplier par 10, on ajoute un zéro : 6 × 10 = 60.",
        "L'ordre ne change pas le résultat : 3 × 8 = 8 × 3.",
        "Connaître ses tables par cœur fait gagner beaucoup de temps !"
      ],
      example: "5 × 4 = 20 (cinq groupes de quatre). C'est aussi 4 × 5.",
      tip: "Apprends une table à la fois. La table de 5 finit toujours par 0 ou 5."
    },
    exercises: [
      { type: "calcul", q: "Combien font 6 × 7 ?", answer: 42, explain: "6 × 7 = 42." },
      { type: "calcul", q: "Combien font 8 × 4 ?", answer: 32, explain: "8 × 4 = 32." },
      { type: "calcul", q: "Combien font 9 × 3 ?", answer: 27, explain: "9 × 3 = 27." },
      { type: "calcul", q: "Combien font 7 × 5 ?", answer: 35, explain: "La table de 5 : 7 × 5 = 35." },
      { type: "qcm", q: "Quel calcul donne le même résultat que 4 × 6 ?", choices: ["6 × 4", "4 + 6", "6 − 4"], answer: 0, explain: "L'ordre ne change rien : 4 × 6 = 6 × 4 = 24." }
    ]
  },

  {
    id: "ma-problemes",
    subject: "maths",
    title: "Résoudre des problèmes",
    icon: "🧩",
    lesson: {
      intro: "Un problème raconte une histoire avec des nombres. Il faut trouver quelle opération utiliser.",
      points: [
        "Étape 1 : lis bien et repère la question.",
        "Étape 2 : entoure les nombres utiles.",
        "Étape 3 : choisis l'opération (+ pour rassembler, − pour enlever, × pour des groupes égaux).",
        "Étape 4 : calcule, puis écris une phrase-réponse."
      ],
      example: "« 3 paquets de 6 gâteaux : combien en tout ? » → 3 × 6 = 18 gâteaux.",
      tip: "Demande-toi : est-ce que ça augmente ou ça diminue ? Ça aide à choisir l'opération."
    },
    exercises: [
      { type: "calcul", q: "Léa a 12 bonbons, elle en reçoit 9. Combien en a-t-elle ?", answer: 21, explain: "On rassemble : 12 + 9 = 21." },
      { type: "calcul", q: "Il y a 4 boîtes de 5 crayons. Combien de crayons en tout ?", answer: 20, explain: "Des groupes égaux : 4 × 5 = 20." },
      { type: "calcul", q: "Un livre coûte 8 €. Tu paies avec 20 €. Combien te rend-on ?", answer: 12, explain: "On enlève : 20 − 8 = 12 €." },
      { type: "calcul", q: "25 élèves, 12 sont des filles. Combien de garçons ?", answer: 13, explain: "25 − 12 = 13 garçons." },
      { type: "qcm", q: "« 6 sachets de 10 billes, combien en tout ? » Quelle opération ?", choices: ["6 + 10", "6 × 10", "10 − 6"], answer: 1, explain: "Des groupes égaux → multiplication : 6 × 10 = 60." }
    ]
  },

  {
    id: "ma-geometrie",
    subject: "maths",
    title: "Les figures géométriques",
    icon: "📐",
    lesson: {
      intro: "On reconnaît une figure à ses côtés et ses angles. L'angle droit est l'angle du coin d'une feuille.",
      points: [
        "Le carré : 4 côtés égaux et 4 angles droits.",
        "Le rectangle : 4 angles droits, mais les côtés opposés sont égaux deux à deux.",
        "Le triangle : 3 côtés et 3 sommets.",
        "Le cercle : une courbe fermée, tous les points à la même distance du centre."
      ],
      example: "Une fenêtre est souvent un rectangle ; une part de pizza ressemble à un triangle.",
      tip: "Utilise le coin de ta règle ou d'une feuille pour vérifier un angle droit."
    },
    exercises: [
      { type: "qcm", q: "Quelle figure a 4 côtés égaux et 4 angles droits ?", choices: ["le rectangle", "le carré", "le triangle"], answer: 1, explain: "Le carré : 4 côtés égaux + 4 angles droits." },
      { type: "calcul", q: "Combien de côtés a un triangle ?", answer: 3, explain: "Un triangle a 3 côtés." },
      { type: "truefalse", q: "Un rectangle a 4 angles droits.", answer: true, explain: "Oui, comme le carré." },
      { type: "qcm", q: "Quelle figure n'a aucun angle ?", choices: ["le carré", "le cercle", "le triangle"], answer: 1, explain: "Le cercle est une courbe : pas d'angle." },
      { type: "calcul", q: "Combien de sommets a un carré ?", answer: 4, explain: "Un carré a 4 sommets (les coins)." }
    ]
  },

  {
    id: "ma-mesures",
    subject: "maths",
    title: "Mesures : longueurs et durées",
    icon: "📏",
    lesson: {
      intro: "On mesure les longueurs en mètres (m) et centimètres (cm), et le temps en heures et minutes.",
      points: [
        "1 mètre (m) = 100 centimètres (cm).",
        "1 kilomètre (km) = 1000 mètres (m).",
        "1 heure = 60 minutes. 1 minute = 60 secondes.",
        "Sur une horloge, la petite aiguille montre les heures, la grande les minutes."
      ],
      example: "Une règle d'écolier mesure 30 cm ; un terrain de foot, environ 100 m.",
      tip: "Pour passer des m aux cm, multiplie par 100 ; pour les cm aux m, divise par 100."
    },
    exercises: [
      { type: "calcul", q: "Combien de centimètres dans 1 mètre ?", answer: 100, explain: "1 m = 100 cm." },
      { type: "calcul", q: "Combien de minutes dans 1 heure ?", answer: 60, explain: "1 h = 60 min." },
      { type: "calcul", q: "Combien de mètres dans 2 kilomètres ?", answer: 2000, explain: "1 km = 1000 m, donc 2 km = 2000 m." },
      { type: "qcm", q: "Pour mesurer ta taille, quelle unité est la mieux ?", choices: ["le km", "le cm", "la seconde"], answer: 1, explain: "On mesure une taille en centimètres (ou mètres)." },
      { type: "calcul", q: "Un film dure 2 heures. Combien de minutes ?", answer: 120, explain: "2 × 60 = 120 minutes." }
    ]
  },

  {
    id: "ma-monnaie",
    subject: "maths",
    title: "La monnaie (les euros)",
    icon: "💶",
    lesson: {
      intro: "On paie avec des euros (€) et des centimes. 1 euro = 100 centimes.",
      points: [
        "Il existe des pièces (1, 2, 5, 10, 20, 50 centimes, 1 €, 2 €) et des billets (5, 10, 20, 50 €…).",
        "Pour payer, on additionne la valeur des pièces et billets.",
        "Quand on paie trop, le marchand rend la monnaie (une soustraction).",
        "1 € = 100 centimes."
      ],
      example: "Une glace coûte 3 €. Je paie avec un billet de 5 € → on me rend 2 €.",
      tip: "Compte d'abord les billets, puis les pièces, du plus grand au plus petit."
    },
    exercises: [
      { type: "calcul", q: "J'ai 2 pièces de 2 € et 1 pièce de 1 €. Combien en tout (en €) ?", answer: 5, explain: "2 + 2 + 1 = 5 €." },
      { type: "calcul", q: "Un jouet coûte 14 €. Je paie 20 €. Combien me rend-on ?", answer: 6, explain: "20 − 14 = 6 €." },
      { type: "calcul", q: "Combien de centimes dans 1 euro ?", answer: 100, explain: "1 € = 100 centimes." },
      { type: "calcul", q: "Deux BD à 7 € chacune. Prix total ?", answer: 14, explain: "7 × 2 = 14 €." },
      { type: "truefalse", q: "Avec un billet de 10 €, je peux payer un livre à 12 €.", answer: false, explain: "12 € > 10 € : il manque de l'argent." }
    ]
  },

  {
    id: "ma-multiplication-posee",
    subject: "maths",
    title: "La multiplication posée",
    icon: "✖️",
    lesson: {
      intro: "Pour multiplier un grand nombre par un petit, on pose la multiplication en colonnes.",
      points: [
        "On multiplie chaque chiffre par le nombre, en commençant par les unités.",
        "Si le résultat dépasse 9, on pose les unités et on RETIENT.",
        "On ajoute la retenue au produit suivant.",
        "Exemple : 24 × 3 → 4×3 = 12 (pose 2, retiens 1) ; 2×3 = 6, +1 = 7 → 72."
      ],
      example: "13 × 4 : 3×4 = 12 (pose 2, retiens 1) ; 1×4 = 4, +1 = 5 → 52.",
      tip: "N'oublie pas d'ajouter la retenue au chiffre suivant !"
    },
    exercises: [
      { type: "calcul", q: "Calcule : 24 × 3 = ?", answer: 72, explain: "4×3=12 (retiens 1), 2×3=6 +1=7 → 72." },
      { type: "calcul", q: "Calcule : 13 × 4 = ?", answer: 52, explain: "3×4=12 (retiens 1), 1×4=4 +1=5 → 52." },
      { type: "calcul", q: "Calcule : 45 × 2 = ?", answer: 90, explain: "5×2=10 (retiens 1), 4×2=8 +1=9 → 90." }
    ]
  },

  {
    id: "ma-division",
    subject: "maths",
    title: "Le partage (division)",
    icon: "➗",
    lesson: {
      intro: "Diviser, c'est partager en parts égales. « Combien chacun en a-t-il ? »",
      points: [
        "Partager 12 bonbons entre 3 enfants : 12 ÷ 3 = 4 bonbons chacun.",
        "La division est le contraire de la multiplication : 3 × 4 = 12, donc 12 ÷ 3 = 4.",
        "On peut s'aider des tables de multiplication.",
        "Parfois il reste des objets qu'on ne peut pas partager (le reste)."
      ],
      example: "15 images pour 5 enfants → 15 ÷ 5 = 3 images chacun (car 5 × 3 = 15).",
      tip: "Demande-toi : « combien de fois le petit nombre entre dans le grand ? »"
    },
    exercises: [
      { type: "calcul", q: "Partage 12 en 3 parts égales : 12 ÷ 3 = ?", answer: 4, explain: "3 × 4 = 12." },
      { type: "calcul", q: "20 bonbons pour 4 enfants. Combien chacun ?", answer: 5, explain: "20 ÷ 4 = 5 (4×5=20)." },
      { type: "calcul", q: "18 ÷ 6 = ?", answer: 3, explain: "6 × 3 = 18." },
      { type: "calcul", q: "Combien de fois 5 dans 35 ?", answer: 7, explain: "5 × 7 = 35." }
    ]
  },

  {
    id: "ma-fractions",
    subject: "maths",
    title: "Les fractions : demi et quart",
    icon: "🍕",
    lesson: {
      intro: "Une fraction, c'est une part d'un tout partagé en parts égales.",
      points: [
        "La MOITIÉ (un demi, ½) : on partage en 2 parts égales. La moitié de 8 = 4.",
        "Le QUART (¼) : on partage en 4 parts égales. Le quart de 8 = 2.",
        "Deux demis font un entier : ½ + ½ = 1.",
        "Une pizza coupée en 4 : chaque part est un quart."
      ],
      example: "La moitié de 10, c'est 5. Le quart de 12, c'est 3 (12 ÷ 4).",
      tip: "La moitié = diviser par 2. Le quart = diviser par 4."
    },
    exercises: [
      { type: "calcul", q: "La moitié de 10 = ?", answer: 5, explain: "10 ÷ 2 = 5." },
      { type: "calcul", q: "Le quart de 12 = ?", answer: 3, explain: "12 ÷ 4 = 3." },
      { type: "calcul", q: "La moitié de 16 = ?", answer: 8, explain: "16 ÷ 2 = 8." },
      { type: "qcm", q: "Une pizza est coupée en 4 parts égales. Une part, c'est…", choices: ["un demi", "un quart", "un tiers"], answer: 1, explain: "4 parts → un quart." }
    ]
  },

  {
    id: "ma-doubles-moities",
    subject: "maths",
    title: "Doubles et moitiés",
    icon: "🔁",
    lesson: {
      intro: "Le double, c'est deux fois plus. La moitié, c'est deux fois moins.",
      points: [
        "Le DOUBLE d'un nombre = le nombre × 2. Double de 6 = 12.",
        "La MOITIÉ d'un nombre = le nombre ÷ 2. Moitié de 6 = 3.",
        "Double et moitié sont contraires : la moitié de 12 est 6, le double de 6 est 12.",
        "On ne peut prendre la moitié que d'un nombre pair."
      ],
      example: "Double de 8 = 16 · Moitié de 8 = 4 · Double de 25 = 50.",
      tip: "Double → tu ajoutes le nombre à lui-même (6 + 6 = 12)."
    },
    exercises: [
      { type: "calcul", q: "Le double de 7 = ?", answer: 14, explain: "7 × 2 = 14." },
      { type: "calcul", q: "La moitié de 18 = ?", answer: 9, explain: "18 ÷ 2 = 9." },
      { type: "calcul", q: "Le double de 25 = ?", answer: 50, explain: "25 × 2 = 50." }
    ]
  },

  {
    id: "ma-pairs-impairs",
    subject: "maths",
    title: "Nombres pairs et impairs",
    icon: "⚖️",
    lesson: {
      intro: "Un nombre est PAIR si on peut le partager en 2 parts égales, sinon il est IMPAIR.",
      points: [
        "Pairs : ils se terminent par 0, 2, 4, 6 ou 8 (2, 10, 24, 56…).",
        "Impairs : ils se terminent par 1, 3, 5, 7 ou 9 (3, 11, 27…).",
        "On reconnaît un nombre pair à son dernier chiffre.",
        "Le double d'un nombre est toujours pair."
      ],
      example: "48 est pair (finit par 8). 35 est impair (finit par 5).",
      tip: "Regarde seulement le dernier chiffre !"
    },
    exercises: [
      { type: "truefalse", q: "Le nombre 24 est pair.", answer: true, explain: "il finit par 4 → pair." },
      { type: "qcm", q: "Lequel est impair ?", choices: ["10", "17", "22"], answer: 1, explain: "17 finit par 7 → impair." },
      { type: "truefalse", q: "Le nombre 30 est impair.", answer: false, explain: "il finit par 0 → pair." }
    ]
  },

  {
    id: "ma-calcul-mental",
    subject: "maths",
    title: "Calcul mental : les compléments",
    icon: "🧠",
    lesson: {
      intro: "Le calcul mental, c'est calculer vite dans sa tête. Les compléments sont très utiles.",
      points: [
        "Compléter à 10 : 7 + ? = 10 → 3. (Apprends les paires : 1-9, 2-8, 3-7, 4-6, 5-5.)",
        "Compléter à 100 avec des dizaines : 60 + ? = 100 → 40.",
        "Ajouter 10 : on ajoute 1 à la dizaine (34 + 10 = 44).",
        "Ces astuces aident pour la monnaie et les additions."
      ],
      example: "8 + ? = 10 → 2 · 70 + ? = 100 → 30 · 45 + 10 = 55.",
      tip: "Pour compléter à 10, pense à la « paire » qui va avec ton chiffre."
    },
    exercises: [
      { type: "calcul", q: "Complète à 10 : 7 + ? = 10", answer: 3, explain: "7 + 3 = 10." },
      { type: "calcul", q: "Complète à 100 : 60 + ? = 100", answer: 40, explain: "60 + 40 = 100." },
      { type: "calcul", q: "34 + 10 = ?", answer: 44, explain: "on ajoute 1 dizaine." },
      { type: "calcul", q: "Complète à 10 : 4 + ? = 10", answer: 6, explain: "4 + 6 = 10." }
    ]
  },

  {
    id: "ma-geometrie-droites",
    subject: "maths",
    title: "Points, droites et segments",
    icon: "📏",
    lesson: {
      intro: "En géométrie, on utilise des points, des droites et des segments, tracés à la règle.",
      points: [
        "Un POINT est un tout petit endroit précis. On le note avec une lettre (A, B…).",
        "Une DROITE est infinie : elle continue des deux côtés sans fin.",
        "Un SEGMENT a un début et une fin (deux points). Ex. : le segment [AB].",
        "Des points ALIGNÉS sont sur la même droite (on peut les relier avec la règle)."
      ],
      example: "Le segment [AB] relie le point A au point B. Une règle sert à tracer droit.",
      tip: "Pour vérifier si des points sont alignés, pose ta règle : passent-ils tous dessus ?"
    },
    exercises: [
      { type: "qcm", q: "Qu'est-ce qui a un début ET une fin ?", choices: ["une droite", "un segment", "un point"], answer: 1, explain: "le segment (deux extrémités)." },
      { type: "qcm", q: "Avec quel instrument trace-t-on un trait droit ?", choices: ["le compas", "la règle", "l'équerre"], answer: 1, explain: "la règle." },
      { type: "truefalse", q: "Une droite s'arrête à ses deux bouts.", answer: false, explain: "une droite est infinie ; c'est le segment qui a deux bouts." },
      { type: "qcm", q: "Des points sur la même droite sont…", choices: ["alignés", "parallèles", "perpendiculaires"], answer: 0, explain: "alignés." }
    ]
  },

  {
    id: "ma-angle-droit",
    subject: "maths",
    title: "L'angle droit",
    icon: "📐",
    lesson: {
      intro: "Un angle droit, c'est un « coin » parfait, comme le coin d'une feuille ou d'une fenêtre.",
      points: [
        "L'angle droit se vérifie avec une ÉQUERRE (ou le coin d'une feuille).",
        "Le carré et le rectangle ont 4 angles droits.",
        "Deux droites qui se croisent en formant un angle droit sont perpendiculaires.",
        "On dessine souvent un petit carré pour montrer un angle droit."
      ],
      example: "Le coin d'un livre, d'une porte, d'une table : ce sont des angles droits.",
      tip: "Utilise le coin d'une feuille : s'il rentre pile dans l'angle, c'est un angle droit."
    },
    exercises: [
      { type: "qcm", q: "Quel instrument vérifie un angle droit ?", choices: ["la règle", "l'équerre", "le compas"], answer: 1, explain: "l'équerre." },
      { type: "calcul", q: "Combien d'angles droits a un rectangle ?", answer: 4, explain: "4 angles droits." },
      { type: "qcm", q: "Le coin d'une feuille forme…", choices: ["un angle droit", "un cercle", "un point"], answer: 0, explain: "un angle droit." },
      { type: "truefalse", q: "Un carré a 4 angles droits.", answer: true, explain: "oui, comme le rectangle." }
    ]
  },

  {
    id: "ma-symetrie",
    subject: "maths",
    title: "La symétrie",
    icon: "🦋",
    lesson: {
      intro: "Une figure est symétrique si on peut la plier en deux moitiés qui se superposent parfaitement.",
      points: [
        "L'axe de symétrie est la ligne de pliage (comme un miroir).",
        "De chaque côté de l'axe, c'est pareil mais inversé (comme dans un miroir).",
        "Un papillon, un cœur, la lettre A ont un axe de symétrie.",
        "Pour compléter une figure symétrique : chaque point a son « reflet » de l'autre côté."
      ],
      example: "Plie une feuille avec une tache de peinture : les deux moitiés sont symétriques.",
      tip: "Imagine un miroir posé sur l'axe : le reflet doit tomber sur l'autre moitié."
    },
    exercises: [
      { type: "qcm", q: "L'axe de symétrie, c'est…", choices: ["la ligne de pliage (miroir)", "un angle", "un sommet"], answer: 0, explain: "la ligne de pliage." },
      { type: "truefalse", q: "Un papillon a un axe de symétrie.", answer: true, explain: "ses deux ailes sont symétriques." },
      { type: "qcm", q: "Quelle lettre a un axe de symétrie vertical ?", choices: ["A", "F", "G"], answer: 0, explain: "le A est symétrique (miroir vertical)." },
      { type: "truefalse", q: "Dans une figure symétrique, les deux moitiés se superposent quand on plie.", answer: true, explain: "c'est la définition." }
    ]
  },

  {
    id: "ma-solides",
    subject: "maths",
    title: "Les solides",
    icon: "🧊",
    lesson: {
      intro: "Les solides sont des objets en volume (en 3D), pas des figures plates.",
      points: [
        "Le CUBE : 6 faces carrées identiques (un dé).",
        "Le PAVÉ droit (parallélépipède) : 6 faces rectangulaires (une boîte).",
        "La BOULE (sphère) : toute ronde (un ballon).",
        "Le CYLINDRE : deux disques et un tour (une boîte de conserve)."
      ],
      example: "Un dé = un cube · une boîte de céréales = un pavé · un ballon = une boule.",
      tip: "Compte les faces : le cube et le pavé en ont 6."
    },
    exercises: [
      { type: "qcm", q: "Un dé de jeu est un…", choices: ["cube", "cylindre", "boule"], answer: 0, explain: "6 faces carrées → cube." },
      { type: "calcul", q: "Combien de faces a un cube ?", answer: 6, explain: "6 faces." },
      { type: "qcm", q: "Une boîte de conserve ressemble à un…", choices: ["cube", "cylindre", "pavé"], answer: 1, explain: "cylindre." },
      { type: "qcm", q: "Un ballon de foot est une…", choices: ["boule", "pyramide", "boîte"], answer: 0, explain: "une boule (sphère)." }
    ]
  },

  {
    id: "ma-quadrillage",
    subject: "maths",
    title: "Se repérer sur un quadrillage",
    icon: "🗺️",
    lesson: {
      intro: "Sur un quadrillage, on repère une case grâce à une lettre (colonne) et un chiffre (ligne).",
      points: [
        "Les colonnes sont repérées par des lettres (A, B, C…).",
        "Les lignes sont repérées par des chiffres (1, 2, 3…).",
        "La case B3 = colonne B, ligne 3.",
        "C'est comme la bataille navale : on croise la lettre et le chiffre."
      ],
      example: "Le trésor est en case C2 : on va à la colonne C puis à la ligne 2.",
      tip: "On dit toujours la lettre d'abord, puis le chiffre (B3)."
    },
    exercises: [
      { type: "qcm", q: "La case « B3 » se trouve…", choices: ["colonne B, ligne 3", "colonne 3, ligne B", "n'importe où"], answer: 0, explain: "lettre = colonne, chiffre = ligne." },
      { type: "truefalse", q: "Sur un quadrillage, on donne d'abord la lettre puis le chiffre.", answer: true, explain: "oui : B3." },
      { type: "qcm", q: "Ce système ressemble au jeu…", choices: ["de la bataille navale", "de dames", "du solitaire"], answer: 0, explain: "bataille navale." }
    ]
  },

  {
    id: "ma-masses",
    subject: "maths",
    title: "Les masses : grammes et kilogrammes",
    icon: "⚖️",
    lesson: {
      intro: "On mesure combien un objet est lourd : sa masse, en grammes (g) et kilogrammes (kg).",
      points: [
        "1 kilogramme (kg) = 1000 grammes (g).",
        "On pèse avec une BALANCE.",
        "Une pomme ≈ 150 g · un paquet de sucre = 1 kg · un enfant ≈ 25 kg.",
        "Pour comparer, il faut la même unité (tout en g, ou tout en kg)."
      ],
      example: "2 kg = 2000 g · 500 g = un demi-kilo.",
      tip: "Pour passer des kg aux g, multiplie par 1000."
    },
    exercises: [
      { type: "calcul", q: "Combien de grammes dans 1 kg ?", answer: 1000, explain: "1 kg = 1000 g." },
      { type: "calcul", q: "Combien de grammes dans 3 kg ?", answer: 3000, explain: "3 × 1000 = 3000 g." },
      { type: "qcm", q: "Avec quoi mesure-t-on une masse ?", choices: ["une règle", "une balance", "une horloge"], answer: 1, explain: "une balance." },
      { type: "qcm", q: "Que pèse à peu près un paquet de sucre ?", choices: ["1 g", "1 kg", "100 kg"], answer: 1, explain: "environ 1 kg." }
    ]
  },

  {
    id: "ma-contenances",
    subject: "maths",
    title: "Les contenances : le litre",
    icon: "🥤",
    lesson: {
      intro: "La contenance, c'est la quantité de liquide qu'un récipient peut contenir. On la mesure en litres (L).",
      points: [
        "On mesure les liquides en LITRES (L).",
        "Une bouteille d'eau = 1 litre ou 1,5 litre.",
        "Un verre contient beaucoup moins qu'un litre.",
        "Pour remplir un seau, il faut plusieurs litres."
      ],
      example: "Une grande bouteille = 1,5 L · une brique de lait = 1 L.",
      tip: "Pense à la bouteille d'eau : c'est à peu près 1 litre."
    },
    exercises: [
      { type: "qcm", q: "En quoi mesure-t-on les liquides ?", choices: ["en litres", "en grammes", "en mètres"], answer: 0, explain: "en litres." },
      { type: "qcm", q: "Que contient environ une bouteille d'eau ?", choices: ["1 litre", "1 gramme", "1 mètre"], answer: 0, explain: "environ 1 litre." },
      { type: "calcul", q: "J'ai 3 bouteilles de 1 litre. Combien de litres en tout ?", answer: 3, explain: "3 × 1 = 3 litres." },
      { type: "truefalse", q: "Un verre contient plus qu'un litre.", answer: false, explain: "un verre contient beaucoup moins." }
    ]
  },

  {
    id: "ma-heure",
    subject: "maths",
    title: "Lire l'heure",
    icon: "🕐",
    lesson: {
      intro: "Sur une horloge, la petite aiguille montre les heures, la grande montre les minutes.",
      points: [
        "1 heure = 60 minutes. 1 demi-heure = 30 minutes. 1 quart d'heure = 15 minutes.",
        "Quand la grande aiguille est sur le 12, il est « pile » (2 h, 3 h…).",
        "Sur le 6, il est « et demie » (2 h 30).",
        "L'après-midi, 13 h = 1 h, 14 h = 2 h, 15 h = 3 h…"
      ],
      example: "8 h 30 = huit heures et demie · 12 h 15 = midi et quart.",
      tip: "Grande aiguille sur 12 = pile ; sur 6 = et demie."
    },
    exercises: [
      { type: "calcul", q: "Combien de minutes dans une demi-heure ?", answer: 30, explain: "30 minutes." },
      { type: "calcul", q: "Combien de minutes dans un quart d'heure ?", answer: 15, explain: "15 minutes." },
      { type: "qcm", q: "Il est 15 h. Dans l'après-midi, c'est…", choices: ["1 h", "3 h", "5 h"], answer: 1, explain: "15 − 12 = 3 → 3 h de l'après-midi." },
      { type: "calcul", q: "Combien de minutes dans 1 heure ?", answer: 60, explain: "60 minutes." }
    ]
  },

  {
    id: "ma-calendrier",
    subject: "maths",
    title: "Le calendrier",
    icon: "📅",
    lesson: {
      intro: "Le calendrier aide à se repérer dans les jours, les semaines, les mois et l'année.",
      points: [
        "Une semaine = 7 jours (lundi, mardi, mercredi, jeudi, vendredi, samedi, dimanche).",
        "Une année = 12 mois et 365 jours (366 les années bissextiles).",
        "Les mois : janvier, février, mars, avril, mai, juin, juillet, août, septembre, octobre, novembre, décembre.",
        "Certains mois ont 30 jours, d'autres 31 (et février 28 ou 29)."
      ],
      example: "Après le mois de mars vient le mois d'avril.",
      tip: "Récite les mois dans l'ordre pour trouver celui d'avant ou d'après."
    },
    exercises: [
      { type: "calcul", q: "Combien de mois dans une année ?", answer: 12, explain: "12 mois." },
      { type: "calcul", q: "Combien de jours dans une semaine ?", answer: 7, explain: "7 jours." },
      { type: "qcm", q: "Quel mois vient après juin ?", choices: ["mai", "juillet", "août"], answer: 1, explain: "…juin, juillet… → juillet." },
      { type: "qcm", q: "Combien de jours dans une année ?", choices: ["300", "365", "400"], answer: 1, explain: "365 jours." }
    ]
  }
];
