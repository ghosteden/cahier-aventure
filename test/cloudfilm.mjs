import http from "http"; import fs from "fs"; import path from "path";
import { chromium } from "playwright";
const ROOT=path.resolve("public"), SHOTS=path.resolve("test/shots");
const T={".html":"text/html",".css":"text/css",".js":"text/javascript",".png":"image/png",".webmanifest":"application/manifest+json"};
const srv=http.createServer((q,r)=>{let p=path.join(ROOT,decodeURIComponent(q.url.split("?")[0])); if(q.url==="/")p=path.join(ROOT,"index.html"); if(q.url.includes("/.netlify/")){r.writeHead(404);r.end();return;} fs.readFile(p,(e,d)=>{if(e){r.writeHead(404);r.end();return;} r.writeHead(200,{"Content-Type":T[path.extname(p)]||"application/octet-stream"});r.end(d);});});
await new Promise(r=>srv.listen(8229,r));
const b=await chromium.launch();
const page=await (await b.newContext({viewport:{width:414,height:900}})).newPage();
await page.goto("http://localhost:8229/index.html",{waitUntil:"domcontentloaded"});
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
// isole UN nuage et affiche ses 7 images côte à côte, telles que le navigateur les rend
await page.evaluate(()=>{
  const el=document.querySelector(".planet-prop");
  const row=document.createElement("div");
  row.id="film"; row.style.cssText="position:fixed;left:0;top:0;z-index:9999;display:flex;background:#5a4a2a;padding:4px;gap:2px";
  for(let i=0;i<7;i++){
    const c=el.cloneNode(true); c.classList.remove("planet-prop","cover");
    c.style.cssText="position:relative;left:0;top:0;transform:none;width:"+el.style.width+";height:"+el.style.height+";overflow:hidden;outline:1px solid red";
    const s=c.querySelector(".hero-strip");
    s.style.animation="none"; s.style.transform="translateX(-"+(100*i/7)+"%)";
    row.appendChild(c);
  }
  document.body.appendChild(row);
});
await page.waitForTimeout(300);
await page.locator("#film").screenshot({path:path.join(SHOTS,"cloud-film.png")});
await b.close(); srv.close(); console.log("ok");
