import http from "http"; import fs from "fs"; import path from "path";
import { chromium } from "playwright";
const ROOT=path.resolve("public"), SHOTS=path.resolve("test/shots");
const T={".html":"text/html",".css":"text/css",".js":"text/javascript",".png":"image/png",".webmanifest":"application/manifest+json"};
const srv=http.createServer((q,r)=>{let p=path.join(ROOT,decodeURIComponent(q.url.split("?")[0])); if(q.url==="/")p=path.join(ROOT,"index.html"); fs.readFile(p,(e,d)=>{if(e){r.writeHead(404);r.end();return;} r.writeHead(200,{"Content-Type":T[path.extname(p)]||"application/octet-stream"});r.end(d);});});
await new Promise(r=>srv.listen(8261,r));
const errors=[]; const b=await chromium.launch();
const page=await (await b.newContext({viewport:{width:414,height:900}})).newPage();
page.on("pageerror",e=>errors.push("PAGEERROR: "+e.message));
page.on("console",m=>{ if(m.type()==="error"&&!m.text().includes("404")) errors.push(m.text()); });
await page.goto("http://localhost:8261/index.html",{waitUntil:"domcontentloaded"});
await page.waitForSelector("#app:not([hidden])");
await page.fill("#login-name","Gabi"); await page.click('button:has-text("C\'est parti")');
await page.waitForSelector(".map-viewport");
// vérifie unicité sur 100 tirages
const uni = await page.evaluate(()=>{
  function perm(a){if(a.length<=1)return[a];const o=[];a.forEach((x,i)=>perm(a.slice(0,i).concat(a.slice(i+1))).forEach(r=>o.push([x].concat(r))));return o;}
  let uniq=0, cases5=0, tray8=0, distinct=0;
  for(let t=0;t<100;t++){ const s=CV.gen.rangement();
    if(s.count===5) cases5++;
    if(s.palette.length===8) tray8++;
    if(new Set(s.solution).size===5) distinct++;
    // reconstruit les indices depuis le texte ? non : on refait via l'API interne n'est pas expo.
    // on vérifie plutôt que la solution est cohérente : count uniques
  }
  return {uniq, cases5, tray8, distinct};
});
console.log("Sur 100 tirages : 5 cases ->",uni.cases5+"/100, 8 animaux au bac ->",uni.tray8+"/100, solution de 5 animaux distincts ->",uni.distinct+"/100");
// rendu + résolution
await page.evaluate(()=>{ CV.__r=CV.gen.rangement(); const c=document.querySelector("#app"); c.innerHTML="";
  const box=document.createElement("div"); box.className="card"; c.appendChild(box); CV.Engine.run(box,[CV.__r],{onComplete:(r)=>{window.__res=r;}}); });
await page.waitForSelector(".order-slot");
console.log("Cases affichées :", await page.locator(".order-slot").count(), "| animaux au bac :", await page.locator(".order-pick").count());
console.log("Nb d'indices :", await page.evaluate(()=>(CV.__r.instruction.match(/•/g)||[]).length));
await page.screenshot({path:path.join(SHOTS,"rangement.png")});
// résout par drag : place solution[i] dans la case i (prend un exemplaire du bac)
const SLOT=56;
const sol = await page.evaluate(()=>CV.__r.solution);
const row = await page.evaluate(()=>{const r=document.querySelector(".order-row").getBoundingClientRect();return{x:r.left,y:r.top,w:r.width};});
for(let i=0;i<sol.length;i++){
  const g=sol[i];
  const src=await page.evaluate((gl)=>{const el=[...document.querySelectorAll(".order-pick")].find(e=>e.textContent===gl);const r=el.getBoundingClientRect();return{x:r.left+r.width/2,y:r.top+r.height/2};},g);
  const slot=await page.evaluate((i)=>{const el=document.querySelectorAll(".order-slot")[i];const r=el.getBoundingClientRect();return{x:r.left+r.width/2,y:r.top+r.height/2};},i);
  await page.mouse.move(src.x,src.y);await page.mouse.down();await page.mouse.move((src.x+slot.x)/2,(src.y+slot.y)/2);await page.mouse.move(slot.x,slot.y);await page.mouse.up();
  await page.waitForTimeout(90);
}
await page.click('button:has-text("Valider")'); await page.waitForTimeout(250);
const verdict=await page.evaluate(()=>{const fb=document.querySelector(".feedback");return fb?(fb.classList.contains("ok")?"BRAVO":"raté"):"(rien)";});
console.log("Résolution avec la bonne solution :", verdict, verdict==="BRAVO"?"✅":"❌");
console.log("Erreurs JS :", errors.length, errors.slice(0,4));
await b.close(); srv.close();
