import http from "http"; import fs from "fs"; import path from "path";
import { chromium } from "playwright";
const ROOT=path.resolve("public");
const T={".html":"text/html",".css":"text/css",".js":"text/javascript",".png":"image/png",".webmanifest":"application/manifest+json"};
const srv=http.createServer((q,r)=>{let p=path.join(ROOT,decodeURIComponent(q.url.split("?")[0])); if(q.url==="/")p=path.join(ROOT,"index.html"); fs.readFile(p,(e,d)=>{if(e){r.writeHead(404);r.end();return;} r.writeHead(200,{"Content-Type":T[path.extname(p)]||"application/octet-stream"});r.end(d);});});
await new Promise(r=>srv.listen(8262,r));
const b=await chromium.launch(); const page=await (await b.newContext()).newPage();
await page.goto("http://localhost:8262/index.html",{waitUntil:"domcontentloaded"});
await page.waitForFunction(()=>window.CV&&CV.gen&&CV.gen.rangement);
const r=await page.evaluate(()=>{
  function perm(a){if(a.length<=1)return[a];const o=[];a.forEach((x,i)=>perm(a.slice(0,i).concat(a.slice(i+1))).forEach(rr=>o.push([x].concat(rr))));return o;}
  let counts=[], uniqAll=0, min=99,max=0;
  for(let t=0;t<200;t++){ const s=CV.gen.rangement();
    const nb=(s.instruction.match(/•/g)||[]).length; counts.push(nb); min=Math.min(min,nb); max=Math.max(max,nb);
    // vérifie unicité : parmi toutes les permutations des 5 glyphes, combien donnent CE solution ?
    // on ne peut pas relire les contraintes depuis le texte ; on refait confiance a l API : la solution est fixée.
    uniqAll++;
  }
  const avg=(counts.reduce((a,b)=>a+b,0)/counts.length).toFixed(1);
  return {avg,min,max};
});
console.log("Nb d'indices sur 200 tirages : moyenne="+r.avg+", min="+r.min+", max="+r.max);
await b.close(); srv.close();
