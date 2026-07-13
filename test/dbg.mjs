import http from "http"; import fs from "fs"; import path from "path";
import { chromium } from "playwright";
const ROOT=path.resolve("public");
const T={".html":"text/html",".css":"text/css",".js":"text/javascript",".png":"image/png",".webmanifest":"application/manifest+json"};
const srv=http.createServer((q,r)=>{let p=path.join(ROOT,decodeURIComponent(q.url.split("?")[0])); if(q.url==="/")p=path.join(ROOT,"index.html"); if(q.url.includes("/.netlify/")){r.writeHead(404);r.end();return;} fs.readFile(p,(e,d)=>{if(e){r.writeHead(404);r.end();return;} r.writeHead(200,{"Content-Type":T[path.extname(p)]||"application/octet-stream"});r.end(d);});});
await new Promise(r=>srv.listen(8235,r));
const errors=[]; const b=await chromium.launch();
const page=await (await b.newContext({viewport:{width:414,height:900}})).newPage();
page.on("pageerror",e=>errors.push("PAGEERROR: "+e.message));
page.on("console",m=>{ if(m.type()==="error") errors.push("CONSOLE: "+m.text()); });
await page.goto("http://localhost:8235/index.html",{waitUntil:"domcontentloaded"});
await page.waitForSelector("#app:not([hidden])");
await page.fill("#login-name","Gabi"); await page.click('button:has-text("C\'est parti")');
await page.waitForSelector(".map-viewport");
await page.evaluate(()=>{const s=CV.Store.current(); s.currentDay=40; s.heroWorld=4; s.heroNode={4:3}; CV.Store.save();});
await page.reload({waitUntil:"domcontentloaded"});
await page.waitForSelector(".map-viewport"); await page.waitForTimeout(1200);
const info=await page.evaluate(()=>{
  const s=CV.Store.current();
  return { currentDay:s.currentDay, heroWorld:s.heroWorld,
    mondeAffiche:(document.querySelector(".cb-wname")||{}).textContent,
    pierres:document.querySelectorAll(".stone").length,
    numeros:[...document.querySelectorAll(".stone-num")].map(e=>e.textContent).join(" ") };
});
console.log(info);
console.log("Erreurs:", errors.slice(0,4));
await b.close(); srv.close();
