import http from "http"; import fs from "fs"; import path from "path";
import { chromium, devices } from "playwright";
const ROOT=path.resolve("public");
const T={".html":"text/html",".css":"text/css",".js":"text/javascript",".png":"image/png",".webmanifest":"application/manifest+json"};
const srv=http.createServer((q,r)=>{let p=path.join(ROOT,decodeURIComponent(q.url.split("?")[0])); if(q.url==="/")p=path.join(ROOT,"index.html"); fs.readFile(p,(e,d)=>{if(e){r.writeHead(404);r.end();return;} r.writeHead(200,{"Content-Type":T[path.extname(p)]||"application/octet-stream"});r.end(d);});});
await new Promise(r=>srv.listen(8259,r));
const errors=[]; const b=await chromium.launch();
async function run(label, touch){
  const ctx = touch ? await b.newContext({ ...devices["Pixel 5"] }) : await b.newContext({viewport:{width:414,height:900}});
  const page=await ctx.newPage();
  page.on("pageerror",e=>errors.push(label+": "+e.message));
  await page.goto("http://localhost:8259/index.html",{waitUntil:"domcontentloaded"});
  await page.waitForSelector("#app:not([hidden])");
  await page.fill("#login-name","Gabi"); await page.click('button:has-text("C\'est parti")');
  await page.waitForSelector(".map-viewport");
  await page.evaluate(()=>{ CV.__c=CV.gen.construction(); const c=document.querySelector("#app"); c.innerHTML="";
    const box=document.createElement("div"); box.className="card"; c.appendChild(box); CV.Engine.run(box,[CV.__c],{onComplete:(r)=>{window.__res=r;}}); });
  await page.waitForSelector(".build-cell");
  const info = await page.evaluate(()=>({ sol:CV.__c.solution, palette:CV.__c.palette, CELL:38, rows:CV.__c.rows, cols:CV.__c.cols }));
  const board = await page.evaluate(()=>{const r=document.querySelector(".tt-board").getBoundingClientRect();return{x:r.left,y:r.top};});
  // pose chaque couleur de la solution (décalée de +1,+1 pour être bien dans la grille)
  const drag=async(x1,y1,x2,y2)=>{ if(touch){ await page.evaluate(([a,bb,c,d])=>{const t=document.elementFromPoint(a,bb);const pe=(t2,x,y,tg)=>(tg||document.elementFromPoint(x,y)||document.body).dispatchEvent(new PointerEvent(t2,{pointerId:1,pointerType:"touch",clientX:x,clientY:y,bubbles:true,cancelable:true,buttons:1}));pe("pointerdown",a,bb,t);pe("pointermove",(a+c)/2,(bb+d)/2);pe("pointermove",c,d);pe("pointerup",c,d);},[x1,y1,x2,y2]);} else { await page.mouse.move(x1,y1);await page.mouse.down();await page.mouse.move((x1+x2)/2,(y1+y2)/2);await page.mouse.move(x2,y2);await page.mouse.up(); } await page.waitForTimeout(90); };
  const palOf = (hex)=>info.palette.findIndex(p=>p.color===hex);
  for (const k of Object.keys(info.sol)){
    const [dr,dc]=k.split(",").map(Number);
    const color=info.sol[k];
    const pi=palOf(color);
    const sw = await page.evaluate((i)=>{const el=document.querySelectorAll(".build-pick")[i];const r=el.getBoundingClientRect();return{x:r.left+r.width/2,y:r.top+r.height/2};},pi);
    const tx=board.x+(dc+1+0.5)*info.CELL, ty=board.y+(dr+1+0.5)*info.CELL;
    await drag(sw.x,sw.y,tx,ty);
  }
  const filled = await page.evaluate(()=>document.querySelectorAll(".build-cell.filled").length);
  await page.click('button:has-text("Valider")'); await page.waitForTimeout(250);
  const verdict = await page.evaluate(()=>{const fb=document.querySelector(".feedback");return fb?(fb.classList.contains("ok")?"BRAVO":"raté"):"(rien)";});
  console.log(label+" : "+filled+" briques posées → "+verdict, verdict==="BRAVO"?"✅":"❌");
  await ctx.close();
}
await run("SOURIS ", false);
await run("TACTILE", true);
console.log("Erreurs JS :", errors.length, errors.slice(0,3));
await b.close(); srv.close();
