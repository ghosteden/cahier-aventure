import { chromium } from "playwright";
const URL="http://localhost:8080/index.html";
const errs=[]; const b=await chromium.launch();
const page=await (await b.newContext({viewport:{width:414,height:820}})).newPage();
page.on("pageerror",e=>errs.push(e.message)); page.on("console",m=>{if(m.type()==="error"&&!m.text().includes("404"))errs.push(m.text());});
try{
  await page.goto(URL,{waitUntil:"domcontentloaded"}); await page.waitForSelector("#app:not([hidden])");
  await page.addStyleTag({content:"*{animation:none!important;transition:none!important}"});
  await page.fill("#login-name","test"); await page.click('button:has-text("C\'est parti")');
  await page.waitForSelector(".map-viewport"); await page.waitForTimeout(400);
  // onglet Révisions
  await page.click('.nav-btn:has-text("Révisions")');
  await page.waitForSelector('h2:has-text("Révisions libres")');
  const chips=await page.locator('.rev-chip').count();
  console.log("Notions dispo (chips):", chips);
  await page.screenshot({path:"test/shots/revisions.png"});
  // ouvre "L'imparfait"
  await page.click('.rev-chip:has-text("imparfait")');
  await page.waitForSelector(".question,.ex-progress",{timeout:5000});
  console.log("Entraînement lancé sur l'imparfait ✅");
  // répond ~10 (fill => tape n'importe quoi, qcm => 1er choix)
  for(let i=0;i<12;i++){
    if(await page.locator('h2:has-text("Entraînement terminé")').count()) break;
    const ch=page.locator(".choice").first(), inp=page.locator(".text-input").first();
    if(await ch.count()&&await ch.isVisible()) await ch.click();
    else if(await inp.count()&&await inp.isVisible()){ await inp.fill("x"); await page.click('button:has-text("Valider")'); }
    else break;
    await page.waitForTimeout(80);
    const cont=page.locator('button:has-text("Continuer"),button:has-text("Terminer")').first();
    if(await cont.count()&&await cont.isVisible()) await cont.click();
    await page.waitForTimeout(80);
  }
  const done=await page.locator('h2:has-text("Entraînement terminé")').count();
  const encore=await page.locator('button:has-text("Encore")').count();
  console.log("Écran de fin ?", done, "| bouton Encore ?", encore);
}catch(e){ console.log("ERREUR:",e.message); }
finally{ console.log("Erreurs:",errs.length,errs.slice(0,3)); await b.close(); }
