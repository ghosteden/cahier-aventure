import http from "http"; import fs from "fs"; import path from "path";
import { chromium } from "playwright";
const ROOT=path.resolve("public");
const T={".html":"text/html",".css":"text/css",".js":"text/javascript",".png":"image/png",".webmanifest":"application/manifest+json"};
const srv=http.createServer((q,r)=>{let p=path.join(ROOT,decodeURIComponent(q.url.split("?")[0])); if(q.url==="/")p=path.join(ROOT,"index.html"); fs.readFile(p,(e,d)=>{if(e){r.writeHead(404);r.end();return;} r.writeHead(200,{"Content-Type":T[path.extname(p)]||"application/octet-stream"});r.end(d);});});
await new Promise(r=>srv.listen(8265,r));
const errors=[]; const b=await chromium.launch();
const page=await (await b.newContext()).newPage();
page.on("pageerror",e=>errors.push(e.message));
await page.goto("http://localhost:8265/index.html",{waitUntil:"domcontentloaded"});
await page.waitForFunction(()=>window.CV&&CV.gen&&CV.gen.logic);
const r=await page.evaluate(()=>{
  const gens=["logicNumber","logicAlpha","suiteMotifs","doubleEntry","symetrie","reproduction","rangement","construction","tetrisMur","tetrisForme"];
  const out={};
  for(const g of gens){ let ok=0; for(let i=0;i<30;i++){ try{ const s=CV.gen[g](); if(s&&s.type) ok++; }catch(e){} } out[g]=ok; }
  // le tirage logic ne renvoie que des jeux valides ?
  let poolOk=0; for(let i=0;i<50;i++){ try{ if(CV.gen.logic().type) poolOk++; }catch(e){} }
  return {out, poolOk};
});
Object.entries(r.out).forEach(([g,ok])=>console.log(g.padEnd(14), ok+"/30", ok===30?"✅":"❌"));
console.log("Tirage logic (pool) :", r.poolOk+"/50", r.poolOk===50?"✅":"❌");
console.log("Erreurs JS :", errors.length, errors.slice(0,4));
await b.close(); srv.close();
