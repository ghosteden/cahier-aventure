/* Recale chaque image d'une bande sur le CENTRE DE MASSE de la première.
   Adapté aux objets qui se désagrègent (nuage qui s'évapore, plateforme qui se casse) :
   le centre de masse reste sur place, contrairement à la boîte englobante que les éclats
   qui volent au loin viennent fausser. Décalage plafonné : on corrige une erreur de calage,
   on n'écrase pas l'animation. */
import fs from "fs"; import zlib from "zlib";
function crc32(b){let c,t=[];for(let n=0;n<256;n++){c=n;for(let k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;t[n]=c>>>0;}
  let r=0xFFFFFFFF;for(const x of b)r=t[(r^x)&255]^(r>>>8);return (r^0xFFFFFFFF)>>>0;}
function chunk(ty,d){const l=Buffer.alloc(4);l.writeUInt32BE(d.length);const td=Buffer.concat([Buffer.from(ty,"ascii"),d]);
  const c=Buffer.alloc(4);c.writeUInt32BE(crc32(td));return Buffer.concat([l,td,c]);}
function decode(f){const b=fs.readFileSync(f),W=b.readUInt32BE(16),H=b.readUInt32BE(20);let idat=Buffer.alloc(0),p=8;
  while(p<b.length){const l=b.readUInt32BE(p),t=b.toString("ascii",p+4,p+8);
    if(t==="IDAT")idat=Buffer.concat([idat,b.slice(p+8,p+8+l)]);p+=12+l;}
  const raw=zlib.inflateSync(idat),bpp=4,st=W*4,o2=Buffer.alloc(H*st);let o=0;
  for(let y=0;y<H;y++){const ft=raw[o++],ln=raw.slice(o,o+st);o+=st;
    for(let x=0;x<st;x++){const a=x>=bpp?o2[y*st+x-bpp]:0,u=y>0?o2[(y-1)*st+x]:0,c=(x>=bpp&&y>0)?o2[(y-1)*st+x-bpp]:0;
      let v=ln[x];if(ft===1)v+=a;else if(ft===2)v+=u;else if(ft===3)v+=(a+u)>>1;
      else if(ft===4){const pa=Math.abs(u-c),pb=Math.abs(a-c),pc=Math.abs(a+u-2*c);v+=(pa<=pb&&pa<=pc)?a:(pb<=pc?u:c);}
      o2[y*st+x]=v&255;}}
  return {W,H,d:o2};}
function encode(W,H,d,f){const st=W*4,raw=Buffer.alloc(H*(st+1));
  for(let y=0;y<H;y++){raw[y*(st+1)]=0;d.copy(raw,y*(st+1)+1,y*st,(y+1)*st);}
  const ih=Buffer.alloc(13);ih.writeUInt32BE(W,0);ih.writeUInt32BE(H,4);ih[8]=8;ih[9]=6;
  fs.writeFileSync(f,Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk("IHDR",ih),
    chunk("IDAT",zlib.deflateSync(raw,{level:9})),chunk("IEND",Buffer.alloc(0))]));}

const file = process.argv[2], cellArg = +process.argv[3], CAP = +process.argv[4] || 40;
const { W, H, d } = decode(file);
const cell = cellArg || H, n = Math.round(W / cell);
function bboxCenter(f) {                     // milieu de la boîte englobante de l'image
  let a = -1, b = -1;
  for (let x = 0; x < cell; x++) {
    let any = false;
    for (let y = 0; y < H; y++) if (d[(y * W + f * cell + x) * 4 + 3] > 20) { any = true; break; }
    if (any) { if (a < 0) a = x; b = x; }
  }
  return a < 0 ? null : (a + b) / 2;
}
const target = cell / 2;                     // tout le monde doit être centré dans sa cellule
const shifts = [];
for (let f = 0; f < n; f++) {
  const cf = bboxCenter(f);
  let s = cf == null ? 0 : Math.round(cf - target);
  s = Math.max(-CAP, Math.min(CAP, s));
  shifts.push(s);
}
const out = Buffer.alloc(W * H * 4);
for (let f = 0; f < n; f++) for (let y = 0; y < H; y++) for (let x = 0; x < cell; x++) {
  const src = x + shifts[f];
  if (src < 0 || src >= cell) continue;
  const si = (y * W + f * cell + src) * 4, di = (y * W + f * cell + x) * 4;
  d.copy(out, di, si, si + 4);
}
encode(W, H, out, file);
console.log(file.split(/[\/]/).pop().padEnd(24), n + " images | recalage :", shifts.join(", "), "px");
