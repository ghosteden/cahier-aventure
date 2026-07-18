import http from "http"; import fs from "fs"; import path from "path";
import { chromium } from "playwright";
const ROOT=path.resolve("public"), SHOTS=path.resolve("test/shots");
const T={".html":"text/html",".css":"text/css",".js":"text/javascript",".png":"image/png",".webmanifest":"application/manifest+json"};
const srv=http.createServer((q,r)=>{let p=path.join(ROOT,decodeURIComponent(q.url.split("?")[0])); if(q.url==="/")p=path.join(ROOT,"index.html"); fs.readFile(p,(e,d)=>{if(e){r.writeHead(404);r.end();return;} r.writeHead(200,{"Content-Type":T[path.extname(p)]||"application/octet-stream"});r.end(d);});});
await new Promise(r=>srv.listen(8258,r));
const errors=[]; const b=await chromium.launch();
const page=await (await b.newContext({viewport:{width:414,height:900}})).newPage();
page.on("pageerror",e=>errors.push("PAGEERROR: "+e.message));
page.on("console",m=>{ if(m.type()==="error"&&!m.text().includes("404")) errors.push(m.text()); });
await page.goto("http://localhost:8258/index.html",{waitUntil:"domcontentloaded"});
await page.waitForSelector("#app:not([hidden])");
await page.fill("#login-name","Gabi"); await page.click('button:has-text("C\'est parti")');
await page.waitForSelector(".map-viewport");
// bouton 📍 présent pour Gabi (joueur normal) ?
const hasTool = await page.evaluate(()=>[...document.querySelectorAll("button")].some(b=>b.textContent==="📍"));
console.log("Bouton outil 📍 pour joueur normal :", hasTool? "❌ encore visible":"✅ retiré");
// structure des jeux
const s = await page.evaluate(()=>{
  const pool = CV.gen.logic.toString();
  const rem = !/logicSize|deduction/.test(pool.match(/pick\(\[[^\]]+\]/)[0]);
  const con = CV.gen.construction();
  const mur = CV.gen.tetrisMur(), forme = CV.gen.tetrisForme();
  return { poolClean: rem,
    construction: {type:con.type, briques:con.count, palette:con.palette.length, consignes:(con.instruction.match(/<br>/g)||[]).length+1, sol:Object.keys(con.solution).length},
    murSize:mur.rows+"x"+mur.cols+" "+mur.pieces.length+"p", formeSize:forme.rows+"x"+forme.cols+" "+forme.pieces.length+"p" };
});
console.log("Pool logique sans les jeux trop simples :", s.poolClean? "✅":"❌");
console.log("Construction :", JSON.stringify(s.construction));
console.log("Tetris mur:", s.murSize, "| forme:", s.formeSize);
// rend la construction pour screenshot + vérifie palette persistante
await page.evaluate(()=>{ CV.__c=CV.gen.construction(); const c=document.querySelector("#app"); c.innerHTML="";
  const box=document.createElement("div"); box.className="card"; c.appendChild(box); CV.Engine.run(box,[CV.__c],{onComplete:()=>{}}); });
await page.waitForSelector(".build-cell");
const paletteCount = await page.evaluate(()=>document.querySelectorAll(".build-pick").length);
console.log("Palette (couleurs + gomme) :", paletteCount, "(5 couleurs + gomme = 6 attendu)");
await page.screenshot({path:path.join(SHOTS,"construction.png")});
console.log("Erreurs JS :", errors.length, errors.slice(0,4));
await b.close(); srv.close();
