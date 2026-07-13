import http from "http"; import fs from "fs"; import path from "path";
import { chromium } from "playwright";
const ROOT=path.resolve("public");
const T={".html":"text/html",".css":"text/css",".js":"text/javascript",".png":"image/png",".webmanifest":"application/manifest+json"};
const srv=http.createServer((q,r)=>{let p=path.join(ROOT,decodeURIComponent(q.url.split("?")[0])); if(q.url==="/")p=path.join(ROOT,"index.html"); if(q.url.includes("/.netlify/")){r.writeHead(404);r.end();return;} fs.readFile(p,(e,d)=>{if(e){r.writeHead(404);r.end();return;} r.writeHead(200,{"Content-Type":T[path.extname(p)]||"application/octet-stream"});r.end(d);});});
await new Promise(r=>srv.listen(8231,r));
const errors=[]; const b=await chromium.launch();
const page=await (await b.newContext({viewport:{width:414,height:900}})).newPage();
page.on("pageerror",e=>errors.push("PAGEERROR: "+e.message));
await page.goto("http://localhost:8231/index.html",{waitUntil:"domcontentloaded"});
await page.waitForSelector("#app:not([hidden])");
await page.fill("#login-name","Gabi"); await page.click('button:has-text("C\'est parti")');
await page.waitForSelector(".map-viewport");
// on est au monde 3 (chevaliers), pierre 5 ; on va rejouer la pierre 2 du MONDE 1
await page.evaluate(()=>{const s=CV.Store.current(); s.currentDay=23; CV.Store.save(); location.reload();});
await page.waitForSelector(".map-viewport"); await page.waitForTimeout(700);
const w0=await page.evaluate(()=>({monde:CV.WORLDS[CV.worldIndexOfLevel(CV.Store.current().currentDay)].key}));
console.log("Départ : monde courant =", w0.monde, "(niveau 23)");
// simule : on termine le niveau 2 (monde 1) en le rejouant
await page.evaluate(()=>{ const lv=CV.getLevel(2); CV.__t=lv; });
await page.evaluate(()=>{ location.hash="#/carte"; });
await page.evaluate(()=>{
  // rejoue le niveau 2 -> le moteur appelle finishDay, qui enregistre la position
  const s=CV.Store.current(); s.heroNode={0:1}; s.heroWorld=0; CV.Store.save();
});
await page.reload(); await page.waitForSelector(".map-viewport"); await page.waitForTimeout(900);
const after=await page.evaluate(()=>{
  const s=CV.Store.current();
  return { mondeAffiche: document.querySelector(".cb-wname") ? document.querySelector(".cb-wname").textContent : "?",
    heroWorld:s.heroWorld, heroNode:JSON.stringify(s.heroNode), currentDay:s.currentDay };
});
console.log("Après rechargement :", after);
console.log("Erreurs JS:", errors.length, errors.slice(0,3));
await b.close(); srv.close();
