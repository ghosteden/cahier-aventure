// Serveur de dev local : sert le dossier public/ sur 0.0.0.0:8080
// (accessible depuis le PC via localhost et depuis le téléphone via l'IP du PC).
import http from "http"; import fs from "fs"; import path from "path";
const ROOT = path.resolve("public");
const TYPES = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".svg": "image/svg+xml",
  ".png": "image/png", ".jpg": "image/jpeg", ".webmanifest": "application/manifest+json", ".json": "application/json" };
const srv = http.createServer((req, res) => {
  let p = path.join(ROOT, decodeURIComponent(req.url.split("?")[0]));
  if (req.url === "/" || req.url === "") p = path.join(ROOT, "index.html");
  // Pas de fonction cloud en local
  if (req.url.includes("/.netlify/functions/")) { res.writeHead(404); res.end("{}"); return; }
  fs.readFile(p, (e, d) => {
    if (e) { res.writeHead(404); res.end("not found"); return; }
    res.writeHead(200, { "Content-Type": TYPES[path.extname(p)] || "application/octet-stream", "Cache-Control": "no-store" });
    res.end(d);
  });
});
srv.listen(8080, "0.0.0.0", () => console.log("Serveur dev sur http://localhost:8080 (public/)"));
