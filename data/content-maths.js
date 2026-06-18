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
  }
];
