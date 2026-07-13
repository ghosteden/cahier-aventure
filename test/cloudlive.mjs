import http from "http"; import fs from "fs"; import path from "path";
import { chromium } from "playwright";
const ROOT=path.resolve("public"), SHOTS=path.resolve("test/shots");
const T={".html":"text/html",".css":"text/css",".js":"text/javascript",".png":"image/png",".webmanifest":"application/manifest+json"};
const srv=http.createServer((q,r)=>{let p=path.join(ROOT,decodeURIComponent(q.url.split("?")[0])); if(q.url==="/")p=path.join(ROOT,"index.html"); if(q.url.includes("/.netlify/")){r.writeHead(404);r.end();return;} fs.readFile(p,(e,d)=>{if(e){r.writeHead(404);r.end();return;} r.writeHead(200,{"Content-Type":T[path.extname(p)]||"application/octet-stream"});r.end(d);});});
await new Promise(r=>srv.listen(8230,r));
const b=await chromium.launch();
const page=await (await b.newContext({viewport:{width:414,height:900}})).newPage();
await page.goto("http://localhost:8230/index.html",{waitUntil:"domcontentloaded"});
await page.waitForSelector("#app:not([hidden])");
await page.fill("#login-name","Gabi"); await page.click('button:has-text("C\'est parti")');
await page.waitForSelector(".map-viewport");
await page.evaluate(()=>{const s=CV.Store.current(); s.currentDay=38; CV.Store.save(); location.reload();});
await page.waitForSelector(".map-viewport");
await page.evaluate(()=>{ CV.drawMix=()=>Array.from({length:12},()=>({type:"qcm",q:"2+2 ?",choices:["4","5","6"],answer:0})); });
await page.waitForTimeout(400);
await page.locator(".stone.current").click({force:true});
await page.waitForSelector(".node-sheet");
await page.click('.node-sheet button:has-text("Jouer"), .node-sheet button:has-text("Rejouer")');
await page.waitForSelector(".planet-stage"); await page.waitForTimeout(300);
// relève, pendant la dissipation, le transform du strip ET la position du jeton
const rows=[];
await page.locator(".choice").first().click();
for(let i=0;i<14;i++){
  const s=await page.evaluate(()=>{
    const el=document.querySelector(".planet-prop"), st=el.querySelector(".hero-strip");
    const cs=getComputedStyle(st), ce=getComputedStyle(el);
    const r=el.getBoundingClientRect();
    return { strip:cs.transform, token:ce.transform, x:Math.round(r.left), w:Math.round(r.width) };
  });
  rows.push(s); await page.waitForTimeout(80);
}
const tokW = rows[0].w;
console.log("Largeur du jeton :", tokW, "px → une image = ", tokW, "px\n");
console.log("temps | décalage de la bande | image affichée | position du jeton à l'écran");
rows.forEach((r,i)=>{
  const m=/matrix\(1, 0, 0, 1, (-?[0-9.]+)/.exec(r.strip);
  const px=m?parseFloat(m[1]):0, f=px/-tokW;
  console.log(String(i*80).padStart(5)+"ms | "+String(px.toFixed(1)).padStart(8)+"px | image "+f.toFixed(2).padStart(5)+" | x="+r.x);
});
await b.close(); srv.close();
