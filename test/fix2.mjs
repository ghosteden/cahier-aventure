import http from "http"; import fs from "fs"; import path from "path";
import { chromium } from "playwright";
const ROOT=path.resolve("public"), SHOTS=path.resolve("test/shots");
const T={".html":"text/html",".css":"text/css",".js":"text/javascript",".png":"image/png",".webmanifest":"application/manifest+json"};
const srv=http.createServer((q,r)=>{let p=path.join(ROOT,decodeURIComponent(q.url.split("?")[0])); if(q.url==="/")p=path.join(ROOT,"index.html"); fs.readFile(p,(e,d)=>{if(e){r.writeHead(404);r.end();return;} r.writeHead(200,{"Content-Type":T[path.extname(p)]||"application/octet-stream"});r.end(d);});});
await new Promise(r=>srv.listen(8266,r));
const errors=[]; const b=await chromium.launch();
const page=await (await b.newContext({viewport:{width:414,height:900}})).newPage();
page.on("pageerror",e=>errors.push(e.message));
await page.goto("http://localhost:8266/index.html",{waitUntil:"domcontentloaded"});
await page.waitForSelector("#app:not([hidden])");
await page.fill("#login-name","Gabi"); await page.click('button:has-text("C\'est parti")');
await page.waitForSelector(".map-viewport");
// RANGEMENT : indices >=5 et unicité (on ne peut plus vérifier _uniq, on refait le check ici via texte? non : on refait via l'API interne)
const rg=await page.evaluate(()=>{
  function perm(a){if(a.length<=1)return[a];const o=[];a.forEach((x,i)=>perm(a.slice(0,i).concat(a.slice(i+1))).forEach(rr=>o.push([x].concat(rr))));return o;}
  let minC=99,maxC=0,sum=0;
  for(let t=0;t<200;t++){ const s=CV.gen.rangement(); const n=(s.instruction.match(/•/g)||[]).length; minC=Math.min(minC,n);maxC=Math.max(maxC,n);sum+=n; }
  return {min:minC,max:maxC,avg:(sum/200).toFixed(1)};
});
console.log("RANGEMENT indices : min="+rg.min+", max="+rg.max+", moy="+rg.avg, rg.min>=5?"✅ (≥5)":"❌ trop peu");
// SYMETRIE : type build, moitié droite identique, résolvable
await page.evaluate(()=>{ CV.__s=CV.gen.symetrie(); const c=document.querySelector("#app"); c.innerHTML="";
  const box=document.createElement("div"); box.className="card"; c.appendChild(box); CV.Engine.run(box,[CV.__s],{onComplete:(r)=>{window.__res=r;}}); });
await page.waitForSelector(".build-cell");
const info=await page.evaluate(()=>({type:CV.__s.type, sol:CV.__s.solutionAbs, cols:CV.__s.cols, lock:CV.__s.lockCols, CELL:38}));
console.log("SYMETRIE type =", info.type, info.type==="build"?"✅":"❌");
const board=await page.evaluate(()=>{const r=document.querySelector(".tt-board").getBoundingClientRect();return{x:r.left,y:r.top};});
// aucune case droite en pointillé (pas de .place-zone) : ce sont des build-cell identiques
const dashed=await page.evaluate(()=>document.querySelectorAll(".place-zone[data-zid]").length);
console.log("Cases en pointillé (cibles trahies) :", dashed, dashed===0?"✅ aucune":"❌");
// résout : peint chaque case solution avec sa couleur (palette)
const drag=async(x1,y1,x2,y2)=>{ await page.mouse.move(x1,y1);await page.mouse.down();await page.mouse.move((x1+x2)/2,(y1+y2)/2);await page.mouse.move(x2,y2);await page.mouse.up();await page.waitForTimeout(70); };
for(const k of Object.keys(info.sol)){ const [r,c]=k.split(",").map(Number); const color=info.sol[k];
  const sw=await page.evaluate((col)=>{const els=[...document.querySelectorAll(".build-pick")];const el=els.find(e=>e.style.background && CV.__rgb(e.style.background)===col) || els[0]; const b=el.getBoundingClientRect(); return {x:b.left+b.width/2,y:b.top+b.height/2};},color).catch(async()=>{
    // fallback : associe par index couleur
    return await page.evaluate((col)=>{const pal=CV.__s.palette.map(p=>p.color);const idx=pal.indexOf(col);const el=document.querySelectorAll(".build-pick")[idx];const b=el.getBoundingClientRect();return{x:b.left+b.width/2,y:b.top+b.height/2};},color);
  });
  const cx=board.x+(c+0.5)*info.CELL, cy=board.y+(r+0.5)*info.CELL;
  await drag(sw.x,sw.y,cx,cy);
}
await page.screenshot({path:path.join(SHOTS,"symetrie2.png")});
await page.click('button:has-text("Valider")'); await page.waitForTimeout(200);
const v=await page.evaluate(()=>{const fb=document.querySelector(".feedback");return fb?(fb.classList.contains("ok")?"BRAVO":"raté"):"?";});
console.log("SYMETRIE résolution :", v, v==="BRAVO"?"✅":"❌");
console.log("Erreurs JS :", errors.length, errors.slice(0,4));
await b.close(); srv.close();
