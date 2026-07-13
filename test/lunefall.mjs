import http from "http"; import fs from "fs"; import path from "path";
import { chromium } from "playwright";
const ROOT=path.resolve("public"), SHOTS=path.resolve("test/shots");
const T={".html":"text/html",".css":"text/css",".js":"text/javascript",".png":"image/png",".webmanifest":"application/manifest+json"};
const srv=http.createServer((q,r)=>{let p=path.join(ROOT,decodeURIComponent(q.url.split("?")[0])); if(q.url==="/")p=path.join(ROOT,"index.html"); if(q.url.includes("/.netlify/")){r.writeHead(404);r.end();return;} fs.readFile(p,(e,d)=>{if(e){r.writeHead(404);r.end();return;} r.writeHead(200,{"Content-Type":T[path.extname(p)]||"application/octet-stream"});r.end(d);});});
await new Promise(r=>srv.listen(8233,r));
const errors=[]; const b=await chromium.launch();
const page=await (await b.newContext({viewport:{width:414,height:900}})).newPage();
page.on("pageerror",e=>errors.push("PAGEERROR: "+e.message));
await page.goto("http://localhost:8233/index.html",{waitUntil:"domcontentloaded"});
await page.waitForSelector("#app:not([hidden])");
await page.fill("#login-name","Gabi"); await page.click('button:has-text("C\'est parti")');
await page.waitForSelector(".map-viewport");
await page.evaluate(()=>{const s=CV.Store.current(); s.currentDay=37; CV.Store.save(); location.reload();});
await page.waitForSelector(".map-viewport");
await page.evaluate(()=>{ CV.drawMix=()=>Array.from({length:14},()=>({type:"qcm",q:"2+2 ?",choices:["4","5","6"],answer:0})); });
await page.waitForTimeout(400);
await page.locator(".stone.current").click({force:true});
await page.waitForSelector(".node-sheet");
await page.click('.node-sheet button:has-text("Jouer"), .node-sheet button:has-text("Rejouer")');
await page.waitForSelector(".planet-stage"); await page.waitForTimeout(400);
const st = () => page.evaluate(()=>({
  pos: document.querySelector(".planet-steps").textContent.trim(),
  plateformes: [...document.querySelectorAll(".planet-prop")].map(e=>({
    x:e.style.left, op:e.style.opacity||"1",
    cassee: !!e.querySelector(".hero-strip").style.animation }))
}));
// 3 bonnes réponses : il monte
for(let i=0;i<3;i++){ await page.locator(".choice").first().click(); await page.waitForTimeout(1400); }
let s = await st();
console.log("Après 3 bonnes réponses :", s.pos);
console.log("   plateformes cassées :", s.plateformes.filter(p=>p.cassee).length, "(attendu 0 — elles doivent rester)");
await page.screenshot({path:path.join(SHOTS,"lune-monte.png")});
// 1 mauvaise réponse : la plateforme sous lui se brise, il retombe
await page.locator(".choice").nth(1).click();
await page.waitForTimeout(300);
const cont = page.locator('button:has-text("compris"), button:has-text("Terminer")').first();
if (await cont.count() && await cont.isVisible()) await cont.click();
await page.waitForTimeout(700);
s = await st();
console.log("\nJuste après l'erreur :", s.pos, "| plateforme en train de se briser :", s.plateformes.filter(p=>p.cassee).length);
await page.screenshot({path:path.join(SHOTS,"lune-casse.png")});
await page.waitForTimeout(1600);
s = await st();
console.log("Après la repousse   :", s.pos, "| plateformes visibles :", s.plateformes.filter(p=>p.op!=="0").length+"/8");
console.log("   positions x :", s.plateformes.map(p=>p.x).join(" "));
await page.screenshot({path:path.join(SHOTS,"lune-repousse.png")});
console.log("\nErreurs JS:", errors.length, errors.slice(0,3));
await b.close(); srv.close();
