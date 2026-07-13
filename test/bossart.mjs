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
await new Promise(r => srv.listen(8215, r));
const errors = [], missing = [];
const b = await chromium.launch();
const page = await (await b.newContext({ viewport: { width: 414, height: 900 } })).newPage();
page.on("pageerror", e => errors.push("PAGEERROR: " + e.message));
page.on("console", m => { if (m.type() === "error" && !m.text().includes("404")) errors.push(m.text()); });
page.on("response", r => { if (r.status() === 404) missing.push(r.url().split("/").pop()); });
const shot = n => page.screenshot({ path: path.join(SHOTS, n + ".png") });

// Boss de chaque monde : dinosaure 9, ulysse 18, chevaliers 27, pirate 36
const BOSSES = [[9, "dinosaure"], [18, "ulysse"], [27, "chevalier"], [36, "pirate"]];
try {
  await page.goto("http://localhost:8215/index.html", { waitUntil: "domcontentloaded" });
  await page.waitForSelector("#app:not([hidden])");
  await page.fill("#login-name", "Gabi");
  await page.click('button:has-text("C\'est parti")');
  await page.waitForSelector(".map-viewport");

  for (const [day, name] of BOSSES) {
    await page.evaluate((d) => { const s = CV.Store.current(); s.currentDay = d; CV.Store.save(); location.hash = "#/carte"; location.reload(); }, day);
    await page.waitForSelector(".map-viewport");
    await page.waitForTimeout(600);
    await page.locator(".stone.current").click({ force: true });
    await page.waitForSelector(".node-sheet");
    await page.click('.node-sheet button:has-text("Affronter")');
    await page.waitForSelector(".combat-scene", { timeout: 5000 });
    await page.waitForTimeout(700);

    const info = await page.evaluate(() => {
      const sc = document.querySelector(".combat-scene");
      const st = document.querySelector(".boss-token .hero-strip");
      const emo = document.querySelector(".boss-token .hero-emo");
      return {
        bg: (getComputedStyle(sc).backgroundImage.match(/assets\/[^")]+/) || ["aucun"])[0],
        strip: st ? (st.style.backgroundImage.match(/assets\/[^")]+/) || [""])[0] : "—",
        stripVisible: st ? st.style.display !== "none" : false,
        emojiFallback: emo ? emo.style.display !== "none" : false,
        anim: st ? st.style.animation : "",
        mirror: document.querySelector(".boss-token") ? getComputedStyle(document.querySelector(".boss-token")).transform : ""
      };
    });
    console.log("\n=== BOSS " + name + " (jour " + day + ") ===");
    console.log("  fond   :", info.bg);
    console.log("  planche:", info.strip, info.emojiFallback ? "❌ FALLBACK EMOJI" : "✅ sprite");
    console.log("  anim   :", info.anim);
    console.log("  miroir :", info.mirror);
    await shot("bossart-" + name + "-idle");

    // une bonne réponse (attaque) puis screenshot
    const choice = page.locator(".choice").first();
    if (await choice.count() && await choice.isVisible()) {
      await choice.click();
      await page.waitForTimeout(250);
      await shot("bossart-" + name + "-hit");
    }
    await page.waitForTimeout(900);
  }
} catch (e) { console.log("ERREUR:", e.message); await shot("bossart-99"); }
finally {
  console.log("\nErreurs JS:", errors.length, errors.slice(0, 5));
  console.log("Assets 404:", [...new Set(missing)].slice(0, 10));
  await b.close(); srv.close();
}
