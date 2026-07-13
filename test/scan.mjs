import { chromium } from "playwright";
const URL="http://localhost:8080/index.html";
const errors=[]; const logs=[];
const b=await chromium.launch();
const page=await (await b.newContext({viewport:{width:414,height:820}})).newPage();
page.on("pageerror",e=>errors.push("PAGEERROR: "+e.message));
page.on("console",m=>{ const t=m.text(); if(m.type()==="error"&&!t.includes("404")&&!t.includes("favicon")) errors.push("CONSOLE: "+t); });
const log=(...a)=>logs.push(a.join(" "));
async function tryStep(name, fn){ try{ await fn(); log("✔",name); }catch(e){ log("✖",name,"->",e.message.split("\n")[0]); } }
async function answerLoop(max){
  for(let i=0;i<max;i++){
    if(await page.locator('h2:has-text("Programme du jour")').count()) return true;
    const ch=page.locator(".choice").first(), inp=page.locator(".text-input").first();
    if(await ch.count()&&await ch.isVisible()) await ch.click();
    else if(await inp.count()&&await inp.isVisible()){ await inp.fill("4"); const v=page.locator('button:has-text("Valider")').first(); if(await v.count())await v.click(); }
    else break;
    await page.waitForTimeout(90);
    const cont=page.locator('button:has-text("Continuer"),button:has-text("Terminer")').first();
    if(await cont.count()&&await cont.isVisible()){ await cont.click(); await page.waitForTimeout(90); }
  }
  return false;
}
try{
  await page.goto(URL,{waitUntil:"domcontentloaded"});
  await page.waitForSelector("#app:not([hidden])",{timeout:8000});
  await page.addStyleTag({content:"*{animation:none!important;transition:none!important}"});
  await tryStep("login",async()=>{ await page.fill("#login-name","TestScan"); await page.click('button:has-text("C\'est parti")'); await page.waitForSelector(".map-viewport",{timeout:8000}); });
  await page.waitForTimeout(800);
  await tryStep("carte", async()=>{ if(!await page.locator(".stone").count()) throw new Error("pas de pierres"); });
  await tryStep("ouvrir jour", async()=>{ await page.click(".stone.current"); await page.waitForSelector(".node-sheet"); await page.click('.node-sheet button:has-text("Jouer")'); await page.waitForSelector('h2:has-text("Programme du jour")'); });
  await tryStep("étape Français", async()=>{ await page.click('.card.row:has-text("Français")'); await page.waitForSelector(".lesson-points"); await page.click('button:has-text("Au défi")'); await page.waitForSelector(".question"); await answerLoop(16); });
  await tryStep("étape Maths", async()=>{ await page.click('.card.row:has-text("Maths")'); await page.waitForSelector(".lesson-points"); await page.click('button:has-text("Au défi")'); await page.waitForSelector(".question"); await answerLoop(22); });
  await tryStep("étape Problème/logique (rendu)", async()=>{ await page.click('.card.row:has-text("Problème")'); await page.waitForSelector(".question,.logic-instr,.numpad",{timeout:5000}); await page.waitForTimeout(300); const back=page.locator('button:has-text("Programme")').first(); if(await back.count())await back.click(); await page.waitForSelector('h2:has-text("Programme du jour")'); });
  await tryStep("étape Dictée (rendu)", async()=>{ await page.click('.card.row:has-text("Dictée")'); await page.waitForSelector(".text-input.dictee"); await page.fill(".text-input.dictee","essai de dictee"); await page.click('button:has-text("Corriger")'); await page.waitForTimeout(200); });
  await tryStep("Trophées", async()=>{ await page.goto(URL+"#/recompenses"); await page.waitForTimeout(400); });
  await tryStep("Profil", async()=>{ await page.goto(URL+"#/profil"); await page.waitForTimeout(400); });
}catch(e){ log("SCAN interrompu:",e.message); }
finally{
  console.log(logs.join("\n"));
  console.log("\n=== ERREURS ("+errors.length+") ===");
  [...new Set(errors)].forEach(e=>console.log(" ⚠",e));
  await b.close();
}
