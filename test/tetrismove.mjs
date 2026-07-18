import http from "http"; import fs from "fs"; import path from "path";
import { chromium, devices } from "playwright";
const ROOT=path.resolve("public");
const T={".html":"text/html",".css":"text/css",".js":"text/javascript",".png":"image/png",".webmanifest":"application/manifest+json"};
const srv=http.createServer((q,r)=>{let p=path.join(ROOT,decodeURIComponent(q.url.split("?")[0])); if(q.url==="/")p=path.join(ROOT,"index.html"); fs.readFile(p,(e,d)=>{if(e){r.writeHead(404);r.end();return;} r.writeHead(200,{"Content-Type":T[path.extname(p)]||"application/octet-stream"});r.end(d);});});
await new Promise(r=>srv.listen(8257,r));
const errors=[]; const b=await chromium.launch();
async function run(label, touch){
  const ctx = touch ? await b.newContext({ ...devices["Pixel 5"] }) : await b.newContext({viewport:{width:414,height:900}});
  const page = await ctx.newPage();
  page.on("pageerror",e=>errors.push(label+": "+e.message));
  await page.goto("http://localhost:8257/index.html",{waitUntil:"domcontentloaded"});
  await page.waitForSelector("#app:not([hidden])");
  await page.fill("#login-name","Gabi"); await page.click('button:has-text("C\'est parti")');
  await page.waitForSelector(".map-viewport");
  await page.evaluate(()=>{ CV.__t=CV.gen.tetrisForme(); const c=document.querySelector("#app"); c.innerHTML="";
    const box=document.createElement("div"); box.className="card"; c.appendChild(box); CV.Engine.run(box,[CV.__t],{onComplete:()=>{}}); });
  await page.waitForSelector(".tt-board");
  const CELL=34;
  // place la 1re piece du bac a un endroit valide
  const p1 = await page.evaluate(()=>{ const t=CV.__t,R=t.rows,C=t.cols,target=new Set(t.target),pc=t.pieces[0];
    for(let r=0;r<R;r++)for(let c=0;c<C;c++) if(pc.cells.every(([dr,dc])=>target.has((r+dr)+","+(c+dc)))){ let hr=0,wc=0;pc.cells.forEach(([a,bb])=>{hr=Math.max(hr,a);wc=Math.max(wc,bb)}); return {r,c,hr:hr+1,wc:wc+1}; } });
  const board = await page.evaluate(()=>{const r=document.querySelector(".tt-board").getBoundingClientRect();return{x:r.left,y:r.top};});
  const src = await page.evaluate(()=>{const el=document.querySelector(".tt-tray .tt-piece");const r=el.getBoundingClientRect();return{x:r.left+r.width/2,y:r.top+r.height/2};});
  const drag=async(x1,y1,x2,y2)=>{ if(touch){ await page.evaluate(([a,bb,c,d])=>{const t=document.elementFromPoint(a,bb);const pe=(t2,x,y,tg)=>(tg||document.elementFromPoint(x,y)||document.body).dispatchEvent(new PointerEvent(t2,{pointerId:1,pointerType:"touch",clientX:x,clientY:y,bubbles:true,cancelable:true,buttons:1}));pe("pointerdown",a,bb,t);pe("pointermove",(a+c)/2,(bb+d)/2);pe("pointermove",c,d);pe("pointerup",c,d);},[x1,y1,x2,y2]);} else { await page.mouse.move(x1,y1);await page.mouse.down();await page.mouse.move((x1+x2)/2,(y1+y2)/2);await page.mouse.move(x2,y2);await page.mouse.up(); } await page.waitForTimeout(120); };
  const t1x=board.x+(p1.c+p1.wc/2)*CELL, t1y=board.y+(p1.r+p1.hr/2)*CELL;
  await drag(src.x,src.y,t1x,t1y);
  const afterPlace = await page.evaluate(()=>document.querySelectorAll(".tt-cell.filled").length);
  // reprend la piece posee (depuis une case pleine) et la deplace ailleurs
  const filledCell = await page.evaluate(()=>{const e=document.querySelector(".tt-cell.filled");const r=e.getBoundingClientRect();return{x:r.left+r.width/2,y:r.top+r.height/2};});
  const p2 = await page.evaluate(()=>{ const t=CV.__t,R=t.rows,C=t.cols,target=new Set(t.target),pc=t.pieces[0];
    // autre emplacement valide different
    for(let r=R-1;r>=0;r--)for(let c=C-1;c>=0;c--) if(pc.cells.every(([dr,dc])=>target.has((r+dr)+","+(c+dc)))){let hr=0,wc=0;pc.cells.forEach(([a,bb])=>{hr=Math.max(hr,a);wc=Math.max(wc,bb)});return{r,c,hr:hr+1,wc:wc+1};} });
  const t2x=board.x+(p2.c+p2.wc/2)*CELL, t2y=board.y+(p2.r+p2.hr/2)*CELL;
  await drag(filledCell.x,filledCell.y,t2x,t2y);
  const afterMove = await page.evaluate(()=>document.querySelectorAll(".tt-cell.filled").length);
  const trayCount = await page.evaluate(()=>document.querySelectorAll(".tt-tray .tt-piece").length);
  console.log(label+" : posée="+afterPlace+" cases, après reprise+redépôt="+afterMove+" cases, bac="+trayCount, (afterPlace>0&&afterMove===afterPlace)?"✅ repositionnable":"❌");
  await ctx.close();
}
await run("SOURIS ", false);
await run("TACTILE", true);
console.log("Erreurs JS :", errors.length, errors.slice(0,3));
await b.close(); srv.close();
