/* =========================================================
   CONTENU — FRANÇAIS (programme CE2)
   Chaque "module" = une leçon + une série d'exercices.
   Types d'exercices : qcm, fill, truefalse, match, dictee.
   ========================================================= */
window.CV = window.CV || {};
CV.content = CV.content || {};

CV.content.francais = [
  {
    id: "fr-natures",
    subject: "francais",
    title: "La nature des mots",
    icon: "🔤",
    lesson: {
      intro: "Chaque mot a une « nature » : c'est sa carte d'identité. Savoir reconnaître les natures aide à bien écrire.",
      points: [
        "Le NOM désigne une personne, un animal, une chose ou une idée : chat, école, joie.",
        "Le VERBE dit ce qu'on fait ou ce qui se passe : courir, manger, être.",
        "L'ADJECTIF donne une précision sur le nom : un grand chien, une fleur rouge.",
        "Le DÉTERMINANT est un petit mot devant le nom : le, la, un, des, mon, cette."
      ],
      example: "Dans « Le petit chat dort », il y a : le (déterminant), petit (adjectif), chat (nom), dort (verbe).",
      tip: "Pour trouver le verbe, demande-toi : « Qu'est-ce qui se passe ? »"
    },
    exercises: [
      { type: "qcm", q: "Quelle est la nature du mot « maison » ?", choices: ["un verbe", "un nom", "un adjectif"], answer: 1, explain: "« maison » désigne une chose : c'est un nom." },
      { type: "qcm", q: "Dans « un joli dessin », quel mot est l'adjectif ?", choices: ["un", "joli", "dessin"], answer: 1, explain: "« joli » précise comment est le dessin : c'est un adjectif." },
      { type: "match", q: "Associe chaque mot à sa nature.", pairs: [["sauter", "verbe"], ["table", "nom"], ["rapide", "adjectif"], ["les", "déterminant"]], explain: "Sauter = action, table = chose, rapide = précision, les = petit mot devant le nom." },
      { type: "truefalse", q: "Le mot « courir » est un nom.", answer: false, explain: "« courir » est une action : c'est un verbe." },
      { type: "fill", q: "Recopie le verbe de la phrase : « Léa chante une chanson. »", answer: ["chante"], explain: "Léa fait l'action de chanter." }
    ]
  },

  {
    id: "fr-phrase",
    subject: "francais",
    title: "La phrase et la ponctuation",
    icon: "📝",
    lesson: {
      intro: "Une phrase commence par une majuscule et se termine par un point. Elle veut dire quelque chose.",
      points: [
        "Le point « . » termine une phrase qui raconte (déclarative).",
        "Le point d'interrogation « ? » termine une question.",
        "Le point d'exclamation « ! » montre une émotion (surprise, joie, colère).",
        "La virgule « , » sert à faire une petite pause dans la phrase."
      ],
      example: "Quelle belle journée ! → exclamation.  As-tu fini ? → question.  Je lis un livre. → déclarative.",
      tip: "Lis la phrase à voix haute : ta voix monte pour une question, elle s'emballe pour une exclamation."
    },
    exercises: [
      { type: "qcm", q: "Quel signe met-on à la fin de « Comment t'appelles-tu » ?", choices: [".", "?", "!"], answer: 1, explain: "C'est une question : on met un point d'interrogation." },
      { type: "qcm", q: "« Attention, le sol est mouillé » exprime…", choices: ["une question", "une émotion / un avertissement", "rien du tout"], answer: 1, explain: "On prévient avec force : on pourrait mettre un point d'exclamation." },
      { type: "truefalse", q: "Une phrase commence toujours par une majuscule.", answer: true, explain: "Oui, toujours une majuscule au début." },
      { type: "qcm", q: "Combien de phrases dans : « Il pleut. Je prends mon parapluie. » ?", choices: ["1", "2", "3"], answer: 1, explain: "Deux points = deux phrases." },
      { type: "fill", q: "Quel signe manque ? « Quel beau cadeau ___ »", answer: ["!"], explain: "On exprime la joie : point d'exclamation." }
    ]
  },

  {
    id: "fr-sujet-verbe",
    subject: "francais",
    title: "Le sujet et le verbe",
    icon: "🎯",
    lesson: {
      intro: "Dans une phrase, le verbe est l'action. Le sujet, c'est celui qui fait l'action.",
      points: [
        "Pour trouver le verbe : cherche l'action ou ce qui se passe.",
        "Pour trouver le sujet : pose la question « Qui est-ce qui… ? » avant le verbe.",
        "Le sujet peut être un nom, un groupe de mots ou un pronom (je, tu, il, elle, nous…).",
        "Le verbe s'accorde avec le sujet : « Les enfants jouent » (pluriel)."
      ],
      example: "« Les oiseaux chantent. » → Qui est-ce qui chante ? Les oiseaux (sujet). Chantent = verbe.",
      tip: "Tu peux encadrer le sujet par « C'est … qui » : C'est les oiseaux qui chantent."
    },
    exercises: [
      { type: "qcm", q: "Dans « Le chien aboie », quel est le sujet ?", choices: ["aboie", "Le chien", "Le"], answer: 1, explain: "Qui est-ce qui aboie ? Le chien." },
      { type: "fill", q: "Trouve le sujet : « Demain, mes cousins arrivent. »", answer: ["mes cousins", "les cousins", "cousins"], explain: "Qui est-ce qui arrive ? Mes cousins." },
      { type: "truefalse", q: "Dans « Nous mangeons », le sujet est « Nous ».", answer: true, explain: "« Nous » est un pronom sujet." },
      { type: "qcm", q: "Quel verbe est correct ? « Les fleurs ___ dans le jardin. »", choices: ["pousse", "poussent", "pousses"], answer: 1, explain: "Sujet pluriel « les fleurs » → poussent." },
      { type: "match", q: "Associe chaque sujet à son verbe correct.", pairs: [["Je", "mange"], ["Tu", "manges"], ["Ils", "mangent"], ["Nous", "mangeons"]], explain: "Le verbe change selon le sujet." }
    ]
  },

  {
    id: "fr-present",
    subject: "francais",
    title: "Le présent des verbes",
    icon: "⏱️",
    lesson: {
      intro: "Le présent dit ce qui se passe maintenant. Les verbes en -ER prennent des terminaisons régulières.",
      points: [
        "Verbes en -ER (chanter) : je chante, tu chantes, il chante, nous chantons, vous chantez, ils chantent.",
        "ÊTRE : je suis, tu es, il est, nous sommes, vous êtes, ils sont.",
        "AVOIR : j'ai, tu as, il a, nous avons, vous avez, ils ont.",
        "ALLER : je vais, tu vas, il va, nous allons, vous allez, ils vont."
      ],
      example: "« Tu joues dans le parc. » → verbe jouer, 2e personne : tu joues (terminaison -es).",
      tip: "Avec « nous », ça se termine presque toujours par -ons ; avec « vous », par -ez."
    },
    exercises: [
      { type: "fill", q: "Conjugue au présent : « Nous (manger) ___ une pomme. »", answer: ["mangeons"], explain: "Avec « nous » → mangeons." },
      { type: "qcm", q: "« Tu ___ content. » (verbe être)", choices: ["es", "est", "ai"], answer: 0, explain: "Tu es (verbe être, 2e personne)." },
      { type: "fill", q: "« Je (avoir) ___ huit ans. »", answer: ["ai"], explain: "J'ai (verbe avoir)." },
      { type: "qcm", q: "« Ils ___ à l'école. » (verbe aller)", choices: ["va", "vont", "allons"], answer: 1, explain: "Ils vont (verbe aller, 3e personne pluriel)." },
      { type: "fill", q: "« Vous (chanter) ___ très bien. »", answer: ["chantez"], explain: "Avec « vous » → chantez." }
    ]
  },

  {
    id: "fr-homophones",
    subject: "francais",
    title: "a / à  et  et / est",
    icon: "🔍",
    lesson: {
      intro: "Certains mots se prononcent pareil mais s'écrivent différemment. Voici une astuce pour ne plus se tromper.",
      points: [
        "« a » (sans accent) = le verbe avoir. Astuce : on peut le remplacer par « avait ».",
        "« à » (avec accent) = un petit mot, jamais un verbe. Il va à la mer.",
        "« est » = le verbe être. Astuce : on peut le remplacer par « était ».",
        "« et » = on peut le remplacer par « et puis » (il relie deux choses)."
      ],
      example: "« Il a (avait) un vélo et (et puis) il va à la plage. »",
      tip: "Si tu peux dire « avait », c'est « a ». Si tu peux dire « était », c'est « est »."
    },
    exercises: [
      { type: "qcm", q: "« Mon frère ___ un ballon. »", choices: ["à", "a"], answer: 1, explain: "On peut dire « avait » → a (verbe avoir)." },
      { type: "qcm", q: "« Je vais ___ la piscine. »", choices: ["a", "à"], answer: 1, explain: "Ce n'est pas le verbe avoir → à (avec accent)." },
      { type: "qcm", q: "« Le ciel ___ bleu. »", choices: ["est", "et"], answer: 0, explain: "On peut dire « était » → est (verbe être)." },
      { type: "fill", q: "Complète avec et / est : « Tom ___ Léa jouent. »", answer: ["et"], explain: "On peut dire « et puis » → et." },
      { type: "truefalse", q: "Dans « Elle est gentille », « est » est le verbe être.", answer: true, explain: "On peut dire « était gentille »." }
    ]
  },

  {
    id: "fr-pluriel",
    subject: "francais",
    title: "Le pluriel des noms",
    icon: "➕",
    lesson: {
      intro: "Quand il y a plusieurs choses, le nom se met au pluriel. En général on ajoute un -s.",
      points: [
        "Règle générale : on ajoute -s. un chat → des chats.",
        "Les noms en -au, -eau, -eu prennent un -x : un bateau → des bateaux, un jeu → des jeux.",
        "Beaucoup de noms en -al font -aux : un cheval → des chevaux.",
        "Le déterminant aussi change : le → les, un → des."
      ],
      example: "un oiseau → des oiseaux ; un journal → des journaux ; une pomme → des pommes.",
      tip: "Si tu hésites entre -s et -x, pense à la famille -au/-eau/-eu qui aime le -x."
    },
    exercises: [
      { type: "fill", q: "Mets au pluriel : un gâteau → des ___", answer: ["gâteaux", "gateaux"], explain: "Les noms en -eau prennent un -x." },
      { type: "fill", q: "Mets au pluriel : un cheval → des ___", answer: ["chevaux"], explain: "-al devient -aux." },
      { type: "qcm", q: "Quel est le bon pluriel de « jeu » ?", choices: ["jeus", "jeux", "jeaux"], answer: 1, explain: "Les noms en -eu prennent un -x : des jeux." },
      { type: "fill", q: "Mets au pluriel : une fleur → des ___", answer: ["fleurs"], explain: "Règle générale : on ajoute -s." },
      { type: "truefalse", q: "Le pluriel de « bateau » est « bateaus ».", answer: false, explain: "C'est « bateaux » avec un -x." }
    ]
  },

  {
    id: "fr-synonymes",
    subject: "francais",
    title: "Synonymes et contraires",
    icon: "🔁",
    lesson: {
      intro: "Pour enrichir ton vocabulaire, tu peux remplacer un mot par un autre qui veut dire la même chose (synonyme) ou le contraire.",
      points: [
        "Un SYNONYME veut dire à peu près la même chose : content = joyeux = heureux.",
        "Un CONTRAIRE (ou antonyme) veut dire l'inverse : grand ≠ petit, jour ≠ nuit.",
        "On peut fabriquer un contraire avec un préfixe : possible → impossible, content → mécontent.",
        "Changer de mot rend tes textes plus jolis et plus précis."
      ],
      example: "Au lieu de « il est gentil », on peut dire « il est aimable, adorable, sympathique ».",
      tip: "Le dictionnaire donne souvent des synonymes : c'est un trésor de mots !"
    },
    exercises: [
      { type: "qcm", q: "Quel est un synonyme de « rapide » ?", choices: ["lent", "véloce", "lourd"], answer: 1, explain: "Véloce = rapide." },
      { type: "qcm", q: "Quel est le contraire de « content » ?", choices: ["joyeux", "triste", "heureux"], answer: 1, explain: "Le contraire de content, c'est triste." },
      { type: "match", q: "Associe chaque mot à son contraire.", pairs: [["chaud", "froid"], ["grand", "petit"], ["ouvrir", "fermer"], ["jour", "nuit"]], explain: "Chaque paire est un mot et son contraire." },
      { type: "fill", q: "Donne un synonyme de « beau » (commence par j) : ___", answer: ["joli", "joli."], explain: "Joli est un synonyme de beau." },
      { type: "truefalse", q: "« Triste » et « malheureux » sont des synonymes.", answer: true, explain: "Ils veulent dire à peu près la même chose." }
    ]
  },

  {
    id: "fr-alphabet",
    subject: "francais",
    title: "L'ordre alphabétique",
    icon: "🔡",
    lesson: {
      intro: "Pour chercher un mot dans le dictionnaire, il faut connaître l'ordre des lettres de l'alphabet.",
      points: [
        "L'alphabet compte 26 lettres, de A à Z.",
        "Pour ranger des mots, on regarde la 1re lettre. Si elle est la même, on regarde la 2e, puis la 3e.",
        "Exemple : chat vient avant chien (h avant i).",
        "Cela sert dans le dictionnaire, l'annuaire, les listes de classe…"
      ],
      example: "Ranger : banane, abricot, cerise → abricot, banane, cerise (a, b, c).",
      tip: "Récite l'alphabet dans ta tête pour savoir quelle lettre vient avant l'autre."
    },
    exercises: [
      { type: "qcm", q: "Quelle lettre vient juste après le M ?", choices: ["L", "N", "O"], answer: 1, explain: "…L, M, N… Après M, c'est N." },
      { type: "qcm", q: "Quel mot vient en premier dans le dictionnaire ?", choices: ["lune", "lampe", "livre"], answer: 1, explain: "la → li → lu : lampe vient en premier." },
      { type: "truefalse", q: "« Pomme » vient avant « poire » dans le dictionnaire.", answer: false, explain: "poi… avant pom… : poire vient avant pomme." },
      { type: "qcm", q: "Combien de lettres dans l'alphabet français ?", choices: ["24", "26", "28"], answer: 1, explain: "Il y a 26 lettres." },
      { type: "fill", q: "Quelle lettre vient juste avant le G ? ___", answer: ["f", "F"], explain: "…E, F, G… avant G c'est F." }
    ]
  },

  /* ---- Modules de DICTÉE (lecture vocale) ---- */
  {
    id: "fr-dictee-1",
    subject: "francais",
    title: "Dictée — Au jardin",
    icon: "🎧",
    isDictee: true,
    lesson: {
      intro: "Une dictée s'écoute, puis on écrit. Tu peux réécouter chaque phrase autant de fois que tu veux !",
      points: [
        "Écoute bien la phrase en entier avant d'écrire.",
        "Pense aux majuscules en début de phrase et aux points à la fin.",
        "N'oublie pas les accords : pluriel des noms, accord du verbe.",
        "Relis-toi à voix basse pour repérer les oublis."
      ],
      example: "Astuce : appuie sur « 🔊 Réécouter » si tu n'as pas tout entendu.",
      tip: "Écris d'abord, corrige ensuite : l'appli te montre les mots à revoir en couleur."
    },
    exercises: [
      { type: "dictee", q: "Écris la phrase que tu entends.", sentences: [
        "Le petit lapin mange une carotte.",
        "Les oiseaux chantent dans les arbres.",
        "Ma sœur arrose les jolies fleurs rouges."
      ] }
    ]
  },

  {
    id: "fr-dictee-2",
    subject: "francais",
    title: "Dictée — L'école",
    icon: "🎧",
    isDictee: true,
    lesson: {
      intro: "Nouvelle dictée ! Concentre-toi sur les accords et la ponctuation.",
      points: [
        "Repère les noms au pluriel : ajoute un -s.",
        "Le verbe s'accorde avec son sujet.",
        "Les mots « et / est », « a / à » : repense aux astuces.",
        "Une majuscule au début, un point à la fin."
      ],
      example: "Astuce : prononce les liaisons pour entendre les pluriels (« les_enfants »).",
      tip: "Prends ton temps : la vitesse, ça vient après !"
    },
    exercises: [
      { type: "dictee", q: "Écris la phrase que tu entends.", sentences: [
        "Le maître écrit la leçon au tableau.",
        "Les élèves rangent leurs cahiers bleus.",
        "À la récréation, les enfants jouent au ballon."
      ] }
    ]
  },

  {
    id: "fr-imparfait",
    subject: "francais",
    title: "L'imparfait",
    icon: "⏳",
    lesson: {
      intro: "L'imparfait raconte le passé : des habitudes ou des actions qui duraient (« autrefois », « quand j'étais petit »).",
      points: [
        "Verbes en -ER : je chantais, tu chantais, il chantait, nous chantions, vous chantiez, ils chantaient.",
        "Terminaisons de l'imparfait : -ais, -ais, -ait, -ions, -iez, -aient.",
        "ÊTRE : j'étais, tu étais, il était, nous étions, vous étiez, ils étaient.",
        "AVOIR : j'avais, tu avais, il avait, nous avions, vous aviez, ils avaient."
      ],
      example: "« Avant, nous habitions à la campagne et nous avions un grand jardin. »",
      tip: "À l'imparfait, on entend souvent « -ait » à la fin (il chantait, il jouait)."
    },
    exercises: [
      { type: "fill", q: "Imparfait : « Autrefois, je (jouer) ___ dans la cour. »", answer: ["jouais"], explain: "je jouais (-ais)." },
      { type: "qcm", q: "« Quand nous étions petits, nous ___ à la mer. » (aller)", choices: ["allions", "allons", "irons"], answer: 0, explain: "imparfait avec nous → -ions." },
      { type: "fill", q: "« Il (être) ___ content hier. »", answer: ["était"], explain: "verbe être à l'imparfait : il était." }
    ]
  },

  {
    id: "fr-futur",
    subject: "francais",
    title: "Le futur",
    icon: "🚀",
    lesson: {
      intro: "Le futur dit ce qui va se passer plus tard (« demain », « bientôt »).",
      points: [
        "Verbes en -ER : je chanterai, tu chanteras, il chantera, nous chanterons, vous chanterez, ils chanteront.",
        "Terminaisons du futur : -rai, -ras, -ra, -rons, -rez, -ront.",
        "ÊTRE : je serai, tu seras, il sera, nous serons, vous serez, ils seront.",
        "AVOIR : j'aurai, tu auras, il aura, nous aurons, vous aurez, ils auront."
      ],
      example: "« Demain, nous irons au parc et nous jouerons au ballon. »",
      tip: "Au futur, tu entends souvent le « r » : il mangeRA, tu iRAS."
    },
    exercises: [
      { type: "fill", q: "Futur : « Demain, je (manger) ___ une glace. »", answer: ["mangerai"], explain: "je mangerai (-rai)." },
      { type: "qcm", q: "« L'année prochaine, tu ___ au CM1. » (être)", choices: ["seras", "étais", "es"], answer: 0, explain: "futur du verbe être : tu seras." },
      { type: "fill", q: "« Ils (avoir) ___ bientôt des vacances. »", answer: ["auront"], explain: "futur d'avoir : ils auront." }
    ]
  },

  {
    id: "fr-onont",
    subject: "francais",
    title: "on / ont  et  son / sont",
    icon: "🔍",
    lesson: {
      intro: "Encore des mots qui se prononcent pareil ! Voici comment ne plus les confondre.",
      points: [
        "« on » remplace il/elle. Astuce : remplace par « il ». On joue → Il joue.",
        "« ont » = le verbe avoir (ils ont). Astuce : « avaient ». Ils ont → ils avaient.",
        "« son » = à lui (son vélo). Astuce : on peut dire « mon » (mon vélo).",
        "« sont » = le verbe être (ils sont). Astuce : « étaient ». Ils sont → ils étaient."
      ],
      example: "« On a vu que les enfants ont rangé leur chambre. »",
      tip: "Si tu peux dire « avaient » → « ont ». Si tu peux dire « étaient » → « sont »."
    },
    exercises: [
      { type: "qcm", q: "« ___ va jouer dehors. »", choices: ["On", "Ont"], answer: 0, explain: "« Il va » → on." },
      { type: "qcm", q: "« Les chats ___ faim. »", choices: ["ont", "on"], answer: 0, explain: "« avaient faim » → ont." },
      { type: "qcm", q: "« Mes amis ___ gentils. »", choices: ["son", "sont"], answer: 1, explain: "« étaient gentils » → sont." },
      { type: "fill", q: "Complète : « Tom cherche ___ ballon. »", answer: ["son"], explain: "à lui → son ballon." }
    ]
  },

  {
    id: "fr-accord-adj",
    subject: "francais",
    title: "L'accord de l'adjectif",
    icon: "🎨",
    lesson: {
      intro: "L'adjectif s'accorde avec le nom : il change au féminin et au pluriel.",
      points: [
        "Au féminin, on ajoute souvent un -e : un chat noir → une chatte noire.",
        "Au pluriel, on ajoute souvent un -s : un chat noir → des chats noirs.",
        "Au féminin pluriel, on met les deux : des fleurs bleues.",
        "Certains changent : beau → belle, nouveau → nouvelle, gros → grosse."
      ],
      example: "une grande maison · des grandes maisons · un petit chien · des petits chiens.",
      tip: "Cherche le nom : masculin/féminin ? singulier/pluriel ? L'adjectif suit."
    },
    exercises: [
      { type: "fill", q: "Accorde : « des chats (noir) → des chats ___ »", answer: ["noirs"], explain: "pluriel → -s." },
      { type: "fill", q: "Accorde : « une fleur (bleu) → une fleur ___ »", answer: ["bleue"], explain: "féminin → -e." },
      { type: "qcm", q: "« des voitures ___ » (rapide)", choices: ["rapide", "rapides", "rapids"], answer: 1, explain: "pluriel → rapides." },
      { type: "fill", q: "Accorde : « une (grand) ___ table »", answer: ["grande"], explain: "féminin de grand → grande." }
    ]
  },

  {
    id: "fr-present3",
    subject: "francais",
    title: "Le présent : faire, dire, aller, venir",
    icon: "🗣️",
    lesson: {
      intro: "Des verbes très utiles mais un peu spéciaux, à connaître par cœur au présent.",
      points: [
        "FAIRE : je fais, tu fais, il fait, nous faisons, vous faites, ils font.",
        "DIRE : je dis, tu dis, il dit, nous disons, vous dites, ils disent.",
        "ALLER : je vais, tu vas, il va, nous allons, vous allez, ils vont.",
        "VENIR : je viens, tu viens, il vient, nous venons, vous venez, ils viennent."
      ],
      example: "« Nous faisons nos devoirs, puis nous allons jouer. »",
      tip: "Attention : « vous faites » et « vous dites » (pas « faisez » ni « disez ») !"
    },
    exercises: [
      { type: "fill", q: "« Nous (faire) ___ un gâteau. »", answer: ["faisons"], explain: "nous faisons." },
      { type: "qcm", q: "« Vous ___ la vérité. » (dire)", choices: ["dites", "disez", "dis"], answer: 0, explain: "vous dites (exception)." },
      { type: "fill", q: "« Ils (venir) ___ demain. »", answer: ["viennent"], explain: "ils viennent." },
      { type: "qcm", q: "« Je ___ à l'école. » (aller)", choices: ["vais", "va", "vas"], answer: 0, explain: "je vais." }
    ]
  },

  {
    id: "fr-passecompose",
    subject: "francais",
    title: "Le passé composé",
    icon: "🕰️",
    lesson: {
      intro: "Le passé composé raconte une action terminée. Il est formé de DEUX mots : un auxiliaire (avoir ou être) + le participe passé.",
      points: [
        "Avec AVOIR : j'ai mangé, tu as mangé, il a mangé, nous avons mangé…",
        "Le participe passé des verbes en -ER se termine par -é : manger → mangé, jouer → joué.",
        "Avec ÊTRE (aller, venir, partir, tomber, arriver…) : je suis allé, tu es parti…",
        "Avec être, le participe s'accorde : elle est allée, ils sont partis."
      ],
      example: "« Hier, j'ai joué au foot, puis je suis rentré à la maison. »",
      tip: "Cherche les deux morceaux : (avoir/être) + le verbe en -é."
    },
    exercises: [
      { type: "fill", q: "Passé composé : « Hier, j'(manger) ___ une pomme. »  (2 mots)", answer: ["ai mangé"], explain: "auxiliaire avoir + mangé." },
      { type: "qcm", q: "« Elle ___ allée à l'école. »", choices: ["est", "a", "as"], answer: 0, explain: "aller se conjugue avec être : elle est allée." },
      { type: "fill", q: "Participe passé de « chanter » : ___", answer: ["chanté"], explain: "verbes en -er → -é." }
    ]
  },

  {
    id: "fr-mbp",
    subject: "francais",
    title: "m devant m, b, p",
    icon: "✏️",
    lesson: {
      intro: "Petite règle magique d'orthographe : devant les lettres m, b et p, on écrit m au lieu de n.",
      points: [
        "Devant m, b, p → on met un m (et pas un n).",
        "Exemples : une chambre, un tambour, une jambe, un pompier.",
        "Aussi : emmener, un timbre, grimper, tomber, la campagne.",
        "Attention aux exceptions : un bonbon, un bonbonnière, néanmoins."
      ],
      example: "un no__bre → un nombre · une cha__bre → une chambre · gri__per → grimper.",
      tip: "Si le mot a un b, un p ou un m juste après, écris un m."
    },
    exercises: [
      { type: "qcm", q: "Complète : « une cha__bre »", choices: ["m", "n"], answer: 0, explain: "devant b → m." },
      { type: "qcm", q: "Complète : « un ta__bour »", choices: ["m", "n"], answer: 0, explain: "devant b → m." },
      { type: "qcm", q: "Complète : « une ora__ge »", choices: ["m", "n"], answer: 1, explain: "devant g → n (règle seulement pour m, b, p)." },
      { type: "fill", q: "Écris correctement : « un no_bre » → ___", answer: ["nombre"], explain: "devant b → m : nombre." }
    ]
  },

  {
    id: "fr-homophones2",
    subject: "francais",
    title: "ou / où  et  ces / ses",
    icon: "🔎",
    lesson: {
      intro: "Encore des sosies ! Deux nouvelles paires à ne plus confondre.",
      points: [
        "« ou » = ou bien (un choix). Astuce : on peut dire « ou bien ». Thé ou café ?",
        "« où » (avec accent) = le lieu. Astuce : ça répond à « à quel endroit ? ». Où es-tu ?",
        "« ces » = ceux-là (pluriel de ce/cette). Ces livres = plusieurs livres.",
        "« ses » = à lui/elle (les siens). Il range ses affaires = ses propres affaires."
      ],
      example: "« Où as-tu mis ces crayons et ses feutres ? »",
      tip: "« ou bien » → ou. Un lieu → où. « ceux-là » → ces. « les siens » → ses."
    },
    exercises: [
      { type: "qcm", q: "« Tu veux du lait ___ du jus ? »", choices: ["ou", "où"], answer: 0, explain: "« ou bien » → ou." },
      { type: "qcm", q: "« ___ habites-tu ? »", choices: ["Ou", "Où"], answer: 1, explain: "un lieu → où." },
      { type: "qcm", q: "« Léa a rangé ___ jouets. » (les siens)", choices: ["ses", "ces"], answer: 0, explain: "à elle → ses." },
      { type: "qcm", q: "« Regarde ___ étoiles ! » (celles-là)", choices: ["ses", "ces"], answer: 1, explain: "celles-là → ces." }
    ]
  },

  {
    id: "fr-types-phrases",
    subject: "francais",
    title: "Les types de phrases",
    icon: "❓",
    lesson: {
      intro: "Une phrase peut servir à raconter, poser une question, montrer une émotion ou donner un ordre.",
      points: [
        "Déclarative : elle raconte, se termine par un point. « Le chien dort. »",
        "Interrogative : elle pose une question, se termine par « ? ». « As-tu faim ? »",
        "Exclamative : elle montre une émotion, se termine par « ! ». « Quelle belle journée ! »",
        "Impérative : elle donne un ordre ou un conseil. « Range ta chambre. »"
      ],
      example: "Ferme la porte. (impérative) · Tu viens ? (interrogative) · Bravo ! (exclamative)",
      tip: "Regarde le signe de fin et écoute ta voix : elle monte pour une question."
    },
    exercises: [
      { type: "qcm", q: "Quel type : « Comme il fait chaud ! »", choices: ["déclarative", "interrogative", "exclamative"], answer: 2, explain: "une émotion → exclamative." },
      { type: "qcm", q: "Quel type : « Où vas-tu ? »", choices: ["interrogative", "impérative", "déclarative"], answer: 0, explain: "une question → interrogative." },
      { type: "qcm", q: "« Ferme la fenêtre. » est une phrase…", choices: ["déclarative", "impérative", "exclamative"], answer: 1, explain: "un ordre → impérative." },
      { type: "truefalse", q: "« Je mange une pomme. » est une phrase déclarative.", answer: true, explain: "elle raconte : déclarative." }
    ]
  },

  {
    id: "fr-familles",
    subject: "francais",
    title: "Familles de mots, préfixes et suffixes",
    icon: "🌳",
    lesson: {
      intro: "Les mots d'une même famille partagent une racine (un morceau commun) et une idée proche.",
      points: [
        "Famille de « dent » : dent, dentiste, dentaire, dentifrice.",
        "Un PRÉFIXE se place devant : re- (refaire), dé- (défaire), in-/im- (impossible).",
        "Un SUFFIXE se place après : -eur (chanteur), -tion (addition), -able (mangeable).",
        "Connaître les familles aide à comprendre et à bien écrire les mots."
      ],
      example: "terre → terrain, terrasse, atterrir · possible → impossible (préfixe im-).",
      tip: "Cherche le petit morceau commun : c'est la racine de la famille."
    },
    exercises: [
      { type: "qcm", q: "Quel mot est de la famille de « fleur » ?", choices: ["fleuriste", "flèche", "fluide"], answer: 0, explain: "fleur → fleuriste (même racine)." },
      { type: "qcm", q: "Le contraire de « faire » avec un préfixe :", choices: ["refaire", "défaire", "surfaire"], answer: 1, explain: "dé- indique le contraire : défaire." },
      { type: "fill", q: "Ajoute le préfixe « re » : ___ + commencer = ___", answer: ["recommencer"], explain: "re- = à nouveau." },
      { type: "qcm", q: "Quel est l'intrus (pas de la famille de « terre ») ?", choices: ["terrain", "terrasse", "terrible"], answer: 2, explain: "« terrible » n'a pas le sens de terre." }
    ]
  },

  {
    id: "fr-lecture",
    subject: "francais",
    title: "Lecture — je comprends ce que je lis",
    icon: "📖",
    lesson: {
      intro: "Bien lire, c'est comprendre. Lis le petit texte, puis réponds aux questions.",
      points: [
        "Lis tout le texte, tranquillement, jusqu'au bout.",
        "Cherche QUI, OÙ, QUAND, et ce qui se passe.",
        "Si tu ne sais plus, relis le passage : la réponse est dans le texte.",
        "Repère les mots importants (les noms, les actions)."
      ],
      example: "Astuce : souligne dans ta tête le personnage et le lieu.",
      tip: "La bonne réponse est toujours écrite (ou cachée) dans le texte."
    },
    exercises: [
      { type: "qcm", q: "Lis : « Léa a un chat noir nommé Réglisse. Il adore dormir sur le canapé rouge. » — De quelle couleur est le chat ?", choices: ["rouge", "noir", "gris"], answer: 1, explain: "« un chat noir »." },
      { type: "qcm", q: "Même texte : où dort le chat ?", choices: ["sur le lit", "sur le canapé", "dans le jardin"], answer: 1, explain: "« dormir sur le canapé »." },
      { type: "qcm", q: "Lis : « Ce matin, Tom a pris son vélo pour aller à l'école car il était en retard. » — Comment Tom va-t-il à l'école ?", choices: ["à pied", "en bus", "à vélo"], answer: 2, explain: "« a pris son vélo »." },
      { type: "qcm", q: "Même texte : pourquoi prend-il le vélo ?", choices: ["il était en retard", "il pleuvait", "pour s'amuser"], answer: 0, explain: "« car il était en retard »." },
      { type: "qcm", q: "Lis : « Dans le jardin, trois oiseaux chantent dans le grand cerisier. » — Combien d'oiseaux ?", choices: ["deux", "trois", "quatre"], answer: 1, explain: "« trois oiseaux »." }
    ]
  }
];
