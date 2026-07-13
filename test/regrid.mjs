/* Reconstruit une bande de sprites PROPRE à partir d'une bande mal packée.
   On ne découpe plus sur une grille théorique (qui coupe les dessins) : on détecte les dessins
   réels via leurs colonnes opaques, on les regroupe par image, puis on les recentre chacun dans
   une cellule uniforme assez large pour tout contenir, avec de la marge. */
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

const file = process.argv[2], n = +process.argv[3], MARGIN = +process.argv[4] || 14;
const orig = file.replace(/\.png$/, ".orig.png");
const src = fs.existsSync(orig) ? orig : file;
if (!fs.existsSync(orig)) fs.copyFileSync(file, orig);
const { W, H, d } = decode(src);
const colFull = (x) => { for (let y = 0; y < H; y++) if (d[(y * W + x) * 4 + 3] > 8) return true; return false; };

// 1) blocs de dessin (suites de colonnes opaques)
const runs = []; let s = -1;
for (let x = 0; x < W; x++) { const f = colFull(x); if (f && s < 0) s = x; if ((!f || x === W - 1) && s >= 0) { runs.push([s, f ? x : x - 1]); s = -1; } }

// 2) chaque bloc est rattaché à l'image dont il occupe le pas (pitch = W / n)
const pitch = W / n;
const frames = Array.from({ length: n }, () => null);
for (const [a, b] of runs) {
  const k = Math.min(n - 1, Math.max(0, Math.floor(((a + b) / 2) / pitch)));
  frames[k] = frames[k] ? [Math.min(frames[k][0], a), Math.max(frames[k][1], b)] : [a, b];
}

// 3) cellule uniforme = le plus large des dessins + marge
const widths = frames.filter(Boolean).map(([a, b]) => b - a + 1);
const cell = Math.max(...widths) + MARGIN * 2;
const NW = cell * n, out = Buffer.alloc(NW * H * 4);
frames.forEach((fr, k) => {
  if (!fr) return;                                  // image vide (objet totalement disparu)
  const [a, b] = fr, w = b - a + 1;
  const dst = k * cell + Math.round((cell - w) / 2); // recentré dans sa cellule
  for (let y = 0; y < H; y++) {
    const si = (y * W + a) * 4, di = (y * NW + dst) * 4;
    d.copy(out, di, si, si + w * 4);
  }
});
encode(NW, H, out, file);
console.log(file.split(/[\/]/).pop().padEnd(24), n + " images | dessins de " + Math.min(...widths) + "→" + Math.max(...widths) + "px | nouvelle cellule " + cell + "×" + H);
