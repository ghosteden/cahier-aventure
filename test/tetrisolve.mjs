import http from "http"; import fs from "fs"; import path from "path";
import { chromium } from "playwright";
const ROOT=path.resolve("public");
const T={".html":"text/html",".css":"text/css",".js":"text/javascript",".png":"image/png",".webmanifest":"application/manifest+json"};
const srv=http.createServer((q,r)=>{let p=path.join(ROOT,decodeURIComponent(q.url.split("?")[0])); if(q.url==="/")p=path.join(ROOT,"index.html"); if(q.url.includes("/.netlify/")){r.writeHead(404);r.end();return;} fs.readFile(p,(e,d)=>{if(e){r.writeHead(404);r.end();return;} r.writeHead(200,{"Content-Type":T[path.extname(p)]||"application/octet-stream"});r.end(d);});});
await new Promise(r=>srv.listen(8249,r));
const b=await chromium.launch();
const page=await (await b.newContext()).newPage();
await page.goto("http://localhost:8249/index.html",{waitUntil:"domcontentloaded"});
await page.waitForFunction(()=>window.CV && CV.gen && CV.gen.tetrisForme);
const r = await page.evaluate(()=>{
  function solvable(step){
    const R=step.rows,C=step.cols,target=new Set(step.target);
    const pieces=step.pieces;
    function rec(idx,owner){
      if(idx>=pieces.length) return [...target].every(k=>owner[k]);
      const p=pieces[idx];
      for(let r=0;r<R;r++)for(let c=0;c<C;c++){
        if(p.cells.every(([dr,dc])=>{const k=(r+dr)+","+(c+dc);return target.has(k)&&!owner[k];})){
          const o2=Object.assign({},owner); p.cells.forEach(([dr,dc])=>o2[(r+dr)+","+(c+dc)]=p.id);
          if(rec(idx+1,o2)) return true;
        }
      }
      return false;
    }
    return rec(0,{});
  }
  let okMur=0, okForme=0;
  for(let i=0;i<30;i++){ if(solvable(CV.gen.tetrisMur())) okMur++; if(solvable(CV.gen.tetrisForme())) okForme++; }
  return {okMur, okForme};
});
console.log("tetrisMur   solubles :", r.okMur+"/30");
console.log("tetrisForme solubles :", r.okForme+"/30");
console.log(r.okMur===30 && r.okForme===30 ? "✅ toutes les grilles ont une solution" : "❌ certaines sont impossibles");
await b.close(); srv.close();
