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
await new Promise(r => srv.listen(8217, r));
const errors = [];
const b = await chromium.launch();
const page = await (await b.newContext({ viewport: { width: 414, height: 900 } })).newPage();
page.on("pageerror", e => errors.push("PAGEERROR: " + e.message));
page.on("console", m => { if (m.type() === "error" && !m.text().includes("404")) errors.push(m.text()); });
const shot = n => page.screenshot({ path: path.join(SHOTS, n + ".png") });
try {
  await page.goto("http://localhost:8217/index.html", { waitUntil: "domcontentloaded" });
  await page.waitForSelector("#app:not([hidden])");
  await page.fill("#login-name", "Gabi");
  await page.click('button:has-text("C\'est parti")');
  await page.waitForSelector(".map-viewport");
  await page.evaluate(() => { const s = CV.Store.current(); s.currentDay = 39; CV.Store.save(); location.reload(); });  // Mercure = pierre 3
  await page.waitForSelector(".map-viewport");
  // questions truquées : la 1re réponse est toujours la bonne
  await page.evaluate(() => {
    CV.drawMix = () => Array.from({ length: 12 }, (_, i) => (
      { type: "qcm", q: "Question " + (i + 1) + " : 1 + 1 = ?", choices: ["2", "3", "4"], answer: 0 }));
  });
  await page.waitForTimeout(400);
  await page.locator(".stone.current").click({ force: true });
  await page.waitForSelector(".node-sheet");
  await page.click('.node-sheet button:has-text("Jouer"), .node-sheet button:has-text("Rejouer")');
  await page.waitForSelector(".planet-stage", { timeout: 5000 });
  await page.waitForTimeout(500);

  const start = await page.evaluate(() => {
    const a = document.querySelector(".planet-hero"), st = document.querySelector(".planet-stage");
    return { left: a.style.left, top: a.style.top, bg: (getComputedStyle(st).backgroundImage.match(/assets\/[^")]+/) || ["?"])[0], steps: document.querySelector(".planet-steps").textContent };
  });
  console.log("Départ :", start);
  await shot("planet-01-depart");

  for (let i = 0; i < 5; i++) {                       // 5 bonnes réponses = 5 appuis franchis
    await page.locator(".choice").first().click();
    await page.waitForTimeout(200);
    const cont = page.locator('button:has-text("Terminer"), button:has-text("Continuer")').first();
    if (await cont.count() && await cont.isVisible()) await cont.click();
    await page.waitForTimeout(300);
    if (i === 2) await shot("planet-02-milieu");
    const pos = await page.evaluate(() => {
      const a = document.querySelector(".planet-hero");
      return a ? a.style.left + " / " + (document.querySelector(".planet-steps") || {}).textContent : "fini";
    });
    console.log("  après réponse " + (i + 1) + " :", pos);
    await page.waitForTimeout(800);
  }
  await page.waitForTimeout(900);
  const end = await page.evaluate(() => ({
    stage: !!document.querySelector(".planet-stage"),
    title: (document.querySelector("h2") || {}).textContent,
    stars: document.querySelectorAll(".star.on, .stars .on").length
  }));
  console.log("Fin :", end);
  await shot("planet-03-fin");
} catch (e) { console.log("ERREUR:", e.message); await shot("planet-99"); }
finally { console.log("Erreurs JS:", errors.length, errors.slice(0, 5)); await b.close(); srv.close(); }
