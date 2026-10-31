// Tiny helpers shared by the pixel world, sprites and game loop.

export const PAL = {
  ink: '#2a1830',
  inkSoft: '#4a2d4d',
  cream: '#fff4d9',
  creamDim: '#ead9b4',
  pink: '#ff6f9c',
  pinkLight: '#ffb3c9',
  pinkPale: '#ffd7e3',
  pinkDark: '#d4436f',
  plum: '#5c2b57',
  plumDeep: '#3a1c3d',
  gold: '#ffd166',
  goldDark: '#e0a52e',
  grass: '#77c47f',
  grassDark: '#57a464',
  grassLight: '#95d497',
  dirt: '#d9b98b',
  sand: '#efd8a8',
  water: '#58b7c9',
  waterDeep: '#3b93ad',
  waterLight: '#8fe0e4',
  skin: '#f6c9a0',
  skinShade: '#e0a97e',
  skinDark: '#c98a63',
  white: '#fffdf4',
};

export const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
export const lerp = (a, b, t) => a + (b - a) * t;
export const dist2 = (ax, ay, bx, by) => {
  const dx = ax - bx;
  const dy = ay - by;
  return dx * dx + dy * dy;
};
export const dist = (ax, ay, bx, by) => Math.sqrt(dist2(ax, ay, bx, by));

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function pick(rng, arr) {
  return arr[Math.floor(rng() * arr.length)];
}

export function range(rng, a, b) {
  return a + rng() * (b - a);
}

