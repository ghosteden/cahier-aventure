import http from "http"; import fs from "fs"; import path from "path";
import { chromium } from "playwright";
const ROOT = path.resolve("public");
const SHOTS = path.resolve("test/shots"); fs.mkdirSync(SHOTS, { recursive: true });
const TYPES = { ".html":"text/html",".css":"text/css",".js":"text/javascript",".svg":"image/svg+xml",".png":"image/png",".webmanifest":"application/manifest+json" };
const srv = http.createServer((req, res) => {
  let p = path.join(ROOT, decodeURIComponent(req.url.split("?")[0]));
  if (req.url === "/" || req.url === "") p = path.join(ROOT, "index.html");
  if (req.url.includes("/.netlify/functions/")) { res.writeHead(404); res.end("nf"); return; }
  fs.readFile(p, (e, d) => { if (e) { res.writeHead(404); res.end("nf"); return; }
    res.writeHead(200, { "Content-Type": TYPES[path.extname(p)] || "application/octet-stream" }); res.end(d); });
});
await new Promise((r) => srv.listen(8201, r));
const errors = [];
const browser = await chromium.launch();
const page = await (await browser.newContext({ viewport: { width: 414, height: 820 } })).newPage();
page.on("pageerror", (e) => errors.push("PAGEERROR: " + e.message));
page.on("console", (m) => { if (m.type() === "error" && !m.text().includes("404")) errors.push(m.text()); });
const shot = (n) => page.screenshot({ path: path.join(SHOTS, n + ".png") });
try {
  await page.goto("http://localhost:8201/index.html", { waitUntil: "domcontentloaded" });
  await page.waitForSelector("#app:not([hidden])", { timeout: 8000 });
  await page.waitForTimeout(500);
  await shot("map-01-login");
  await page.fill("#login-name", "Gabi");
  await page.click('button:has-text("C\'est parti")');
  await page.waitForSelector(".map-viewport", { timeout: 8000 });
  await page.addStyleTag({ content: "*{animation:none!important;transition:none!important}" });
  await page.waitForTimeout(1200);
  const stones = await page.locator(".stone").count();
  const hero = await page.locator(".hero-sprite").count();
  const world = await page.evaluate(() => CV.WORLDS[CV.worldIndexOfLevel(CV.Store.current().currentDay)].name);
  console.log("Monde affiché:", world, "| pierres:", stones, "| sprite héros:", hero);
  await shot("map-02-carte");
  // Ouvre la pierre courante
  await page.click(".stone.current");
  await page.waitForSelector(".node-sheet", { timeout: 4000 });
  await shot("map-03-sheet");
  // Bouton Débloquer (test)
  await page.click('.node-sheet button:has-text("Débloquer")');
  await page.waitForTimeout(800);
  const cur = await page.evaluate(() => CV.Store.current().currentDay);
  console.log("Niveau courant après Débloquer:", cur, "(attendu 2)");
  await shot("map-04-apres-skip");
  // Saute jusqu'au boss du monde 1 (niveau 9) puis vérifie la transition de monde
  for (let i = 0; i < 8; i++) {
    await page.click(".stone.current");
    await page.waitForSelector(".node-sheet", { timeout: 4000 });
    await page.click('.node-sheet button:has-text("Débloquer")');
    await page.waitForTimeout(500);
    // si une transition de monde apparaît
    if (await page.locator(".world-transition").count()) {
      await shot("map-05-transition");
      await page.click('button:has-text("monde suivant")');
      await page.waitForTimeout(700);
      break;
    }
  }
  const cur2 = await page.evaluate(() => CV.Store.current().currentDay);
  const world2 = await page.evaluate(() => CV.WORLDS[CV.worldIndexOfLevel(CV.Store.current().currentDay)].name);
  console.log("Après le boss → niveau:", cur2, "| monde:", world2);
  await shot("map-06-monde2");
} catch (e) {
  console.log("ERREUR:", e.message);
  await shot("map-99-erreur");
} finally {
  console.log("Erreurs console/page:", errors.length, errors.slice(0, 4));
  await browser.close(); srv.close();
}
