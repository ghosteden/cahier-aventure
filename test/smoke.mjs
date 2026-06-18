import http from "http"; import fs from "fs"; import path from "path";
import { chromium } from "playwright";

const ROOT = path.resolve(process.argv[2] || ".");
const SHOTS = path.join(ROOT, "test", "shots");
fs.mkdirSync(SHOTS, { recursive: true });
const TYPES = { ".html":"text/html",".css":"text/css",".js":"text/javascript",".svg":"image/svg+xml",".webmanifest":"application/manifest+json",".json":"application/json" };

// Serveur statique local
const srv = http.createServer((req, res) => {
  let p = path.join(ROOT, decodeURIComponent(req.url.split("?")[0]));
  if (req.url === "/" || req.url === "") p = path.join(ROOT, "index.html");
  // Les appels de fonction Netlify n'existent pas en local -> 404 (cloud "indispo")
  if (req.url.includes("/.netlify/functions/")) { res.writeHead(404); res.end("no function"); return; }
  fs.readFile(p, (e, d) => {
    if (e) { res.writeHead(404); res.end("nf"); return; }
    res.writeHead(200, { "Content-Type": TYPES[path.extname(p)] || "application/octet-stream" });
    res.end(d);
  });
});

const PORT = 8123;
const errors = [];
const logs = [];

await new Promise((r) => srv.listen(PORT, r));
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 414, height: 820 } });
const page = await ctx.newPage();
page.on("console", (m) => { logs.push(m.type() + ": " + m.text()); if (m.type() === "error") errors.push(m.text()); });
page.on("pageerror", (e) => errors.push("PAGEERROR: " + e.message));

const base = "http://localhost:" + PORT + "/index.html";
function shot(name) { return page.screenshot({ path: path.join(SHOTS, name + ".png") }); }

try {
  await page.goto(base, { waitUntil: "networkidle" });
  await page.waitForSelector("#app:not([hidden])", { timeout: 5000 });
  await page.waitForTimeout(400);
  await shot("01-login");
  console.log("✔ Écran de connexion affiché");

  // L'option Cloud doit être désactivée (pas de fonctions en local)
  const cloudDisabled = await page.locator(".theme-opt.disabled").count();
  console.log("  Option Cloud désactivée :", cloudDisabled > 0 ? "OUI ✅" : "non ❌");

  // Le champ classe est un <select> avec CE2
  const classOptions = await page.locator("#login-class option").allTextContents();
  console.log("  Classe(s) proposée(s) :", JSON.stringify(classOptions));

  // Connexion
  await page.fill("#login-name", "Gabi");
  await page.click('button:has-text("C\'est parti")');
  await page.waitForSelector(".world", { timeout: 5000 });
  await page.waitForTimeout(400);
  await shot("02-carte");
  console.log("✔ Carte d'aventure affichée");
  const worlds = await page.locator(".world").count();
  const days = await page.locator(".daynode").count();
  console.log("  Mondes :", worlds, "| Jours visibles :", days);

  // Ouvrir le jour 1 (today)
  await page.click(".daynode.today");
  await page.waitForSelector(".card", { timeout: 5000 });
  await page.waitForTimeout(300);
  await shot("03-jour1");
  console.log("✔ Vue du Jour 1 affichée");

  // Ouvrir le premier module -> leçon
  await page.click(".card.row >> nth=0");
  await page.waitForSelector(".lesson-points", { timeout: 5000 });
  await shot("04-lecon");
  console.log("✔ Leçon affichée");

  // Aller à l'exercice
  await page.click('button:has-text("Au défi")');
  await page.waitForSelector(".question", { timeout: 5000 });
  await shot("05-exo1");
  console.log("✔ Premier exercice affiché");

  // Répondre à quelques étapes (QCM/vrai-faux/saisie), tolérant aux types
  let steps = 0;
  for (let i = 0; i < 6; i++) {
    const choice = page.locator(".choice").first();
    const input = page.locator(".text-input").first();
    if (await choice.count() && await choice.isVisible()) {
      await choice.click();
    } else if (await input.count() && await input.isVisible()) {
      await input.fill("3");
      await page.click('button:has-text("Valider")');
    } else {
      break; // type non géré automatiquement (ex. associations)
    }
    await page.waitForTimeout(250);
    const cont = page.locator('button:has-text("Continuer"), button:has-text("Terminer")').first();
    if (await cont.count() && await cont.isVisible()) { await cont.click(); steps++; await page.waitForTimeout(250); }
    else break;
  }
  console.log("✔ Étapes d'exercice enchaînées :", steps);
  await shot("06-apres-exos");

} catch (e) {
  console.log("✖ ERREUR DE TEST :", e.message);
  await shot("99-erreur");
} finally {
  console.log("\n--- Erreurs console/page :", errors.length);
  errors.forEach((e) => console.log("   ⚠", e));
  await browser.close();
  srv.close();
  console.log("Captures dans test/shots/");
}
