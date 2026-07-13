// Découpe les N premières cellules d'une bande de sprites dans un nouveau PNG.
import fs from "fs"; import zlib from "zlib";

function crc32(buf) {
  let c, t = [];
  for (let n = 0; n < 256; n++) { c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; }
  let crc = 0xFFFFFFFF;
  for (const b of buf) crc = t[(crc ^ b) & 0xFF] ^ (crc >>> 8);
  return (crc ^ 0xFFFFFFFF) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
function decode(f) {
  const b = fs.readFileSync(f), W = b.readUInt32BE(16), H = b.readUInt32BE(20);
  let idat = Buffer.alloc(0), p = 8;
  while (p < b.length) { const len = b.readUInt32BE(p), t = b.toString("ascii", p + 4, p + 8);
    if (t === "IDAT") idat = Buffer.concat([idat, b.slice(p + 8, p + 8 + len)]); p += 12 + len; }
  const raw = zlib.inflateSync(idat), bpp = 4, stride = W * 4, out = Buffer.alloc(H * stride);
  let o = 0;
  for (let y = 0; y < H; y++) {
    const ft = raw[o++], line = raw.slice(o, o + stride); o += stride;
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? out[y * stride + x - bpp] : 0, u = y > 0 ? out[(y - 1) * stride + x] : 0,
        c = (x >= bpp && y > 0) ? out[(y - 1) * stride + x - bpp] : 0;
      let v = line[x];
      if (ft === 1) v += a; else if (ft === 2) v += u; else if (ft === 3) v += (a + u) >> 1;
      else if (ft === 4) { const pa = Math.abs(u - c), pb = Math.abs(a - c), pc = Math.abs(a + u - 2 * c); v += (pa <= pb && pa <= pc) ? a : (pb <= pc ? u : c); }
      out[y * stride + x] = v & 255;
    }
  }
  return { W, H, d: out };
}
function encode(W, H, d, file) {
  const stride = W * 4, raw = Buffer.alloc(H * (stride + 1));
  for (let y = 0; y < H; y++) { raw[y * (stride + 1)] = 0; d.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride); }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4); ihdr[8] = 8; ihdr[9] = 6;
  fs.writeFileSync(file, Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr), chunk("IDAT", zlib.deflateSync(raw, { level: 9 })), chunk("IEND", Buffer.alloc(0))
  ]));
}

const [src, dst, cellW, n] = [process.argv[2], process.argv[3], +process.argv[4], +process.argv[5]];
const { W, H, d } = decode(src);
const nw = cellW * n, out = Buffer.alloc(nw * H * 4);
for (let y = 0; y < H; y++) d.copy(out, y * nw * 4, y * W * 4, y * W * 4 + nw * 4);
encode(nw, H, out, dst);
console.log("écrit :", dst, nw + "x" + H, "(" + n + " cellules de " + cellW + ")");
