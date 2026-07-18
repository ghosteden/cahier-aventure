import http from "http"; import fs from "fs"; import path from "path";
import { chromium } from "playwright";
const ROOT=path.resolve("public"), SHOTS=path.resolve("test/shots");
const T={".html":"text/html",".css":"text/css",".js":"text/javascript",".png":"image/png",".webmanifest":"application/manifest+json"};
const srv=http.createServer((q,r)=>{let p=path.join(ROOT,decodeURIComponent(q.url.split("?")[0])); if(q.url==="/")p=path.join(ROOT,"index.html"); if(q.url.includes("/.netlify/")){r.writeHead(404);r.end();return;} fs.readFile(p,(e,d)=>{if(e){r.writeHead(404);r.end();return;} r.writeHead(200,{"Content-Type":T[path.extname(p)]||"application/octet-stream"});r.end(d);});});
await new Promise(r=>srv.listen(8240,r));
const errors=[]; const b=await chromium.launch();
const page=await (await b.newContext({viewport:{width:414,height:900}})).newPage();
page.on("pageerror",e=>errors.push("PAGEERROR: "+e.message));
await page.goto("http://localhost:8240/index.html",{waitUntil:"domcontentloaded"});
await page.waitForSelector("#app:not([hidden])");
await page.fill("#login-name","Gabi"); await page.click('button:has-text("C\'est parti")');
await page.waitForSelector(".map-viewport");
await page.evaluate(()=>{const s=CV.Store.current(); s.currentDay=45; s.heroWorld=4; CV.Store.save();});
await page.reload({waitUntil:"domcontentloaded"});
await page.waitForSelector(".map-viewport");
await page.evaluate(()=>{ CV.drawMix=()=>Array.from({length:14},()=>({type:"qcm",q:"2+2 ?",choices:["4","5","6"],answer:0})); });
await page.waitForTimeout(400);
await page.evaluate(()=>document.querySelectorAll(".planet-hit")[7].click());
await page.waitForSelector(".node-sheet");
await page.locator('.node-sheet .btn.big').click();
await page.waitForSelector(".planet-stage"); await page.waitForTimeout(400);
// 3 bonnes réponses pour avancer
for(let i=0;i<3;i++){ await page.locator(".choice").first().click(); await page.waitForTimeout(1100); }
const before = await page.evaluate(()=>document.querySelector(".planet-steps").textContent.trim());
// 1 mauvaise réponse -> rafale + recul, sans retournement
await page.locator(".choice").nth(1).click();
await page.waitForTimeout(300);
const cont=page.locator('button:has-text("compris")').first();
if(await cont.count() && await cont.isVisible()) await cont.click();
await page.waitForTimeout(250);
const mid = await page.evaluate(()=>({
  rafales: document.querySelectorAll(".wind-streak").length,
  orientation: document.querySelector(".planet-hero .hero-token").style.transform || "(aucune)"
}));
await page.screenshot({path:path.join(SHOTS,"neptune-gust.png")});
await page.waitForTimeout(1000);
const after = await page.evaluate(()=>document.querySelector(".planet-steps").textContent.trim());
console.log("Avant l'erreur :", before);
console.log("Pendant la rafale : streaks =", mid.rafales, "| orientation astronaute =", mid.orientation);
console.log("Après le recul :", after, "(doit avoir reculé d'un cran)");
console.log("Erreurs JS:", errors.length, errors.slice(0,3));
await b.close(); srv.close();
