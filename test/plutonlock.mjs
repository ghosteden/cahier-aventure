import http from "http"; import fs from "fs"; import path from "path";
import { chromium } from "playwright";
const ROOT=path.resolve("public");
const T={".html":"text/html",".css":"text/css",".js":"text/javascript",".png":"image/png",".webmanifest":"application/manifest+json"};
const srv=http.createServer((q,r)=>{let p=path.join(ROOT,decodeURIComponent(q.url.split("?")[0])); if(q.url==="/")p=path.join(ROOT,"index.html"); if(q.url.includes("/.netlify/")){r.writeHead(404);r.end();return;} fs.readFile(p,(e,d)=>{if(e){r.writeHead(404);r.end();return;} r.writeHead(200,{"Content-Type":T[path.extname(p)]||"application/octet-stream"});r.end(d);});});
await new Promise(r=>srv.listen(8241,r));
const b=await chromium.launch();
const page=await (await b.newContext({viewport:{width:414,height:900}})).newPage();
await page.goto("http://localhost:8241/index.html",{waitUntil:"domcontentloaded"});
await page.waitForSelector("#app:not([hidden])");
await page.fill("#login-name","Gabi"); await page.click('button:has-text("C\'est parti")');
await page.waitForSelector(".map-viewport");
// simule : 8 planetes gagnées (comme un vrai finishDay)
await page.evaluate(()=>{
  const s=CV.Store.current(); s.currentDay=45; s.heroWorld=4;
  s.dayProgress=s.dayProgress||{};
  const wi=CV.freeWorldIndex();
  for(let i=0;i<8;i++){ s.dayProgress[CV.levelNumber(wi,i)]={done:true,stars:2}; }
  CV.Store.save();
  window.__diag={ wi, boss:CV.BOSS_NODE, played:CV.planetsPlayed(s), unlocked:CV.plutonUnlocked(s),
    plutonLevel:CV.levelNumber(wi,CV.BOSS_NODE),
    keys:Object.keys(s.dayProgress).map(Number).sort((a,b)=>a-b) };
});
console.log(await page.evaluate(()=>window.__diag));
// et si on les SKIP au lieu de les jouer ?
await page.evaluate(()=>{
  const s=CV.Store.current(); const wi=CV.freeWorldIndex();
  for(let i=0;i<8;i++){ s.dayProgress[CV.levelNumber(wi,i)]={done:true,stars:0,skipped:true}; }
  CV.Store.save();
  window.__diag2={ played:CV.planetsPlayed(s), unlocked:CV.plutonUnlocked(s) };
});
console.log("Si les 8 sont PASSÉES (skip) :", await page.evaluate(()=>window.__diag2));
await b.close(); srv.close();
