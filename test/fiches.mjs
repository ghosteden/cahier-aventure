import http from "http"; import fs from "fs"; import path from "path";
import { chromium } from "playwright";
const ROOT=path.resolve("public"), SHOTS=path.resolve("test/shots");
const T={".html":"text/html",".css":"text/css",".js":"text/javascript",".png":"image/png",".webmanifest":"application/manifest+json"};
const srv=http.createServer((q,r)=>{let p=path.join(ROOT,decodeURIComponent(q.url.split("?")[0])); if(q.url==="/")p=path.join(ROOT,"index.html"); if(q.url.includes("/.netlify/")){r.writeHead(404);r.end();return;} fs.readFile(p,(e,d)=>{if(e){r.writeHead(404);r.end();return;} r.writeHead(200,{"Content-Type":T[path.extname(p)]||"application/octet-stream"});r.end(d);});});
await new Promise(r=>srv.listen(8244,r));
const errors=[]; const b=await chromium.launch();
const page=await (await b.newContext({viewport:{width:414,height:900}})).newPage();
page.on("pageerror",e=>errors.push("PAGEERROR: "+e.message));
page.on("console",m=>{ if(m.type()==="error"&&!m.text().includes("404")) errors.push(m.text()); });
await page.goto("http://localhost:8244/index.html",{waitUntil:"domcontentloaded"});
await page.waitForSelector("#app:not([hidden])");
await page.fill("#login-name","Gabi"); await page.click('button:has-text("C\'est parti")');
await page.waitForSelector(".map-viewport");
// diag : nombre total de fiches, et fiches de la journée 1
const diag = await page.evaluate(()=>({
  total: CV.allFiches().length,
  world: CV.allFiches().filter(f=>f.kind==="world").length,
  jour1: CV.fichesForLevel(1)
}));
console.log("Fiches au total :", diag.total, "(dont", diag.world, "de monde)");
console.log("Fiches débloquées par la journée 1 :", diag.jour1);
// simule le déblocage : on gagne les fiches de la journée 1 + une fiche de monde
await page.evaluate(()=>{
  const s=CV.Store.current(); s.fiches=s.fiches||{};
  CV.fichesForLevel(1).forEach(id=>s.fiches[id]=true);
  s.fiches["world-dino"]=true; CV.Store.save();
});
await page.click('.nav-btn[data-go="#/recompenses"]');
await page.waitForSelector(".fiche-grid");
const owned = await page.evaluate(()=>document.querySelectorAll(".fiche-cell:not(.locked)").length);
console.log("Fiches affichées comme débloquées :", owned);
await page.screenshot({path:path.join(SHOTS,"fiches-collection.png")});
// ouvre une fiche débloquée
await page.locator(".fiche-cell:not(.locked)").first().click();
await page.waitForSelector(".fiche-sheet");
const detail = await page.evaluate(()=>({
  titre:(document.querySelector(".fiche-sheet h3")||{}).textContent,
  aRetenir: !!document.querySelector(".fiche-block.retenir") || !!document.querySelector(".fiche-body") }));
console.log("Fiche ouverte :", detail);
await page.screenshot({path:path.join(SHOTS,"fiche-detail.png")});
console.log("Erreurs JS:", errors.length, errors.slice(0,4));
await b.close(); srv.close();
