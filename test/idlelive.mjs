import http from "http"; import fs from "fs"; import path from "path";
import { chromium } from "playwright";
const ROOT=path.resolve("public"), SHOTS=path.resolve("test/shots");
const T={".html":"text/html",".css":"text/css",".js":"text/javascript",".png":"image/png",".webmanifest":"application/manifest+json"};
const srv=http.createServer((q,r)=>{let p=path.join(ROOT,decodeURIComponent(q.url.split("?")[0])); if(q.url==="/")p=path.join(ROOT,"index.html"); if(q.url.includes("/.netlify/")){r.writeHead(404);r.end();return;} fs.readFile(p,(e,d)=>{if(e){r.writeHead(404);r.end();return;} r.writeHead(200,{"Content-Type":T[path.extname(p)]||"application/octet-stream"});r.end(d);});});
await new Promise(r=>srv.listen(8226,r));
const b=await chromium.launch();
const page=await (await b.newContext({viewport:{width:414,height:900}})).newPage();
await page.goto("http://localhost:8226/index.html",{waitUntil:"domcontentloaded"});
await page.waitForSelector("#app:not([hidden])");
await page.fill("#login-name","Gabi"); await page.click('button:has-text("C\'est parti")');
await page.waitForSelector(".map-viewport");
await page.evaluate(()=>{const s=CV.Store.current(); s.currentDay=36; CV.Store.save(); location.reload();});
await page.waitForSelector(".map-viewport"); await page.waitForTimeout(500);
await page.locator(".stone.current").click({force:true});
await page.waitForSelector(".node-sheet");
await page.click('.node-sheet button:has-text("Affronter")');
await page.waitForSelector(".combat-scene"); await page.waitForTimeout(200);
// relève le transform réel du strip pendant l'idle (2 cycles)
const seen=new Set();
for(let i=0;i<80;i++){
  const t=await page.evaluate(()=>{
    const s=document.querySelector(".boss-token .hero-strip");
    return getComputedStyle(s).transform;
  });
  seen.add(t); await page.waitForTimeout(30);
}
const tokW = await page.evaluate(()=>document.querySelector(".boss-token").getBoundingClientRect().width);
console.log("Largeur du jeton :", Math.round(tokW), "px  → une cellule =", Math.round(tokW), "px");
console.log("Décalages observés pendant l'idle :");
for (const t of seen) {
  const m = /matrix\(1, 0, 0, 1, (-?[0-9.]+)/.exec(t);
  if (!m) continue;
  const px = parseFloat(m[1]);
  const f = px / -tokW;                       // n° d'image affichée
  const ok = Math.abs(f - Math.round(f)) < 0.02 && f >= -0.02 && f <= 7.02;
  console.log("   " + px.toFixed(1) + "px → image n° " + f.toFixed(2) + (ok ? "  OK" : "  ❌ HORS PLANCHE (il n'y a que 8 images : 0 à 7)"));
}
await b.close(); srv.close();