// Crisp, integer-aligned primitives so the art stays chunky at every scale.
export function pxRect(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

export function pxCircle(ctx, cx, cy, r, color) {
  ctx.fillStyle = color;
  const x0 = Math.round(cx);
  const y0 = Math.round(cy);
  const rr = Math.max(0, Math.round(r));
  for (let y = -rr; y <= rr; y++) {
    const half = Math.floor(Math.sqrt(rr * rr - y * y));
    if (half >= 0) ctx.fillRect(x0 - half, y0 + y, half * 2 + 1, 1);
  }
}

export function pxEllipse(ctx, cx, cy, rx, ry, color) {
  ctx.fillStyle = color;
  const x0 = Math.round(cx);
  const y0 = Math.round(cy);
  const rxx = Math.max(0, rx);
  const ryy = Math.max(0, ry);
  for (let y = -Math.round(ryy); y <= Math.round(ryy); y++) {
    const t = 1 - (y * y) / (ryy * ryy || 1);
    if (t < 0) continue;
    const half = Math.floor(rxx * Math.sqrt(t));
    ctx.fillRect(x0 - half, y0 + y, half * 2 + 1, 1);
  }
}

export function pxRing(ctx, cx, cy, r, color, thickness = 1) {
  ctx.fillStyle = color;
  const x0 = Math.round(cx);
  const y0 = Math.round(cy);
  const rr = Math.max(1, Math.round(r));
  const inner = Math.max(0, rr - thickness);
  for (let y = -rr; y <= rr; y++) {
    const halfOut = Math.floor(Math.sqrt(rr * rr - y * y));
    const yy = Math.abs(y);
    const halfIn = yy > inner ? -1 : Math.floor(Math.sqrt(Math.max(0, inner * inner - y * y)));
    if (halfIn < 0) {
      ctx.fillRect(x0 - halfOut, y0 + y, halfOut * 2 + 1, 1);
    } else {
      const w = halfOut - halfIn;
      if (w >= 0) {
        ctx.fillRect(x0 - halfOut, y0 + y, w, 1);
        ctx.fillRect(x0 + halfIn + 1, y0 + y, w, 1);
      }
    }
  }
}

// 5x7 bitmap font — guaranteed crisp and available offline.
const GLYPHS = {
  A: '01110/10001/10001/11111/10001/10001/10001',
  B: '11110/10001/10001/11110/10001/10001/11110',
  C: '01110/10001/10000/10000/10000/10001/01110',
  D: '11110/10001/10001/10001/10001/10001/11110',
  E: '11111/10000/10000/11110/10000/10000/11111',
  F: '11111/10000/10000/11110/10000/10000/10000',
  G: '01110/10001/10000/10111/10001/10001/01111',
  H: '10001/10001/10001/11111/10001/10001/10001',
  I: '11111/00100/00100/00100/00100/00100/11111',
  J: '00111/00010/00010/00010/00010/10010/01100',
  K: '10001/10010/10100/11000/10100/10010/10001',
  L: '10000/10000/10000/10000/10000/10000/11111',
  M: '10001/11011/10101/10101/10001/10001/10001',
  N: '10001/11001/10101/10011/10001/10001/10001',
  O: '01110/10001/10001/10001/10001/10001/01110',
  P: '11110/10001/10001/11110/10000/10000/10000',
  Q: '01110/10001/10001/10001/10101/10010/01101',
  R: '11110/10001/10001/11110/10100/10010/10001',
  S: '01111/10000/10000/01110/00001/00001/11110',
  T: '11111/00100/00100/00100/00100/00100/00100',
  U: '10001/10001/10001/10001/10001/10001/01110',
  V: '10001/10001/10001/10001/10001/01010/00100',
  W: '10001/10001/10001/10101/10101/10101/01010',
  X: '10001/10001/01010/00100/01010/10001/10001',
  Y: '10001/10001/01010/00100/00100/00100/00100',
  Z: '11111/00001/00010/00100/01000/10000/11111',
  0: '01110/10001/10011/10101/11001/10001/01110',
  1: '00100/01100/00100/00100/00100/00100/01110',
  2: '01110/10001/00001/00010/00100/01000/11111',
  3: '11110/00001/00001/01110/00001/00001/11110',
  4: '00010/00110/01010/10010/11111/00010/00010',
  5: '11111/10000/11110/00001/00001/10001/01110',
  6: '00110/01000/10000/11110/10001/10001/01110',
  7: '11111/00001/00010/00100/01000/01000/01000',
  8: '01110/10001/10001/01110/10001/10001/01110',
  9: '01110/10001/10001/01111/00001/00010/01100',
  '!': '00100/00100/00100/00100/00100/00000/00100',
  '+': '00000/00100/00100/11111/00100/00100/00000',
  '-': '00000/00000/00000/11111/00000/00000/00000',
  '.': '00000/00000/00000/00000/00000/00000/00100',
  '?': '01110/10001/00001/00010/00100/00000/00100',
  ':': '00000/00100/00100/00000/00100/00100/00000',
  '/': '00001/00010/00010/00100/01000/01000/10000',
  "'": '00100/00100/00000/00000/00000/00000/00000',
  '<': '00010/00100/01000/10000/01000/00100/00010',
  '>': '01000/00100/00010/00001/00010/00100/01000',
};

const parsed = {};
for (const [key, raw] of Object.entries(GLYPHS)) parsed[key] = raw.split('/');

const HEART5 = ['01010', '11111', '11111', '01110', '00100'];
const HEART3 = ['101', '111', '010'];

export function measureText(str, scale = 1) {
  return Math.max(0, String(str).length * 6 * scale - scale);
}

function blit(ctx, str, x, y, color, scale) {
  ctx.fillStyle = color;
  let cx = x;
  for (const ch of String(str).toUpperCase()) {
    const glyph = parsed[ch];
    if (glyph) {
      for (let r = 0; r < glyph.length; r++) {
        const row = glyph[r];
        for (let c = 0; c < row.length; c++) {
          if (row[c] === '1') ctx.fillRect(cx + c * scale, y + r * scale, scale, scale);
        }
      }
    }
    cx += 6 * scale;
  }
}

export function drawText(ctx, str, x, y, opts = {}) {
  const { color = PAL.cream, scale = 1, align = 'left', shadow = null, shadowOffset = 1 } = opts;
  const width = measureText(str, scale);
  let sx = Math.round(x);
  if (align === 'center') sx = Math.round(x - width / 2);
  else if (align === 'right') sx = Math.round(x - width);
  const sy = Math.round(y);
  if (shadow) blit(ctx, str, sx + shadowOffset, sy + shadowOffset, shadow, scale);
  blit(ctx, str, sx, sy, color, scale);
}

export function drawHeart(ctx, cx, cy, scale, color) {
  const s = Math.max(1, Math.round(scale));
  const w = 5 * s;
  const h = 5 * s;
  const x = Math.round(cx - w / 2);
  const y = Math.round(cy - h / 2);
  ctx.fillStyle = color;
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      if (HEART5[r][c] === '1') ctx.fillRect(x + c * s, y + r * s, s, s);
    }
  }
}

export function drawHeartSmall(ctx, cx, cy, scale, color) {
  const s = Math.max(1, Math.round(scale));
  const w = 3 * s;
  const h = 3 * s;
  const x = Math.round(cx - w / 2);
  const y = Math.round(cy - h / 2);
  ctx.fillStyle = color;
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      if (HEART3[r][c] === '1') ctx.fillRect(x + c * s, y + r * s, s, s);
    }
  }
}

// Outline helper for UI sprites drawn straight on the low-res canvas.
export function rectOutline(ctx, x, y, w, h, color) {
  pxRect(ctx, x, y, w, 1, color);
  pxRect(ctx, x, y + h - 1, w, 1, color);
  pxRect(ctx, x, y, 1, h, color);
  pxRect(ctx, x + w - 1, y, 1, h, color);
}

export function store(key, value) {
  try {
    localStorage.setItem(key, String(value));
  } catch {
    /* storage can be unavailable in private mode */
  }
}

export function load(key, fallback = null) {
  try {
    const value = localStorage.getItem(key);
    return value === null ? fallback : value;
  } catch {
    return fallback;
  }
}

export function vibrate(pattern) {
  try {
    if (navigator.vibrate) navigator.vibrate(pattern);
  } catch {
    /* not supported */
  }
}
