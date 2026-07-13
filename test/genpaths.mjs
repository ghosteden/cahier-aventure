// Génère des chemins courbes par défaut entre des pierres (nodes).
// Usage : node test/genpaths.mjs "[[x,y],[x,y],...9 pierres...]"
const nodes = JSON.parse(process.argv[2] || "[]");
if (nodes.length < 2) { console.log("Donne au moins 2 pierres."); process.exit(0); }
const r1 = (v) => Math.round(v * 10) / 10;
const paths = [];
for (let i = 0; i < nodes.length - 1; i++) {
  const a = nodes[i], b = nodes[i + 1];
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const len = Math.hypot(dx, dy) || 1;
  // vecteur perpendiculaire normalisé, courbure alternée
  const px = -dy / len, py = dx / len;
  const curve = len * 0.10 * (i % 2 === 0 ? 1 : -1);
  const p1 = [r1(a[0] + dx * 0.22), r1(a[1] + dy * 0.22)];
  const pm = [r1(a[0] + dx * 0.5 + px * curve), r1(a[1] + dy * 0.5 + py * curve)];
  const p2 = [r1(a[0] + dx * 0.78), r1(a[1] + dy * 0.78)];
  paths.push([p1, pm, p2]);
}
console.log("paths: [");
paths.forEach((seg, i) => console.log("  [" + seg.map((p) => "[" + p[0] + ", " + p[1] + "]").join(", ") + "]" + (i < paths.length - 1 ? "," : "")));
console.log("]");
