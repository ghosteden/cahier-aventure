import http from "http"; import fs from "fs"; import path from "path";
import { chromium } from "playwright";
const ROOT=path.resolve("public");
const T={".html":"text/html",".css":"text/css",".js":"text/javascript",".svg":"image/svg+xml",".png":"image/png",".webmanifest":"application/manifest+json"};
const srv=http.createServer((q,r)=>{let p=path.join(ROOT,decodeURIComponent(q.url.split("?")[0])); if(q.url==="/")p=path.join(ROOT,"index.html"); fs.readFile(p,(e,d)=>{if(e){r.writeHead(404);r.end();return;} r.writeHead(200,{"Content-Type":T[path.extname(p)]||"application/octet-stream"});r.end(d);});});
await new Promise(r=>srv.listen(8254,r));
const errors=[], ext=[];
const b=await chromium.launch();
const page=await (await b.newContext({viewport:{width:414,height:900}})).newPage();
page.on("pageerror",e=>errors.push("PAGEERROR: "+e.message));
page.on("request",r=>{ const u=r.url(); if(!u.startsWith("http://localhost:8254") && !u.startsWith("data:")) ext.push(u); });
await page.goto("http://localhost:8254/index.html",{waitUntil:"domcontentloaded"});
await page.waitForSelector("#app:not([hidden])");
// vérifie qu'il n'y a plus de bouton Cloud sur le login
const hasCloud = await page.evaluate(()=>document.body.textContent.includes("Cloud"));
await page.fill("#login-name","Gabi"); await page.click('button:has-text("C\'est parti")');
await page.waitForSelector(".map-viewport");
await page.click('.nav-btn[data-go="#/profil"]');
await page.waitForTimeout(300);
const profilCloud = await page.evaluate(()=>document.body.textContent.includes("☁️")||document.body.textContent.includes("Cloud"));
// vérifie la persistance locale
const saved = await page.evaluate(()=>!!localStorage.getItem("cv:current"));
console.log("Bouton Cloud au login :", hasCloud? "❌ encore présent":"✅ retiré");
console.log("Cloud dans le profil  :", profilCloud? "❌ encore présent":"✅ retiré");
console.log("Sauvegarde locale     :", saved? "✅ écrite dans localStorage":"❌");
console.log("Requêtes réseau externes :", ext.length? ("❌ "+ext.join(", ")):"✅ aucune");
console.log("Erreurs JS :", errors.length, errors.slice(0,3));
await b.close(); srv.close();
