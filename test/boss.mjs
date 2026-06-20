import http from "http"; import fs from "fs"; import path from "path";
import { chromium } from "playwright";
const ROOT = path.resolve("public");
const SHOTS = path.resolve("test/shots"); fs.mkdirSync(SHOTS,{recursive:true});
const T={ ".html":"text/html",".css":"text/css",".js":"text/javascript",".svg":"image/svg+xml",".png":"image/png",".webmanifest":"application/manifest+json" };
const srv=http.createServer((req,res)=>{ let p=path.join(ROOT,decodeURIComponent(req.url.split("?")[0])); if(req.url==="/")p=path.join(ROOT,"index.html"); if(req.url.includes("/.netlify/")){res.writeHead(404);res.end();return;} fs.readFile(p,(e,d)=>{ if(e){res.writeHead(404);res.end();return;} res.writeHead(200,{"Content-Type":T[path.extname(p)]||"application/octet-stream"});res.end(d);});});
await new Promise(r=>srv.listen(8203,r));
const errors=[]; const b=await chromium.launch();
const page=await (await b.newContext({viewport:{width:414,height:820}})).newPage();
page.on("pageerror",e=>errors.push("PAGEERROR: "+e.message));
page.on("console",m=>{ if(m.type()==="error"&&!m.text().includes("404")) errors.push(m.text()); });
const shot=n=>page.screenshot({path:path.join(SHOTS,n+".png")});
try{
  await page.goto("http://localhost:8203/index.html",{waitUntil:"domcontentloaded"});
  await page.waitForSelector("#app:not([hidden])");
  await page.addStyleTag({content:"*{animation:none!important;transition:none!important}"});
  await page.fill("#login-name","Gabi");
  await page.click('button:has-text("C\'est parti")');
  await page.waitForSelector(".map-viewport");
  await page.waitForTimeout(800);
  // saute les 8 leçons -> arrive au boss (niveau 9)
  for(let i=0;i<8;i++){
    await page.click(".stone.current");
    await page.waitForSelector(".node-sheet");
    await page.click('.node-sheet button:has-text("Débloquer")');
    await page.waitForTimeout(300);
  }
  const cur=await page.evaluate(()=>CV.Store.current().currentDay);
  console.log("Niveau courant (attendu 9 = boss):",cur);
  await page.click(".stone.current"); // boss
  await page.waitForSelector(".node-sheet");
  await page.click('.node-sheet button:has-text("Affronter")');
  await page.waitForSelector(".combat-scene",{timeout:5000});
  await page.waitForTimeout(400);
  const hp0=await page.evaluate(()=>document.querySelectorAll(".hp")[1].textContent);
  console.log("Combat lancé ✅ — PV boss au départ:",hp0);
  await shot("boss-01-combat");
  // répond à 5 questions (clic 1er choix ou saisie)
  for(let q=0;q<5;q++){
    const choice=page.locator(".choice").first();
    const input=page.locator(".text-input").first();
    if(await choice.count() && await choice.isVisible()) await choice.click();
    else if(await input.count() && await input.isVisible()){ await input.fill("4"); await page.click('button:has-text("Valider")'); }
    await page.waitForTimeout(150);
    const cont=page.locator('button:has-text("Terminer"),button:has-text("Continuer")').first();
    if(await cont.count()&&await cont.isVisible()) await cont.click();
    await page.waitForTimeout(900);
    if(await page.locator(".combat-scene").count()===0) break; // fin (win/lose)
  }
  await shot("boss-02-apres");
  console.log("Scène encore là ?", await page.locator(".combat-scene").count()>0?"oui (combat en cours)":"non (terminé win/lose)");
}catch(e){ console.log("ERREUR:",e.message); await shot("boss-99"); }
finally{ console.log("Erreurs:",errors.length,errors.slice(0,4)); await b.close(); srv.close(); }
