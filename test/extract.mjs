import fs from "fs"; import { PNG } from "pngjs";
const ASSETS="public/assets";
const sprites=["dinosaure","ulysse","chevalier","pirate","espace"];
for(const key of sprites){
  const file=`${ASSETS}/sprite-${key}.png`;
  if(!fs.existsSync(file)){ console.log("manque:",file); continue; }
  const png=PNG.sync.read(fs.readFileSync(file));
  const {width:W,height:H,data}=png;
  // 1) chroma-key : pixels quasi-noirs -> transparents
  const isBg=(i)=> (data[i]+data[i+1]+data[i+2])<55 && Math.max(data[i],data[i+1],data[i+2])<28;
  for(let i=0;i<data.length;i+=4){ if(isBg(i)) data[i+3]=0; }
  // 2) bbox du 1er personnage : on cherche dans la bande haut-gauche
  const X0=0, X1=Math.floor(W/6), Y0=0, Y1=Math.floor(H/4);
  let minx=1e9,miny=1e9,maxx=-1,maxy=-1;
  for(let y=Y0;y<Y1;y++) for(let x=X0;x<X1;x++){ const i=(y*W+x)*4; if(data[i+3]>40){ if(x<minx)minx=x; if(x>maxx)maxx=x; if(y<miny)miny=y; if(y>maxy)maxy=y; } }
  if(maxx<0){ console.log(key,"-> rien détecté"); continue; }
  const pad=6; minx=Math.max(0,minx-pad); miny=Math.max(0,miny-pad); maxx=Math.min(W-1,maxx+pad); maxy=Math.min(H-1,maxy+pad);
  const w=maxx-minx+1, h=maxy-miny+1;
  const out=new PNG({width:w,height:h});
  for(let y=0;y<h;y++) for(let x=0;x<w;x++){ const si=((y+miny)*W+(x+minx))*4, di=(y*w+x)*4; out.data[di]=data[si]; out.data[di+1]=data[si+1]; out.data[di+2]=data[si+2]; out.data[di+3]=data[si+3]; }
  const dest=`${ASSETS}/hero-${key}.png`;
  fs.writeFileSync(dest, PNG.sync.write(out));
  console.log(`hero-${key}.png  ${w}x${h}  (depuis frame en ${minx},${miny})`);
}
