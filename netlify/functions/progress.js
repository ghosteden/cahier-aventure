/* Fonction Netlify — sauvegarde/lecture de la progression d'un joueur.
   Chaque joueur est rangé dans Netlify Blobs sous la clé = son identifiant
   (prénom + code classe). Gratuit, sans base de données à gérer.

   Endpoints (appelés par js/sync.js) :
     GET  /.netlify/functions/progress?id=<identifiant>   -> { state: {...} | null }
     POST /.netlify/functions/progress  body {id, state}  -> { ok: true }
*/
import { getStore } from "@netlify/blobs";

function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status: status || 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    }
  });
}

export default async (req) => {
  if (req.method === "OPTIONS") return json({ ok: true });

  let store;
  try {
    store = getStore("progress-ce2");
  } catch (e) {
    return json({ error: "blobs-unavailable" }, 500);
  }

  try {
    if (req.method === "GET") {
      const id = new URL(req.url).searchParams.get("id");
      if (!id) return json({ error: "missing id" }, 400);
      const state = await store.get(id, { type: "json" });
      return json({ state: state || null });
    }

    if (req.method === "POST") {
      const body = await req.json();
      if (!body || !body.id || !body.state) return json({ error: "missing id/state" }, 400);
      // Sécurité simple : on borne la taille pour éviter les abus.
      const raw = JSON.stringify(body.state);
      if (raw.length > 200000) return json({ error: "too large" }, 413);
      await store.setJSON(body.id, body.state);
      return json({ ok: true });
    }

    if (req.method === "DELETE") {
      const id = new URL(req.url).searchParams.get("id");
      if (!id) return json({ error: "missing id" }, 400);
      await store.delete(id);
      return json({ ok: true });
    }

    return json({ error: "method not allowed" }, 405);
  } catch (e) {
    return json({ error: "server", detail: String(e && e.message || e) }, 500);
  }
};
