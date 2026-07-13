import { chromium } from "playwright";
const URL="http://localhost:8080/index.html";
const errors=[]; const b=await chromium.launch();
const page=await (await b.newContext({viewport:{width:414,height:820}})).newPage();
page.on("pageerror",e=>errors.push("PAGEERROR: "+e.message));
page.on("console",m=>{ if(m.type()==="error"&&!m.text().includes("404")) errors.push(m.text()); });
page.on("dialog", d=>d.accept()); // accepte la confirmation "Passer ?"
try{
  await page.goto(URL,{waitUntil:"domcontentloaded"}); await page.waitForSelector("#app:not([hidden])");
  await page.addStyleTag({content:"*{animation:none!important;transition:none!important}"});
  await page.fill("#login-name","SkipTest"); await page.click('button:has-text("C\'est parti")');
  await page.waitForSelector(".map-viewport"); await page.waitForTimeout(600);
  const hero = await page.evaluate(()=>{ const el=document.querySelector(".hero-sprite"); return el?{left:el.style.left,top:el.style.top}:null; });
  console.log("Position héros au départ:", JSON.stringify(hero), "(node0=35.6,47.9 ; chemin pt1=31.6,49.7)");
  await page.click(".stone.current"); await page.waitForSelector(".node-sheet");
  const skipLabel = await page.locator('.node-sheet button:has-text("Passer")').innerText();
  console.log("Bouton skip:", skipLabel);
  await page.click('.node-sheet button:has-text("Passer")');
  await page.waitForTimeout(400);
  const title = await page.locator(".victory h2").innerText().catch(()=>"-");
  const starsShown = await page.locator(".stars-won").count();
  console.log("Après skip → titre:", title, "| étoiles affichées:", starsShown, "(attendu 0)");
  await page.click('.victory button'); await page.waitForTimeout(400);
  const cur = await page.evaluate(()=>CV.Store.current().currentDay);
  const dp1 = await page.evaluate(()=>CV.Store.current().dayProgress[1]);
  console.log("currentDay:", cur, "| jour1:", JSON.stringify(dp1), "(stars attendu 0)");
}catch(e){ console.log("ERREUR:",e.message); }
finally{ console.log("Erreurs:",errors.length,errors.slice(0,3)); await b.close(); }
