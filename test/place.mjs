import http from "http"; import fs from "fs"; import path from "path";
import { chromium } from "playwright";
const ROOT=path.resolve("public"); const SHOTS=path.resolve("test/shots"); fs.mkdirSync(SHOTS,{recursive:true});
const T={ ".html":"text/html",".css":"text/css",".js":"text/javascript",".svg":"image/svg+xml",".png":"image/png",".webmanifest":"application/manifest+json" };
const srv=http.createServer((req,res)=>{ let p=path.join(ROOT,decodeURIComponent(req.url.split("?")[0])); if(req.url==="/")p=path.join(ROOT,"index.html"); if(req.url.includes("/.netlify/")){res.writeHead(404);res.end();return;} fs.readFile(p,(e,d)=>{ if(e){res.writeHead(404);res.end();return;} res.writeHead(200,{"Content-Type":T[path.extname(p)]||"application/octet-stream"});res.end(d);});});
await new Promise(r=>srv.listen(8213,r));
const errors=[]; const b=await chromium.launch();
const page=await (await b.newContext({viewport:{width:414,height:820}})).newPage();
page.on("pageerror",e=>errors.push("PAGEERROR: "+e.message));
page.on("console",m=>{ if(m.type()==="error"&&!m.text().includes("404")) errors.push(m.text()); });
async function center(sel,filter){ return await page.$$eval(sel, (els,f)=>{ const e = f? els.find(x=>x.textContent.trim()===f) : els[0]; const r=e.getBoundingClientRect(); return {x:r.x+r.width/2,y:r.y+r.height/2}; }, filter); }
try{
  await page.goto("http://localhost:8213/index.html",{waitUntil:"domcontentloaded"});
  await page.waitForSelector("#app"); await page.waitForTimeout(300);
  // ---- SUITE DE MOTIFS (réponse connue = 🔵) ----
  await page.evaluate(()=>{
    const app=document.getElementById("app"); app.removeAttribute("hidden"); app.innerHTML="";
    const box=document.createElement("div"); app.appendChild(box); window.__r=null;
    CV.Engine.run(box,[{type:"place",layout:"sequence",q:"Continue la suite.",instruction:"Glisse la bonne image.",
      sequence:[{glyph:"🔴"},{glyph:"🔵"},{glyph:"🔴"},{glyph:"🔵"},{glyph:"🔴"},{zoneId:"z0"}],
      zones:[{id:"z0",expect:"🔵"}],
      pieces:[{id:"p0",key:"🔴",glyph:"🔴"},{id:"p1",key:"🔵",glyph:"🔵"},{id:"p2",key:"⭐",glyph:"⭐"}]}],
      {compact:true,onComplete:r=>window.__r=r});
  });
  await page.waitForSelector(".place-tray .place-piece");
  await page.screenshot({path:path.join(SHOTS,"place-01-suite.png")});
  const from = await center(".place-tray .place-piece","🔵");
  const to = await center(".place-zone");
  await page.mouse.move(from.x,from.y); await page.mouse.down();
  await page.mouse.move(to.x,to.y,{steps:12}); await page.mouse.up();
  await page.waitForTimeout(150);
  await page.click('button:has-text("Valider")'); await page.waitForTimeout(150);
  const fb=await page.locator(".feedback").first().innerText().catch(()=>"(rien)");
  console.log("SUITE → feedback:", fb.split("\n")[0]);
  // ---- TABLEAU DOUBLE ENTRÉE (rendu) ----
  await page.evaluate(()=>{
    const app=document.getElementById("app"); app.innerHTML="";
    const box=document.createElement("div"); app.appendChild(box);
    CV.Engine.run(box,[CV.gen.doubleEntry()],{compact:true,onComplete:()=>{}});
  });
  await page.waitForSelector(".place-grid");
  const cells=await page.locator(".place-grid .place-zone").count();
  const tiles=await page.locator(".place-tray .place-piece").count();
  console.log("DOUBLE ENTRÉE → cases:",cells,"| étiquettes:",tiles);
  await page.screenshot({path:path.join(SHOTS,"place-02-tableau.png")});
}catch(e){ console.log("ERREUR:",e.message); }
finally{ console.log("Erreurs:",errors.length,errors.slice(0,4)); await b.close(); srv.close(); }
