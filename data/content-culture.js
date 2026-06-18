/* =========================================================
   CONTENU — CULTURE & DÉCOUVERTES (histoire, géo, anglais, logique)
   Journées "fun" : pour les enfants curieux de tout.
   ========================================================= */
window.CV = window.CV || {};
CV.content = CV.content || {};

CV.content.culture = [
  {
    id: "cu-temps",
    subject: "culture",
    title: "Se repérer dans le temps",
    icon: "⏳",
    lesson: {
      intro: "Le temps se mesure en jours, semaines, mois, années… et l'Histoire se range sur une grande frise.",
      points: [
        "Une semaine a 7 jours ; une année a 12 mois et 365 jours.",
        "Les grandes périodes de l'Histoire : Préhistoire, Antiquité, Moyen Âge, Temps modernes, Époque contemporaine.",
        "La Préhistoire, c'est avant l'écriture (les hommes des cavernes).",
        "Le Moyen Âge, c'est l'époque des châteaux forts et des chevaliers !"
      ],
      example: "Les chevaliers et les châteaux forts appartiennent au Moyen Âge.",
      tip: "Une frise chronologique se lit de gauche (le plus ancien) à droite (le plus récent)."
    },
    exercises: [
      { type: "calcul", q: "Combien de jours dans une semaine ?", answer: 7, explain: "7 jours." },
      { type: "calcul", q: "Combien de mois dans une année ?", answer: 12, explain: "12 mois." },
      { type: "qcm", q: "À quelle période vivaient les chevaliers ?", choices: ["la Préhistoire", "le Moyen Âge", "aujourd'hui"], answer: 1, explain: "Les chevaliers, c'est le Moyen Âge." },
      { type: "qcm", q: "La Préhistoire, c'est…", choices: ["avant l'invention de l'écriture", "le futur", "l'an dernier"], answer: 0, explain: "La Préhistoire est avant l'écriture." },
      { type: "truefalse", q: "Une année compte 365 jours.", answer: true, explain: "Oui, 365 jours (366 les années bissextiles)." }
    ]
  },

  {
    id: "cu-geo",
    subject: "culture",
    title: "La France et la planète",
    icon: "🌍",
    lesson: {
      intro: "Tu habites dans une ville, dans un pays (la France), sur un continent (l'Europe), sur la planète Terre.",
      points: [
        "La France est un pays d'Europe. Sa capitale est Paris.",
        "Il y a des océans (Atlantique, Pacifique…) et des continents (Europe, Afrique, Asie, Amérique, Océanie, Antarctique).",
        "Une carte ou un globe représente la Terre en plus petit.",
        "Sur une carte, le bleu montre l'eau (mers, océans) et le vert/marron, la terre."
      ],
      example: "Adresse de plus en plus grande : ma rue → ma ville → la France → l'Europe → la Terre.",
      tip: "Sur un globe, cherche la France : elle est petite mais on la trouve en Europe de l'Ouest !"
    },
    exercises: [
      { type: "qcm", q: "Quelle est la capitale de la France ?", choices: ["Lyon", "Paris", "Marseille"], answer: 1, explain: "La capitale de la France est Paris." },
      { type: "qcm", q: "Sur quel continent se trouve la France ?", choices: ["l'Asie", "l'Europe", "l'Afrique"], answer: 1, explain: "La France est en Europe." },
      { type: "qcm", q: "Sur une carte, le bleu représente…", choices: ["les montagnes", "l'eau", "les villes"], answer: 1, explain: "Le bleu, c'est l'eau (mers et océans)." },
      { type: "truefalse", q: "La Terre est la planète où nous vivons.", answer: true, explain: "Oui, nous vivons sur la Terre." },
      { type: "qcm", q: "Lequel est un océan ?", choices: ["l'Atlantique", "l'Europe", "Paris"], answer: 0, explain: "L'Atlantique est un océan." }
    ]
  },

  {
    id: "cu-anglais",
    subject: "culture",
    title: "Premiers mots d'anglais",
    icon: "🇬🇧",
    lesson: {
      intro: "L'anglais est parlé partout dans le monde. Voici tes premiers mots pour dire bonjour et compter !",
      points: [
        "Bonjour = Hello.  Au revoir = Goodbye.  Merci = Thank you.",
        "Les couleurs : red (rouge), blue (bleu), green (vert), yellow (jaune).",
        "Les nombres : one (1), two (2), three (3), four (4), five (5).",
        "Yes = oui.  No = non.  My name is… = Je m'appelle…"
      ],
      example: "« Hello! My name is Tom. » veut dire « Bonjour ! Je m'appelle Tom. »",
      tip: "Répète les mots à voix haute : l'anglais s'apprend surtout avec les oreilles et la bouche !"
    },
    exercises: [
      { type: "qcm", q: "Que veut dire « Hello » ?", choices: ["Au revoir", "Bonjour", "Merci"], answer: 1, explain: "Hello = Bonjour." },
      { type: "qcm", q: "Quelle couleur est « blue » ?", choices: ["rouge", "bleu", "vert"], answer: 1, explain: "Blue = bleu." },
      { type: "match", q: "Associe le nombre anglais au chiffre.", pairs: [["one", "1"], ["two", "2"], ["three", "3"], ["four", "4"]], explain: "one=1, two=2, three=3, four=4." },
      { type: "qcm", q: "Comment dit-on « merci » en anglais ?", choices: ["Goodbye", "Yes", "Thank you"], answer: 2, explain: "Thank you = merci." },
      { type: "truefalse", q: "« Yes » veut dire « non ».", answer: false, explain: "Yes = oui. No = non." }
    ]
  },

  {
    id: "cu-logique",
    subject: "culture",
    title: "Énigmes et logique",
    icon: "🧠",
    lesson: {
      intro: "Réfléchir, observer, déduire : voici des défis pour faire travailler tes méninges !",
      points: [
        "Une suite logique continue selon une règle : 2, 4, 6, 8… (on ajoute 2).",
        "Pour résoudre une énigme, lis bien et imagine la situation.",
        "Parfois il faut éliminer les mauvaises réponses pour trouver la bonne.",
        "Prends ton temps : réfléchir, ce n'est pas aller vite, c'est aller juste."
      ],
      example: "Suite : 5, 10, 15, 20… La règle est « +5 », donc ensuite : 25.",
      tip: "Si tu bloques, recommence depuis le début et cherche ce qui se répète."
    },
    exercises: [
      { type: "calcul", q: "Continue la suite : 2, 4, 6, 8, ___ ?", answer: 10, explain: "On ajoute 2 à chaque fois : 8 + 2 = 10." },
      { type: "calcul", q: "Continue la suite : 5, 10, 15, 20, ___ ?", answer: 25, explain: "Règle « +5 » : 20 + 5 = 25." },
      { type: "qcm", q: "Je suis grand le matin, petit à midi. Qui suis-je ?", choices: ["une ombre", "un nuage", "une fleur"], answer: 0, explain: "L'ombre change de taille avec la position du soleil." },
      { type: "calcul", q: "Pierre a 3 ans de plus que Léa qui a 7 ans. Quel âge a Pierre ?", answer: 10, explain: "7 + 3 = 10 ans." },
      { type: "qcm", q: "Quel intrus dans la liste : pomme, poire, carotte, banane ?", choices: ["pomme", "carotte", "banane"], answer: 1, explain: "La carotte est un légume, les autres des fruits." }
    ]
  }
];
