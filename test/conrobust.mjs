import http from "http"; import fs from "fs"; import path from "path";
import { chromium } from "playwright";
const ROOT=path.resolve("public");
const T={".html":"text/html",".css":"text/css",".js":"text/javascript",".png":"image/png",".webmanifest":"application/manifest+json"};
const srv=http.createServer((q,r)=>{let p=path.join(ROOT,decodeURIComponent(q.url.split("?")[0])); if(q.url==="/")p=path.join(ROOT,"index.html"); fs.readFile(p,(e,d)=>{if(e){r.writeHead(404);r.end();return;} r.writeHead(200,{"Content-Type":T[path.extname(p)]||"application/octet-stream"});r.end(d);});});
await new Promise(r=>srv.listen(8260,r));
const b=await chromium.launch(); const page=await (await b.newContext()).newPage();
await page.goto("http://localhost:8260/index.html",{waitUntil:"domcontentloaded"});
await page.waitForFunction(()=>window.CV&&CV.gen&&CV.gen.construction);
const r=await page.evaluate(()=>{ let ok=0,bad=0;
  for(let i=0;i<200;i++){ try{ const c=CV.gen.construction();
    const solN=Object.keys(c.solution).length;
    const valid = solN===c.count && Object.values(c.solution).every(v=>typeof v==="string") && c.instruction.split("<br>").length===c.count;
    if(valid) ok++; else bad++;
  }catch(e){ bad++; } }
  return {ok,bad}; });
console.log("Constructions valides :", r.ok+"/200, ratées :", r.bad, r.bad===0?"✅":"❌");
await b.close(); srv.close();
