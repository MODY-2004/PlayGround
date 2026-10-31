(() => {
  "use strict";
  const MH = (window.MH = window.MH || {});
  const { W, H, groundY } = MH.view;

  MH.bgCanvas = document.createElement("canvas");
  MH.bgCtx = MH.bgCanvas.getContext("2d", { alpha: false });

  function hexToRgb(hex) {
    const value = parseInt(hex.slice(1), 16);
    return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
  }

  function mix(a, b, t) {
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  }

  function rgba(color, alpha) {
    return `rgba(${color[0] | 0},${color[1] | 0},${color[2] | 0},${alpha})`;
  }

  function drawHeart(c, x, y, scale, color) {
    c.fillStyle = color;
    for (let row = 0; row < MH.HEART_ART.length; row++) {
      const line = MH.HEART_ART[row];
      for (let col = 0; col < line.length; col++) {
        if (line[col] === "1") c.fillRect(x + col * scale, y + row * scale, scale, scale);
      }
    }
  }

  function pixelCircle(c, cx, cy, radius, color) {
    c.fillStyle = color;
    for (let dy = -radius; dy <= radius; dy++) {
      const half = Math.floor(Math.sqrt(radius * radius - dy * dy));
      if (half > 0) c.fillRect(cx - half, cy + dy, half * 2, 1);
    }
  }

  function drawSky(c, w, h, floor) {
    const stops = [
      [0.0, "#0d0823"],
      [0.22, "#1b0d34"],
      [0.42, "#341541"],
      [0.58, "#5c2250"],
      [0.71, "#9a3c5b"],
      [0.82, "#d4676d"],
      [0.9, "#ff9b79"],
      [1.0, "#ffc095"],
    ].map(([at, color]) => [at, hexToRgb(color)]);
    const bands = 96;
    for (let i = 0; i < bands; i++) {
      const t = i / bands;
      let a = stops[0][1];
      let b = stops[stops.length - 1][1];
      for (let s = 0; s < stops.length - 1; s++) {
        if (t >= stops[s][0] && t <= stops[s + 1][0]) {
          const local = (t - stops[s][0]) / (stops[s + 1][0] - stops[s][0]);
          a = stops[s][1];
          b = stops[s + 1][1];
          break;
        }
      }
      c.fillStyle = rgba(mix(a, b, (t % 1) * 1), 1);
      c.fillRect(0, Math.floor((i * h) / bands), w + 1, Math.ceil(h / bands) + 1);
    }

    // Warm haze at the horizon.
    const haze = c.createLinearGradient(0, floor - 190, 0, floor + 20);
    haze.addColorStop(0, "rgba(255, 118, 134, 0)");
    haze.addColorStop(0.62, "rgba(255, 147, 129, 0.13)");
    haze.addColorStop(1, "rgba(255, 191, 143, 0.24)");
    c.fillStyle = haze;
    c.fillRect(0, floor - 190, w, 210);
  }

  function drawStars(c, w, h, floor, rng) {
    for (let i = 0; i < 105; i++) {
      const x = Math.floor(rng() * w);
      const y = Math.floor(rng() * Math.max(80, floor - 130));
      const alpha = 0.16 + rng() * 0.62;
      const size = rng() > 0.9 ? 2 : 1;
      c.fillStyle = rng() > 0.82 ? `rgba(255,196,211,${alpha})` : `rgba(255,241,214,${alpha})`;
      c.fillRect(x, y, size, size);
      if (size === 2 && rng() > 0.55) {
        c.fillStyle = `rgba(255,222,210,${alpha * 0.28})`;
        c.fillRect(x - 1, y, 1, 1);
        c.fillRect(x + 2, y, 1, 1);
        c.fillRect(x, y - 1, 1, 1);
        c.fillRect(x, y + 2, 1, 1);
      }
    }

    // A soft diagonal constellation.
    const sx = Math.floor(w * 0.17);
    const sy = Math.floor(h * 0.14);
    const pts = [
      [sx, sy],
      [sx + 14, sy + 6],
      [sx + 8, sy + 21],
      [sx + 25, sy + 29],
    ];
    c.strokeStyle = "rgba(255, 224, 217, 0.15)";
    c.lineWidth = 1;
    c.beginPath();
    pts.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])));
    c.stroke();
    for (const p of pts) {
      c.fillStyle = "rgba(255, 241, 217, 0.8)";
      c.fillRect(p[0], p[1], 2, 2);
    }
  }

  function drawMoon(c, w, h) {
    const cx = Math.floor(w * 0.79);
    const cy = Math.floor(h * 0.145);
    const r = Math.max(24, Math.min(34, Math.floor(w * 0.082)));

    const glow = c.createRadialGradient(cx, cy, r * 0.65, cx, cy, r * 3.2);
    glow.addColorStop(0, "rgba(255, 231, 189, 0.3)");
    glow.addColorStop(0.45, "rgba(255, 198, 174, 0.09)");
    glow.addColorStop(1, "rgba(255, 198, 174, 0)");
    c.fillStyle = glow;
    c.fillRect(cx - r * 3.3, cy - r * 3.3, r * 6.6, r * 6.6);

    pixelCircle(c, cx, cy, r, "#ffe8c5");
    pixelCircle(c, cx + Math.floor(r * 0.16), cy - 1, Math.max(8, Math.floor(r * 0.82)), "#ffd9ae");

    const craters = [
      [-10, -7, 5, 4],
      [7, -11, 3, 3],
      [5, 4, 7, 5],
      [-8, 9, 3, 3],
      [14, 8, 4, 2],
      [-2, 2, 3, 2],
    ];
    c.fillStyle = "rgba(203, 158, 125, 0.3)";
    for (const [dx, dy, cw, ch] of craters) {
      c.fillRect(cx + dx, cy + dy, cw, ch);
    }

    // A thin cloud crossing the moon.
    c.fillStyle = "rgba(44, 20, 53, 0.23)";
    c.fillRect(cx - r * 1.9, cy + r * 0.45, r * 2.7, 2);
    c.fillRect(cx - r * 0.8, cy + r * 0.62, r * 2.4, 2);
    c.fillRect(cx - r * 1.4, cy + r * 0.79, r * 1.6, 2);
  }

  function drawClouds(c, w, h, floor) {
    const clouds = [
      [w * 0.08, h * 0.1, 60, 3, 0.09],
      [w * 0.33, h * 0.2, 45, 2, 0.08],
      [w * 0.58, h * 0.08, 74, 3, 0.07],
      [w * 0.12, h * 0.3, 54, 2, 0.06],
      [w * 0.64, h * 0.29, 40, 2, 0.06],
    ];
    for (const [x, y, len, height, alpha] of clouds) {
      c.fillStyle = `rgba(255, 205, 206, ${alpha})`;
      c.fillRect(Math.floor(x), Math.floor(y), len, height);
      c.fillRect(Math.floor(x + len * 0.15), Math.floor(y - 3), len * 0.55, 2);
      c.fillRect(Math.floor(x + len * 0.42), Math.floor(y + height), len * 0.4, 2);
    }
  }

  function drawBuilding(c, x, top, width, base, color, rng, litChance, windowColor) {
    c.fillStyle = color;
    c.fillRect(x, top, width, base - top);
    c.fillStyle = "rgba(0,0,0,0.08)";
    c.fillRect(x, top, Math.max(2, Math.floor(width * 0.35)), base - top);

    const cellW = Math.max(5, Math.floor(width / 4));
    const cellH = 7;
    for (let wy = top + 8; wy < base - 8; wy += cellH) {
      for (let wx = x + 3; wx < x + width - 3; wx += cellW) {
        if (rng() < litChance) {
          const warm = rng();
          c.fillStyle = warm > 0.5 ? windowColor : "rgba(255,189,139,0.52)";
          c.fillRect(wx, wy, 2, 3);
        }
      }
    }

    // Rooftop bits.
    if (rng() > 0.55) {
      c.fillStyle = color;
      c.fillRect(x + 3, top - 4, Math.max(5, width * 0.28), 4);
      c.fillStyle = "rgba(255,255,255,0.04)";
      c.fillRect(x + 3, top - 4, Math.max(5, width * 0.28), 1);
    }
    if (rng() > 0.72) {
      c.fillStyle = color;
      c.fillRect(x + width * 0.7, top - 12, 1, 12);
      c.fillStyle = "rgba(255,130,150,0.65)";
      c.fillRect(x + width * 0.7, top - 13, 2, 2);
    }
    if (rng() > 0.84) {
      const tx = x + width * 0.28;
      c.fillStyle = color;
      c.fillRect(tx, top - 14, 8, 10);
      c.fillRect(tx + 1, top - 16, 6, 2);
      c.fillRect(tx + 2, top - 5, 1, 5);
      c.fillRect(tx + 6, top - 5, 1, 5);
    }
  }

  function drawCity(c, w, floor) {
    // Distant skyline.
    const farRng = MH.mulberry32(29137);
    let x = -12;
    while (x < w + 20) {
      const buildW = 18 + Math.floor(farRng() * 30);
      const top = floor - 160 - Math.floor(farRng() * 78);
      drawBuilding(
        c,
        x,
        top,
        buildW,
        floor + 110,
        farRng() > 0.5 ? "#2b163d" : "#311943",
        farRng,
        0.16,
        "rgba(255,183,132,0.4)"
      );
      x += buildW + 2 + Math.floor(farRng() * 7);
    }

    // Mid skyline.
    const midRng = MH.mulberry32(7719);
    x = -18;
    while (x < w + 30) {
      const buildW = 22 + Math.floor(midRng() * 34);
      const top = floor - 78 - Math.floor(midRng() * 95);
      drawBuilding(
        c,
        x,
        top,
        buildW,
        floor + 100,
        midRng() > 0.45 ? "#1d102d" : "#231331",
        midRng,
        0.24,
        "rgba(255,132,168,0.47)"
      );
      x += buildW + 2 + Math.floor(midRng() * 9);
    }

    // A bridge of distant lit windows, just above the near skyline.
    c.fillStyle = "rgba(255, 160, 143, 0.11)";
    c.fillRect(0, floor - 66, w, 1);

    // Little rooftop water tower silhouette.
    const tx = Math.floor(w * 0.68);
    const ty = floor - 132;
    c.fillStyle = "#1b0e29";
    c.fillRect(tx, ty, 13, 12);
    c.fillRect(tx + 1, ty - 3, 11, 3);
    c.fillRect(tx + 2, ty + 12, 2, 7);
    c.fillRect(tx + 9, ty + 12, 2, 7);
  }

  function neonText(c, text, x, y, size, color, glowColor, align = "left") {
    c.save();
    c.font = `${size}px Silkscreen, monospace`;
    c.textAlign = align;
    c.textBaseline = "top";
    c.shadowColor = glowColor;
    c.shadowBlur = 7;
    c.fillStyle = color;
    c.fillText(text, x, y);
    c.shadowBlur = 0;
    c.fillStyle = "rgba(255,255,255,0.4)";
    c.fillText(text, x, y);
    c.restore();
  }

  function drawSign(c, w, floor) {
    const x = Math.floor(w * 0.105);
    const y = floor - 234;
    const height = 69;
    c.fillStyle = "rgba(20, 9, 27, 0.7)";
    c.fillRect(x - 7, y - 7, 24, height);
    c.strokeStyle = "rgba(255, 111, 148, 0.28)";
    c.lineWidth = 1;
    c.strokeRect(x - 6.5, y - 6.5, 23, height);
    c.fillStyle = "rgba(255, 112, 150, 0.55)";
    c.fillRect(x + 3, y - 12, 1, 6);
    c.fillRect(x + 3, y + height + 1, 1, 6);

    const letters = ["L", "O", "V", "E"];
    letters.forEach((letter, i) => {
      neonText(c, letter, x + 5, y + i * 15, 10, "#ffb3c8", "rgba(255, 46, 108, 0.95)", "center");
    });
    c.fillStyle = "rgba(255, 91, 137, 0.7)";
    c.fillRect(x - 2, y + height - 3, 14, 1);
  }

  function drawStringLights(c, w, h) {
    const y = Math.floor(h * 0.255);
    const sag = Math.floor(h * 0.036);
    c.strokeStyle = "rgba(34, 15, 41, 0.92)";
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(-8, y);
    c.quadraticCurveTo(w * 0.5, y + sag * 2.2, w + 8, y - 2);
    c.stroke();

    const bulbs = Math.max(10, Math.floor(w / 24));
    for (let i = 0; i <= bulbs; i++) {
      const t = i / bulbs;
      const bx = -8 + (w + 16) * t;
      const by = y + Math.sin(Math.PI * t) * sag * 1.1;
      const warm = i % 5 === 0;
      const glow = c.createRadialGradient(bx, by + 3, 0, bx, by + 3, 10);
      glow.addColorStop(0, warm ? "rgba(255, 205, 130, 0.34)" : "rgba(255, 143, 166, 0.26)");
      glow.addColorStop(1, "rgba(255, 143, 166, 0)");
      c.fillStyle = glow;
      c.fillRect(bx - 10, by - 7, 20, 20);
      c.fillStyle = "#2b1534";
      c.fillRect(bx - 0.5, by, 1, 2);
      c.fillStyle = warm ? "#ffd68f" : "#ff9db4";
      c.fillRect(bx - 1, by + 2, 2, 3);
      c.fillStyle = "rgba(255,255,255,0.68)";
      c.fillRect(bx - 1, by + 2, 1, 1);
    }

    // Tiny heart pennants at intervals.
    const pennants = Math.max(4, Math.floor(w / 82));
    for (let i = 0; i < pennants; i++) {
      const t = (i + 0.5) / pennants;
      const px = -8 + (w + 16) * t;
      const py = y + Math.sin(Math.PI * t) * sag * 1.1 + 7;
      drawHeart(c, Math.floor(px - 4), Math.floor(py), 1, i % 2 ? "rgba(255,147,173,0.42)" : "rgba(255,213,174,0.35)");
    }
  }

  function drawBalcony(c, w, y) {
    const x0 = Math.floor(w * 0.055);
    const x1 = Math.floor(w * 0.945);
    const width = x1 - x0;

    // Railing behind the title couple.
    c.strokeStyle = "rgba(22, 10, 31, 0.9)";
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(x0, y - 20);
    c.lineTo(x1, y - 20);
    c.stroke();
    c.fillStyle = "rgba(21, 9, 29, 0.86)";
    for (let x = x0 + 5; x < x1; x += 13) {
      c.fillRect(x, y - 20, 1, 20);
    }
    c.fillStyle = "rgba(255, 151, 168, 0.2)";
    c.fillRect(x0, y - 21, width, 1);
    c.fillRect(x0, y - 2, width, 1);

    // Ledge and brackets.
    c.fillStyle = "#2a1436";
    c.fillRect(x0, y - 2, width, 8);
    c.fillStyle = "#4a264c";
    c.fillRect(x0, y - 2, width, 2);
    c.fillStyle = "rgba(255, 130, 158, 0.42)";
    c.fillRect(x0 + 10, y - 2, width - 20, 1);
    c.fillStyle = "rgba(10, 4, 16, 0.72)";
    for (let x = x0 + 20; x < x1 - 10; x += 42) {
      c.fillRect(x, y + 6, 6, 8);
      c.fillRect(x + 1, y + 14, 4, 2);
    }

    // Planter boxes at the ends.
    for (const px of [x0 + 4, x1 - 32]) {
      c.fillStyle = "#47213f";
      c.fillRect(px, y - 9, 28, 9);
      c.fillStyle = "#613050";
      c.fillRect(px, y - 9, 28, 2);
      const rng = MH.mulberry32(px + 31);
      for (let i = 0; i < 7; i++) {
        const lx = px + 3 + Math.floor(rng() * 23);
        const ly = y - 12 - Math.floor(rng() * 9);
        c.fillStyle = i % 3 === 0 ? "#5b3155" : "#294b49";
        c.fillRect(lx, ly, 3, 7 - Math.floor(rng() * 3));
        c.fillRect(lx + 2, ly + 2, 1, 4);
      }
      c.fillStyle = "#ff93a8";
      c.fillRect(px + 9, y - 16, 2, 2);
      c.fillRect(px + 19, y - 13, 2, 2);
    }
  }

  function drawRoof(c, w, h, floor) {
    // Upper roof lip.
    c.fillStyle = "#2b1334";
    c.fillRect(0, floor, w, 19);
    c.fillStyle = "#6f3354";
    c.fillRect(0, floor, w, 2);
    c.fillStyle = "rgba(255, 153, 173, 0.7)";
    c.fillRect(0, floor, w, 1);
    c.fillStyle = "rgba(255, 144, 164, 0.19)";
    c.fillRect(0, floor + 3, w, 1);
    c.fillStyle = "rgba(7, 2, 11, 0.22)";
    for (let x = 8; x < w; x += 23) c.fillRect(x, floor + 5, 1, 13);

    // Roof front wall.
    const wallTop = floor + 19;
    c.fillStyle = "#1a0d21";
    c.fillRect(0, wallTop, w, h - wallTop);
    const spill = c.createLinearGradient(0, wallTop, 0, h);
    spill.addColorStop(0, "rgba(255, 89, 132, 0.11)");
    spill.addColorStop(0.4, "rgba(255, 89, 132, 0.035)");
    spill.addColorStop(1, "rgba(255, 89, 132, 0)");
    c.fillStyle = spill;
    c.fillRect(0, wallTop, w, h - wallTop);

    for (let y = wallTop + 7; y < h; y += 12) {
      c.fillStyle = "rgba(70, 35, 68, 0.45)";
      c.fillRect(0, y, w, 1);
      const offset = ((y - wallTop) / 12) % 2 === 0 ? 0 : 13;
      for (let x = offset; x < w; x += 26) {
        c.fillRect(x, y, 1, 12);
      }
    }

    // A little heart stencil on the wall.
    c.save();
    c.globalAlpha = 0.13;
    drawHeart(c, Math.floor(w * 0.47), wallTop + 34, 4, "#ff7f9d");
    c.restore();

    // AC unit.
    const ax = w - 68;
    c.fillStyle = "#2c1731";
    c.fillRect(ax, floor - 25, 42, 25);
    c.fillStyle = "#492b47";
    c.fillRect(ax, floor - 25, 42, 3);
    c.fillStyle = "#180c1f";
    c.fillRect(ax + 5, floor - 19, 32, 13);
    for (let i = 0; i < 5; i++) {
      c.fillStyle = "rgba(121, 75, 101, 0.6)";
      c.fillRect(ax + 7, floor - 17 + i * 2, 28, 1);
    }
    c.fillStyle = "rgba(255, 155, 169, 0.27)";
    c.fillRect(ax + 2, floor - 25, 4, 1);

    // Planter at the left edge.
    c.fillStyle = "#4b2340";
    c.fillRect(7, floor - 16, 39, 16);
    c.fillStyle = "#6a3351";
    c.fillRect(7, floor - 16, 39, 2);
    c.fillStyle = "#1b0c20";
    c.fillRect(8, floor - 14, 37, 4);
    const leafRng = MH.mulberry32(1234);
    for (let i = 0; i < 18; i++) {
      const lx = 11 + Math.floor(leafRng() * 31);
      const ly = floor - 23 - Math.floor(leafRng() * 18);
      c.fillStyle = i % 4 === 0 ? "#3c5d53" : "#24443f";
      c.fillRect(lx, ly, 2, 8 + Math.floor(leafRng() * 7));
      if (i % 5 === 0) c.fillRect(lx + 2, ly + 2, 2, 3);
    }
    c.fillStyle = "#ff9db2";
    c.fillRect(16, floor - 34, 2, 2);
    c.fillRect(30, floor - 29, 2, 2);
    c.fillStyle = "#ffd18f";
    c.fillRect(23, floor - 38, 2, 2);

    // A trailing vine over the roof edge.
    c.fillStyle = "rgba(35, 69, 62, 0.75)";
    for (let i = 0; i < 9; i++) {
      c.fillRect(9 + i * 4, floor + i * 5, 2, 3);
    }
  }

  function drawForeground(c, w, h, floor, rng) {
    // Tiny roof gravel and petals.
    for (let i = 0; i < 42; i++) {
      const x = Math.floor(rng() * w);
      const y = floor + 3 + Math.floor(rng() * 13);
      c.fillStyle = rng() > 0.6 ? "rgba(255, 159, 173, 0.16)" : "rgba(255, 225, 197, 0.12)";
      c.fillRect(x, y, 1, 1);
    }
  }

  MH.buildBackground = () => {
    const { W: w, H: h, groundY: floor } = MH.view;
    MH.bgCanvas.width = w;
    MH.bgCanvas.height = h;
    const c = MH.bgCtx;
    c.imageSmoothingEnabled = false;
    const rng = MH.mulberry32(881193);

    drawSky(c, w, h, floor);
    drawStars(c, w, h, floor, rng);
    drawMoon(c, w, h);
    drawClouds(c, w, h, floor);
    drawCity(c, w, floor);
    drawSign(c, w, floor);
    drawStringLights(c, w, h);
    drawBalcony(c, w, Math.floor(h * 0.56));
    drawRoof(c, w, h, floor);
    drawForeground(c, w, h, floor, rng);

    // Crisp vignette baked into the scene.
    const v = c.createRadialGradient(w / 2, h * 0.46, Math.min(w, h) * 0.28, w / 2, h * 0.52, Math.max(w, h) * 0.72);
    v.addColorStop(0, "rgba(8,3,13,0)");
    v.addColorStop(1, "rgba(8,3,13,0.35)");
    c.fillStyle = v;
    c.fillRect(0, 0, w, h);
  };
})();
