/* =========================================================
   CONTENU — SCIENCES & DÉCOUVERTE DU MONDE (CE2)
   Journées "fun" : plus légères, ludiques, avec des expériences.
   ========================================================= */
window.CV = window.CV || {};
CV.content = CV.content || {};

CV.content.sciences = [
  {
    id: "sc-eau",
    subject: "sciences",
    title: "Les états de l'eau",
    icon: "💧",
    lesson: {
      intro: "L'eau peut prendre 3 formes différentes selon la température : c'est magique mais très scientifique !",
      points: [
        "L'eau LIQUIDE coule (la pluie, la rivière, le robinet).",
        "L'eau SOLIDE, c'est la glace : quand il fait très froid (0 °C ou moins), l'eau gèle.",
        "L'eau GAZEUSE, c'est la vapeur : quand l'eau bout (100 °C), elle s'évapore.",
        "On peut passer d'un état à l'autre en chauffant ou en refroidissant."
      ],
      example: "Un glaçon (solide) fond et devient de l'eau (liquide), puis s'évapore au soleil (vapeur).",
      tip: "Expérience : mets un glaçon dans ta main. La chaleur le fait fondre : solide → liquide !"
    },
    exercises: [
      { type: "qcm", q: "À quelle température l'eau gèle-t-elle ?", choices: ["0 °C", "50 °C", "100 °C"], answer: 0, explain: "À 0 °C, l'eau devient de la glace." },
      { type: "qcm", q: "La glace est de l'eau à l'état…", choices: ["liquide", "solide", "gazeux"], answer: 1, explain: "La glace est solide." },
      { type: "truefalse", q: "La vapeur d'eau est l'eau à l'état gazeux.", answer: true, explain: "Quand l'eau bout, elle devient vapeur (gaz)." },
      { type: "qcm", q: "Un glaçon qui fond passe de…", choices: ["solide à liquide", "liquide à solide", "gaz à solide"], answer: 0, explain: "La glace (solide) devient de l'eau (liquide)." },
      { type: "qcm", q: "À quelle température l'eau bout-elle ?", choices: ["0 °C", "37 °C", "100 °C"], answer: 2, explain: "L'eau bout à 100 °C." }
    ]
  },

  {
    id: "sc-vivant",
    subject: "sciences",
    title: "Le vivant : besoins des êtres vivants",
    icon: "🌱",
    lesson: {
      intro: "Les êtres vivants (animaux, plantes, toi !) naissent, grandissent, se reproduisent et meurent.",
      points: [
        "Pour vivre, un animal a besoin de manger, de boire et de respirer.",
        "Une plante a besoin d'eau, de lumière et d'air pour grandir.",
        "Les animaux qui mangent des plantes sont herbivores ; ceux qui mangent de la viande, carnivores ; les deux, omnivores.",
        "Tous les êtres vivants suivent un cycle de vie : naître, grandir, vieillir."
      ],
      example: "La vache est herbivore (elle broute l'herbe) ; le lion est carnivore ; l'humain est omnivore.",
      tip: "Expérience : plante un haricot dans du coton humide près de la fenêtre et observe-le pousser !"
    },
    exercises: [
      { type: "qcm", q: "De quoi une plante a-t-elle besoin pour grandir ?", choices: ["d'eau et de lumière", "de chocolat", "d'obscurité totale"], answer: 0, explain: "Eau, lumière et air font pousser les plantes." },
      { type: "qcm", q: "Un animal qui ne mange que des plantes est…", choices: ["carnivore", "herbivore", "omnivore"], answer: 1, explain: "Herbivore = mange des plantes." },
      { type: "match", q: "Associe chaque animal à son régime.", pairs: [["lion", "carnivore"], ["vache", "herbivore"], ["humain", "omnivore"]], explain: "Lion = viande, vache = herbe, humain = les deux." },
      { type: "truefalse", q: "Les plantes sont des êtres vivants.", answer: true, explain: "Elles naissent, grandissent et se reproduisent : elles sont vivantes." },
      { type: "qcm", q: "Lequel n'est PAS vivant ?", choices: ["un arbre", "un caillou", "un poisson"], answer: 1, explain: "Le caillou ne naît pas et ne grandit pas." }
    ]
  },

  {
    id: "sc-corps",
    subject: "sciences",
    title: "Le corps humain : les 5 sens",
    icon: "👀",
    lesson: {
      intro: "Grâce à tes 5 sens, tu découvres le monde autour de toi.",
      points: [
        "La VUE : avec les yeux, on voit les couleurs et les formes.",
        "L'OUÏE : avec les oreilles, on entend les sons.",
        "L'ODORAT : avec le nez, on sent les odeurs.",
        "Le GOÛT (la langue) et le TOUCHER (la peau) complètent les cinq sens."
      ],
      example: "Quand tu manges une fraise : tu la vois (vue), tu la sens (odorat), tu la goûtes (goût) !",
      tip: "Ferme les yeux et écoute : combien de sons différents entends-tu autour de toi ?"
    },
    exercises: [
      { type: "qcm", q: "Avec quel organe sent-on les odeurs ?", choices: ["les oreilles", "le nez", "la langue"], answer: 1, explain: "Le nez sert à l'odorat." },
      { type: "match", q: "Associe chaque sens à son organe.", pairs: [["la vue", "les yeux"], ["l'ouïe", "les oreilles"], ["le goût", "la langue"], ["le toucher", "la peau"]], explain: "Chaque sens a son organe." },
      { type: "calcul", q: "Combien de sens a un être humain ?", answer: 5, explain: "Il y a 5 sens." },
      { type: "truefalse", q: "On entend les sons grâce aux yeux.", answer: false, explain: "On entend avec les oreilles (l'ouïe)." },
      { type: "qcm", q: "Quel sens utilises-tu pour savoir qu'un glaçon est froid ?", choices: ["le toucher", "le goût", "la vue"], answer: 0, explain: "La peau ressent le froid : c'est le toucher." }
    ]
  },

  {
    id: "sc-systeme-solaire",
    subject: "sciences",
    title: "La Terre et le système solaire",
    icon: "🪐",
    lesson: {
      intro: "Notre planète, la Terre, tourne autour du Soleil avec 7 autres planètes.",
      points: [
        "Le Soleil est une étoile : il donne la lumière et la chaleur.",
        "Il y a 8 planètes. La Terre est la 3e à partir du Soleil.",
        "La Terre tourne sur elle-même en 24 heures : cela fait le jour et la nuit.",
        "La Lune tourne autour de la Terre : c'est son satellite."
      ],
      example: "Quand notre côté de la Terre fait face au Soleil, c'est le jour ; de l'autre côté, c'est la nuit.",
      tip: "Le Soleil ne « se couche » pas vraiment : c'est la Terre qui tourne !"
    },
    exercises: [
      { type: "qcm", q: "Le Soleil est…", choices: ["une planète", "une étoile", "une lune"], answer: 1, explain: "Le Soleil est une étoile." },
      { type: "calcul", q: "Combien d'heures met la Terre pour tourner sur elle-même ?", answer: 24, explain: "24 heures = un jour et une nuit." },
      { type: "truefalse", q: "La Lune tourne autour de la Terre.", answer: true, explain: "La Lune est le satellite de la Terre." },
      { type: "qcm", q: "Qu'est-ce qui fait le jour et la nuit ?", choices: ["la Terre qui tourne sur elle-même", "le Soleil qui s'éteint", "les nuages"], answer: 0, explain: "La rotation de la Terre crée le jour et la nuit." },
      { type: "calcul", q: "Combien y a-t-il de planètes dans le système solaire ?", answer: 8, explain: "Il y a 8 planètes." }
    ]
  }
];
