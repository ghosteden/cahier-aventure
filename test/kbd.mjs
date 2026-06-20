import http from "http"; import fs from "fs"; import path from "path";
import { chromium } from "playwright";
const ROOT=path.resolve("public");
const T={ ".html":"text/html",".css":"text/css",".js":"text/javascript",".svg":"image/svg+xml",".png":"image/png",".webmanifest":"application/manifest+json" };
const srv=http.createServer((req,res)=>{ let p=path.join(ROOT,decodeURIComponent(req.url.split("?")[0])); if(req.url==="/")p=path.join(ROOT,"index.html"); if(req.url.includes("/.netlify/")){res.writeHead(404);res.end();return;} fs.readFile(p,(e,d)=>{ if(e){res.writeHead(404);res.end();return;} res.writeHead(200,{"Content-Type":T[path.extname(p)]||"application/octet-stream"});res.end(d);});});
await new Promise(r=>srv.listen(8215,r));
const errors=[]; const b=await chromium.launch();
const page=await (await b.newContext({viewport:{width:414,height:820}})).newPage();
page.on("pageerror",e=>errors.push("PAGEERROR: "+e.message));
page.on("console",m=>{ if(m.type()==="error"&&!m.text().includes("404")) errors.push(m.text()); });
try{
  await page.goto("http://localhost:8215/index.html",{waitUntil:"domcontentloaded"});
  await page.waitForSelector("#app"); await page.waitForTimeout(300);
  // calcul -> pas de pavé, clavier
  await page.evaluate(()=>{ const app=document.getElementById("app"); app.removeAttribute("hidden"); app.innerHTML="";
    const box=document.createElement("div"); app.appendChild(box);
    CV.Engine.run(box,[{type:"calcul",q:"3 + 4 = ?",answer:7}],{compact:true,onComplete:()=>{}}); });
  await page.waitForSelector(".text-input");
  console.log("calcul → pavé numérique présent ?", await page.locator(".numpad").count(), "(attendu 0) | écriture ?", await page.locator('button:has-text("Écrire")').count());
  await page.fill(".text-input","7"); await page.click('button:has-text("Valider")'); await page.waitForTimeout(120);
  console.log("calcul → correction:", (await page.locator(".feedback").first().innerText().catch(()=>"-")).split("\n")[0]);
  // dictée -> pas de canvas, clavier
  await page.evaluate(()=>{ const app=document.getElementById("app"); app.innerHTML="";
    const box=document.createElement("div"); app.appendChild(box);
    CV.Engine.run(box,[CV.drawDictee(1)],{compact:true,onComplete:()=>{}}); });
  await page.waitForSelector(".text-input.dictee");
  console.log("dictée → canvas stylet présent ?", await page.locator(".hw-canvas").count(), "(attendu 0) | phrases:", await page.evaluate(()=>document.querySelector("textarea")?1:0));
  await page.screenshot({path:path.resolve("test/shots/kbd-dictee.png")});
}catch(e){ console.log("ERREUR:",e.message); }
finally{ console.log("Erreurs:",errors.length,errors.slice(0,4)); await b.close(); srv.close(); }
