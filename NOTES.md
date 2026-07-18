# L'Aventure des Savoirs — note de passation

Cahier de vacances CE2 → CM1 gamifié (PWA, vanilla JS, pas de build).
Ce document sert à reprendre le travail sans relire tout l'historique.

## Règles de travail (demandées par l'utilisateur)

- **Ne PAS déployer** sans qu'il le demande explicitement (ça consomme des tokens et il craint d'être bloqué). On travaille en local.
- Serveur de dev : `node test/serve.mjs` → http://localhost:8080. **Le lancer en processus détaché**, sinon il meurt avec la session :
  `Start-Process node -ArgumentList "test/serve.mjs" -WorkingDirectory "i:\vacance Gabi" -WindowStyle Hidden`
- Une **session parallèle** touche parfois `public/js/app.js` et `public/js/program.js` (éditeur de pierres/chemins, déblocage). **Relire les fichiers avant d'éditer.**
- Les sprites sont produits par une **autre session** ; on lui commande des planches et on lui remonte les défauts.

## Structure

```
public/
  index.html            ordre de chargement des scripts (data/* puis js/*)
  data/content-*.js     60 modules de contenu CE2 (français, maths, sciences, culture)
  data/generators.js    banque de questions procédurales (CV.gen, CV.draw, CV.drawMix) + dictées
  data/days.js          CV.CURRICULUM : le programme jour par jour (mondes 1-4)
  data/planets.js       MONDE 5 : les 9 mini-jeux des planètes  ← le gros du travail récent
  js/program.js         CV.WORLDS (5 mondes × 9 niveaux), sprites, chemins, déblocage
  js/engine.js          moteur d'exercices (qcm, calcul, fill, match, logic, place, dictee)
  js/app.js             routeur, carte, combats de boss, mini-jeux des planètes
  js/store.js           sauvegarde (localStorage + cloud Netlify Blobs)
  planet-tool.html      OUTIL : relever les appuis d'une planète en cliquant dessus
  sprite-tool.html      OUTIL : découper une planche de sprites
test/                   scripts Playwright (un par fonctionnalité) + serve.mjs
```

## Le monde 5 (Espace) — état

L'ordre des planètes suit **les pierres posées sur la carte** :

