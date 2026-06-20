import fs from "fs"; import { PNG } from "pngjs";
const A="public/assets";
function keyAndSegment(key){
  const file=`${A}/sprite-${key}.png`;
  const png=PNG.sync.read(fs.readFileSync(file));
  const {width:W,height:H,data}=png;
  for(let i=0;i<data.length;i+=4){ if((data[i]+data[i+1]+data[i+2])<60 && Math.max(data[i],data[i+1],data[i+2])<30) data[i+3]=0; }
  const colOcc=new Array(W).fill(0), rowOcc=new Array(H).fill(0);
  for(let y=0;y<H;y++) for(let x=0;x<W;x++){ if(data[(y*W+x)*4+3]>40){ colOcc[x]++; rowOcc[y]++; } }
  // premières runs non vides
  const firstRun=(arr,thr)=>{ let s=-1; for(let i=0;i<arr.length;i++){ if(arr[i]>thr){ if(s<0)s=i; } else if(s>=0){ return [s,i-1]; } } return s>=0?[s,arr.length-1]:null; };
  const cx=firstRun(colOcc,1), ry=firstRun(rowOcc,1);
  if(!cx||!ry){ console.log(key,"-> rien"); return; }
  const pad=4; let [x0,x1]=cx,[y0,y1]=ry; x0=Math.max(0,x0-pad);y0=Math.max(0,y0-pad);x1=Math.min(W-1,x1+pad);y1=Math.min(H-1,y1+pad);
  const w=x1-x0+1,h=y1-y0+1;
  const out=new PNG({width:w,height:h});
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){const si=((y+y0)*W+(x+x0))*4,di=(y*w+x)*4;out.data[di]=data[si];out.data[di+1]=data[si+1];out.data[di+2]=data[si+2];out.data[di+3]=data[si+3];}
  fs.writeFileSync(`${A}/hero-${key}.png`,PNG.sync.write(out));
  console.log(`hero-${key}.png ${w}x${h} (x:${x0}-${x1} y:${y0}-${y1})`);
}
["dinosaure","ulysse","chevalier","pirate","espace"].forEach(keyAndSegment);
