import http from "http"; import fs from "fs"; import path from "path";
import { chromium } from "playwright";
const ROOT=path.resolve("public"), SHOTS=path.resolve("test/shots");
const T={".html":"text/html",".css":"text/css",".js":"text/javascript",".svg":"image/svg+xml",".png":"image/png",".webmanifest":"application/manifest+json"};
const srv=http.createServer((q,r)=>{let p=path.join(ROOT,decodeURIComponent(q.url.split("?")[0])); if(q.url==="/")p=path.join(ROOT,"index.html"); if(q.url.includes("/.netlify/")){r.writeHead(404);r.end();return;} fs.readFile(p,(e,d)=>{if(e){r.writeHead(404);r.end();return;} r.writeHead(200,{"Content-Type":T[path.extname(p)]||"application/octet-stream"});r.end(d);});});
await new Promise(r=>srv.listen(8220,r));
const errors=[]; const b=await chromium.launch();
const page=await (await b.newContext({viewport:{width:414,height:900}})).newPage();
page.on("pageerror",e=>errors.push("PAGEERROR: "+e.message));
try{
  await page.goto("http://localhost:8220/index.html",{waitUntil:"domcontentloaded"});
  await page.waitForSelector("#app:not([hidden])");
  await page.fill("#login-name","Gabi"); await page.click('button:has-text("C\'est parti")');
  await page.waitForSelector(".map-viewport");
  await page.evaluate(()=>{const s=CV.Store.current(); s.currentDay=39; CV.Store.save(); location.reload();});
  await page.waitForSelector(".map-viewport");
  await page.evaluate(()=>{ CV.drawMix=()=>Array.from({length:12},(_,i)=>({type:"calcul",q:"Q"+(i+1)+" : 2 + 2 = ?",answer:["4"],explain:"2+2=4"})); });
  await page.waitForTimeout(400);
  await page.locator(".stone.current").click({force:true});
  await page.waitForSelector(".node-sheet");
  await page.click('.node-sheet button:has-text("Jouer"), .node-sheet button:has-text("Rejouer")');
  await page.waitForSelector(".planet-stage");

  // 1) bonne réponse : un seul clic sur Valider, ça doit enchaîner tout seul
  await page.fill(".text-input","4"); await page.click('button:has-text("Valider")');
  await page.waitForTimeout(300);
  console.log("Après Valider (juste) — bouton Terminer visible ?", await page.locator('button:has-text("Terminer"), button:has-text("Continuer"), button:has-text("compris")').count() ? "OUI ❌" : "non ✅");
  await page.waitForTimeout(1400);
  console.log("  → avancé tout seul ?", (await page.locator(".planet-steps").textContent()).trim());

  // 2) mauvaise réponse : le bouton doit rester (pour lire la correction)
  await page.fill(".text-input","9"); await page.click('button:has-text("Valider")');
  await page.waitForTimeout(1500);
  const btn = await page.locator('button:has-text("Terminer"), button:has-text("Continuer"), button:has-text("compris")').count();
  console.log("Après Valider (faux) — bouton de correction présent ?", btn ? "oui ✅" : "NON ❌");
  console.log("  → position inchangée ?", (await page.locator(".planet-steps").textContent()).trim());
  await page.screenshot({path:path.join(SHOTS,"autonext.png")});

  // 3) enchaîner 4 bonnes réponses d'affilée sans jamais cliquer Terminer
  await page.click('button:has-text("Terminer"), button:has-text("Continuer"), button:has-text("compris")');
  for(let i=0;i<3;i++){ await page.waitForSelector(".text-input"); await page.fill(".text-input","4"); await page.click('button:has-text("Valider")'); await page.waitForTimeout(1300); }
  console.log("Après 3 bonnes réponses enchaînées :", (await page.locator(".planet-steps").count()) ? (await page.locator(".planet-steps").textContent()).trim() : "planète terminée");
}catch(e){console.log("ERREUR:",e.message);}
finally{console.log("Erreurs JS:",errors.length,errors.slice(0,3)); await b.close(); srv.close();}
