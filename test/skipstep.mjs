import { chromium } from "playwright";
const URL="http://localhost:8080/index.html";
const errors=[]; const b=await chromium.launch();
const page=await (await b.newContext({viewport:{width:414,height:820}})).newPage();
page.on("pageerror",e=>errors.push("PAGEERROR: "+e.message));
page.on("console",m=>{ if(m.type()==="error"&&!m.text().includes("404")) errors.push(m.text()); });
page.on("dialog", d=>d.accept());
try{
  await page.goto(URL,{waitUntil:"domcontentloaded"}); await page.waitForSelector("#app:not([hidden])");
  await page.addStyleTag({content:"*{animation:none!important;transition:none!important}"});
  await page.fill("#login-name","SkipStep"); await page.click('button:has-text("C\'est parti")');
  await page.waitForSelector(".map-viewport"); await page.waitForTimeout(500);
  await page.click(".stone.current"); await page.waitForSelector(".node-sheet");
  console.log("Fiche: skip-mini visible ?", await page.locator('.node-sheet .skip-mini').count());
  await page.screenshot({path:"test/shots/skip-sheet.png"});
  await page.click('.node-sheet button:has-text("Jouer")');
  await page.waitForSelector('h2:has-text("Programme du jour")');
  console.log("Programme: skip-mini sur l'étape courante ?", await page.locator('.card.row .skip-mini').count());
  await page.screenshot({path:"test/shots/skip-program.png"});
  // passe les 4 étapes
  for(let k=0;k<4;k++){
    const sm=page.locator('.card.row .skip-mini').first();
    if(!await sm.count()) break;
    await sm.click(); await page.waitForTimeout(200);
  }
  const skipped = await page.locator('.card.row:has-text("⏭️")').count();
  console.log("Étapes marquées passées:", skipped);
  const term = page.locator('button:has-text("Terminer la journée")');
  console.log("Bouton Terminer présent ?", await term.count());
  if(await term.count()){ await term.click(); await page.waitForTimeout(300);
    const t=await page.locator(".victory h2").innerText().catch(()=>"-");
    const dp=await page.evaluate(()=>CV.Store.current().dayProgress[1]);
    console.log("Fin →", t, "| jour1:", JSON.stringify(dp), "(stars attendu 0)");
  }
}catch(e){ console.log("ERREUR:",e.message); }
finally{ console.log("Erreurs:",errors.length,errors.slice(0,3)); await b.close(); }
