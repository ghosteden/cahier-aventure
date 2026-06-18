/* =========================================================
   SYNC — synchronisation cloud de la progression.
   Utilise une fonction Netlify (/.netlify/functions/progress)
   qui range chaque joueur dans Netlify Blobs, repéré par son
   identifiant (prénom + code classe).
   Si le cloud n'est pas joignable (hors-ligne, pas déployé),
   l'appli continue à fonctionner en local sans rien casser.
   ========================================================= */
window.CV = window.CV || {};

CV.Sync = (function () {
  const ENDPOINT = "/.netlify/functions/progress";
  let pushTimer = null;
  let available = null; // null = inconnu, true/false ensuite
  let lastStatusCb = null;

  function onStatus(cb) { lastStatusCb = cb; }
  function setStatus(ok) {
    available = ok;
    if (lastStatusCb) lastStatusCb(ok);
  }

  /* Teste si la sauvegarde cloud est réellement disponible
     (fonction Netlify joignable). Met à jour le statut. */
  async function ping() {
    try {
      const res = await fetch(ENDPOINT + "?id=__ping__", { method: "GET" });
      if (!res.ok) { setStatus(false); return false; }
      const data = await res.json().catch(() => null);
      if (data && data.offline) { setStatus(false); return false; }
      setStatus(true);
      return true;
    } catch (e) {
      setStatus(false);
      return false;
    }
  }

  async function pull(state) {
    if (!state || !state.player) return null;
    try {
      const res = await fetch(ENDPOINT + "?id=" + encodeURIComponent(state.player), { method: "GET" });
      if (!res.ok) { setStatus(false); return null; }
      const data = await res.json();
      if (data && data.offline) { setStatus(false); return null; }
      setStatus(true);
      return data && data.state ? data.state : null;
    } catch (e) {
      setStatus(false);
      return null;
    }
  }

  async function push(state) {
    if (!state || !state.player) return false;
    try {
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: state.player, state: state })
      });
      setStatus(res.ok);
      return res.ok;
    } catch (e) {
      setStatus(false);
      return false;
    }
  }

  function pushDebounced(state) {
    if (pushTimer) clearTimeout(pushTimer);
    // copie figée de l'état au moment de l'appel
    const snapshot = JSON.parse(JSON.stringify(state));
    pushTimer = setTimeout(() => push(snapshot), 1500);
  }

  /* Supprime la sauvegarde cloud d'un joueur (quand on passe en local). */
  async function remove(id) {
    if (!id) return false;
    try {
      const res = await fetch(ENDPOINT + "?id=" + encodeURIComponent(id), { method: "DELETE" });
      return res.ok;
    } catch (e) { return false; }
  }

  return { ping, pull, push, pushDebounced, remove, onStatus, isAvailable: () => available };
})();
