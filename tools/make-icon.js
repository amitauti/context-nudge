#!/usr/bin/env node
// Regenerates .claude-plugin/icon.png (512x512, flat, no dependencies).
// Usage: node tools/make-icon.js [out.png]
// Mark: a chat bubble holding a "fresh start" circular arrow. Edit the constants to restyle.
'use strict';
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const SIZE = 512, SS = 4;                 // output px, supersampling factor
const ACCENT = [79, 70, 229];             // #4F46E5 background
const MARK = [255, 255, 255];             // bubble colour

const inRRect = (x, y, x0, y0, x1, y1, r) => {
  const cx = Math.min(Math.max(x, x0 + r), x1 - r), cy = Math.min(Math.max(y, y0 + r), y1 - r);
  return x >= x0 && x <= x1 && y >= y0 && y <= y1 && (x - cx) ** 2 + (y - cy) ** 2 <= r * r;
};
const inTri = (x, y, [ax, ay], [bx, by], [cx, cy]) => {
  const s = (px, py, qx, qy) => (x - qx) * (py - qy) - (px - qx) * (y - qy);
  const d1 = s(ax, ay, bx, by), d2 = s(bx, by, cx, cy), d3 = s(cx, cy, ax, ay);
  return !((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0));
};

// Circular arrow geometry (screen coords, y down, angles clockwise).
const C = [256, 226], R = 68, W = 28, GAP_START = 300, GAP_END = 345;
const rad = (d) => (d * Math.PI) / 180;
const tip = (() => {
  const a = rad(GAP_START), px = C[0] + R * Math.cos(a), py = C[1] + R * Math.sin(a);
  const t = [-Math.sin(a), Math.cos(a)], n = [Math.cos(a), Math.sin(a)];
  return [[px + t[0] * 44, py + t[1] * 44], [px + n[0] * 38, py + n[1] * 38], [px - n[0] * 38, py - n[1] * 38]];
})();
const inArrow = (x, y) => {
  const dx = x - C[0], dy = y - C[1], d = Math.hypot(dx, dy);
  if (Math.abs(d - R) <= W / 2) {
    let a = (Math.atan2(dy, dx) * 180) / Math.PI; if (a < 0) a += 360;
    if (a <= GAP_START || a >= GAP_END) return true;
  }
  return inTri(x, y, tip[0], tip[1], tip[2]);
};

// 0 = transparent, 1 = accent, 2 = bubble, 3 = arrow (accent on bubble)
const sample = (x, y) => {
  if (!inRRect(x, y, 0, 0, SIZE, SIZE, 112)) return 0;
  const bubble = inRRect(x, y, 92, 100, 420, 350, 64) || inTri(x, y, [140, 330], [130, 424], [236, 340]);
  if (!bubble) return 1;
  return inArrow(x, y) ? 3 : 2;
};

const raw = Buffer.alloc((SIZE * 4 + 1) * SIZE);
for (let py = 0; py < SIZE; py++) {
  raw[py * (SIZE * 4 + 1)] = 0;
  for (let px = 0; px < SIZE; px++) {
    let r = 0, g = 0, b = 0, a = 0;
    for (let sy = 0; sy < SS; sy++) for (let sx = 0; sx < SS; sx++) {
      const k = sample(px + (sx + 0.5) / SS, py + (sy + 0.5) / SS);
      if (!k) continue;
      const c = k === 2 ? MARK : ACCENT;
      r += c[0]; g += c[1]; b += c[2]; a += 1;
    }
    const o = py * (SIZE * 4 + 1) + 1 + px * 4, n = SS * SS;
    raw[o] = a ? Math.round(r / a) : 0; raw[o + 1] = a ? Math.round(g / a) : 0;
    raw[o + 2] = a ? Math.round(b / a) : 0; raw[o + 3] = Math.round((255 * a) / n);
  }
}

const crcTable = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
const crc = (buf) => { let c = 0xffffffff; for (const x of buf) c = crcTable[(c ^ x) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
const chunk = (type, data) => {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const c = Buffer.alloc(4); c.writeUInt32BE(crc(td));
  return Buffer.concat([len, td, c]);
};
const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(SIZE, 0); ihdr.writeUInt32BE(SIZE, 4); ihdr[8] = 8; ihdr[9] = 6;
const png = Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);

const out = process.argv[2] || path.join(__dirname, '..', '.claude-plugin', 'icon.png');
fs.writeFileSync(out, png);
console.log(`wrote ${out} (${png.length} bytes)`);
