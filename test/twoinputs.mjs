import { chromium } from "playwright";
const URL="http://localhost:8080/index.html";
const errors=[]; const b=await chromium.launch();
const page=await (await b.newContext({viewport:{width:414,height:820}})).newPage();
page.on("pageerror",e=>errors.push("PAGEERROR: "+e.message));
page.on("console",m=>{ if(m.type()==="error"&&!m.text().includes("404")) errors.push(m.text()); });
try{
  await page.goto(URL,{waitUntil:"domcontentloaded"}); await page.waitForSelector("#app"); await page.waitForTimeout(300);
  await page.evaluate(()=>{ const app=document.getElementById("app"); app.removeAttribute("hidden"); app.innerHTML="";
    const box=document.createElement("div"); app.appendChild(box); window.__r=null;
    CV.Engine.run(box,[{type:"calcul",q:"2+3=?",answer:5},{type:"calcul",q:"4+4=?",answer:8}],{onComplete:r=>window.__r=r}); });
  // Q1
  await page.waitForSelector(".text-input");
  await page.fill(".text-input","5"); await page.click('button:has-text("Valider")'); await page.waitForTimeout(120);
  const fb1=(await page.locator(".feedback").first().innerText().catch(()=>"-")).split("\n")[0];
  console.log("Q1 valider:", fb1);
  await page.click('button:has-text("Continuer"),button:has-text("Terminer")'); await page.waitForTimeout(150);
  // Q2 (la fameuse 2e saisie)
  await page.fill(".text-input","8"); await page.click('button:has-text("Valider")'); await page.waitForTimeout(150);
  const fb2=(await page.locator(".feedback").first().innerText().catch(()=>"(rien - BLOQUÉ)")).split("\n")[0];
  console.log("Q2 valider (2e saisie):", fb2);
  const r=await page.evaluate(()=>window.__r);
  console.log("Résultat final:", JSON.stringify(r));
}catch(e){ console.log("ERREUR:",e.message); }
finally{ console.log("Erreurs:",errors.length,errors.slice(0,3)); await b.close(); }