| Pierre | Planète | Mécanique | État |
|---|---|---|---|
| 1 | 🌙 Lune | Doodle Jump vertical. Bonne réponse = il monte. **Erreur = la plateforme sous ses pieds se brise, il retombe d'un cran, une neuve arrive en glissant** du bord le plus proche. Scène scrollable verticalement. | ✅ |
| 2 | 🌕 Vénus | `mode: "reveal"` — **pas d'astronaute**. 11 nuages couvrent le fond ; chaque bonne réponse en dissipe un, le paysage se découvre. | ✅ |
| 3 | ☄️ Mercure | Sauts de dalle en dalle au-dessus de la lave (un segment en marche). | ✅ |
| 4 | 🔴 Mars | **Rover** (son propre jeu d'animations) qui roule ; scène **scrollable horizontalement** ; à l'arrivée il déploie sa parabole (`scan`, figée). | ✅ |
| 5 | 🟠 Jupiter | Gravité écrasante : il **marche** sur la passerelle (jamais de saut). | ✅ |
| 6 | 🪐 Saturne | **Surf** le long de la courbe des anneaux ; l'astronaute **s'incline dans la pente** sans jamais avoir la tête en bas. | ✅ |
| 7 | 🩵 Uranus | Traversée de la banquise. | ✅ |
| 8 | 💙 Neptune | Vents à 2 000 km/h : **une erreur ne bloque pas, elle fait RECULER** d'un cran. | ✅ |
| 9 | 🚀 Pluton | **Jeu de récompense, aucune question** : on pilote la fusée (doigt ou flèches), on ramasse gemmes/étoiles et on pulvérise les astéroïdes. 45 s, toujours 3 étoiles. | ✅ |

Tout est piloté par `public/data/planets.js` (un objet par planète). Options disponibles :
`points`, `moves` (`jump`/`walk`/`surf`/`drive`), `props` + `propsVanish`/`breakOnWrong`,
`mode` (`reveal`/`reward`), `vehicle`, `vertical`/`hscroll`, `followAngle`, `idleMode`,
`pushBackOnWrong`, `winMode`, `heroSize`, `propSize`/`propPct`/`propAnchor`, `gen`.

⚠️ **Pluton occupe la case du boss** : dans `openLevel()`, le test `mode === "reward"` doit rester **AVANT** `lv.isBoss`, sinon elle lance un combat.

## Combats de boss (mondes 1-4)

Fond d'arène + planche de boss (idle/attack/hit/death) par monde, dans `CV.WORLDS[i].bossBg` / `.bossAnim`.
Le boss est **miroité** (`scaleX(-1)` sur `.boss-token`) car les planches sont dessinées vers la droite.
Taille réglée par boss via `BOSS[world].scale` dans `app.js` (le fantôme a un gros halo, le dragon une cellule très large pour sa flamme).

## Le piège des planches de sprites — À LIRE

C'est la source de **presque tous** les bugs visuels rencontrés. Le mécanisme d'affichage
(`setSpriteMode`) suppose une **grille parfaitement régulière** : largeur = nb_images × cellule,
dessin **centré** dans sa cellule, **aucun pixel touchant le bord**. Quand ce n'est pas le cas :

- le dessin **déborde** dans la cellule voisine → le personnage apparaît **en double** ;
- il **touche le bord** → il est **rogné** ;
- il est **mal centré** d'une image à l'autre → il **glisse** (et l'idle joué en aller-retour transforme ça en balancier).

Outils écrits pour diagnostiquer et réparer (tous en Node pur, décodent/encodent le PNG) :

| Script | Usage |
|---|---|
| `test/regrid.mjs <png> <nb_images> [marge]` | **Le bon outil.** Détecte les dessins réels, les regroupe par image et reconstruit une grille propre. À utiliser dès qu'une planche déborde. |
| `test/repack.mjs <png> <cellule> [marge]` | Élargit les cellules (si la grille est bonne mais sans marge). |
| `test/recentroid.mjs <png> [cellule] [cap]` | Recentre chaque image sur sa boîte englobante. |
| `test/crop.mjs <src> <dst> <cellule> <n>` | Découpe les n premières images (a servi à fabriquer `dragon-hit.png`). |

Les planches d'origine sont conservées en `*.orig.png` à côté.
Planches déjà reconstruites : `cloud-venus-*`, `platform-lune-*`, `asteroid-4/5`, `star-rainbow-collect`.

**Défauts encore à corriger côté sprites** (à demander à la session sprites) :
- `boss-*` et `hero-pirate-*` : il reste du **fond noir** collé autour des personnages.
- `boss-chevalier-*` (les 4) et `boss-pirate-attack` : **cellules irrégulières** → dédoublement.
  (Le dragon a été remplacé par `dragon-*.png`, qui est propre. Le T-Rex est la référence à copier.)

## Autres points acquis

- **Enchaînement des questions** : bonne réponse → ça continue tout seul (~1 s). Mauvaise réponse → le bouton *Valider* disparaît et un seul bouton reste : **« J'ai compris 👍 »**, le temps de lire la correction. La **dictée** garde son bouton dans tous les cas.
- **Étoiles** : `starsForScore` (≥90 % → 3, ≥65 % → 2, ≥40 % → 1, sinon 0). Passer un niveau = **0 étoile et pas de confettis**.
- **Position du héros sauvegardée** (`state.heroNode` + `state.heroWorld`, donc local ET cloud) : rejouer une vieille pierre l'y ramène (il marche à contresens) et la carte rouvre sur le bon monde.
- **Service worker désactivé en local** : sur `localhost` l'appli le désinstalle et vide ses caches, sinon un vieux worker sert d'anciens fichiers et les modifications n'apparaissent jamais. (Ça a coûté une heure de fausses pistes.)
- **La fusée** remplace le héros sur la carte de l'espace et **pivote sur 360°** pour suivre la courbe des orbites (angle calculé en pixels, pas en %, sinon la carte n'étant pas carrée l'angle serait faux).
- **Ombres portées** : posées sur le jeton (`.hero-token`), **pas** sur la bande — sinon l'ombre est calculée sur toutes les images d'un coup et celle du voisin bave dans la case affichée.

## Fait depuis (2e passe)

- **Fiches de connaissance** ✅ (`public/data/fiches.js`) : chaque leçon réussie débloque une fiche
  (résumé « à retenir » + exemple + astuce, tirés du module) ; chaque boss vaincu débloque une
  fiche de monde. Collection dans l'écran Trophées, fiche en grand au clic. Débloquées via
  `unlockFiches()` dans `finishDay`/`finishLevel` ; stockées dans `state.fiches`.
- **3 jeux de logique** ✅ (`CV.gen.deduction/symetrie/reproduction`, dans generators.js) :
  déduction (séquence + indices), symétrie (grille avec cases fixes + axe), repérage sur
  quadrillage (coordonnées lettre/chiffre). Le moteur `place`/grid supporte désormais
  `grid.fixed` (cases modèle non déplaçables) et `grid.rows/cols` sans en-têtes.
- **Pluton** : pilotage refait en **« Flappy »** (tombe en permanence, monte tant qu'on appuie —
  doigt ou espace/flèche haut) ; et le déblocage compte maintenant les planètes **passées**
  (`planetsPlayed` inclut les skips) pour ne pas priver l'enfant de sa récompense.
- **Neptune** : rafale de vent renforcée et **synchronisée** (le vent se lève avant le recul).
- **Journée découverte : ABANDONNÉE** (la répartition des journées a été refaite, plus besoin).

## Fait depuis (3e passe)

- **Fiches restructurées** (`data/fiches.js`, 66 au total, toutes débloquables) :
  fr+maths par journée · **sciences+culture au boss** de chaque monde 1-4 (mapping
  `CV.WORLD_BONUS` par clé de monde) · **une fiche par planète** avec **lien Google**
  (`CV.planetFiche`, kind "planet"). Débloquage : `fichesForLevel` (jour/planète),
  `fichesForBoss` (boss). L'ancien `WORLD_FICHES` générique a été supprimé.
- **2 jeux Tetris** (`CV.gen.tetrisMur` consigne à lire / `tetrisForme` libre), type moteur
  `tetris` (pièces multi-cases, drag&drop, clic pour retirer). Grilles solubles garanties.
- **Jupiter** refait en **attrape-diamants** (`playCatch`, `mode:"catch"`).
- **Pluton** : fond en parallaxe + écran de fin qui montre le score/record.
- **Dictée** exclue des étoiles de la journée.

## Reste à faire

1. (rien de bloquant) — tester en vrai les fiches (boss → sciences/culture, planètes → lien).
2. Optionnel : `rover-death.png` et `dragon-stand.png` inutilisés — **on ignore**.
