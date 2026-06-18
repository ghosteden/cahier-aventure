const B = "https://cahier-aventure-ce2.netlify.app/.netlify/functions/progress";
const j = async (r) => ({ status: r.status, body: await r.json().catch(() => null) });
const id = "ce2__zztest";

const ping = await j(await fetch(B + "?id=__ping__"));
console.log("1) PING:", JSON.stringify(ping));

const post = await j(await fetch(B, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ id, state: { xp: 42, displayName: "Test", updatedAt: Date.now() } })
}));
console.log("2) POST:", JSON.stringify(post));

const get = await j(await fetch(B + "?id=" + id));
console.log("3) GET :", JSON.stringify(get));

const del = await j(await fetch(B + "?id=" + id, { method: "DELETE" }));
console.log("4) DEL :", JSON.stringify(del));

const get2 = await j(await fetch(B + "?id=" + id));
console.log("5) GET après suppression:", JSON.stringify(get2));
