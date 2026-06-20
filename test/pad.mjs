import http from "http"; import fs from "fs"; import path from "path";
import { chromium } from "playwright";
const ROOT=path.resolve("public"); const SHOTS=path.resolve("test/shots"); fs.mkdirSync(SHOTS,{recursive:true});
const T={ ".html":"text/html",".css":"text/css",".js":"text/javascript",".svg":"image/svg+xml",".png":"image/png",".webmanifest":"application/manifest+json" };
const srv=http.createServer((req,res)=>{ let p=path.join(ROOT,decodeURIComponent(req.url.split("?")[0])); if(req.url==="/")p=path.join(ROOT,"index.html"); if(req.url.includes("/.netlify/")){res.writeHead(404);res.end();return;} fs.readFile(p,(e,d)=>{ if(e){res.writeHead(404);res.end();return;} res.writeHead(200,{"Content-Type":T[path.extname(p)]||"application/octet-stream"});res.end(d);});});
await new Promise(r=>srv.listen(8204,r));
const errors=[]; const b=await chromium.launch();
const page=await (await b.newContext({viewport:{width:414,height:820}})).newPage();
page.on("pageerror",e=>errors.push("PAGEERROR: "+e.message));
page.on("console",m=>{ if(m.type()==="error"&&!m.text().includes("404")) errors.push(m.text()); });
try{
  await page.goto("http://localhost:8204/index.html",{waitUntil:"domcontentloaded"});
  await page.waitForSelector("#app:not([hidden])");
  await page.addStyleTag({content:"*{animation:none!important;transition:none!important}"});
  await page.fill("#login-name","Gabi");
  await page.click('button:has-text("C\'est parti")');
  await page.waitForSelector(".map-viewport"); await page.waitForTimeout(700);
  // skip niveau 1 pour débloquer le niveau 2 (maths, contient un calcul)
  await page.click(".stone.current"); await page.waitForSelector(".node-sheet");
  await page.click('.node-sheet button:has-text("Débloquer")'); await page.waitForTimeout(500);
  // ouvre niveau 2
  await page.click(".stone.current"); await page.waitForSelector(".node-sheet");
  await page.click('.node-sheet button:has-text("Jouer")');
  await page.waitForSelector(".lesson-points"); 
  await page.click('button:has-text("Au défi")');
  await page.waitForSelector(".question");
  // avance jusqu'à un champ de saisie
  let found=false;
  for(let i=0;i<6;i++){
    if(await page.locator(".text-input").count() && await page.locator(".text-input").first().isVisible()){ found=true; break; }
    const ch=page.locator(".choice").first();
    if(await ch.count()&&await ch.isVisible()){ await ch.click(); await page.waitForTimeout(150); const cont=page.locator('button:has-text("Continuer"),button:has-text("Terminer")').first(); if(await cont.count()) await cont.click(); await page.waitForTimeout(200); }
    else break;
  }
  console.log("Champ de saisie atteint ?", found);
  const hasToggle = await page.locator('button:has-text("Écrire à la main")').count();
  console.log("Bouton 'Écrire à la main' présent ?", hasToggle>0?"OUI ✅":"non ❌");
  if(hasToggle){ await page.click('button:has-text("Écrire à la main")'); await page.waitForTimeout(200);
    const canvas=await page.locator(".hw-canvas").count();
    console.log("Pad d'écriture affiché au clic ?", canvas>0?"OUI ✅":"non ❌");
    await page.screenshot({path:path.join(SHOTS,"pad-01.png")});
  }
}catch(e){ console.log("ERREUR:",e.message); }
finally{ console.log("Erreurs:",errors.length,errors.slice(0,4)); await b.close(); srv.close(); }
