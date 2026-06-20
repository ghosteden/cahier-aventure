import http from "http"; import fs from "fs"; import path from "path";
import { chromium } from "playwright";
const ROOT=path.resolve("public"); const SHOTS=path.resolve("test/shots"); fs.mkdirSync(SHOTS,{recursive:true});
const T={ ".html":"text/html",".css":"text/css",".js":"text/javascript",".svg":"image/svg+xml",".png":"image/png",".webmanifest":"application/manifest+json" };
const srv=http.createServer((req,res)=>{ let p=path.join(ROOT,decodeURIComponent(req.url.split("?")[0])); if(req.url==="/")p=path.join(ROOT,"index.html"); if(req.url.includes("/.netlify/")){res.writeHead(404);res.end();return;} fs.readFile(p,(e,d)=>{ if(e){res.writeHead(404);res.end();return;} res.writeHead(200,{"Content-Type":T[path.extname(p)]||"application/octet-stream"});res.end(d);});});
await new Promise(r=>srv.listen(8212,r));
const errors=[]; const b=await chromium.launch();
const page=await (await b.newContext({viewport:{width:414,height:820}})).newPage();
page.on("pageerror",e=>errors.push("PAGEERROR: "+e.message));
page.on("console",m=>{ if(m.type()==="error"&&!m.text().includes("404")) errors.push(m.text()); });
try{
  await page.goto("http://localhost:8212/index.html",{waitUntil:"domcontentloaded"});
  await page.waitForSelector("#app");
  await page.waitForTimeout(400);
  await page.evaluate(()=>{
    const app=document.getElementById("app"); app.removeAttribute("hidden"); app.innerHTML="";
    const box=document.createElement("div"); box.id="lgbox"; app.appendChild(box);
    window.__r=null;
    CV.Engine.run(box,[{type:"logic",q:"Range",instruction:"du plus petit au plus grand",
      tokens:[{id:"a",label:"2",key:2},{id:"b",label:"1",key:1}],solutionKeys:[1,2]}],
      {compact:true,onComplete:r=>{window.__r=r;}});
  });
  await page.waitForSelector(".logic-tok");
  let toks = await page.$$eval(".logic-tok", els=>els.map(e=>{const r=e.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2,label:e.textContent.trim()};}));
  console.log("Ordre initial:", toks.map(t=>t.label).join(","));
  await page.screenshot({path:path.join(SHOTS,"logic-01.png")});
  { // glissement force pour tester l echange
    await page.mouse.move(toks[0].x,toks[0].y); await page.mouse.down();
    await page.mouse.move(toks[1].x,toks[1].y,{steps:10}); await page.mouse.up();
    await page.waitForTimeout(150);
  }
  toks = await page.$$eval(".logic-tok", els=>els.map(e=>e.textContent.trim()));
  console.log("Ordre après glissement:", toks.join(","));
  await page.click('button:has-text("Valider")');
  await page.waitForTimeout(150);
  const fb = await page.locator(".feedback").first().innerText().catch(()=>"(rien)");
  console.log("Feedback:", fb.split("\n")[0]);
  await page.screenshot({path:path.join(SHOTS,"logic-02.png")});
  const cont=page.locator('button:has-text("Terminer"),button:has-text("Continuer")').first();
  if(await cont.count()) await cont.click();
  await page.waitForTimeout(150);
  const r=await page.evaluate(()=>window.__r);
  console.log("Résultat:", JSON.stringify(r));
}catch(e){ console.log("ERREUR:",e.message); }
finally{ console.log("Erreurs:",errors.length,errors.slice(0,4)); await b.close(); srv.close(); }
