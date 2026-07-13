import http from "http"; import fs from "fs"; import path from "path";
import { chromium } from "playwright";
const ROOT=path.resolve("public"), SHOTS=path.resolve("test/shots");
const T={".html":"text/html",".css":"text/css",".js":"text/javascript",".png":"image/png",".webmanifest":"application/manifest+json"};
const srv=http.createServer((q,r)=>{let p=path.join(ROOT,decodeURIComponent(q.url.split("?")[0])); if(q.url==="/")p=path.join(ROOT,"index.html"); if(q.url.includes("/.netlify/")){r.writeHead(404);r.end();return;} fs.readFile(p,(e,d)=>{if(e){r.writeHead(404);r.end();return;} r.writeHead(200,{"Content-Type":T[path.extname(p)]||"application/octet-stream"});r.end(d);});});
await new Promise(r=>srv.listen(8238,r));
const errors=[]; const b=await chromium.launch();
const page=await (await b.newContext({viewport:{width:414,height:900}})).newPage();
page.on("pageerror",e=>errors.push("PAGEERROR: "+e.message));
await page.goto("http://localhost:8238/index.html",{waitUntil:"domcontentloaded"});
await page.waitForSelector("#app:not([hidden])");
await page.fill("#login-name","Gabi"); await page.click('button:has-text("C\'est parti")');
await page.waitForSelector(".map-viewport");
await page.evaluate(()=>{const s=CV.Store.current(); s.currentDay=45; s.heroWorld=4; CV.Store.save();});
await page.reload({waitUntil:"domcontentloaded"});
await page.waitForSelector(".map-viewport");

const PLANETS=[[5,"saturne"],[6,"uranus"],[7,"neptune"]];
for(const [idx,name] of PLANETS){
  await page.evaluate(()=>{ CV.drawMix=()=>Array.from({length:14},()=>({type:"qcm",q:"2+2 ?",choices:["4","5","6"],answer:0})); });
  await page.waitForTimeout(300);
  await page.evaluate((i)=>document.querySelectorAll(".planet-hit")[i].click(), idx);
  await page.waitForSelector(".node-sheet");
  await page.click('.node-sheet button:has-text("Jouer"), .node-sheet button:has-text("Rejouer")');
  await page.waitForSelector(".planet-stage"); await page.waitForTimeout(400);
  console.log("\n=== "+name.toUpperCase()+" ===");
  // 3 bonnes réponses
  for(let i=0;i<3;i++){ await page.locator(".choice").first().click(); await page.waitForTimeout(1200); }
  let s=await page.evaluate(()=>{
    const t=document.querySelector(".planet-hero .hero-token");
    return { etape:document.querySelector(".planet-steps").textContent.trim(),
      pose:(document.querySelector(".planet-hero .hero-strip").style.backgroundImage.match(/hero-espace-[a-z-]+/)||["?"])[0],
      angle:t.style.transform };
  });
  console.log("  après 3 bonnes réponses :", s.etape, "| pose :", s.pose, "| orientation :", s.angle);
  await page.screenshot({path:path.join(SHOTS,"p3-"+name+".png")});
  // 1 mauvaise réponse
  await page.locator(".choice").nth(1).click();
  await page.waitForTimeout(300);
  const cont=page.locator('button:has-text("compris")').first();
  if(await cont.count() && await cont.isVisible()) await cont.click();
  await page.waitForTimeout(1300);
  s=await page.evaluate(()=>document.querySelector(".planet-steps").textContent.trim());
  console.log("  après 1 erreur          :", s);
  await page.click('.backbar button, button:has-text("Carte")').catch(()=>{});
  await page.evaluate(()=>{ location.hash="#/carte"; });
  await page.waitForSelector(".map-viewport"); await page.waitForTimeout(400);
}
console.log("\nErreurs JS:", errors.length, errors.slice(0,4));
await b.close(); srv.close();
