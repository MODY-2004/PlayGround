import { PAL, clamp, mulberry32, pxRect, pxCircle, pxEllipse, pxRing, range, drawHeart } from './util.js';

export const WORLD = 1000;
const MARGIN = 46;

export function createWorld(seed = 20261031) {
  const rng = mulberry32(seed);
  const ground = document.createElement('canvas');
  ground.width = WORLD;
  ground.height = WORLD;
  const g = ground.getContext('2d');
  g.imageSmoothingEnabled = false;

  const plaza = { x: 500, y: 500, r: 150 };
  const pond = { x: 772, y: 244, rx: 114, ry: 80 };
  const plazaPath = [];

  // ---- Base lawn -------------------------------------------------
  pxRect(g, 0, 0, WORLD, WORLD, PAL.grass);
  const patchTones = ['#7bcb83', '#72bf7a', '#80cd86', '#74c17c'];
  for (let i = 0; i < 90; i++) {
    const x = range(rng, 30, WORLD - 30);
    const y = range(rng, 30, WORLD - 30);
    const r = range(rng, 6, 26);
    pxCircle(g, x, y, r, patchTones[i % patchTones.length]);
    if (rng() > 0.55) pxCircle(g, x + range(rng, -8, 8), y + range(rng, -8, 8), r * 0.55, patchTones[(i + 2) % patchTones.length]);
  }

  // ---- Winding path network --------------------------------------
  const diagonal = [];
  for (let i = 0; i <= 30; i++) {
    const t = i / 30;
    const x = 540 + (735 - 540) * t + Math.sin(t * Math.PI) * 18;
    const y = 510 + (306 - 510) * t;
    diagonal.push({ x, y });
    plazaPath.push({ x, y });
  }

  const paintPath = (points, radius, color) => {
    for (let i = 0; i < points.length - 1; i++) {
      const a = points[i];
      const b = points[i + 1];
      const d = Math.hypot(b.x - a.x, b.y - a.y);
      const steps = Math.max(1, Math.ceil(d / 5));
      for (let s = 0; s < steps; s++) {
        const t = s / steps;
        pxCircle(g, a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t, radius, color);
      }
    }
  };

  const vertical = [
    { x: 500, y: 20 },
    { x: 500, y: 980 },
  ];
  const horizontal = [
    { x: 20, y: 500 },
    { x: 980, y: 500 },
  ];

  paintPath(vertical, 46, '#dfc99c');
  paintPath(horizontal, 46, '#dfc99c');
  paintPath(diagonal, 33, '#dfc99c');
  paintPath(vertical, 37, '#f3e3bb');
  paintPath(horizontal, 37, '#f3e3bb');
  paintPath(diagonal, 25, '#f3e3bb');

  // ---- Plaza -----------------------------------------------------
  pxCircle(g, plaza.x, plaza.y, 166, '#d8bd8d');
  pxCircle(g, plaza.x, plaza.y, 158, '#f3e3bb');
  pxRing(g, plaza.x, plaza.y, 152, '#e7ce9e', 2);
  pxRing(g, plaza.x, plaza.y, 112, '#e7ce9e', 1);

  // checker stones
  for (let y = -142; y <= 142; y += 17) {
    for (let x = -142; x <= 142; x += 17) {
      if (x * x + y * y > 142 * 142) continue;
      if ((Math.floor((x + 200) / 17) + Math.floor((y + 200) / 17)) % 2 === 0) {
        pxRect(g, plaza.x + x, plaza.y + y, 16, 16, '#f8ecd0');
      } else if (rng() > 0.72) {
        pxRect(g, plaza.x + x + 3, plaza.y + y + 4, 2, 1, '#e4cda1');
      }
    }
  }

  // heart mosaic in the very centre, with a little fountain on top
  g.save();
  g.translate(plaza.x, plaza.y);
  drawHeart(g, 0, 0, 15, '#e6c0c6');
  drawHeart(g, 0, 0, 13, '#f3d6ce');
  drawHeart(g, 0, 0, 11, '#f9e4d4');
  drawHeart(g, 0, 0, 9, '#f3e3bb');
  pxRect(g, -34, 46, 68, 2, '#e7ce9e');
  pxRect(g, -20, 51, 40, 1, '#e7ce9e');
  g.restore();

  // Fountain (solid — the path curves around it).
  pxCircle(g, plaza.x, plaza.y, 33, 'rgba(60,40,64,0.10)');
  pxCircle(g, plaza.x, plaza.y, 31, '#c9ad7b');
  pxCircle(g, plaza.x, plaza.y, 29, '#e9d3a6');
  pxRing(g, plaza.x, plaza.y, 28, '#b09163', 2);
  pxCircle(g, plaza.x, plaza.y, 24, PAL.waterDeep);
  pxCircle(g, plaza.x, plaza.y, 21, PAL.water);
  pxCircle(g, plaza.x, plaza.y, 12, '#79ced6');
  pxRect(g, plaza.x - 17, plaza.y - 10, 12, 1, PAL.waterLight);
  pxRect(g, plaza.x + 7, plaza.y + 12, 9, 1, '#6ec8d2');
  // pedestal + heart statue
  pxRect(g, plaza.x - 4, plaza.y + 2, 8, 10, '#d9c08e');
  pxRect(g, plaza.x + 1, plaza.y + 2, 3, 10, '#b8945f');
  pxRect(g, plaza.x - 8, plaza.y + 3, 16, 2, '#e9d3a6');
  pxRect(g, plaza.x - 7, plaza.y + 5, 14, 2, '#c9ad7b');
  pxRect(g, plaza.x - 6, plaza.y - 1, 12, 3, '#e9d3a6');
  drawHeart(g, plaza.x, plaza.y - 8, 2, '#e8577c');
  drawHeart(g, plaza.x, plaza.y - 8, 1, '#ffadc4');
  pxRect(g, plaza.x - 3, plaza.y - 15, 2, 1, '#ffd6e2');

  // ---- Pond ------------------------------------------------------
  pxEllipse(g, pond.x, pond.y, pond.rx + 13, pond.ry + 11, '#e2c894');
  pxEllipse(g, pond.x, pond.y, pond.rx + 5, pond.ry + 4, '#c8ad7b');
  pxEllipse(g, pond.x, pond.y, pond.rx, pond.ry, PAL.waterDeep);
  pxEllipse(g, pond.x, pond.y, pond.rx - 6, pond.ry - 5, PAL.water);
  pxEllipse(g, pond.x - 12, pond.y - 8, pond.rx - 36, pond.ry - 28, '#79ced6');
  pxRect(g, pond.x - 78, pond.y - 40, 18, 1, PAL.waterLight);
  pxRect(g, pond.x - 52, pond.y - 52, 9, 1, PAL.waterLight);
  pxRect(g, pond.x + 18, pond.y + 40, 22, 1, '#6ec8d2');

  // lily pads
  const pads = [
    [pond.x - 50, pond.y + 22, 9],
    [pond.x + 30, pond.y - 18, 7],
    [pond.x + 58, pond.y + 30, 10],
    [pond.x - 5, pond.y + 50, 6],
  ];
  for (const [lx, ly, lr] of pads) {
    pxCircle(g, lx, ly, lr, '#4f9d64');
    pxCircle(g, lx, ly, lr - 2, '#6fbd75');
    pxRect(g, lx, ly, lr - 1, 2, PAL.water);
    if (lr > 7) {
      pxRect(g, lx - 1, ly - 2, 2, 2, '#ffd6e2');
      pxRect(g, lx - 3, ly - 1, 2, 1, '#ffd6e2');
      pxRect(g, lx + 1, ly - 1, 2, 1, '#ffd6e2');
      pxRect(g, lx - 1, ly, 2, 1, PAL.gold);
    }
  }
  // reeds
  for (const [rx, ry] of [[pond.x - 100, pond.y + 42], [pond.x + 98, pond.y - 25], [pond.x - 92, pond.y - 38]]) {
    pxRect(g, rx, ry - 18, 1, 18, '#3f7c4e');
    pxRect(g, rx + 4, ry - 23, 1, 23, '#4c8c55');
    pxRect(g, rx + 2, ry - 27, 2, 5, '#8c6340');
    pxRect(g, rx + 7, ry - 15, 1, 15, '#3f7c4e');
  }

  // ---- Lawn detail ----------------------------------------------
  const isPaved = (x, y) => {
    if ((x - plaza.x) ** 2 + (y - plaza.y) ** 2 < (plaza.r + 16) ** 2) return true;
    if (Math.abs(x - 500) < 52 || Math.abs(y - 500) < 52) return true;
    if ((x - pond.x) ** 2 / (pond.rx + 24) ** 2 + (y - pond.y) ** 2 / (pond.ry + 24) ** 2 < 1) return true;
    let best = 999;
    for (const p of diagonal) best = Math.min(best, Math.hypot(x - p.x, y - p.y));
    return best < 40;
  };

  for (let i = 0; i < 340; i++) {
    const x = Math.floor(range(rng, 55, 945));
    const y = Math.floor(range(rng, 55, 945));
    if (isPaved(x, y)) continue;
    const c = rng();
    pxRect(g, x, y, 1, 2, c > 0.6 ? PAL.grassDark : c > 0.3 ? '#8bcf8a' : '#5eaf6b');
    if (rng() > 0.55) pxRect(g, x + 2, y + 1, 1, 2, '#5eaf6b');
  }

  const flowerColors = ['#fff4d9', '#ff9fbb', '#ffd166', '#c7a4ff', '#8fe0e4'];
  for (let i = 0; i < 130; i++) {
    const x = Math.floor(range(rng, 62, 938));
    const y = Math.floor(range(rng, 62, 938));
    if (isPaved(x, y)) continue;
    const color = flowerColors[Math.floor(rng() * flowerColors.length)];
    pxRect(g, x, y + 1, 1, 2, '#3e7f50');
    pxRect(g, x - 1, y, 3, 1, color);
    pxRect(g, x, y - 1, 1, 2, color);
    pxRect(g, x, y, 1, 1, '#ffe9a8');
  }

  // little stones / curbs
  for (let i = 0; i < 70; i++) {
    const x = Math.floor(range(rng, 60, 940));
    const y = Math.floor(range(rng, 60, 940));
    if (isPaved(x, y)) {
      pxRect(g, x, y, 2, 1, '#d3b787');
    }
  }

  // flower beds in the four quadrants
  const beds = [
    { x: 300, y: 300, rx: 80, ry: 48 },
    { x: 710, y: 700, rx: 84, ry: 52 },
    { x: 280, y: 720, rx: 68, ry: 58 },
    { x: 720, y: 610, rx: 55, ry: 42 },
  ];
  for (const bed of beds) {
    pxEllipse(g, bed.x + 2, bed.y + 3, bed.rx + 4, bed.ry + 3, 'rgba(60,40,64,0.10)');
    pxEllipse(g, bed.x, bed.y, bed.rx, bed.ry, '#8a6547');
    pxEllipse(g, bed.x, bed.y, bed.rx - 3, bed.ry - 3, '#9a7352');
    for (let i = 0; i < 26; i++) {
      const a = rng() * Math.PI * 2;
      const rr = Math.sqrt(rng()) * 0.85;
      const x = bed.x + Math.cos(a) * bed.rx * rr;
      const y = bed.y + Math.sin(a) * bed.ry * rr;
      const color = flowerColors[Math.floor(rng() * flowerColors.length)];
      pxRect(g, x, y + 1, 1, 3, '#3f7c4e');
      pxRect(g, x - 1, y, 3, 2, color);
      pxRect(g, x, y, 1, 1, '#ffe9a8');
    }
    pxRing(g, bed.x, bed.y, bed.rx, '#6f5139', 1);
  }

  // ---- Hedge border ---------------------------------------------
  const hedge = (x, y, r) => {
    pxCircle(g, x, y, r, '#2f6b48');
    pxCircle(g, x - 2, y - 3, r - 3, '#3f8a55');
    pxCircle(g, x - 4, y - 5, Math.max(2, r - 8), '#57a865');
    pxRect(g, x - 5, y - 7, 2, 1, '#83c887');
  };
  for (let i = 18; i <= WORLD - 18; i += 26) {
    hedge(i, 30, 17);
    hedge(i, WORLD - 30, 17);
    hedge(30, i, 17);
    hedge(WORLD - 30, i, 17);
  }
  for (const [hx, hy] of [[30, 30], [WORLD - 30, 30], [30, WORLD - 30], [WORLD - 30, WORLD - 30]]) {
    hedge(hx, hy, 19);
  }
  for (let i = 70; i < WORLD - 60; i += 90) {
    if (rng() > 0.55) {
      pxRect(g, i, 22, 1, 1, '#ffd6e2');
      pxRect(g, i + 3, WORLD - 24, 1, 1, '#ffd6e2');
    }
  }

  // ---- Collisions ------------------------------------------------
  const circles = [];
  const rects = [];
  const trees = [];
  const bushes = [];
  const lamps = [];
  const benches = [];
  const flowers = [];

  const tooClose = (x, y, min = 58) => {
    for (const c of circles) if (Math.hypot(x - c.x, y - c.y) < min + c.r) return true;
    for (const b of benches) if (Math.abs(x - b.x) < 34 && Math.abs(y - b.y) < 20) return true;
    return false;
  };

  const nearPond = (x, y, pad = 34) =>
    (x - pond.x) ** 2 / (pond.rx + pad) ** 2 + (y - pond.y) ** 2 / (pond.ry + pad) ** 2 < 1;

  const nearPlaza = (x, y, pad = 34) => (x - plaza.x) ** 2 + (y - plaza.y) ** 2 < (plaza.r + pad) ** 2;

  const onPath = (x, y, pad = 24) => {
    if (Math.abs(x - 500) < 46 + pad || Math.abs(y - 500) < 46 + pad) return true;
    for (const p of diagonal) if (Math.hypot(x - p.x, y - p.y) < 34 + pad) return true;
    return false;
  };

  // Benches around the plaza and pond
  const benchSpots = [
    [418, 372],
    [586, 632],
    [382, 566],
    [626, 430],
    [690, 348],
  ];
  for (const [x, y] of benchSpots) {
    benches.push({ x, y });
    rects.push({ x: x - 16, y: y - 9, w: 32, h: 10 });
  }

  const fountain = { x: plaza.x, y: plaza.y, r: 30 };
  circles.push({ x: fountain.x, y: fountain.y, r: fountain.r });

  // Lamps
  for (const [x, y] of [
    [500, 324],
    [500, 678],
    [322, 500],
    [678, 500],
    [500, 108],
    [500, 892],
    [108, 500],
    [892, 500],
  ]) {
    lamps.push({ x, y });
    circles.push({ x, y, r: 3 });
  }

  // Trees — keep paths, plaza and pond clear.
  for (let attempt = 0; attempt < 420 && trees.length < 34; attempt++) {
    const x = Math.floor(range(rng, 82, 918));
    const y = Math.floor(range(rng, 82, 918));
    if (onPath(x, y, 42)) continue;
    if (nearPlaza(x, y, 40)) continue;
    if (nearPond(x, y, 46)) continue;
    if (tooClose(x, y, 64)) continue;
    if (Math.hypot(x - 500, y - 640) < 90) continue;
    const kind = rng() > 0.68 ? 'blossom' : rng() > 0.5 ? 'green' : 'dark';
    trees.push({ x, y, kind, seed: rng() * 10 });
    circles.push({ x, y, r: 7 });
  }

  // Flowering bushes (non-solid, pure decoration)
  for (let attempt = 0; attempt < 300 && bushes.length < 18; attempt++) {
    const x = Math.floor(range(rng, 70, 930));
    const y = Math.floor(range(rng, 70, 930));
    if (onPath(x, y, 18) || nearPlaza(x, y, 8) || nearPond(x, y, 18)) continue;
    if (tooClose(x, y, 36)) continue;
    bushes.push({ x, y, kind: rng() > 0.6 ? 'blossom' : 'green', seed: rng() * 10 });
  }

  // Animated flowers along the grass
  for (let i = 0; i < 46; i++) {
    const x = Math.floor(range(rng, 60, 940));
    const y = Math.floor(range(rng, 60, 940));
    if (isPaved(x, y) || nearPond(x, y, 6)) continue;
    if (tooClose(x, y, 20)) continue;
    flowers.push({
      x,
      y,
      color: flowerColors[Math.floor(rng() * flowerColors.length)],
      seed: rng() * 10,
    });
  }

  const pondEllipse = { ...pond };
  const bounds = { min: MARGIN, max: WORLD - MARGIN };

  function resolveCircle(x, y, r = 7) {
    let hit = false;
    for (let iter = 0; iter < 3; iter++) {
      // world bounds
      if (x < bounds.min + r) {
        x = bounds.min + r;
        hit = true;
      }
      if (x > bounds.max - r) {
        x = bounds.max - r;
        hit = true;
      }
      if (y < bounds.min + r) {
        y = bounds.min + r;
        hit = true;
      }
      if (y > bounds.max - r) {
        y = bounds.max - r;
        hit = true;
      }

      // pond push-out
      const prx = pondEllipse.rx + r;
      const pry = pondEllipse.ry + r;
      const nx = (x - pondEllipse.x) / prx;
      const ny = (y - pondEllipse.y) / pry;
      const d = Math.sqrt(nx * nx + ny * ny);
      if (d < 1 && d > 0.0001) {
        const s = 1.005 / d;
        x = pondEllipse.x + nx * prx * s;
        y = pondEllipse.y + ny * pry * s;
        hit = true;
      }

      for (const c of circles) {
        const dx = x - c.x;
        const dy = y - c.y;
        const min = c.r + r;
        const dd = dx * dx + dy * dy;
        if (dd < min * min) {
          const dl = Math.sqrt(dd) || 0.0001;
          x = c.x + (dx / dl) * min;
          y = c.y + (dy / dl) * min;
          hit = true;
        }
      }

      for (const rc of rects) {
        const cx = clamp(x, rc.x, rc.x + rc.w);
        const cy = clamp(y, rc.y, rc.y + rc.h);
        const dx = x - cx;
        const dy = y - cy;
        const dd = dx * dx + dy * dy;
        if (dd < r * r) {
          if (dd > 0.0001) {
            const dl = Math.sqrt(dd);
            x = cx + (dx / dl) * r;
            y = cy + (dy / dl) * r;
          } else {
            // inside the seat: eject toward the closest edge
            const left = x - rc.x;
            const right = rc.x + rc.w - x;
            const top = y - rc.y;
            const bottom = rc.y + rc.h - y;
            const m = Math.min(left, right, top, bottom);
            if (m === left) x = rc.x - r;
            else if (m === right) x = rc.x + rc.w + r;
            else if (m === top) y = rc.y - r;
            else y = rc.y + rc.h + r;
          }
          hit = true;
        }
      }
    }
    return { x, y, hit };
  }

  function canStand(x, y, r = 8) {
    if (x < bounds.min + r || x > bounds.max - r || y < bounds.min + r || y > bounds.max - r) return false;
    const prx = pondEllipse.rx + r;
    const pry = pondEllipse.ry + r;
    if ((x - pondEllipse.x) ** 2 / prx ** 2 + (y - pondEllipse.y) ** 2 / pry ** 2 < 1.02) return false;
    for (const c of circles) if (Math.hypot(x - c.x, y - c.y) < c.r + r + 2) return false;
    for (const rc of rects) {
      const cx = clamp(x, rc.x, rc.x + rc.w);
      const cy = clamp(y, rc.y, rc.y + rc.h);
      if (Math.hypot(x - cx, y - cy) < r + 2) return false;
    }
    return true;
  }

  function spawnPoint(px, py, minR = 190, maxR = 330) {
    for (let i = 0; i < 140; i++) {
      const a = rng() * Math.PI * 2;
      const d = range(rng, minR, maxR);
      const x = px + Math.cos(a) * d;
      const y = py + Math.sin(a) * d;
      if (canStand(x, y, 10) && !onPath(x, y, -18)) return { x, y };
    }
    for (let i = 0; i < 200; i++) {
      const x = Math.floor(range(rng, 90, 910));
      const y = Math.floor(range(rng, 90, 910));
      if (canStand(x, y, 10) && Math.hypot(x - px, y - py) > 120) return { x, y };
    }
    return { x: 500, y: 640 };
  }

  function wanderPoint(x, y, radius = 130) {
    for (let i = 0; i < 40; i++) {
      const a = rng() * Math.PI * 2;
      const d = Math.sqrt(rng()) * radius;
      const tx = x + Math.cos(a) * d;
      const ty = y + Math.sin(a) * d;
      if (canStand(tx, ty, 9)) return { x: tx, y: ty };
    }
    return { x, y };
  }

  return {
    ground,
    plaza,
    fountain,
    pond: pondEllipse,
    trees,
    bushes,
    benches,
    lamps,
    flowers,
    diagonal,
    bounds,
    resolveCircle,
    canStand,
    spawnPoint,
    wanderPoint,
  };
}
