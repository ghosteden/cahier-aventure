import http from "http"; import fs from "fs"; import path from "path";
import { chromium } from "playwright";
const ROOT=path.resolve("public"), SHOTS=path.resolve("test/shots");
const T={".html":"text/html",".css":"text/css",".js":"text/javascript",".png":"image/png",".webmanifest":"application/manifest+json"};
const srv=http.createServer((q,r)=>{let p=path.join(ROOT,decodeURIComponent(q.url.split("?")[0])); if(q.url==="/")p=path.join(ROOT,"index.html"); if(q.url.includes("/.netlify/")){r.writeHead(404);r.end();return;} fs.readFile(p,(e,d)=>{if(e){r.writeHead(404);r.end();return;} r.writeHead(200,{"Content-Type":T[path.extname(p)]||"application/octet-stream"});r.end(d);});});
await new Promise(r=>srv.listen(8253,r));
const errors=[]; const b=await chromium.launch();
const page=await (await b.newContext({viewport:{width:414,height:900}})).newPage();
page.on("pageerror",e=>errors.push("PAGEERROR: "+e.message));
page.on("console",m=>{ if(m.type()==="error"&&!m.text().includes("404")) errors.push(m.text()); });
await page.goto("http://localhost:8253/index.html",{waitUntil:"domcontentloaded"});
await page.waitForSelector("#app:not([hidden])");
await page.fill("#login-name","Gabi"); await page.click('button:has-text("C\'est parti")');
await page.waitForSelector(".map-viewport");
const diag = await page.evaluate(()=>{
  const all=CV.allFiches();
  return {
    total:all.length,
    modules:all.filter(f=>f.kind==="module").length,
    bonus:all.filter(f=>f.kind==="bonus").length,
    planetes:all.filter(f=>f.kind==="planet").length,
    jour1:CV.fichesForLevel(1),
    bossDino:CV.fichesForBoss(9),
    planeteJupiter:CV.fichesForLevel(41),  // pierre 5 espace = Jupiter (niveau 37+4)
    lienPluton:(CV.ficheById("planet-pluton")||{}).link
  };
});
console.log("Total fiches :", diag.total, "= "+diag.modules+" fr/maths + "+diag.bonus+" sciences/culture + "+diag.planetes+" planètes");
console.log("Journée 1 débloque :", diag.jour1);
console.log("Boss dino débloque :", diag.bossDino);
console.log("Planète (niv 41) débloque :", diag.planeteJupiter);
console.log("Lien Pluton :", diag.lienPluton);
// débloque une planète + le boss dino, et ouvre la fiche planète pour voir le lien
await page.evaluate(()=>{ const s=CV.Store.current(); s.fiches={"planet-mercure":true,"mod-sc-vivant":true}; CV.Store.save(); });
await page.click('.nav-btn[data-go="#/recompenses"]');
await page.waitForSelector(".fiche-grid");
await page.locator(".fiche-cell.world:not(.locked)").first().scrollIntoViewIfNeeded();
await page.locator(".fiche-cell.world:not(.locked)").first().click();
await page.waitForSelector(".fiche-sheet");
const planetSheet = await page.evaluate(()=>({ titre:(document.querySelector(".fiche-sheet h3")||{}).textContent,
  lien:(document.querySelector(".fiche-sheet a")||{}).getAttribute("href"), kicker:(document.querySelector(".fiche-kicker")||{}).textContent }));
console.log("Fiche planète ouverte :", planetSheet);
await page.screenshot({path:path.join(SHOTS,"fiche-planete.png")});
console.log("Erreurs JS:", errors.length, errors.slice(0,4));
await b.close(); srv.close();
