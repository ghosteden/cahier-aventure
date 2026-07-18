import http from "http"; import fs from "fs"; import path from "path";
import { chromium, devices } from "playwright";
const ROOT=path.resolve("public");
const T={".html":"text/html",".css":"text/css",".js":"text/javascript",".png":"image/png",".webmanifest":"application/manifest+json"};
const srv=http.createServer((q,r)=>{let p=path.join(ROOT,decodeURIComponent(q.url.split("?")[0])); if(q.url==="/")p=path.join(ROOT,"index.html"); fs.readFile(p,(e,d)=>{if(e){r.writeHead(404);r.end();return;} r.writeHead(200,{"Content-Type":T[path.extname(p)]||"application/octet-stream"});r.end(d);});});
await new Promise(r=>srv.listen(8256,r));
const errors=[]; const b=await chromium.launch();
// contexte tactile facon telephone
const ctx=await b.newContext({ ...devices["Pixel 5"] });
const page=await ctx.newPage();
page.on("pageerror",e=>errors.push("PAGEERROR: "+e.message));
await page.goto("http://localhost:8256/index.html",{waitUntil:"domcontentloaded"});
await page.waitForSelector("#app:not([hidden])");
await page.fill("#login-name","Gabi"); await page.tap('button:has-text("C\'est parti")');
await page.waitForSelector(".map-viewport");
// affiche le jeu "remplis la forme"
await page.evaluate(()=>{ CV.__t = CV.gen.tetrisForme(); const c=document.querySelector("#app"); c.innerHTML="";
  const box=document.createElement("div"); box.className="card"; c.appendChild(box);
  CV.Engine.run(box,[CV.__t],{onComplete:(r)=>{window.__res=r;}}); });
await page.waitForSelector(".tt-board");
const ta = await page.evaluate(()=>getComputedStyle(document.querySelector(".tt-piece")).touchAction);
console.log("touch-action sur les pieces :", ta, ta==="none"?"✅":"❌ (le scroll annulera le drag)");
// drag tactile : place chaque piece a un emplacement valide (balayage)
const CELL=34;
const ids = await page.evaluate(()=>CV.__t.pieces.map(p=>p.id));
for (let k=0;k<ids.length;k++){
  const p = await page.evaluate(()=>{ const t=CV.__t, R=t.rows,C=t.cols,target=new Set(t.target),owner=window.__owner||{};
    const pc=t.pieces.find(x=>!window.__placed || !window.__placed[x.id]);
    // trouve un emplacement libre pour la 1re piece du bac
    for(let r=0;r<R;r++)for(let c=0;c<C;c++){ if(pc.cells.every(([dr,dc])=>{const kk=(r+dr)+","+(c+dc);return target.has(kk)&&!owner[kk]})){
      window.__owner=owner; pc.cells.forEach(([dr,dc])=>owner[(r+dr)+","+(c+dc)]=1); window.__placed=(window.__placed||{}); window.__placed[pc.id]=1;
      let hr=0,wc=0; pc.cells.forEach(([a,bb])=>{hr=Math.max(hr,a);wc=Math.max(wc,bb)}); return {r,c,hr:hr+1,wc:wc+1}; } }
    return null; });
  if(!p) break;
  const board = await page.evaluate(()=>{ const r=document.querySelector(".tt-board").getBoundingClientRect(); return {x:r.left,y:r.top}; });
  const src = await page.evaluate(()=>{ const el=document.querySelector(".tt-tray .tt-piece"); const r=el.getBoundingClientRect(); return {x:r.left+r.width/2,y:r.top+r.height/2}; });
  const tx=board.x+(p.c+p.wc/2)*CELL, ty=board.y+(p.r+p.hr/2)*CELL;
  // séquence tactile réelle
  await page.touchscreen.tap(src.x, src.y).catch(()=>{});
  await page.evaluate(([sx,sy,mx,my,ex,ey])=>{
    const el=document.querySelector(".tt-tray .tt-piece");
    const pe=(t,x,y)=>el.dispatchEvent(new PointerEvent(t,{pointerId:1,pointerType:"touch",clientX:x,clientY:y,bubbles:true,cancelable:true,buttons:1}));
    pe("pointerdown",sx,sy); pe("pointermove",mx,my); pe("pointermove",ex,ey); pe("pointerup",ex,ey);
  },[src.x,src.y,(src.x+tx)/2,(src.y+ty)/2,tx,ty]);
  await page.waitForTimeout(150);
}
const filled = await page.evaluate(()=>document.querySelectorAll(".tt-cell.filled").length);
const target = await page.evaluate(()=>CV.__t.target.length);
console.log("Cases remplies au doigt :", filled+"/"+target, filled===target?"✅ forme complétée":"⚠️");
console.log("Erreurs JS :", errors.length, errors.slice(0,3));
await b.close(); srv.close();
