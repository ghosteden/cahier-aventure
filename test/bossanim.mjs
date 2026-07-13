import http from "http"; import fs from "fs"; import path from "path";
import { chromium } from "playwright";
const ROOT=path.resolve("public"), SHOTS=path.resolve("test/shots");
const T={".html":"text/html",".css":"text/css",".js":"text/javascript",".png":"image/png",".webmanifest":"application/manifest+json"};
const srv=http.createServer((q,r)=>{let p=path.join(ROOT,decodeURIComponent(q.url.split("?")[0])); if(q.url==="/")p=path.join(ROOT,"index.html"); if(q.url.includes("/.netlify/")){r.writeHead(404);r.end();return;} fs.readFile(p,(e,d)=>{if(e){r.writeHead(404);r.end();return;} r.writeHead(200,{"Content-Type":T[path.extname(p)]||"application/octet-stream"});r.end(d);});});
await new Promise(r=>srv.listen(8224,r));
const b=await chromium.launch();
const page=await (await b.newContext({viewport:{width:414,height:900}})).newPage();
await page.goto("http://localhost:8224/index.html",{waitUntil:"domcontentloaded"});
await page.waitForSelector("#app:not([hidden])");
await page.fill("#login-name","Gabi"); await page.click('button:has-text("C\'est parti")');
await page.waitForSelector(".map-viewport");
await page.evaluate(()=>{const s=CV.Store.current(); s.currentDay=36; CV.Store.save(); location.reload();});
await page.waitForSelector(".map-viewport"); await page.waitForTimeout(500);
await page.locator(".stone.current").click({force:true});
await page.waitForSelector(".node-sheet");
await page.click('.node-sheet button:has-text("Affronter")');
await page.waitForSelector(".combat-scene");
await page.waitForTimeout(400);
// force chaque pose et fige-la sur son image du milieu pour la photographier
for (const mode of ["idle","attack","hit","death"]) {
  await page.evaluate((m)=>{
    const strip=document.querySelector(".boss-token .hero-strip");
    const anim=CV.WORLDS[3].bossAnim[m];
    strip.style.animation="none";
    strip.style.width=(anim.frames*100)+"%";
    strip.style.backgroundImage="url("+anim.strip+")";
    const mid = Math.floor(anim.frames/2);
    strip.style.transform="translateX(-"+(100*mid/anim.frames)+"%)";
  }, mode);
  await page.waitForTimeout(200);
  await page.locator(".combat-scene").screenshot({path:path.join(SHOTS,"anim-pirate-"+mode+".png")});
}
await b.close(); srv.close();
console.log("captures ok");
