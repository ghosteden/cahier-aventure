import http from "http"; import fs from "fs"; import path from "path";
import { chromium } from "playwright";
const ROOT=path.resolve("public"), SHOTS=path.resolve("test/shots");
const T={".html":"text/html",".css":"text/css",".js":"text/javascript",".png":"image/png",".webmanifest":"application/manifest+json"};
const srv=http.createServer((q,r)=>{let p=path.join(ROOT,decodeURIComponent(q.url.split("?")[0])); if(q.url==="/")p=path.join(ROOT,"index.html"); if(q.url.includes("/.netlify/")){r.writeHead(404);r.end();return;} fs.readFile(p,(e,d)=>{if(e){r.writeHead(404);r.end();return;} r.writeHead(200,{"Content-Type":T[path.extname(p)]||"application/octet-stream"});r.end(d);});});
await new Promise(r=>srv.listen(8250,r));
const errors=[]; const b=await chromium.launch();
const page=await (await b.newContext({viewport:{width:414,height:900}})).newPage();
page.on("pageerror",e=>errors.push("PAGEERROR: "+e.message));
await page.goto("http://localhost:8250/index.html",{waitUntil:"domcontentloaded"});
await page.waitForSelector("#app:not([hidden])");
await page.fill("#login-name","Gabi"); await page.click('button:has-text("C\'est parti")');
await page.waitForSelector(".map-viewport");
await page.evaluate(()=>{ CV.__t = CV.gen.tetrisMur(); const c=document.querySelector("#app"); c.innerHTML="";
  const box=document.createElement("div"); box.className="card"; c.appendChild(box);
  CV.Engine.run(box,[CV.__t],{onComplete:(r)=>{window.__res=r;}}); });
await page.waitForSelector(".tt-board");
const step = await page.evaluate(()=>({ CELL:34, sol:CV.__t.solution, pieces:CV.__t.pieces.map(p=>({id:p.id,cells:p.cells})) }));
// pour chaque pièce : drag depuis le tray jusqu'à la cellule cible (centre de la pièce)
for (const p of step.pieces){
  const [ar,ac]=step.sol[p.id];
  // dims
  let hr=0,wc=0; p.cells.forEach(([r,c])=>{hr=Math.max(hr,r);wc=Math.max(wc,c);}); hr++; wc++;
  const board = await page.evaluate(()=>{ const r=document.querySelector(".tt-board").getBoundingClientRect(); return {x:r.left,y:r.top}; });
  const src = await page.evaluate((pid)=>{ const els=[...document.querySelectorAll(".tt-tray .tt-piece")];
    // retrouve la pièce dans le tray par son ordre — on prend la première encore présente
    const el=els[0]; const r=el.getBoundingClientRect(); el.setAttribute("data-testpick","1"); return {x:r.left+r.width/2,y:r.top+r.height/2}; }, p.id);
  // cible : centre de la pièce sur le plateau
  const tx = board.x + (ac + wc/2)*step.CELL;
  const ty = board.y + (ar + hr/2)*step.CELL;
  await page.mouse.move(src.x, src.y);
  await page.mouse.down();
  await page.mouse.move((src.x+tx)/2, (src.y+ty)/2);
  await page.mouse.move(tx, ty);
  await page.mouse.up();
  await page.waitForTimeout(150);
}
const filled = await page.evaluate(()=>document.querySelectorAll(".tt-cell.filled").length);
const trayLeft = await page.evaluate(()=>document.querySelectorAll(".tt-tray .tt-piece").length);
console.log("Cases remplies :", filled, "| pièces restant dans le bac :", trayLeft);
await page.click('button:has-text("Valider")');
await page.waitForTimeout(300);
const verdict = await page.evaluate(()=>{ const fb=document.querySelector(".feedback"); return fb?fb.textContent.slice(0,30):"(pas de feedback)"; });
console.log("Après validation :", verdict);
await page.screenshot({path:path.join(SHOTS,"tetris-drag.png")});
console.log("Erreurs JS:", errors.length, errors.slice(0,3));
await b.close(); srv.close();
