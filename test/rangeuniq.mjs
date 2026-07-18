import http from "http"; import fs from "fs"; import path from "path";
import { chromium } from "playwright";
const ROOT=path.resolve("public");
const T={".html":"text/html",".css":"text/css",".js":"text/javascript",".png":"image/png",".webmanifest":"application/manifest+json"};
const srv=http.createServer((q,r)=>{let p=path.join(ROOT,decodeURIComponent(q.url.split("?")[0])); if(q.url==="/")p=path.join(ROOT,"index.html"); fs.readFile(p,(e,d)=>{if(e){r.writeHead(404);r.end();return;} r.writeHead(200,{"Content-Type":T[path.extname(p)]||"application/octet-stream"});r.end(d);});});
await new Promise(r=>srv.listen(8263,r));
const b=await chromium.launch(); const page=await (await b.newContext()).newPage();
await page.goto("http://localhost:8263/index.html",{waitUntil:"domcontentloaded"});
await page.waitForFunction(()=>window.CV&&CV.gen&&CV.gen.rangement);
const r=await page.evaluate(()=>{ let notUniq=0, clues=[];
  for(let t=0;t<500;t++){ const s=CV.gen.rangement(); if(s._uniq!==1) notUniq++; clues.push((s.instruction.match(/•/g)||[]).length); }
  return {notUniq, avg:(clues.reduce((a,b)=>a+b,0)/clues.length).toFixed(1), min:Math.min(...clues), max:Math.max(...clues)}; });
console.log("Sur 500 tirages : puzzles NON uniques =", r.notUniq, r.notUniq===0?"✅ toujours une seule solution":"❌ AMBIGU");
console.log("Indices : moyenne="+r.avg+", min="+r.min+", max="+r.max);
await b.close(); srv.close();
