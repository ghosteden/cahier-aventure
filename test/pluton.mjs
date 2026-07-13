import http from "http"; import fs from "fs"; import path from "path";
import { chromium } from "playwright";
const ROOT=path.resolve("public"), SHOTS=path.resolve("test/shots");
const T={".html":"text/html",".css":"text/css",".js":"text/javascript",".png":"image/png",".webmanifest":"application/manifest+json"};
const srv=http.createServer((q,r)=>{let p=path.join(ROOT,decodeURIComponent(q.url.split("?")[0])); if(q.url==="/")p=path.join(ROOT,"index.html"); if(q.url.includes("/.netlify/")){r.writeHead(404);r.end();return;} fs.readFile(p,(e,d)=>{if(e){r.writeHead(404);r.end();return;} r.writeHead(200,{"Content-Type":T[path.extname(p)]||"application/octet-stream"});r.end(d);});});
await new Promise(r=>srv.listen(8239,r));
const errors=[]; const b=await chromium.launch();
const page=await (await b.newContext({viewport:{width:414,height:900}})).newPage();
page.on("pageerror",e=>errors.push("PAGEERROR: "+e.message));
page.on("response",r=>{ if(r.status()===404 && /\.png/.test(r.url())) errors.push("404 "+r.url().split("/").pop()); });
await page.goto("http://localhost:8239/index.html",{waitUntil:"domcontentloaded"});
await page.waitForSelector("#app:not([hidden])");
await page.fill("#login-name","Gabi"); await page.click('button:has-text("C\'est parti")');
await page.waitForSelector(".map-viewport");
// débloque Pluton : les 8 planètes jouées
await page.evaluate(()=>{const s=CV.Store.current(); s.currentDay=45; s.heroWorld=4;
  s.dayProgress=s.dayProgress||{}; for(let i=0;i<8;i++) s.dayProgress[37+i]={done:true,stars:3};
  CV.Store.save();});
await page.reload({waitUntil:"domcontentloaded"});
await page.waitForSelector(".map-viewport"); await page.waitForTimeout(600);
// raccourcit la partie pour le test
await page.evaluate(()=>{ CV.PLANETS[8].duration = 6; });
await page.evaluate(()=>document.querySelectorAll(".planet-hit")[8].click());
await page.waitForSelector(".node-sheet");
await page.locator('.node-sheet .btn.big').click();
await page.waitForSelector(".reward-stage",{timeout:5000});
await page.waitForTimeout(1200);
console.log("Fusée présente :", await page.locator(".reward-ship .hero-strip").count()? "✅":"❌");
// pilote : on balaie la fusée de haut en bas pour attraper des objets
const box = await page.locator(".reward-stage").boundingBox();
for (let i=0;i<10;i++){
  const y = box.y + box.height * (0.2 + 0.6*Math.abs(Math.sin(i)));
  await page.mouse.move(box.x + box.width*0.2, y);
  await page.waitForTimeout(180);
}
const mid = await page.evaluate(()=>({
  objets: document.querySelectorAll(".reward-item").length,
  hud: document.querySelector(".planet-steps").textContent
}));
console.log("En cours de partie :", mid);
await page.screenshot({path:path.join(SHOTS,"pluton.png")});
await page.waitForTimeout(6500);
const fin = await page.evaluate(()=>({ jeuFini: !document.querySelector(".reward-stage"),
  titre:(document.querySelector("h2")||{}).textContent }));
console.log("Fin de partie :", fin);
console.log("Erreurs:", errors.length, errors.slice(0,4));
await b.close(); srv.close();
