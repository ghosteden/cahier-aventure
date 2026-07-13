import http from "http"; import fs from "fs"; import path from "path";
import { chromium } from "playwright";
const ROOT=path.resolve("public"), SHOTS=path.resolve("test/shots");
const T={".html":"text/html",".css":"text/css",".js":"text/javascript",".png":"image/png",".webmanifest":"application/manifest+json"};
const srv=http.createServer((q,r)=>{let p=path.join(ROOT,decodeURIComponent(q.url.split("?")[0])); if(q.url==="/")p=path.join(ROOT,"index.html"); if(q.url.includes("/.netlify/")){r.writeHead(404);r.end();return;} fs.readFile(p,(e,d)=>{if(e){r.writeHead(404);r.end();return;} r.writeHead(200,{"Content-Type":T[path.extname(p)]||"application/octet-stream"});r.end(d);});});
await new Promise(r=>srv.listen(8227,r));
const errors=[]; const b=await chromium.launch();
const page=await (await b.newContext({viewport:{width:414,height:900}})).newPage();
page.on("pageerror",e=>errors.push("PAGEERROR: "+e.message));
page.on("response",r=>{ if(r.status()===404 && /cloud/.test(r.url())) errors.push("404 "+r.url()); });
try{
  await page.goto("http://localhost:8227/index.html",{waitUntil:"domcontentloaded"});
  await page.waitForSelector("#app:not([hidden])");
  await page.fill("#login-name","Gabi"); await page.click('button:has-text("C\'est parti")');
  await page.waitForSelector(".map-viewport");
  await page.evaluate(()=>{const s=CV.Store.current(); s.currentDay=37; CV.Store.save(); location.reload();});  // Lune = pierre 1
  await page.waitForSelector(".map-viewport");
  await page.evaluate(()=>{ CV.drawMix=()=>Array.from({length:8},()=>({type:"qcm",q:"2+2 ?",choices:["4","5","6"],answer:0})); });
  await page.waitForTimeout(400);
  await page.locator(".stone.current").click({force:true});
  await page.waitForSelector(".node-sheet");
  await page.click('.node-sheet button:has-text("Jouer"), .node-sheet button:has-text("Rejouer")');
  await page.waitForSelector(".planet-stage");
  await page.waitForTimeout(500);
  console.log("Plateformes posées :", await page.locator(".planet-prop").count());
  await page.screenshot({path:path.join(SHOTS,"lune-01-depart.png")});
  for(let i=0;i<2;i++){ await page.locator(".choice").first().click(); await page.waitForTimeout(1400); }
  const st=await page.evaluate(()=>[...document.querySelectorAll(".planet-prop .hero-strip")].map(s=>({
    img:(s.style.backgroundImage.match(/cloud-venus-\d/)||["?"])[0],
    anim: s.style.animation ? "dissipé" : "intact", fige: s.style.transform || "-" })));
  console.log("État des nuages après 2 bonds :"); st.forEach((s,i)=>console.log("   nuage "+(i+1)+" :", s.img, "→", s.anim, s.fige));
  await page.screenshot({path:path.join(SHOTS,"lune-02-casse.png")});
}catch(e){console.log("ERREUR:",e.message);}
finally{console.log("Erreurs:",errors.length,errors.slice(0,3)); await b.close(); srv.close();}
