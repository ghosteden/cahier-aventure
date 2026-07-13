import http from "http"; import fs from "fs"; import path from "path";
import { chromium } from "playwright";
const ROOT=path.resolve("public"), SHOTS=path.resolve("test/shots");
const T={".html":"text/html",".css":"text/css",".js":"text/javascript",".png":"image/png",".webmanifest":"application/manifest+json"};
const srv=http.createServer((q,r)=>{let p=path.join(ROOT,decodeURIComponent(q.url.split("?")[0])); if(q.url==="/")p=path.join(ROOT,"index.html"); if(q.url.includes("/.netlify/")){r.writeHead(404);r.end();return;} fs.readFile(p,(e,d)=>{if(e){r.writeHead(404);r.end();return;} r.writeHead(200,{"Content-Type":T[path.extname(p)]||"application/octet-stream"});r.end(d);});});
await new Promise(r=>srv.listen(8232,r));
const b=await chromium.launch();
const page=await (await b.newContext({viewport:{width:414,height:900},deviceScaleFactor:3})).newPage();
await page.goto("http://localhost:8232/index.html",{waitUntil:"domcontentloaded"});
await page.waitForSelector("#app:not([hidden])");
await page.fill("#login-name","Gabi"); await page.click('button:has-text("C\'est parti")');
await page.waitForSelector(".map-viewport");
await page.evaluate(()=>{const s=CV.Store.current(); s.currentDay=37; CV.Store.save(); location.reload();});
await page.waitForSelector(".map-viewport");
await page.evaluate(()=>{ CV.drawMix=()=>Array.from({length:12},()=>({type:"qcm",q:"2+2 ?",choices:["4","5","6"],answer:0})); });
await page.waitForTimeout(400);
await page.locator(".stone.current").click({force:true});
await page.waitForSelector(".node-sheet");
await page.click('.node-sheet button:has-text("Jouer"), .node-sheet button:has-text("Rejouer")');
await page.waitForSelector(".planet-stage"); await page.waitForTimeout(400);
const info = await page.evaluate(()=>{
  const el=document.querySelectorAll(".planet-prop")[2], st=el.querySelector(".hero-strip");
  const r=el.getBoundingClientRect();
  return { img:(st.style.backgroundImage.match(/platform[^")]+/)||["?"])[0], stripW:st.style.width,
    token:[Math.round(r.width),Math.round(r.height)], ratio:(r.width/r.height).toFixed(3) };
});
console.log("Jeton plateforme :", info);
// zoom sur 3 plateformes, cadre rouge = limite du jeton
await page.evaluate(()=>{
  const row=document.createElement("div");
  row.id="pf"; row.style.cssText="position:fixed;left:0;top:0;z-index:9999;display:flex;gap:6px;background:#123;padding:6px";
  document.querySelectorAll(".planet-prop").forEach((el,i)=>{ if(i>2) return;
    const c=el.cloneNode(true);
    c.style.cssText="position:relative;left:0;top:0;transform:none;width:"+el.style.width+";height:"+el.style.height+";overflow:hidden;outline:1px solid red";
    row.appendChild(c); });
  document.body.appendChild(row);
});
await page.waitForTimeout(200);
await page.locator("#pf").screenshot({path:path.join(SHOTS,"platform-zoom.png")});
await b.close(); srv.close();
