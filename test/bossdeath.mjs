import http from "http"; import fs from "fs"; import path from "path";
import { chromium } from "playwright";
const ROOT = path.resolve("public");
const SHOTS = path.resolve("test/shots"); fs.mkdirSync(SHOTS, { recursive: true });
const T = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".svg": "image/svg+xml", ".png": "image/png", ".webmanifest": "application/manifest+json" };
const srv = http.createServer((req, res) => {
  let p = path.join(ROOT, decodeURIComponent(req.url.split("?")[0]));
  if (req.url === "/") p = path.join(ROOT, "index.html");
  if (req.url.includes("/.netlify/")) { res.writeHead(404); res.end(); return; }
  fs.readFile(p, (e, d) => { if (e) { res.writeHead(404); res.end(); return; } res.writeHead(200, { "Content-Type": T[path.extname(p)] || "application/octet-stream" }); res.end(d); });
});
await new Promise(r => srv.listen(8216, r));
const errors = [];
const b = await chromium.launch();
const page = await (await b.newContext({ viewport: { width: 414, height: 900 } })).newPage();
page.on("pageerror", e => errors.push("PAGEERROR: " + e.message));
const shot = n => page.screenshot({ path: path.join(SHOTS, n + ".png") });
try {
  await page.goto("http://localhost:8216/index.html", { waitUntil: "domcontentloaded" });
  await page.waitForSelector("#app:not([hidden])");
  await page.fill("#login-name", "Gabi");
  await page.click('button:has-text("C\'est parti")');
  await page.waitForSelector(".map-viewport");
  // boss des chevaliers (7 PV) + questions truquées : la bonne réponse est toujours la 1re
  await page.evaluate(() => { const s = CV.Store.current(); s.currentDay = 27; CV.Store.save(); location.reload(); });
  await page.waitForSelector(".map-viewport");
  await page.evaluate(() => {
    CV.buildBossExercises = () => Array.from({ length: 20 }, () => (
      { type: "qcm", q: "1 + 1 = ?", choices: ["2", "3", "4"], answer: 0 }));
  });
  await page.waitForTimeout(400);
  await page.locator(".stone.current").click({ force: true });
  await page.waitForSelector(".node-sheet");
  await page.click('.node-sheet button:has-text("Affronter")');
  await page.waitForSelector(".combat-scene");

  for (let i = 0; i < 7; i++) {                       // 7 bonnes réponses = dragon KO
    await page.locator(".choice").first().click();
    await page.waitForTimeout(200);
    const cont = page.locator('button:has-text("Terminer"), button:has-text("Continuer")').first();
    if (await cont.count() && await cont.isVisible()) await cont.click();
    if (i < 6) await page.waitForTimeout(950);
  }
  await page.waitForTimeout(700);                     // pendant l'animation de mort
  await shot("bossdeath-01-mort");
  const st = await page.evaluate(() => {
    const s = document.querySelector(".boss-token .hero-strip");
    if (!s) return null;
    return { anim: s.style.animation, inline: s.style.transform, img: (s.style.backgroundImage.match(/assets\/[^")]+/) || [""])[0] };
  });
  console.log("Strip au moment de la mort :", st);
  await page.waitForTimeout(1600);
  console.log("Écran final :", await page.locator(".combat-scene").count() ? "combat encore là ❌" : "victoire ✅");
  await shot("bossdeath-02-victoire");
} catch (e) { console.log("ERREUR:", e.message); await shot("bossdeath-99"); }
finally { console.log("Erreurs JS:", errors.length, errors.slice(0, 4)); await b.close(); srv.close(); }
