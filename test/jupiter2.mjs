import http from "http"; import fs from "fs"; import path from "path";
import { chromium } from "playwright";
const ROOT=path.resolve("public"), SHOTS=path.resolve("test/shots");
const T={".html":"text/html",".css":"text/css",".js":"text/javascript",".png":"image/png",".webmanifest":"application/manifest+json"};
const srv=http.createServer((q,r)=>{let p=path.join(ROOT,decodeURIComponent(q.url.split("?")[0])); if(q.url==="/")p=path.join(ROOT,"index.html"); if(q.url.includes("/.netlify/")){r.writeHead(404);r.end();return;} fs.readFile(p,(e,d)=>{if(e){r.writeHead(404);r.end();return;} r.writeHead(200,{"Content-Type":T[path.extname(p)]||"application/octet-stream"});r.end(d);});});
await new Promise(r=>srv.listen(8252,r));
const errors=[]; const b=await chromium.launch();
const page=await (await b.newContext({viewport:{width:414,height:900}})).newPage();
page.on("pageerror",e=>errors.push("PAGEERROR: "+e.message));
page.on("response",r=>{ if(r.status()===404 && /gem/.test(r.url())) errors.push("404 "+r.url().split("/").pop()); });
await page.goto("http://localhost:8252/index.html",{waitUntil:"domcontentloaded"});
await page.waitForSelector("#app:not([hidden])");
await page.fill("#login-name","Gabi"); await page.click('button:has-text("C\'est parti")');
await page.waitForSelector(".map-viewport");
await page.evaluate(()=>{const s=CV.Store.current(); s.currentDay=45; s.heroWorld=4; CV.Store.save();});
await page.reload({waitUntil:"domcontentloaded"});
await page.waitForSelector(".map-viewport");
await page.evaluate(()=>{ CV.drawMix=()=>Array.from({length:20},()=>({type:"qcm",q:"2+2 ?",choices:["4","5","6"],answer:0})); });
await page.waitForTimeout(400);
await page.evaluate(()=>document.querySelectorAll(".planet-hit")[4].click());   // Jupiter = pierre 5
await page.waitForSelector(".node-sheet");
await page.locator('.node-sheet .btn.big').click();
await page.waitForSelector(".catch-hero",{timeout:5000});
await page.waitForTimeout(300);
const x0 = await page.evaluate(()=>document.querySelector(".catch-hero").style.left);
// bonne réponse -> diamant tombe + héros bouge
await page.locator(".choice").first().click();
await page.waitForTimeout(1050);
const mid = await page.evaluate(()=>({ gems:document.querySelectorAll(".catch-gem").length, x:document.querySelector(".catch-hero").style.left,
  pose:(document.querySelector(".catch-hero .hero-strip").style.backgroundImage.match(/hero-espace-[a-z]+/)||["?"])[0] }));
await page.screenshot({path:path.join(SHOTS,"jupiter-catch.png")});
await page.waitForTimeout(1400);
const hud = await page.evaluate(()=>document.querySelector(".planet-steps").textContent);
console.log("Départ x =", x0, "| pendant la chute : diamants =", mid.gems, "héros x =", mid.x, "pose =", mid.pose);
console.log("HUD après attrape :", hud);
console.log("Erreurs:", errors.length, errors.slice(0,3));
await b.close(); srv.close();
