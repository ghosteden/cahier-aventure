import http from "http"; import fs from "fs"; import path from "path";
import { chromium } from "playwright";
const ROOT = path.resolve("public"), SHOTS = path.resolve("test/shots");
const T={".html":"text/html",".css":"text/css",".js":"text/javascript",".svg":"image/svg+xml",".png":"image/png",".webmanifest":"application/manifest+json"};
const srv=http.createServer((q,r)=>{let p=path.join(ROOT,decodeURIComponent(q.url.split("?")[0])); if(q.url==="/")p=path.join(ROOT,"index.html"); if(q.url.includes("/.netlify/")){r.writeHead(404);r.end();return;} fs.readFile(p,(e,d)=>{if(e){r.writeHead(404);r.end();return;} r.writeHead(200,{"Content-Type":T[path.extname(p)]||"application/octet-stream"});r.end(d);});});
await new Promise(r=>srv.listen(8218,r));
const errors=[]; const b=await chromium.launch();
const page=await (await b.newContext({viewport:{width:414,height:900}})).newPage();
page.on("pageerror",e=>errors.push("PAGEERROR: "+e.message));
try{
  await page.goto("http://localhost:8218/index.html",{waitUntil:"domcontentloaded"});
  await page.waitForSelector("#app:not([hidden])");
  await page.fill("#login-name","Gabi"); await page.click('button:has-text("C\'est parti")');
  await page.waitForSelector(".map-viewport");
  await page.evaluate(()=>{const s=CV.Store.current(); s.currentDay=38; CV.Store.save(); location.reload();});
  await page.waitForSelector(".map-viewport"); await page.waitForTimeout(1200);
  const t=await page.evaluate(()=>{const s=document.querySelector(".hero-token .hero-strip"), k=document.querySelector(".hero-token");
    return {img:(s.style.backgroundImage.match(/assets\/[^")]+/)||["?"])[0], w:k.style.width, h:k.style.height, visible:s.style.display!=="none"};});
  console.log("Jeton sur la carte Espace :", t);
  await page.screenshot({path:path.join(SHOTS,"rocket-carte.png")});
}catch(e){console.log("ERREUR:",e.message);}
finally{console.log("Erreurs JS:",errors.length,errors.slice(0,3)); await b.close(); srv.close();}
