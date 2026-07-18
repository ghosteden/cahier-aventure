# 🚀 L'Aventure des Savoirs — Cahier de vacances CE2 → CM1

Une application web (PWA) installable sur **téléphone et ordinateur** qui transforme les
révisions du programme de **CE2** en jeu d'aventure : français, maths, sciences, culture
et **dictées vocales**. Chaque journée enchaîne 📖 Français → 🔢 Maths → 🧩 Problème & logique
→ 🎧 Dictée, avec étoiles, trophées et fiches de connaissance à collectionner.

- **5 mondes illustrés** avec une carte, un héros animé et un boss à la fin :
  🦖 Dinosaures → ⚡ Dieux & Héros → ⚔️ Chevaliers → 🏴‍☠️ Pirates → 🚀 Espace.
- **45 niveaux** (8 leçons + 1 boss par monde). Le monde Espace propose **9 mini-jeux de
  planètes** différents (Doodle Jump sur la Lune, surf sur les anneaux de Saturne, pluie de
  diamants sur Jupiter, fusée sur Pluton…).
- **Questions générées** : elles changent à chaque partie, on peut refaire un niveau à volonté.
- **Fiches de connaissance** : chaque leçon, chaque boss et chaque planète en débloque une.
- **100 % local** : la progression est gardée dans le navigateur. Aucune inscription, aucun
  serveur, aucune donnée envoyée en ligne.

---

## 1) Tester sur l'ordinateur

Le jeu est un site statique : il suffit de servir le dossier `public/` avec un petit serveur
local (le `file://` direct bloque certaines fonctions).

```bash
# avec Node (le script fourni)
node test/serve.mjs          # puis ouvrir http://localhost:8080

# ou avec Python
cd public && python -m http.server 8080
```

---

## 2) Mettre en ligne — GitHub Pages (gratuit, sans limite)

Le dépôt contient déjà le workflow de déploiement (`.github/workflows/pages.yml`).

1. Pousse le projet sur GitHub.
2. Dans le dépôt : **Settings → Pages → Source : GitHub Actions**.
3. À chaque `git push`, le contenu de `public/` est publié automatiquement.

Le site est alors en ligne à `https://<pseudo>.github.io/<nom-du-depot>/` — trafic illimité,
aucune facture possible.

### Installer l'appli sur le téléphone
Ouvre l'adresse dans le navigateur, puis menu → **« Ajouter à l'écran d'accueil »**.
L'icône apparaît comme une vraie appli, utilisable **hors-ligne**.

---

## 3) Sauvegarde et partage

La progression est stockée **dans le navigateur** de l'appareil (localStorage) : chaque enfant
joue toujours sur le même appareil/navigateur et ne doit pas effacer ses données de navigation.

Pour **transférer une progression** (changer d'appareil, ou l'envoyer au maître/à la maîtresse) :
**Profil → 🔗 Créer mon lien de partage**. Le lien contient le prénom et toute la progression
(encodés dans l'URL, rien n'est envoyé en ligne). L'ouvrir sur un autre appareil propose de
**charger** cette progression.

---

## 4) Ajouter ou modifier du contenu (leçons, exercices, dictées)

Tout le contenu pédagogique est dans `public/data/` :
`content-francais.js`, `content-maths.js`, `content-sciences.js`, `content-culture.js`.

Chaque **module** = une leçon + des exercices. Exemple minimal :

```js
{
  id: "fr-mon-exo",           // identifiant unique
  subject: "francais",         // francais | maths | sciences | culture
  title: "Titre de la leçon",
  icon: "✏️",
  lesson: {
    intro: "Phrase d'intro.",
    points: ["Point 1", "Point 2"],
    example: "Un exemple.",
    tip: "Une astuce."
  },
  exercises: [
    { type: "qcm", q: "Question ?", choices: ["A", "B", "C"], answer: 1, explain: "Pourquoi B." },
    { type: "fill", q: "Complète : le chat ___ noir.", answer: ["est"], explain: "verbe être" },
    { type: "calcul", q: "7 × 8 = ?", answer: 56, explain: "table de 7" },
    { type: "truefalse", q: "Le ciel est vert.", answer: false, explain: "Il est bleu." }
  ]
}
```

Beaucoup de notions utilisent en plus des **générateurs de questions** (`public/data/generators.js`)
pour varier à l'infini. La répartition des notions sur les journées est dans
`public/data/days.js` ; les mondes, cartes et boss dans `public/js/program.js`.

### Les dictées
Elles utilisent la **synthèse vocale du navigateur** (voix française intégrée, gratuite).
L'enfant clique sur « 🔊 Écouter », écrit, puis l'appli corrige **mot à mot** en couleur.
La dictée est un entraînement : elle ne compte pas dans les étoiles.

---

## Structure du projet

```
public/                    LE SITE (c'est ce dossier qui est publié)
  index.html               Page principale + écran de démarrage
  manifest.webmanifest     Métadonnées PWA (installation)
  sw.js                    Service worker (hors-ligne)
  css/styles.css           Design (5 thèmes de mondes)
  assets/                  Cartes, sprites de héros et de boss, planètes…
  data/content-*.js        CONTENU pédagogique CE2
  data/generators.js       Générateurs de questions (variété infinie)
  data/days.js             Répartition des notions sur les journées
  data/planets.js          Les 9 mini-jeux du monde Espace
  data/fiches.js           Fiches de connaissance (collection)
  js/program.js            5 mondes, 45 niveaux, cartes, boss
  js/store.js              État du joueur + sauvegarde locale + partage par lien
  js/gamification.js       Étoiles, badges, série de jours
  js/dictee.js             Dictée par synthèse vocale + correction
  js/engine.js             Moteur d'exercices (tous les types)
  js/ui.js                 Composants visuels (statut, confettis, victoire)
  js/app.js                Navigation, carte, combats de boss, mini-jeux
  planet-tool.html         Outil : relever les appuis d'une planète
  sprite-tool.html         Outil : découper une planche de sprites
test/                      Scripts de test (Playwright) + serveur de dev
.github/workflows/pages.yml   Déploiement automatique sur GitHub Pages
```

Bonnes vacances et bon apprentissage ! 🎉
