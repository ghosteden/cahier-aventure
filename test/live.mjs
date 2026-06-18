import { chromium } from "playwright";
import path from "path"; import fs from "fs";
const URL = "https://cahier-aventure-ce2.netlify.app/";
const SHOTS = path.resolve("test/shots"); fs.mkdirSync(SHOTS, { recursive: true });
const errors = [];
const browser = await chromium.launch();
const page = await (await browser.newContext({ viewport: { width: 414, height: 820 } })).newPage();
page.on("pageerror", (e) => errors.push("PAGEERROR: " + e.message));
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
try {
  await page.goto(URL, { waitUntil: "networkidle" });
  await page.waitForSelector("#app:not([hidden])", { timeout: 8000 });
  await page.waitForTimeout(1500); // laisse le ping cloud répondre
  await page.screenshot({ path: path.join(SHOTS, "live-01-login.png") });
  const cloudDisabled = await page.locator(".theme-opt.disabled").count();
  const cloudSel = await page.locator(".theme-opt.sel:has-text('Cloud')").count();
  console.log("Cloud désactivé ?", cloudDisabled > 0 ? "oui" : "NON (dispo ✅)");
  console.log("Cloud sélectionné par défaut ?", cloudSel > 0 ? "oui ✅" : "non");
  await page.fill("#login-name", "Léo");
  await page.click('button:has-text("C\'est parti")');
  await page.waitForSelector(".world", { timeout: 8000 });
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(SHOTS, "live-02-carte.png") });
  console.log("Connexion + carte OK ✅");
  // Vérifie que la sauvegarde cloud du joueur a bien été créée
  const r = await fetch(URL + ".netlify/functions/progress?id=ce2__leo");
  const d = await r.json();
  console.log("Sauvegarde cloud du joueur 'Léo' présente ?", d.state ? "OUI ✅ (xp=" + d.state.xp + ")" : "non");
  // Nettoyage
  await fetch(URL + ".netlify/functions/progress?id=ce2__leo", { method: "DELETE" });
} catch (e) {
  console.log("ERREUR:", e.message);
} finally {
  console.log("Erreurs console/page:", errors.length, errors.slice(0, 3));
  await browser.close();
}
