import http from "http"; import fs from "fs"; import path from "path";
import { chromium } from "playwright";
const ROOT=path.resolve("public");
const T={ ".html":"text/html",".css":"text/css",".js":"text/javascript",".svg":"image/svg+xml",".png":"image/png",".webmanifest":"application/manifest+json" };
const srv=http.createServer((req,res)=>{ let p=path.join(ROOT,decodeURIComponent(req.url.split("?")[0])); if(req.url==="/")p=path.join(ROOT,"index.html"); if(req.url.includes("/.netlify/")){res.writeHead(404);res.end();return;} fs.readFile(p,(e,d)=>{ if(e){res.writeHead(404);res.end();return;} res.writeHead(200,{"Content-Type":T[path.extname(p)]||"application/octet-stream"});res.end(d);});});
await new Promise(r=>srv.listen(8214,r));
const errors=[]; const b=await chromium.launch();
const page=await (await b.newContext({viewport:{width:414,height:820}})).newPage();
page.on("pageerror",e=>errors.push("PAGEERROR: "+e.message));
page.on("console",m=>{ if(m.type()==="error"&&!m.text().includes("404")) errors.push(m.text()); });
try{
  await page.goto("http://localhost:8214/index.html",{waitUntil:"domcontentloaded"});
  await page.waitForSelector("#app"); await page.waitForTimeout(300);
  await page.evaluate(()=>{ const app=document.getElementById("app"); app.removeAttribute("hidden"); app.innerHTML="";
    const box=document.createElement("div"); app.appendChild(box); window.__r=null;
    CV.Engine.run(box,[{type:"calcul",q:"12 + 5 = ?",answer:17,explain:"=17"}],{compact:true,onComplete:r=>window.__r=r}); });
  await page.waitForSelector(".numpad");
  const keys=await page.locator(".numkey").count();
  console.log("Pavé numérique affiché, touches:",keys);
  // tape 1 puis 7
  await page.click('.numkey:has-text("1")');
  await page.click('.numkey:has-text("7")');
  const val=await page.inputValue(".text-input");
  console.log("Saisie via pavé:",val);
  await page.click('button:has-text("Valider")'); await page.waitForTimeout(150);
  const fb=await page.locator(".feedback").first().innerText().catch(()=>"(rien)");
  console.log("Feedback:",fb.split("\n")[0]);
  await page.screenshot({path:path.resolve("test/shots/numpad-01.png")});
  // handwriting NON supporté ici -> pas de bouton "Écrire à la main" sur un champ texte
  await page.evaluate(()=>{ const app=document.getElementById("app"); app.innerHTML="";
    const box=document.createElement("div"); app.appendChild(box);
    CV.Engine.run(box,[{type:"fill",q:"Complète : le chat ___ noir.",answer:["est"]}],{compact:true,onComplete:()=>{}}); });
  await page.waitForSelector(".text-input");
  const hw=await page.locator('button:has-text("Écrire à la main")').count();
  console.log("Bouton écriture manuscrite sur champ texte (sans support):",hw,"(attendu 0)");
}catch(e){ console.log("ERREUR:",e.message); }
finally{ console.log("Erreurs:",errors.length,errors.slice(0,4)); await b.close(); srv.close(); }
