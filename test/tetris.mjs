import http from "http"; import fs from "fs"; import path from "path";
import { chromium } from "playwright";
const ROOT=path.resolve("public"), SHOTS=path.resolve("test/shots");
const T={".html":"text/html",".css":"text/css",".js":"text/javascript",".png":"image/png",".webmanifest":"application/manifest+json"};
const srv=http.createServer((q,r)=>{let p=path.join(ROOT,decodeURIComponent(q.url.split("?")[0])); if(q.url==="/")p=path.join(ROOT,"index.html"); if(q.url.includes("/.netlify/")){r.writeHead(404);r.end();return;} fs.readFile(p,(e,d)=>{if(e){r.writeHead(404);r.end();return;} r.writeHead(200,{"Content-Type":T[path.extname(p)]||"application/octet-stream"});r.end(d);});});
await new Promise(r=>srv.listen(8248,r));
const errors=[]; const b=await chromium.launch();
const page=await (await b.newContext({viewport:{width:414,height:900}})).newPage();
page.on("pageerror",e=>errors.push("PAGEERROR: "+e.message));
page.on("console",m=>{ if(m.type()==="error"&&!m.text().includes("404")) errors.push(m.text()); });
await page.goto("http://localhost:8248/index.html",{waitUntil:"domcontentloaded"});
await page.waitForSelector("#app:not([hidden])");
await page.fill("#login-name","Gabi"); await page.click('button:has-text("C\'est parti")');
await page.waitForSelector(".map-viewport");

// vérifie structure sur 20 tirages de chaque
const check = await page.evaluate(()=>{
  const out={};
  for (const g of ["tetrisMur","tetrisForme"]) {
    let coverOk=0, hasSol=0;
    for (let i=0;i<20;i++){
      const s=CV.gen[g]();
      const cells=s.pieces.reduce((n,p)=>n+p.cells.length,0);
      if (cells===s.target.length) coverOk++;   // les pièces couvrent exactement la forme
      if (g==="tetrisMur" && s.solution && Object.keys(s.solution).length===s.pieces.length) hasSol++;
    }
    out[g]={coverOk, hasSol};
  }
  return out;
});
console.log("tetrisMur   : couverture exacte", check.tetrisMur.coverOk+"/20, solution complète", check.tetrisMur.hasSol+"/20");
console.log("tetrisForme : couverture exacte", check.tetrisForme.coverOk+"/20");

// affiche + résout tetrisMur via sa solution, puis valide
for (const g of ["tetrisMur","tetrisForme"]) {
  await page.evaluate((gg)=>{ CV.__t = CV.gen[gg](); const c=document.querySelector("#app"); c.innerHTML="";
    const box=document.createElement("div"); box.className="card"; c.appendChild(box);
    CV.Engine.run(box,[CV.__t],{onComplete:(r)=>{window.__res=r;}});
  }, g);
  await page.waitForSelector(".tt-board");
  await page.screenshot({path:path.join(SHOTS,"tetris-"+g+".png")});
  // résolution programmatique : pose chaque pièce (à sa solution pour mur ; en balayant pour forme)
  const solved = await page.evaluate((gg)=>{
    const step=CV.__t, R=step.rows, C=step.cols;
    const target=new Set(step.target), owner={};
    const place=(p,ar,ac)=>{ if(!p.cells.every(([dr,dc])=>{const k=(ar+dr)+","+(ac+dc); return target.has(k)&&!owner[k];})) return false;
      p.cells.forEach(([dr,dc])=>owner[(ar+dr)+","+(ac+dc)]=p.id); return true; };
    for (const p of step.pieces){
      if (step.mode==="exact"){ const [r,c]=step.solution[p.id]; place(p,r,c); }
      else { let done=false; for(let r=0;r<R&&!done;r++)for(let c=0;c<C&&!done;c++) if(place(p,r,c)) done=true; }
    }
    return [...target].every(k=>owner[k]);   // forme entièrement couverte par la solution trouvée
  }, g);
  console.log(g, "→ résoluble jusqu'au bout :", solved? "✅":"❌");
}
console.log("Erreurs JS:", errors.length, errors.slice(0,4));
await b.close(); srv.close();
