import http from "http"; import fs from "fs"; import path from "path";
import { chromium } from "playwright";
const ROOT=path.resolve("public"), SHOTS=path.resolve("test/shots");
const T={".html":"text/html",".css":"text/css",".js":"text/javascript",".png":"image/png",".webmanifest":"application/manifest+json"};
const srv=http.createServer((q,r)=>{let p=path.join(ROOT,decodeURIComponent(q.url.split("?")[0])); if(q.url==="/")p=path.join(ROOT,"index.html"); if(q.url.includes("/.netlify/")){r.writeHead(404);r.end();return;} fs.readFile(p,(e,d)=>{if(e){r.writeHead(404);r.end();return;} r.writeHead(200,{"Content-Type":T[path.extname(p)]||"application/octet-stream"});r.end(d);});});
await new Promise(r=>srv.listen(8242,r));
const errors=[]; const b=await chromium.launch();
const page=await (await b.newContext({viewport:{width:414,height:900}})).newPage();
page.on("pageerror",e=>errors.push("PAGEERROR: "+e.message));
page.on("console",m=>{ if(m.type()==="error"&&!m.text().includes("404")) errors.push(m.text()); });
await page.goto("http://localhost:8242/index.html",{waitUntil:"domcontentloaded"});
await page.waitForSelector("#app:not([hidden])");
await page.fill("#login-name","Gabi"); await page.click('button:has-text("C\'est parti")');
await page.waitForSelector(".map-viewport");
// génère chaque jeu et vérifie sa structure + qu'on peut le valider en plaçant la bonne pièce
for (const gen of ["deduction","symetrie","reproduction"]) {
  const info = await page.evaluate((g)=>{
    const step = CV.gen[g]();
    return { type:step.type, layout:step.layout, zones:step.zones.length, pieces:step.pieces.length,
      expects:step.zones.map(z=>z.expect), keys:step.pieces.map(p=>p.key),
      solvable: step.zones.every(z => step.pieces.some(p=>String(p.key)===String(z.expect))) };
  }, gen);
  console.log(gen.padEnd(13), "type="+info.type+"/"+info.layout, "zones="+info.zones, "pièces="+info.pieces,
    info.solvable? "→ soluble ✅":"→ INSOLUBLE ❌ ("+info.expects+" vs "+info.keys+")");
}
// rendu visuel réel de la symétrie et du repère via un exercice
await page.evaluate(()=>{ CV.__demo = CV.gen.symetrie(); });
await page.evaluate(()=>{
  const c=document.querySelector("#app"); c.innerHTML="";
  const box=document.createElement("div"); box.className="card"; c.appendChild(box);
  CV.Engine.run(box,[CV.__demo],{onComplete:()=>{}});
});
await page.waitForTimeout(300);
const sy = await page.evaluate(()=>({ fixes:document.querySelectorAll(".place-zone.fixed").length,
  zones:document.querySelectorAll(".place-zone[data-zid]").length, axe:document.querySelectorAll(".pg-axis").length }));
console.log("Symétrie rendue : cases modèle =",sy.fixes,"| cases à remplir =",sy.zones,"| axe =",sy.axe);
await page.screenshot({path:path.join(SHOTS,"logic-symetrie.png")});
await page.evaluate(()=>{
  const c=document.querySelector("#app"); c.innerHTML="";
  const box=document.createElement("div"); box.className="card"; c.appendChild(box);
  CV.Engine.run(box,[CV.gen.reproduction()],{onComplete:()=>{}});
});
await page.waitForTimeout(300);
await page.screenshot({path:path.join(SHOTS,"logic-repere.png")});
console.log("Erreurs JS:", errors.length, errors.slice(0,4));
await b.close(); srv.close();
