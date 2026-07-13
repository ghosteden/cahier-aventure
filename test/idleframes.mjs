import http from "http"; import fs from "fs"; import path from "path";
import { chromium } from "playwright";
const ROOT=path.resolve("public"), SHOTS=path.resolve("test/shots");
const T={".html":"text/html",".css":"text/css",".js":"text/javascript",".png":"image/png",".webmanifest":"application/manifest+json"};
const srv=http.createServer((q,r)=>{let p=path.join(ROOT,decodeURIComponent(q.url.split("?")[0])); if(q.url==="/")p=path.join(ROOT,"index.html"); if(q.url.includes("/.netlify/")){r.writeHead(404);r.end();return;} fs.readFile(p,(e,d)=>{if(e){r.writeHead(404);r.end();return;} r.writeHead(200,{"Content-Type":T[path.extname(p)]||"application/octet-stream"});r.end(d);});});
await new Promise(r=>srv.listen(8225,r));
const b=await chromium.launch();
const page=await (await b.newContext({viewport:{width:414,height:900}})).newPage();
await page.goto("http://localhost:8225/index.html",{waitUntil:"domcontentloaded"});
await page.waitForSelector("#app:not([hidden])");
await page.fill("#login-name","Gabi"); await page.click('button:has-text("C\'est parti")');
await page.waitForSelector(".map-viewport");
await page.evaluate(()=>{const s=CV.Store.current(); s.currentDay=36; CV.Store.save(); location.reload();});
await page.waitForSelector(".map-viewport"); await page.waitForTimeout(500);
await page.locator(".stone.current").click({force:true});
await page.waitForSelector(".node-sheet");
await page.click('.node-sheet button:has-text("Affronter")');
await page.waitForSelector(".combat-scene"); await page.waitForTimeout(300);
// fige l'idle image par image, et colle les 8 côte à côte
await page.evaluate(()=>{
  const tok=document.querySelector(".boss-token"); const strip=tok.querySelector(".hero-strip");
  strip.style.animation="none";
  const row=document.createElement("div");
  row.id="row"; row.style.cssText="position:fixed;left:0;top:0;z-index:9999;display:flex;background:#fff;padding:4px";
  for(let i=0;i<8;i++){
    const c=tok.cloneNode(true); c.style.transform="none";
    c.querySelector(".hero-strip").style.transform="translateX(-"+(100*i/8)+"%)";
    c.style.outline="1px solid red"; row.appendChild(c);
  }
  document.body.appendChild(row);
});
await page.waitForTimeout(200);
await page.locator("#row").screenshot({path:path.join(SHOTS,"idle-frames.png")});
await b.close(); srv.close(); console.log("ok");
