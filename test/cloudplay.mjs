import http from "http"; import fs from "fs"; import path from "path";
import { chromium } from "playwright";
const ROOT=path.resolve("public"), SHOTS=path.resolve("test/shots");
const T={".html":"text/html",".css":"text/css",".js":"text/javascript",".png":"image/png",".webmanifest":"application/manifest+json"};
const srv=http.createServer((q,r)=>{let p=path.join(ROOT,decodeURIComponent(q.url.split("?")[0])); if(q.url==="/")p=path.join(ROOT,"index.html"); if(q.url.includes("/.netlify/")){r.writeHead(404);r.end();return;} fs.readFile(p,(e,d)=>{if(e){r.writeHead(404);r.end();return;} r.writeHead(200,{"Content-Type":T[path.extname(p)]||"application/octet-stream"});r.end(d);});});
await new Promise(r=>srv.listen(8228,r));
const b=await chromium.launch();
const page=await (await b.newContext({viewport:{width:414,height:900}})).newPage();
await page.goto("http://localhost:8228/index.html",{waitUntil:"domcontentloaded"});
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
const geo = await page.evaluate(()=>{
  const el=document.querySelector(".planet-prop"), st=el.querySelector(".hero-strip");
  const r=el.getBoundingClientRect(), rs=st.getBoundingClientRect();
  return { token:[Math.round(r.width),Math.round(r.height)], strip:[Math.round(rs.width),Math.round(rs.height)],
    overflow:getComputedStyle(el).overflow, stripW:st.style.width,
    ratioToken:(r.width/r.height).toFixed(3), cellRatio:(201/154).toFixed(3),
    cellsInStrip:(rs.width/r.width).toFixed(2) };
});
console.log("Géométrie d'un nuage :", geo);
await b.close(); srv.close();
