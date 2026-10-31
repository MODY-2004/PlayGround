(() => {
  "use strict";
  const MH = (window.MH = window.MH || {});

  MH.HEART_ART = [
    "0110110",
    "1111111",
    "1111111",
    "0111110",
    "0011100",
    "0001000",
  ];

  MH.GIRL_TYPES = {
    cherry: {
      key: "cherry",
      name: "CHERRY",
      hair: "#ff709d",
      hairDark: "#c43b69",
      hairLight: "#ffa8c2",
      dress: "#ff8caf",
      dressDark: "#d84a78",
      trim: "#ffe3eb",
      shoe: "#731f43",
      style: "twin",
      accent: "#fff0f5",
      speed: 41,
      shootRate: 4.5,
      projectile: "#ff5d91",
    },
    luna: {
      key: "luna",
      name: "LUNA",
      hair: "#7a67e9",
      hairDark: "#4836ad",
      hairLight: "#b2a5ff",
      dress: "#9481f7",
      dressDark: "#6553c7",
      trim: "#e8e3ff",
      shoe: "#342773",
      style: "long",
      accent: "#ffe7a8",
      speed: 55,
      shootRate: 5.6,
      projectile: "#a78bff",
    },
    sunny: {
      key: "sunny",
      name: "SUNNY",
      hair: "#ffd166",
      hairDark: "#ce922b",
      hairLight: "#ffe9a4",
      dress: "#ffb645",
      dressDark: "#de8926",
      trim: "#fff2c8",
      shoe: "#75411f",
      style: "bob",
      accent: "#fff6d3",
      speed: 37,
      shootRate: 4.9,
      projectile: "#ffc15c",
    },
    mint: {
      key: "mint",
      name: "MINT",
      hair: "#55ddc4",
      hairDark: "#1c9688",
      hairLight: "#a8f8e9",
      dress: "#6be3cd",
      dressDark: "#34ad9f",
      trim: "#dbfff9",
      shoe: "#165d57",
      style: "pony",
      accent: "#eefff8",
      speed: 47,
      shootRate: 5.1,
      projectile: "#68efda",
    },
  };

  const c = () => MH.ctx;

  function rect(ctx, x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x), Math.round(y), Math.max(1, Math.round(w)), Math.max(1, Math.round(h)));
  }

  function drawHeart(ctx, x, y, scale, color, alpha = 1) {
    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.fillStyle = color;
    for (let row = 0; row < MH.HEART_ART.length; row++) {
      const line = MH.HEART_ART[row];
      for (let col = 0; col < line.length; col++) {
        if (line[col] === "1") {
          ctx.fillRect(Math.round(x + col * scale), Math.round(y + row * scale), scale, scale);
        }
      }
    }
    ctx.restore();
  }

  MH.drawHeart = drawHeart;
  MH.drawHeartAt = (x, y, scale, color, alpha = 1) => drawHeart(MH.ctx, x, y, scale, color, alpha);

  function drawShadow(x, groundY, scale = 1, alpha = 0.32) {
    const ctx = c();
    ctx.fillStyle = `rgba(7,3,11,${alpha})`;
    const w = Math.max(8, Math.round(15 * scale));
    ctx.fillRect(Math.round(x - w / 2), Math.round(groundY - 1), w, 2);
    ctx.fillRect(Math.round(x - w / 2 + 2), Math.round(groundY + 1), w - 4, 1);
    ctx.fillStyle = `rgba(255,126,154,${alpha * 0.12})`;
    ctx.fillRect(Math.round(x - w / 2), Math.round(groundY - 1), w, 1);
  }

  MH.drawShadow = drawShadow;

  // ---------------------------------------------------------------------------
  // Milo — the last romantic on the rooftop
  // ---------------------------------------------------------------------------

  MH.drawMan = (p) => {
    const ctx = c();
    const time = MH.view.time;
    const flicker = p.invT > 0 && Math.floor(time * 26) % 2 === 0 && !p.kissing;
    const ground = p.groundY || MH.view.groundY;
    const scale = p.scale || 1;
    const height = Math.max(0, ground - p.y);
    drawShadow(p.x, ground, Math.max(0.45, (1 - height / 130) * scale), 0.34 - Math.min(0.18, height / 380));

    const moving = p.onGround && Math.abs(p.vx) > 12;
    const cycle = p.anim || 0;
    const swing = Math.sin(cycle * 11);
    const bob = p.onGround ? (moving ? Math.abs(swing) * 1.3 : Math.sin(time * 2.2) * 0.5) : 0;
    const jumping = !p.onGround;
    const kissing = !!p.kissing;
    const hurt = p.hurtT > 0;
    const walking = moving && !kissing;

    const jacket = "#e74d63";
    const jacketDark = "#b82d4b";
    const jacketLight = "#ff7588";
    const shirt = "#ffe7d1";
    const pants = "#2e3857";
    const pantsDark = "#202840";
    const skin = "#f0b28d";
    const skinDark = "#d18b73";
    const hair = "#342435";
    const hairLight = "#513548";
    const shoe = "#f1d2a6";
    const shoeDark = "#402737";

    ctx.save();
    if (flicker) ctx.globalAlpha = 0.38;
    ctx.translate(Math.round(p.x), Math.round(p.y - bob));
    ctx.scale((p.facing || 1) * scale, scale);

    if (hurt) ctx.translate(-2, 0);
    if (kissing) ctx.translate(1, 0);

    const legA = walking ? Math.round(swing * 2) : 0;
    const legB = -legA;
    const armSwing = walking ? Math.round(Math.sin(cycle * 11 + Math.PI) * 2) : 0;

    // Rear arm.
    if (jumping) {
      rect(ctx, -11, -37 + armSwing, 3, 8, jacketDark);
      rect(ctx, -12, -40 + armSwing, 3, 4, skinDark);
    } else if (kissing) {
      rect(ctx, -10, -28, 3, 8, jacketDark);
      rect(ctx, -11, -21, 3, 3, skinDark);
    } else {
      rect(ctx, -10, -27 + armSwing, 3, 10, jacketDark);
      rect(ctx, -10, -18 + armSwing, 3, 3, skinDark);
    }

    // Legs.
    if (jumping) {
      rect(ctx, -6, -14, 5, 7, pantsDark);
      rect(ctx, -8, -9, 7, 4, shoeDark);
      rect(ctx, 1, -13, 5, 7, pants);
      rect(ctx, 0, -8, 7, 4, shoe);
      rect(ctx, -7, -8, 6, 1, shoe);
    } else if (kissing) {
      rect(ctx, -6, -16, 5, 11, pantsDark);
      rect(ctx, -8, -4, 7, 3, shoeDark);
      rect(ctx, 1, -16, 5, 11, pants);
      rect(ctx, 1, -4, 7, 3, shoe);
    } else {
      rect(ctx, -6 + (walking ? legB : 0), -16, 5, 11, pantsDark);
      rect(ctx, -8 + (walking ? legB : 0), -5, 7, 3, shoeDark);
      rect(ctx, 1 + (walking ? legA : 0), -16, 5, 11, pants);
      rect(ctx, 1 + (walking ? legA : 0), -5, 7, 3, shoe);
    }

    // Jacket body.
    rect(ctx, -8, -31, 16, 17, jacket);
    rect(ctx, -8, -31, 3, 17, jacketLight);
    rect(ctx, 5, -31, 3, 17, jacketDark);
    rect(ctx, -8, -31, 16, 2, jacketDark);
    rect(ctx, -8, -17, 16, 2, jacketDark);
    rect(ctx, -7, -15, 14, 2, "#271b2d");

    // Open jacket, tee and heart patch.
    rect(ctx, -3, -30, 6, 14, shirt);
    rect(ctx, -3, -30, 1, 14, "#e6c6b8");
    rect(ctx, 3, -30, 1, 14, "#d6b1a8");
    rect(ctx, -6, -30, 3, 4, jacketLight);
    rect(ctx, 3, -30, 4, 4, jacketDark);
    rect(ctx, -5, -31, 4, 2, "#ffe0ca");
    rect(ctx, 2, -31, 4, 2, "#ffe0ca");
    drawHeart(ctx, -1, -26, 1, "#ff4f78", 0.95);

    // Belt buckle and jacket pockets.
    rect(ctx, -1, -16, 3, 2, "#e8ba74");
    rect(ctx, -7, -22, 2, 4, jacketDark);
    rect(ctx, 6, -22, 2, 4, jacketDark);

    // Front arm.
    if (kissing) {
      rect(ctx, 8, -36, 8, 3, jacket);
      rect(ctx, 13, -35, 4, 3, skin);
      rect(ctx, 8, -36, 3, 2, jacketLight);
    } else if (jumping) {
      rect(ctx, 8, -39 - armSwing, 3, 8, jacket);
      rect(ctx, 8, -42 - armSwing, 3, 4, skin);
    } else {
      rect(ctx, 8, -28 + armSwing, 3, 10, jacket);
      rect(ctx, 8, -19 + armSwing, 3, 3, skin);
    }

    // Neck and head lean.
    const hx = kissing ? 2 : 0;
    rect(ctx, -2 + hx, -34, 4, 4, skinDark);
    rect(ctx, -7 + hx, -45, 14, 12, skin);
    rect(ctx, -7 + hx, -45, 2, 9, skinDark);
    rect(ctx, 6 + hx, -40, 2, 3, skinDark);

    // Hair.
    rect(ctx, -8 + hx, -49, 16, 5, hair);
    rect(ctx, -8 + hx, -45, 3, 5, hair);
    rect(ctx, 1 + hx, -45, 7, 2, hair);
    rect(ctx, -5 + hx, -47, 6, 2, hairLight);
    rect(ctx, 3 + hx, -51, 5, 3, hair);
    rect(ctx, 6 + hx, -49, 2, 2, hairLight);

    // Face.
    const eyesClosed = kissing || p.hurtT > 0;
    rect(ctx, 2 + hx, -43, 4, 1, hair);
    if (eyesClosed) {
      rect(ctx, 3 + hx, -41, 2, 1, "#6b3040");
    } else {
      rect(ctx, 3 + hx, -41, 2, 2, "#2b1622");
      rect(ctx, 3 + hx, -41, 1, 1, "#fff6e6");
    }
    rect(ctx, 7 + hx, -39, 1, 2, skinDark);
    rect(ctx, 4 + hx, -36, 2, 1, "#7b3348");
    rect(ctx, 1 + hx, -38, 2, 1, "rgba(226,121,135,0.8)");
    if (kissing) rect(ctx, 1 + hx, -35, 2, 1, "#f7d5c0");

    // A windblown scarf tail.
    if (walking || jumping) {
      ctx.fillStyle = "rgba(255, 221, 199, 0.7)";
      ctx.fillRect(-11, -31, 3, 2);
      ctx.fillRect(-14, -30, 3, 1);
      ctx.fillRect(-16, -29, 2, 1);
    }

    // Reach hand when a kiss misses.
    if (p.reachT > 0) {
      rect(ctx, 9, -36, 9, 2, jacket);
      rect(ctx, 17, -37, 3, 3, skin);
      drawHeart(ctx, 19, -42, 1, "#ff88a7", 0.8);
    }

    ctx.restore();
  };

  // ---------------------------------------------------------------------------
  // The heartbreakers
  // ---------------------------------------------------------------------------

  function drawGirlHairBack(ctx, g, type) {
    if (type.style === "long") {
      rect(ctx, -8, -44, 5, 24, type.hairDark);
      rect(ctx, 4, -44, 5, 24, type.hairDark);
      rect(ctx, -9, -34, 3, 12, type.hair);
      rect(ctx, 7, -34, 3, 12, type.hair);
      rect(ctx, -7, -42, 14, 4, type.hairDark);
    } else if (type.style === "twin") {
      rect(ctx, -8, -42, 14, 4, type.hairDark);
      rect(ctx, -11, -42, 5, 6, type.hair);
      rect(ctx, 7, -42, 5, 6, type.hair);
      rect(ctx, -12, -38, 4, 11, type.hair);
      rect(ctx, 9, -38, 4, 11, type.hair);
      rect(ctx, -12, -29, 3, 4, type.hairDark);
      rect(ctx, 10, -29, 3, 4, type.hairDark);
    } else if (type.style === "pony") {
      rect(ctx, -7, -43, 14, 4, type.hairDark);
      rect(ctx, 7, -45, 4, 5, type.hairDark);
      rect(ctx, 9, -41, 5, 15, type.hair);
      rect(ctx, 10, -28, 4, 5, type.hairDark);
    } else {
      rect(ctx, -8, -43, 16, 5, type.hairDark);
      rect(ctx, -8, -39, 3, 8, type.hair);
      rect(ctx, 6, -39, 3, 8, type.hair);
    }
  }

  function drawGirlHairFront(ctx, g, type, kissing) {
    rect(ctx, -7, -46, 14, 5, type.hair);
    rect(ctx, -7, -46, 14, 2, type.hairLight);
    if (type.style === "long") {
      rect(ctx, -7, -43, 3, 8, type.hair);
      rect(ctx, 5, -43, 3, 8, type.hair);
      rect(ctx, -5, -43, 5, 2, type.hair);
      rect(ctx, 2, -42, 4, 2, type.hairDark);
      rect(ctx, 5, -39, 2, 2, type.accent);
    } else if (type.style === "twin") {
      rect(ctx, -7, -43, 4, 4, type.hair);
      rect(ctx, 4, -43, 4, 2, type.hair);
      rect(ctx, -5, -42, 4, 2, type.hairLight);
      rect(ctx, 4, -46, 4, 4, type.hairDark);
      rect(ctx, 5, -45, 2, 2, type.accent);
      rect(ctx, -9, -41, 2, 2, type.accent);
    } else if (type.style === "bob") {
      rect(ctx, -8, -43, 4, 7, type.hair);
      rect(ctx, 5, -43, 4, 7, type.hair);
      rect(ctx, -5, -42, 4, 2, type.hairLight);
      rect(ctx, 3, -42, 3, 2, type.hair);
      rect(ctx, 6, -45, 2, 2, type.accent);
    } else {
      rect(ctx, -7, -43, 4, 3, type.hair);
      rect(ctx, 3, -43, 5, 2, type.hairLight);
      rect(ctx, -3, -44, 4, 2, type.hairDark);
      rect(ctx, 5, -47, 3, 2, type.accent);
    }
  }

  function drawGirl(ctx, g, type, state, scale = 1) {
    const time = MH.view.time;
    const moving = state !== "kissing" && state !== "charmed" && Math.abs(g.vx) > 6;
    const walk = Math.sin((g.anim || 0) * 9.5);
    const legA = moving ? Math.round(walk * 2) : 0;
    const legB = -legA;
    const bob = moving ? Math.abs(walk) * 1.1 : Math.sin(time * 2 + g.bobSeed) * 0.6;
    const kissing = state === "kissing";
    const charmed = state === "charmed" || state === "leaving";

    ctx.save();
    ctx.translate(Math.round(g.x), Math.round(g.y - bob));
    ctx.scale((g.facing || 1) * scale, scale);
    if (kissing) ctx.translate(2, 0);
    if (state === "hurt") ctx.translate(-2, 0);

    const skin = "#f4bc99";
    const skinDark = "#d99078";
    const skirt = type.dress;
    const skirtDark = type.dressDark;

    // Back hair.
    drawGirlHairBack(ctx, g, type);

    // Legs and shoes.
    rect(ctx, -5 + (moving ? legB : 0), -13, 4, 9, "#f0c9b5");
    rect(ctx, 1 + (moving ? legA : 0), -13, 4, 9, "#f6d5c0");
    rect(ctx, -7 + (moving ? legB : 0), -4, 6, 3, type.shoe);
    rect(ctx, 1 + (moving ? legA : 0), -4, 6, 3, type.shoe);
    rect(ctx, -6 + (moving ? legB : 0), -4, 4, 1, type.trim);
    rect(ctx, 2 + (moving ? legA : 0), -4, 4, 1, type.trim);

    // Skirt with a soft stepped hem.
    for (let row = 0; row < 9; row++) {
      const half = 5 + Math.floor(row * 0.65);
      rect(ctx, -half, -23 + row, half * 2, 1, row % 3 === 0 ? skirtDark : skirt);
    }
    rect(ctx, -10, -15, 20, 1, type.trim);
    rect(ctx, -1, -22, 2, 8, skirtDark);

    // Bodice.
    rect(ctx, -6, -32, 12, 11, skirt);
    rect(ctx, -6, -32, 2, 11, skirtDark);
    rect(ctx, 4, -32, 2, 11, skirtDark);
    rect(ctx, -5, -32, 10, 2, type.trim);
    rect(ctx, -1, -31, 2, 7, type.trim);
    rect(ctx, -5, -25, 10, 1, skirtDark);

    // Neck and head.
    rect(ctx, -2, -34, 4, 3, skinDark);
    rect(ctx, -6, -45, 12, 12, skin);
    rect(ctx, -6, -45, 2, 9, skinDark);
    rect(ctx, 5, -40, 2, 3, skinDark);

    // Back arm and front arm.
    const armY = kissing ? -32 : -30;
    if (kissing) {
      rect(ctx, -9, -30, 3, 8, skirtDark);
      rect(ctx, 6, -33, 6, 2, skin);
      rect(ctx, 10, -33, 3, 2, skin);
    } else {
      rect(ctx, -9, -30 + Math.round(walk), 3, 9, skirtDark);
      rect(ctx, -9, -22 + Math.round(walk), 2, 3, skinDark);
      rect(ctx, 7, -30 - Math.round(walk), 3, 9, skirt);
      rect(ctx, 7, -22 - Math.round(walk), 2, 3, skin);
    }

    drawGirlHairFront(ctx, g, type, kissing);

    // Face.
    const closed = kissing || charmed;
    if (closed) {
      rect(ctx, -4, -40, 2, 1, "#6d3341");
      rect(ctx, 2, -40, 2, 1, "#6d3341");
    } else {
      rect(ctx, -4, -41, 2, 2, "#2d1824");
      rect(ctx, 2, -41, 2, 2, "#2d1824");
      rect(ctx, -4, -41, 1, 1, "#fff8ea");
      rect(ctx, 2, -41, 1, 1, "#fff8ea");
      // Angry little brows.
      rect(ctx, -4, -43, 2, 1, type.hairDark);
      rect(ctx, 3, -43, 2, 1, type.hairDark);
      rect(ctx, 2, -42, 1, 1, type.hairDark);
    }
    rect(ctx, -1, -37, 2, 1, "#a34a5e");
    if (closed) {
      rect(ctx, -5, -38, 2, 1, "rgba(236,120,139,0.85)");
      rect(ctx, 3, -38, 2, 1, "rgba(236,120,139,0.85)");
    }

    // Accessories.
    if (type.style === "twin") {
      // Bow.
      rect(ctx, 4, -49, 3, 2, type.accent);
      rect(ctx, 7, -48, 3, 2, type.accent);
      rect(ctx, 6, -47, 2, 2, type.hairDark);
    } else if (type.style === "long") {
      // Crescent pin.
      rect(ctx, 5, -48, 3, 1, type.accent);
      rect(ctx, 7, -47, 1, 2, type.accent);
      rect(ctx, 5, -46, 3, 1, type.accent);
    } else if (type.style === "bob") {
      // Sun pin.
      rect(ctx, 5, -49, 2, 2, type.accent);
      rect(ctx, 4, -48, 1, 1, type.accent);
      rect(ctx, 7, -48, 1, 1, type.accent);
      rect(ctx, 5, -50, 1, 1, type.accent);
    } else {
      // Mint flower.
      rect(ctx, 5, -50, 2, 2, type.accent);
      rect(ctx, 4, -49, 1, 1, type.accent);
      rect(ctx, 7, -49, 1, 1, type.accent);
      rect(ctx, 5, -48, 2, 1, type.accent);
    }

    // Kissy arms and a tiny heart.
    if (kissing) {
      drawHeart(ctx, 13, -41, 1, "#ff6a96", 0.9);
    }

    if (charmed) {
      drawHeart(ctx, -12, -50 + Math.sin(time * 5) * 2, 1, "#ff93b0", 0.9);
      drawHeart(ctx, 11, -45 + Math.cos(time * 4.4) * 2, 1, type.projectile, 0.8);
      if (state === "leaving") {
        drawHeart(ctx, -2, -55 + Math.sin(time * 6) * 2, 1, "#ffd1df", 0.7);
      }
    }

    ctx.restore();
  }

  MH.drawGirl = (g, forcedState) => {
    const ctx = c();
    const type = MH.GIRL_TYPES[g.type] || MH.GIRL_TYPES.cherry;
    const state = forcedState || g.state;
    const ground = g.groundY || MH.view.groundY;
    const scale = g.scale || 1;
    const height = Math.max(0, ground - g.y);
    drawShadow(g.x, ground, Math.max(0.45, (1 - height / 120) * scale), state === "charmed" ? 0.24 : 0.3);

    const flicker = g.invT > 0 && Math.floor(MH.view.time * 24) % 2 === 0;
    ctx.save();
    if (flicker) ctx.globalAlpha = 0.4;
    drawGirl(ctx, g, type, state, scale);
    ctx.restore();
  };

  MH.drawProjectile = (p) => {
    const ctx = c();
    const pulse = 1 + Math.sin(MH.view.time * 12 + p.seed) * 0.12;
    ctx.save();
    ctx.translate(Math.round(p.x), Math.round(p.y));
    ctx.scale(pulse, pulse);
    ctx.globalAlpha = 0.25;
    drawHeart(ctx, -8, -7, 2.4, p.color, 0.45);
    ctx.globalAlpha = 1;
    drawHeart(ctx, -6, -5, 1.75, p.color);
    drawHeart(ctx, -5, -4, 1, "#fff2df");
    ctx.restore();
  };

  MH.drawKissTarget = (g) => {
    const ctx = c();
    const time = MH.view.time;
    const cx = Math.round(g.x);
    const cy = Math.round(g.y - 26);
    const radius = 22 + Math.sin(time * 5) * 1.5;
    ctx.save();

    // Dashed halo drawn above the girl so it never hides behind her.
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2 + time * 0.55;
      const x = Math.round(cx + Math.cos(a) * radius);
      const y = Math.round(cy + Math.sin(a) * radius * 0.88);
      const hot = i % 3 === 0;
      ctx.fillStyle = "rgba(31, 10, 29, 0.72)";
      ctx.fillRect(x - 1, y - 1, 4, 4);
      ctx.fillStyle = hot ? "rgba(255, 247, 227, 0.96)" : "rgba(255, 112, 155, 0.92)";
      ctx.fillRect(x, y, hot ? 2 : 3, 2);
    }

    // Pulsing ring on the rooftop at her feet.
    const groundPulse = 0.28 + (Math.sin(time * 5) + 1) * 0.14;
    ctx.fillStyle = `rgba(255, 124, 161, ${groundPulse})`;
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 - time * 0.7;
      ctx.fillRect(
        Math.round(g.x + Math.cos(a) * 15),
        Math.round(g.y - 1 + Math.sin(a) * 3),
        2,
        1
      );
    }

    // Kiss marker.
    const hx = cx - 4;
    const hy = Math.round(g.y - 58 + Math.sin(time * 5) * 2);
    drawHeart(ctx, hx + 1, hy + 1, 1.3, "rgba(24, 8, 22, 0.55)");
    drawHeart(ctx, hx, hy, 1.3, "#ff719b");
    drawHeart(ctx, hx + 1, hy + 1, 0.6, "#fff1e0");
    ctx.fillStyle = "rgba(28, 9, 25, 0.7)";
    ctx.fillRect(cx - 9, hy + 9, 18, 3);
    ctx.fillStyle = "rgba(255, 238, 224, 0.96)";
    ctx.fillRect(cx - 8, hy + 9, 16, 1);
    ctx.fillStyle = "rgba(255, 113, 155, 0.9)";
    ctx.fillRect(cx - 4, hy + 11, 8, 1);
    ctx.restore();
  };

  MH.drawKissBurst = (x, y, age, color) => {
    const ctx = c();
    const t = Math.max(0, Math.min(1, age));
    ctx.save();
    ctx.globalAlpha = 1 - t;
    drawHeart(ctx, x - 11, y - 12 - t * 16, 2.5, color);
    drawHeart(ctx, x - 17, y - 4 - t * 8, 1.3, "#ffe1ea");
    drawHeart(ctx, x + 10, y - 6 - t * 12, 1.6, "#ffe1ea");
    ctx.restore();
  };
})();
