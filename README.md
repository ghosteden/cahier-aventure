# 🚀 L'Aventure des Savoirs — Cahier de vacances CE2 → CM1

Une application web (PWA) installable sur **téléphone et ordinateur**, qui transforme les
révisions du programme de **CE2** en jeu d'aventure : français, maths, sciences, culture
et **dictées vocales**. Leçon courte, puis défi, avec étoiles, niveaux et trophées.

- **3 mondes** qui s'enchaînent sur l'été : 🚀 Espace → 🏴‍☠️ Pirates → ⚔️ Chevaliers
- **Parcours de 56 jours** : 3 journées d'entraînement (français + maths) puis 1 journée
  « découverte » (sciences/culture), et un **BOSS** à la fin de chaque monde.
- **Sessions chronométrées** : l'appli encourage un temps minimum et propose une pause.
- **Connexion par prénom** (+ code classe facultatif) et **sauvegarde cloud** : on peut
  jouer depuis le téléphone ou le PC, la progression suit. Plusieurs élèves possibles.

---

## 1) Tester sur l'ordinateur (rapide)

La partie jeu fonctionne sans rien installer. Il suffit de servir le dossier avec un petit
serveur local (le `file://` direct bloque certaines fonctions) :

```bash
# avec Python (déjà présent sur la plupart des PC)
python -m http.server 8080
# puis ouvrir http://localhost:8080
```

> La **sauvegarde cloud** ne marche qu'une fois déployé sur Netlify (voir plus bas).
> En local, la progression est simplement gardée dans le navigateur.

---

## 2) Mettre en ligne sur Netlify (recommandé)

La sauvegarde cloud utilise une **fonction Netlify** + **Netlify Blobs** (gratuit, aucune
base de données à configurer).

### Option A — par glisser-déposer (le plus simple, sans Git)
1. Va sur [app.netlify.com](https://app.netlify.com) → **Add new site → Deploy manually**.
2. Glisse **tout le dossier** du projet.
3. ⚠️ Pour que la sauvegarde cloud fonctionne, Netlify doit installer la dépendance
   `@netlify/blobs`. Le glisser-déposer ne le fait pas toujours. Si la sync ne marche pas,
   utilise l'option B (Git), plus fiable pour les fonctions.

### Option B — par dépôt Git (conseillé pour les fonctions)
1. Crée un dépôt (GitHub/GitLab) avec ce dossier.
2. Sur Netlify : **Add new site → Import from Git** → choisis le dépôt.
3. Réglages de build :
   - **Build command** : *(laisser vide)*
   - **Publish directory** : `.`
   - Les fonctions sont détectées automatiquement (`netlify/functions`).
4. Déploie. C'est tout ✅

Une fois en ligne, l'appli détecte automatiquement le cloud : chaque enfant tape son
**prénom** (et le **code classe** si tu en donnes un), et sa progression se synchronise
entre tous ses appareils.

### Installer l'appli sur le téléphone
Ouvre l'adresse du site dans le navigateur, puis menu → **« Ajouter à l'écran d'accueil »**.
L'icône apparaît comme une vraie appli, utilisable hors-ligne.

---

## 3) Proposer l'appli à toute la classe

- Donne la même adresse Netlify à tous les élèves.
- Choisis un **code classe** commun (ex. `CE2-MARTIN`) : chaque enfant se connecte avec
  son prénom + ce code. Les prénoms identiques ne se mélangent pas entre classes.
- Chaque progression est stockée séparément côté serveur (clé = `code-classe__prénom`).

> ⚠️ Vie privée : seuls des **prénoms** sont demandés (pas de mot de passe, pas de données
> sensibles). Pour un usage scolaire élargi, préviens les familles et l'école.

---

## 4) Ajouter ou modifier du contenu (leçons, exercices, dictées)

Tout le contenu pédagogique est dans `data/` :
`content-francais.js`, `content-maths.js`, `content-sciences.js`, `content-culture.js`.

Chaque **module** = une leçon + des exercices. Exemple minimal :

```js
{
  id: "fr-mon-exo",          // identifiant unique
  subject: "francais",        // francais | maths | sciences | culture
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
    { type: "truefalse", q: "Le ciel est vert.", answer: false, explain: "Il est bleu." },
    { type: "match", q: "Associe.", pairs: [["chat","animal"],["rose","fleur"]], explain: "..." },
    { type: "dictee", q: "Écris la phrase.", sentences: ["Le lapin mange une carotte."] }
  ]
}
```

Les nouveaux modules sont **automatiquement intégrés au parcours** (le générateur de
`js/program.js` répartit les modules sur les 56 jours). Pour changer le rythme ou la durée
des mondes, modifie `CV.WORLDS` et `CV.SESSION` dans `js/program.js`.

### Les dictées
Elles utilisent la **synthèse vocale du navigateur** (voix française intégrée, gratuite).
L'enfant clique sur « 🔊 Écouter », écrit, puis l'appli corrige **mot à mot** en couleur.
Aucun enregistrement audio à fournir.

---

## 5) Ajouter des images (optionnel, ex. générées avec Gemini)

L'appli marche entièrement avec des emojis et l'icône SVG — **aucune image n'est requise**.
Pour enrichir visuellement :

- Mets tes images dans `assets/` (PNG/JPG/SVG, format paysage léger conseillé).
- Tu peux ajouter un champ `image: "assets/mon-illustration.png"` dans un module et
  l'afficher dans la leçon (dis-moi si tu veux que je branche ce champ dans l'affichage).
- **Icône de l'appli** : remplace `assets/icon.svg`, ou ajoute `icon-192.png` /
  `icon-512.png` (512×512) et réactive-les dans `manifest.webmanifest` pour un rendu
  optimal sur Android.

---

## Structure du projet

```
index.html                 Page principale + écran de démarrage
manifest.webmanifest       Métadonnées PWA (installation)
sw.js                      Service worker (hors-ligne)
css/styles.css             Design (3 thèmes : espace / pirates / chevaliers)
assets/icon.svg            Icône de l'appli
data/content-*.js          CONTENU pédagogique CE2 (à enrichir)
js/program.js              Génère le parcours de 56 jours (3 mondes, boss)
js/store.js                État du joueur + sauvegarde locale + multi-joueurs
js/sync.js                 Synchronisation cloud (repli local si hors-ligne)
js/gamification.js         XP, niveaux, étoiles, badges, série de jours
js/dictee.js               Dictée par synthèse vocale + correction
js/engine.js               Moteur d'exercices (tous les types)
js/ui.js                   Composants visuels (statut, confettis, victoire)
js/app.js                  Navigation et écrans
netlify/functions/progress.js   Sauvegarde cloud (Netlify Blobs)
netlify.toml               Config de déploiement
```

Bonnes vacances et bon apprentissage ! 🎉
