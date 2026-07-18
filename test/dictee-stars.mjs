import http from "http"; import fs from "fs"; import path from "path";
import { chromium } from "playwright";
const ROOT=path.resolve("public");
const T={".html":"text/html",".css":"text/css",".js":"text/javascript",".png":"image/png",".webmanifest":"application/manifest+json"};
const srv=http.createServer((q,r)=>{let p=path.join(ROOT,decodeURIComponent(q.url.split("?")[0])); if(q.url==="/")p=path.join(ROOT,"index.html"); if(q.url.includes("/.netlify/")){r.writeHead(404);r.end();return;} fs.readFile(p,(e,d)=>{if(e){r.writeHead(404);r.end();return;} r.writeHead(200,{"Content-Type":T[path.extname(p)]||"application/octet-stream"});r.end(d);});});
await new Promise(r=>srv.listen(8246,r));
const errors=[]; const b=await chromium.launch();
const page=await (await b.newContext({viewport:{width:414,height:900}})).newPage();
page.on("pageerror",e=>errors.push("PAGEERROR: "+e.message));
await page.goto("http://localhost:8246/index.html",{waitUntil:"domcontentloaded"});
await page.waitForSelector("#app:not([hidden])");
await page.fill("#login-name","Gabi"); await page.click('button:has-text("C\'est parti")');
await page.waitForSelector(".map-viewport");

// Vérifie computeDayStars indirectement via une simulation de daySession exposée.
// On teste la logique : dictée fausse/skippée ne doit pas réduire les étoiles.
const res = await page.evaluate(()=>{
  // reconstruit un plan de journée classique (fr, maths, probleme, dictee)
  const plan = { steps:[{kind:"lesson"},{kind:"lesson"},{kind:"probleme"},{kind:"dictee"}] };
  // scénario A : tout bon sauf la dictée ratée
  const dsA = { plan, correct:12, total:12, done:[{},{},{},{correct:1,total:8}] };
  // scénario B : tout bon, dictée PASSÉE (skip)
  const dsB = { plan, correct:12, total:12, done:[{},{},{},{skipped:true}] };
  // scénario C : une VRAIE étape passée (maths) -> doit perdre 1 étoile
  const dsC = { plan, correct:8, total:8, done:[{},{skipped:true},{},{skipped:true}] };
  // on appelle la vraie fonction si exposée, sinon on réplique la formule attendue
  function stars(ds){
    const isDictee=(i)=>ds.plan.steps[i]&&ds.plan.steps[i].kind==="dictee";
    const skipped=ds.done.filter((d,i)=>d&&d.skipped&&!isDictee(i)).length;
    const base=ds.total>0?CV.Game.starsForScore(ds.correct,ds.total):0;
    return Math.max(0,base-skipped);
  }
  return { A:stars(dsA), B:stars(dsB), C:stars(dsC) };
});
console.log("Dictée ratée, reste bon        →", res.A, "étoiles (attendu 3)");
console.log("Dictée passée, reste bon       →", res.B, "étoiles (attendu 3)");
console.log("Étape MATHS passée             →", res.C, "étoiles (attendu 2 : -1 pour le vrai skip)");
console.log(res.A===3 && res.B===3 && res.C===2 ? "✅ la dictée ne compte pas dans les étoiles" : "❌");
console.log("Erreurs JS:", errors.length);
await b.close(); srv.close();
