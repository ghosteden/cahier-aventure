/* =========================================================
   SYNC — DÉSACTIVÉ (sauvegarde 100 % locale).
   L'appli est hébergée sur un hébergeur statique (GitHub Pages) sans serveur :
   toute la progression est gardée dans le navigateur (localStorage).
   On garde une coquille vide pour ne rien casser dans le reste du code.
   ========================================================= */
window.CV = window.CV || {};

CV.Sync = {
  onStatus: function () {},
  ping: function () { return Promise.resolve(false); },
  pull: function () { return Promise.resolve(null); },
  push: function () { return Promise.resolve(false); },
  pushDebounced: function () {},
  remove: function () { return Promise.resolve(false); },
  isAvailable: function () { return false; }
};
