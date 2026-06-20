import http from "http"; import fs from "fs"; import path from "path";
import { chromium } from "playwright";
const ROOT = path.resolve("public");
const T = { ".html":"text/html",".css":"text/css",".js":"text/javascript",".svg":"image/svg+xml",".png":"image/png",".webmanifest":"application/manifest+json" };
const srv = http.createServer((req,res)=>{ let p=path.join(ROOT,decodeURIComponent(req.url.split("?")[0])); if(req.url==="/")p=path.join(ROOT,"index.html"); if(req.url.includes("/.netlify/"))  {res.writeHead(404);res.end();return;} fs.readFile(p,(e,d)=>{ if(e){res.writeHead(404);res.end();return;} res.writeHead(200,{"Content-Type":T[path.extname(p)]||"application/octet-stream"});res.end(d);});});
await new Promise(r=>srv.listen(8202,r));
const b=await chromium.launch();
const page=await (await b.newContext({viewport:{width:414,height:820}})).newPage();
page.on("pageerror",e=>console.log("PAGEERROR:",e.message));
await page.goto("http://localhost:8202/index.html",{waitUntil:"domcontentloaded"});
await page.waitForSelector("#app:not([hidden])");
await page.fill("#login-name","Gabi");
await page.click('button:has-text("C\'est parti")');
await page.waitForSelector(".map-viewport");
await page.waitForTimeout(1000);
const info = await page.evaluate(()=>{
  const s=document.querySelector(".stone.current");
  const r=s.getBoundingClientRect();
  // top element au centre de la pierre
  const top=document.elementFromPoint(r.left+r.width/2, r.top+r.height/2);
  return { rect:{x:Math.round(r.left),y:Math.round(r.top),w:Math.round(r.width),h:Math.round(r.height)},
           topEl: top? (top.className && top.className.baseVal!==undefined? "svg:"+top.className.baseVal : top.className||top.tagName) : "null" };
});
console.log("Pierre courante:", JSON.stringify(info));
// clic JS direct
const r1 = await page.evaluate(()=>{ document.querySelector(".stone.current").click(); return document.querySelectorAll(".node-sheet").length; });
console.log("Après .click() JS -> node-sheet:", r1);
await b.close(); srv.close();
