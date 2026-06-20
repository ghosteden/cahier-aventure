import http from "http"; import fs from "fs"; import path from "path";
import { chromium } from "playwright";
const ROOT=path.resolve("public"); const SHOTS=path.resolve("test/shots"); fs.mkdirSync(SHOTS,{recursive:true});
const T={ ".html":"text/html",".css":"text/css",".js":"text/javascript",".svg":"image/svg+xml",".png":"image/png",".webmanifest":"application/manifest+json" };
const srv=http.createServer((req,res)=>{ let p=path.join(ROOT,decodeURIComponent(req.url.split("?")[0])); if(req.url==="/")p=path.join(ROOT,"index.html"); if(req.url.includes("/.netlify/")){res.writeHead(404);res.end();return;} fs.readFile(p,(e,d)=>{ if(e){res.writeHead(404);res.end();return;} res.writeHead(200,{"Content-Type":T[path.extname(p)]||"application/octet-stream"});res.end(d);});});
await new Promise(r=>srv.listen(8211,r));
const errors=[]; const b=await chromium.launch();
const page=await (await b.newContext({viewport:{width:414,height:820}})).newPage();
page.on("pageerror",e=>errors.push("PAGEERROR: "+e.message));
page.on("console",m=>{ if(m.type()==="error"&&!m.text().includes("404")) errors.push(m.text()); });
const shot=n=>page.screenshot({path:path.join(SHOTS,n+".png")});
try{
  await page.goto("http://localhost:8211/index.html",{waitUntil:"domcontentloaded"});
  await page.waitForSelector("#app:not([hidden])");
  await page.addStyleTag({content:"*{animation:none!important;transition:none!important}"});
  await page.fill("#login-name","Gabi"); await page.click('button:has-text("C\'est parti")');
  await page.waitForSelector(".map-viewport"); await page.waitForTimeout(600);
  await page.click(".stone.current");
  await page.waitForSelector(".node-sheet");
  await page.click('.node-sheet button:has-text("Jouer")');
  await page.waitForSelector('h2:has-text("Programme du jour")',{timeout:5000});
  const steps = await page.locator(".card.row").count();
  const labels = await page.locator(".card.row").allInnerTexts();
  console.log("Programme du jour ✅ — étapes:", steps);
  console.log("Libellés:", labels.map(l=>l.split("\n")[0]).join(" | "));
  await shot("jour-01-programme");
  // Étape Français
  await page.click('.card.row:has-text("Français")');
  await page.waitForSelector(".lesson-points",{timeout:5000});
  await page.click('button:has-text("Au défi")');
  await page.waitForSelector(".question");
  // répond aux questions jusqu'au retour au programme
  let answered=0;
  for(let i=0;i<14;i++){
    if(await page.locator('h2:has-text("Programme du jour")').count()){ break; }
    const ch=page.locator(".choice").first();
    const inp=page.locator(".text-input").first();
    if(await ch.count() && await ch.isVisible()) await ch.click();
    else if(await inp.count() && await inp.isVisible()){ await inp.fill("4"); await page.click('button:has-text("Valider")'); }
    else break;
    await page.waitForTimeout(120);
    const cont=page.locator('button:has-text("Continuer"),button:has-text("Terminer")').first();
    if(await cont.count()&&await cont.isVisible()){ await cont.click(); answered++; await page.waitForTimeout(120); }
  }
  console.log("Questions français enchaînées:", answered);
  await page.waitForSelector('h2:has-text("Programme du jour")',{timeout:5000});
  const frDone = await page.locator('.card.row:has-text("Français"):has-text("✅")').count();
  console.log("Étape Français marquée ✅ ?", frDone>0?"OUI":"non");
  await shot("jour-02-apres-francais");
}catch(e){ console.log("ERREUR:",e.message); await shot("jour-99"); }
finally{ console.log("Erreurs:",errors.length,errors.slice(0,4)); await b.close(); srv.close(); }
