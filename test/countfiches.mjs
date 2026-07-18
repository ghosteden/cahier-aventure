import http from "http"; import fs from "fs"; import path from "path";
import { chromium } from "playwright";
const ROOT=path.resolve("public");
const T={".html":"text/html",".css":"text/css",".js":"text/javascript",".png":"image/png",".webmanifest":"application/manifest+json"};
const srv=http.createServer((q,r)=>{let p=path.join(ROOT,decodeURIComponent(q.url.split("?")[0])); if(q.url==="/")p=path.join(ROOT,"index.html"); if(q.url.includes("/.netlify/")){r.writeHead(404);r.end();return;} fs.readFile(p,(e,d)=>{if(e){r.writeHead(404);r.end();return;} r.writeHead(200,{"Content-Type":T[path.extname(p)]||"application/octet-stream"});r.end(d);});});
await new Promise(r=>srv.listen(8247,r));
const b=await chromium.launch();
const page=await (await b.newContext()).newPage();
await page.goto("http://localhost:8247/index.html",{waitUntil:"domcontentloaded"});
await page.waitForFunction(()=>window.CV && CV.buildProgram);
const r = await page.evaluate(()=>{
  const set=new Set();
  CV.buildProgram().forEach(lv=>{
    if(lv.isBoss) return;
    const plan=CV.dayPlan(lv.level);
    if(!plan) return;
    plan.steps.forEach(s=>{ if(s.moduleId){ const m=CV.getModule(s.moduleId); if(m && !m.isDictee) set.add(s.moduleId); } });
  });
  return { unlockable:[...set].length, list:[...set].sort() };
});
console.log("Notions réellement enseignées (fiches débloquables) :", r.unlockable);
console.log("+ 5 fiches de monde =", r.unlockable+5);
console.log(r.list.join(", "));
await b.close(); srv.close();
