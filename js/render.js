(() => {
  "use strict";
  const MH = (window.MH = window.MH || {});
  const ctx = MH.ctx;

  MH.petals = [];
  MH.particles = [];
  MH.floaters = [];
  MH.girls = [];
  MH.projectiles = [];

  MH.initPetals = () => {
    const { W, H } = MH.view;
    const pinks = ["rgba(255,147,173,", "rgba(255,211,183,", "rgba(255,104,145,", "rgba(255,233,216,"];
    MH.petals = [];
    for (let i = 0; i < 26; i++) {
      MH.petals.push({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: MH.rand(-4, 5),
        vy: MH.rand(7, 20),
        size: Math.random() > 0.8 ? 2 : 1,
        alpha: MH.rand(0.16, 0.5),
        color: MH.pick(pinks),
        phase: Math.random() * Math.PI * 2,
      });
    }
    // Fireflies near the planters.
    for (let i = 0; i < 9; i++) {
      MH.petals.push({
        firefly: true,
        x: MH.rand(6, W - 6),
        y: MH.rand(H - 260, H - 150),
        baseY: 0,
        vx: MH.rand(-5, 5),
        vy: MH.rand(-3, 3),
        size: Math.random() > 0.6 ? 2 : 1,
        alpha: MH.rand(0.25, 0.8),
        color: "rgba(255,211,132,",
        phase: Math.random() * Math.PI * 2,
      });
    }
  };

  MH.updatePetals = (dt, time) => {
    const { W, H } = MH.view;
    for (const p of MH.petals) {
      if (p.firefly) {
        p.x += Math.sin(time * 0.7 + p.phase) * 2.5 * dt + p.vx * dt;
        p.y += Math.cos(time * 0.55 + p.phase * 1.4) * 2 * dt + p.vy * dt;
        if (p.x < -5) p.x = W + 5;
        if (p.x > W + 5) p.x = -5;
        if (p.y < H - 330) p.y = H - 160;
        if (p.y > H - 130) p.y = H - 310;
      } else {
        p.x += p.vx * dt + Math.sin(time * 0.6 + p.phase) * 4 * dt;
        p.y += p.vy * dt;
        if (p.y > H + 4) {
          p.y = -4;
          p.x = Math.random() * W;
        }
        if (p.x < -4) p.x = W + 4;
        if (p.x > W + 4) p.x = -4;
      }
    }
  };

  MH.spawnHeartBurst = (x, y, count, colors, power = 1) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = MH.rand(18, 68) * power;
      MH.particles.push({
        kind: "heart",
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - MH.rand(8, 38),
        gravity: 42,
        life: MH.rand(0.55, 1.25),
        max: 1.2,
        scale: Math.random() > 0.72 ? 2 : 1,
        color: MH.pick(colors),
        phase: Math.random() * 5,
      });
    }
  };

  MH.spawnSparks = (x, y, count, colors, power = 1) => {
    for (let i = 0; i < count; i++) {
      MH.particles.push({
        kind: "spark",
        x,
        y,
        vx: MH.rand(-70, 70) * power,
        vy: MH.rand(-75, 20) * power,
        gravity: 130,
        life: MH.rand(0.25, 0.7),
        max: 0.7,
        scale: Math.random() > 0.75 ? 2 : 1,
        color: MH.pick(colors),
      });
    }
  };

  MH.spawnDust = (x, y, dir = 0) => {
    for (let i = 0; i < 4; i++) {
      MH.particles.push({
        kind: "dust",
        x: x + MH.rand(-4, 4),
        y,
        vx: MH.rand(-18, 18) - dir * 18,
        vy: MH.rand(-22, -6),
        gravity: 10,
        life: MH.rand(0.22, 0.48),
        max: 0.48,
        scale: Math.random() > 0.6 ? 2 : 1,
        color: "rgba(235,183,173,0.36)",
      });
    }
  };

  MH.addFloater = (x, y, text, color, size = 8, drift = -22, life = 1.1) => {
    MH.floaters.push({
      x,
      y,
      text,
      color,
      size,
      drift,
      life,
      max: life,
    });
  };

  MH.updateParticles = (dt) => {
    for (const p of MH.particles) {
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += (p.gravity || 0) * dt;
      p.vx *= 1 - 1.4 * dt;
    }
    MH.particles = MH.particles.filter((p) => p.life > 0);
    if (MH.particles.length > 260) MH.particles.splice(0, MH.particles.length - 260);

    for (const f of MH.floaters) {
      f.life -= dt;
      f.y += f.drift * dt;
    }
    MH.floaters = MH.floaters.filter((f) => f.life > 0);
  };

  function drawAmbient() {
    const { W, H } = MH.view;
    const time = MH.view.time;
    for (const p of MH.petals) {
      if (p.firefly) {
        const flicker = 0.55 + Math.sin(time * 3.1 + p.phase) * 0.45;
        ctx.fillStyle = `${p.color}${p.alpha * flicker * 0.15})`;
        ctx.fillRect(Math.round(p.x - 2), Math.round(p.y - 2), 5, 5);
        ctx.fillStyle = `${p.color}${p.alpha * flicker})`;
        ctx.fillRect(Math.round(p.x), Math.round(p.y), p.size, p.size);
      } else {
        ctx.fillStyle = `${p.color}${p.alpha})`;
        ctx.fillRect(Math.round(p.x), Math.round(p.y), p.size, Math.max(1, Math.round(p.size * 0.6)));
      }
    }
  }

  function drawParticles() {
    for (const p of MH.particles) {
      const a = MH.clamp(p.life / p.max, 0, 1);
      if (p.kind === "heart") {
        MH.drawHeartAt(p.x - p.scale * 3, p.y - p.scale * 2, p.scale, p.color, a * 0.95);
      } else if (p.kind === "dust") {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = a * 0.8;
        ctx.fillRect(Math.round(p.x), Math.round(p.y), p.scale + 1, p.scale);
        ctx.globalAlpha = 1;
      } else {
        ctx.globalAlpha = a;
        ctx.fillStyle = p.color;
        ctx.fillRect(Math.round(p.x), Math.round(p.y), p.scale, p.scale);
        if (p.scale > 1) {
          ctx.fillStyle = "rgba(255,255,255,0.55)";
          ctx.fillRect(Math.round(p.x), Math.round(p.y), 1, 1);
        }
        ctx.globalAlpha = 1;
      }
    }
  }

  function drawFloaters() {
    for (const f of MH.floaters) {
      const alpha = MH.clamp(f.life / Math.min(0.4, f.max), 0, 1);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.font = `${f.size}px Silkscreen, monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "rgba(20,8,24,0.8)";
      ctx.fillText(f.text, Math.round(f.x) + 1, Math.round(f.y) + 2);
      ctx.fillStyle = f.color;
      ctx.fillText(f.text, Math.round(f.x), Math.round(f.y));
      ctx.restore();
    }
  }

  function drawTitleScene() {
    const { W, H } = MH.view;
    const time = MH.view.time;
    const balconyY = Math.floor(H * 0.56);
    const man = {
      x: W * 0.46,
      y: balconyY,
      groundY: balconyY,
      facing: 1,
      onGround: true,
      vx: 0,
      anim: time * 0.5,
      invT: 0,
      hurtT: 0,
      kissLock: 1,
      kissing: true,
      reachT: 0,
      scale: 1.38,
    };
    const girl = {
      x: W * 0.54,
      y: balconyY,
      groundY: balconyY,
      facing: -1,
      anim: time,
      vx: 0,
      state: "kissing",
      bobSeed: 1,
      type: "cherry",
      invT: 0,
      scale: 1.38,
    };

    // A warm little glow behind the couple.
    const glow = ctx.createRadialGradient(W * 0.51, balconyY - 26, 4, W * 0.51, balconyY - 26, 65);
    glow.addColorStop(0, "rgba(255, 102, 144, 0.18)");
    glow.addColorStop(1, "rgba(255, 102, 144, 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(W * 0.51 - 70, balconyY - 96, 140, 140);

    // Two heartbreakers linger at the edges of the balcony.
    const balconyGirls = [
      {
        x: W * 0.2,
        y: balconyY,
        groundY: balconyY,
        facing: 1,
        anim: time * 0.7 + 1,
        vx: 0,
        state: "charmed",
        bobSeed: 1.4,
        type: "luna",
        invT: 0,
        scale: 1.08,
      },
      {
        x: W * 0.8,
        y: balconyY,
        groundY: balconyY,
        facing: -1,
        anim: time * 0.7 + 3,
        vx: 0,
        state: "charmed",
        bobSeed: 3.2,
        type: "sunny",
        invT: 0,
        scale: 1.08,
      },
    ];
    for (const extra of balconyGirls) MH.drawGirl(extra);

    MH.drawGirl(girl);
    MH.drawMan(man);

    const pulse = 1 + Math.sin(time * 3) * 0.08;
    const hx = W * 0.5;
    const hy = balconyY - 76 + Math.sin(time * 2.2) * 2;
    ctx.save();
    ctx.translate(hx, hy);
    ctx.scale(pulse, pulse);
    MH.drawHeart(ctx, -7, -6, 2, "#ff6c98", 0.95);
    MH.drawHeart(ctx, -5, -4, 1, "#ffe4ea", 1);
    ctx.restore();

    // Sparkles around the pair.
    for (let i = 0; i < 5; i++) {
      const angle = time * 0.7 + (i / 5) * Math.PI * 2;
      const r = 38 + Math.sin(time * 1.7 + i) * 8;
      ctx.fillStyle = i % 2 ? "rgba(255,210,167,0.65)" : "rgba(255,147,176,0.65)";
      ctx.fillRect(Math.round(hx + Math.cos(angle) * r), Math.round(hy + 8 + Math.sin(angle) * r * 0.45), 1, 1);
    }
  }

  function drawKissMoment() {
    const G = MH.G;
    const player = MH.player;
    if (!player || !player.kissing) return;
    const girl = MH.girls.find((g) => g.state === "kissing");
    if (!girl) return;
    const x = (player.x + girl.x) / 2;
    const y = MH.view.groundY - 42;
    const pulse = 1 + Math.sin(MH.view.time * 15) * 0.1;
    ctx.save();
    ctx.translate(Math.round(x), Math.round(y));
    ctx.scale(pulse, pulse);
    MH.drawHeart(ctx, -5, -4, 1.7, "#ff779f", 0.9);
    MH.drawHeart(ctx, -3, -2, 1, "#fff0e5", 0.9);
    ctx.restore();
  }

  MH.renderFrame = () => {
    const { W, H, groundY } = MH.view;
    const G = MH.G;
    const state = G ? G.state : "title";
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, W, H);
    if (MH.bgCanvas.width === W && MH.bgCanvas.height === H) {
      ctx.drawImage(MH.bgCanvas, 0, 0);
    } else {
      ctx.fillStyle = "#150c22";
      ctx.fillRect(0, 0, W, H);
    }

    drawAmbient();

    if (state === "title") {
      drawTitleScene();
    } else {
      const shakeX = G.shake > 0 ? Math.round((Math.random() * 2 - 1) * Math.min(2.2, G.shake * 4)) : 0;
      const shakeY = G.shake > 0 ? Math.round((Math.random() * 2 - 1) * Math.min(1.4, G.shake * 2.5)) : 0;
      ctx.save();
      ctx.translate(shakeX, shakeY);

      const sorted = [...MH.girls].sort((a, b) => (a.y === b.y ? a.x - b.x : a.y - b.y));
      for (const girl of sorted) MH.drawGirl(girl);
      if (G.kissTarget && state === "playing") MH.drawKissTarget(G.kissTarget);
      if (MH.player) MH.drawMan(MH.player);

      for (const p of MH.projectiles) MH.drawProjectile(p);
      drawKissMoment();

      for (const p of MH.particles) {
        const a = MH.clamp(p.life / p.max, 0, 1);
        if (p.kind === "heart") {
          MH.drawHeartAt(p.x - p.scale * 3, p.y - p.scale * 2, p.scale, p.color, a * 0.95);
        } else if (p.kind === "dust") {
          ctx.globalAlpha = a * 0.8;
          ctx.fillStyle = p.color;
          ctx.fillRect(Math.round(p.x), Math.round(p.y), p.scale + 1, p.scale);
          ctx.globalAlpha = 1;
        } else {
          ctx.globalAlpha = a;
          ctx.fillStyle = p.color;
          ctx.fillRect(Math.round(p.x), Math.round(p.y), p.scale, p.scale);
          if (p.scale > 1) {
            ctx.fillStyle = "rgba(255,255,255,0.55)";
            ctx.fillRect(Math.round(p.x), Math.round(p.y), 1, 1);
          }
          ctx.globalAlpha = 1;
        }
      }

      drawFloaters();

      // A sunset kiss flare when the round ends in love.
      if (state === "ending" && G.endWin) {
        const t = 1 - Math.max(0, G.endTimer) / 1.7;
        ctx.fillStyle = `rgba(255, 175, 149, ${Math.min(0.16, t * 0.16)})`;
        ctx.fillRect(0, 0, W, H);
      } else if (state === "ending" && !G.endWin) {
        const t = 1 - Math.max(0, G.endTimer) / 1.2;
        ctx.fillStyle = `rgba(84, 10, 32, ${Math.min(0.25, t * 0.25)})`;
        ctx.fillRect(0, 0, W, H);
      }

      ctx.restore();

      // Fallen petals in front of the action, low contrast.
      ctx.save();
      ctx.globalAlpha = 0.5;
      for (let i = 0; i < MH.petals.length; i += 5) {
        const p = MH.petals[i];
        if (p.firefly) continue;
        ctx.fillStyle = `${p.color}${p.alpha * 0.8})`;
        ctx.fillRect(Math.round(p.x), Math.round(p.y), p.size, 1);
      }
      ctx.restore();
    }
  };
})();
