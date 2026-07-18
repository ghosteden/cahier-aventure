import http from "http"; import fs from "fs"; import path from "path";
import { chromium } from "playwright";
const ROOT=path.resolve("public"), SHOTS=path.resolve("test/shots");
const T={".html":"text/html",".css":"text/css",".js":"text/javascript",".png":"image/png",".webmanifest":"application/manifest+json"};
const srv=http.createServer((q,r)=>{let p=path.join(ROOT,decodeURIComponent(q.url.split("?")[0])); if(q.url==="/")p=path.join(ROOT,"index.html"); fs.readFile(p,(e,d)=>{if(e){r.writeHead(404);r.end();return;} r.writeHead(200,{"Content-Type":T[path.extname(p)]||"application/octet-stream"});r.end(d);});});
await new Promise(r=>srv.listen(8264,r));
const errors=[]; const b=await chromium.launch();
const page=await (await b.newContext({viewport:{width:414,height:900}})).newPage();
page.on("pageerror",e=>errors.push(e.message));
await page.goto("http://localhost:8264/index.html",{waitUntil:"domcontentloaded"});
await page.waitForSelector("#app:not([hidden])");
await page.fill("#login-name","Gabi"); await page.click('button:has-text("C\'est parti")');
await page.waitForSelector(".map-viewport");
async function loadGame(gen){ await page.evaluate((g)=>{ CV.__g=CV.gen[g](); const c=document.querySelector("#app"); c.innerHTML="";
  const box=document.createElement("div"); box.className="card"; c.appendChild(box); CV.Engine.run(box,[CV.__g],{onComplete:(r)=>{window.__res=r;}}); }, gen); }
const drag=async(x1,y1,x2,y2)=>{ await page.mouse.move(x1,y1);await page.mouse.down();await page.mouse.move((x1+x2)/2,(y1+y2)/2);await page.mouse.move(x2,y2);await page.mouse.up();await page.waitForTimeout(80); };

// 1) SUITE (place/sequence, palette) : le bac garde ses 3 étiquettes après placement
await loadGame("suiteMotifs"); await page.waitForSelector(".place-tray");
let trayBefore=await page.locator(".place-tray .place-piece").count();
const pc=await page.locator(".place-tray .place-piece").first().boundingBox();
const zone=await page.locator(".place-zone[data-zid]").first().boundingBox();
await drag(pc.x+pc.width/2,pc.y+pc.height/2,zone.x+zone.width/2,zone.y+zone.height/2);
let trayAfter=await page.locator(".place-tray .place-piece").count();
console.log("SUITE  : bac avant="+trayBefore+" après placement="+trayAfter, trayBefore===trayAfter?"✅ bac persistant":"❌ vidé");

// 2) COORD (repère) : toutes les cases sont des cases identiques droppables + résolution
await loadGame("reproduction"); await page.waitForSelector(".coord-cell");
const cells=await page.locator(".coord-cell").count();
const droppable=await page.locator(".coord-cell[data-k]").count();
console.log("COORD  : cases="+cells+" toutes droppables="+droppable, cells===droppable?"✅ aucune différenciation":"❌");
// résout via solution
const sol=await page.evaluate(()=>CV.__g.solution);
for(const k of Object.keys(sol)){ const [r,c]=k.split(",").map(Number); const glyph=sol[k];
  const pick=await page.evaluate((g)=>{const el=[...document.querySelectorAll(".coord-pick")].find(e=>e.textContent===g);const b=el.getBoundingClientRect();return{x:b.left+b.width/2,y:b.top+b.height/2};},glyph);
  const cell=await page.evaluate((k)=>{const el=document.querySelector('.coord-cell[data-k="'+k+'"]');const b=el.getBoundingClientRect();return{x:b.left+b.width/2,y:b.top+b.height/2};},k);
  await drag(pick.x,pick.y,cell.x,cell.y);
}
const trayCoord=await page.locator(".coord-pick").count();
await page.click('button:has-text("Valider")'); await page.waitForTimeout(200);
let verdict=await page.evaluate(()=>{const fb=document.querySelector(".feedback");return fb?(fb.classList.contains("ok")?"BRAVO":"raté"):"?";});
console.log("COORD  : bac après placement="+trayCoord+" (doit rester "+ (await page.evaluate(()=>CV.__g.palette.length)) +") → résolution="+verdict, verdict==="BRAVO"?"✅":"❌");
await page.screenshot({path:path.join(SHOTS,"coord.png")});

// 3) SYMETRIE (palette couleurs) + DOUBLE ENTREE : bac persistant, résolvables
for(const g of ["symetrie","doubleEntry"]){
  await loadGame(g); await page.waitForSelector(".place-tray");
  const tb=await page.locator(".place-tray .place-piece").count();
  // place une pièce
  const p0=await page.locator(".place-tray .place-piece").first().boundingBox();
  const z0=await page.locator(".place-zone[data-zid]").first().boundingBox();
  await drag(p0.x+p0.width/2,p0.y+p0.height/2,z0.x+z0.width/2,z0.y+z0.height/2);
  const ta=await page.locator(".place-tray .place-piece").count();
  console.log(g.toUpperCase().padEnd(7)+": bac "+tb+"→"+ta, tb===ta?"✅ persistant":"❌");
}
console.log("Erreurs JS :", errors.length, errors.slice(0,4));
await b.close(); srv.close();
