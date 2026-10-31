(() => {
  "use strict";
  const MH = (window.MH = window.MH || {});
  const D = MH.DOM;

  MH.player = null;

  const G = {
    state: "title",
    hp: MH.MAX_LIFE,
    kisses: 0,
    score: 0,
    combo: 0,
    comboTimer: 0,
    maxCombo: 1,
    elapsed: 0,
    timeLeft: MH.ROUND_TIME,
    spawnTimer: 0.8,
    kissCd: 0,
    kissTarget: null,
    shake: 0,
    endTimer: 0,
    endWin: false,
    endReason: "",
    result: null,
    stepTimer: 0,
    lastHud: "",
  };
  MH.G = G;

  const TypeKeys = Object.keys(MH.GIRL_TYPES);

  function makePlayer() {
    return {
      x: MH.view.W / 2,
      y: MH.view.groundY,
      groundY: MH.view.groundY,
      vx: 0,
      vy: 0,
      onGround: true,
      facing: 1,
      anim: 0,
      invT: 0,
      hurtT: 0,
      kissing: false,
      kissT: 0,
      reachT: 0,
      coyote: 0.1,
      jumpBuffer: 0,
      jumpCut: 0,
      dead: false,
      scale: MH.PLAYER_SCALE,
    };
  }

  MH.player = makePlayer();

  function makeGirl(typeKey, fromLeft) {
    const type = MH.GIRL_TYPES[typeKey];
    const speedBonus = Math.min(0.44, G.elapsed / 150);
    const hp = 52;
    return {
      type: typeKey,
      x: fromLeft ? -24 : MH.view.W + 24,
      y: MH.view.groundY,
      groundY: MH.view.groundY,
      vx: fromLeft ? 1 : -1,
      facing: fromLeft ? 1 : -1,
      anim: Math.random() * 10,
      state: "angry",
      stateT: 0,
      shootCd: type.shootRate * MH.rand(0.55, 0.95),
      windup: 0,
      speed: type.speed * (1 + speedBonus) * MH.rand(0.9, 1.08),
      height: hp,
      bobSeed: Math.random() * 5,
      invT: 0,
      removed: false,
      scale: MH.GIRL_SCALE,
    };
  }

  function clearInputs() {
    MH.input.jumpQueued = false;
    MH.input.kissQueued = false;
    MH.input.jumpHeld = false;
    MH.input.keyboardAxis = 0;
    MH.input.joyAxis = 0;
    MH.input.joystickActive = false;
    MH.input.tiltAxis = 0;
    MH.keys.left = false;
    MH.keys.right = false;
    D.joystick.classList.remove("active");
    D.joystickKnob.style.transform = "translate(0px, 0px)";
  }

  // ---------------------------------------------------------------------------
  // UI and state transitions
  // ---------------------------------------------------------------------------

  function setScreenVisibility() {
    D.titleScreen.hidden = G.state !== "title";
    D.pauseScreen.hidden = G.state !== "paused";
    D.overScreen.hidden = G.state !== "won" && G.state !== "lost";
    D.frame.dataset.state = G.state;

    const controlsActive = G.state === "playing" || G.state === "ending";
    D.touchControls.inert = !controlsActive;
    D.touchControls.setAttribute("aria-hidden", String(!controlsActive));
    D.hud.inert = !controlsActive;
    D.hud.setAttribute("aria-hidden", String(!controlsActive));
  }

  function updateSoundUI() {
    const muted = MH.sound.muted;
    D.soundBtn.classList.toggle("muted", muted);
    D.soundBtn.setAttribute("aria-pressed", String(muted));
    D.soundBtn.setAttribute("aria-label", muted ? "Unmute sound" : "Mute sound");
    D.soundGlyph.textContent = muted ? "×" : "♪";
    D.titleSoundBtn.textContent = `SOUND: ${muted ? "OFF" : "ON"}`;
  }

  function updateHud(force = false) {
    const hp = Math.round(G.hp);
    const key = `${hp}|${G.kisses}|${G.combo}|${Math.ceil(G.timeLeft)}|${G.kissTarget ? 1 : 0}|${G.kissCd > 0}|${G.state}`;
    if (!force && key === G.lastHud) return;
    G.lastHud = key;
    D.lifeFill.style.width = `${MH.clamp(G.hp, 0, 100)}%`;
    D.lifeText.textContent = String(hp);
    D.lifeBar.setAttribute("aria-valuenow", String(hp));
    D.lifeBar.classList.toggle("low", G.hp < 31);
    D.kissCount.textContent = `${String(G.kisses).padStart(2, "0")}/${MH.GOAL}`;
    D.timerText.textContent = MH.formatTime(G.timeLeft);
    D.timerBox.classList.toggle("urgent", G.timeLeft <= 15 && G.state === "playing");
    const showCombo = G.combo > 1 && G.state === "playing";
    D.comboChip.hidden = !showCombo;
    if (showCombo) D.comboChip.textContent = `x${G.combo}`;
    D.kissBtn.classList.toggle("ready", !!G.kissTarget && G.state === "playing");
    D.kissBtn.classList.toggle("cooling", G.kissCd > 0);
  }

  function resetRound() {
    const { W, groundY } = MH.view;
    MH.player = makePlayer();
    MH.player.x = W * 0.5;
    MH.player.y = groundY;
    MH.player.groundY = groundY;
    MH.girls = [];
    MH.projectiles = [];
    MH.particles = [];
    MH.floaters = [];
    MH.initPetals();

    G.hp = MH.MAX_LIFE;
    G.kisses = 0;
    G.score = 0;
    G.combo = 0;
    G.comboTimer = 0;
    G.maxCombo = 1;
    G.elapsed = 0;
    G.timeLeft = MH.ROUND_TIME;
    G.spawnTimer = 0.9;
    G.kissCd = 0;
    G.kissTarget = null;
    G.shake = 0;
    G.endTimer = 0;
    G.endWin = false;
    G.endReason = "";
    G.result = null;
    G.stepTimer = 0;
    G.lastHud = "";
    clearInputs();
    updateHud(true);
  }

  function startRound() {
    MH.sound.init();
    MH.sound.click();
    resetRound();
    G.state = "playing";
    setScreenVisibility();
    updateHud(true);
    MH.toast("KISS THE HEARTBREAKERS TO HEAL", 2400);
  }

  function showTitle() {
    G.state = "title";
    G.kissTarget = null;
    G.endWin = false;
    clearInputs();
    setScreenVisibility();
    D.bestTitle.textContent = `BEST ${MH.formatScore(MH.bestScore)}`;
    updateHud(true);
  }

  function togglePause() {
    if (G.state === "playing") {
      G.state = "paused";
      clearInputs();
      setScreenVisibility();
    } else if (G.state === "paused") {
      G.state = "playing";
      setScreenVisibility();
      clearInputs();
    }
  }

  function autoPause() {
    if (G.state === "playing") {
      G.state = "paused";
      clearInputs();
      setScreenVisibility();
    }
  }

  function toggleSound() {
    MH.sound.init();
    MH.sound.toggleMuted();
    updateSoundUI();
  }

  function toggleTilt() {
    MH.toggleTilt();
  }

  MH.game = {
    togglePause,
    autoPause,
    toggleSound,
    toggleTilt,
    startRound,
    showTitle,
  };

  // ---------------------------------------------------------------------------
  // Kissing
  // ---------------------------------------------------------------------------

  function findKissTarget() {
    let best = null;
    let bestDist = Infinity;
    for (const girl of MH.girls) {
      if (girl.state !== "angry") continue;
      const dx = Math.abs(girl.x - MH.player.x);
      const dy = Math.abs(girl.y - MH.player.y);
      if (dx <= 67 && dy <= 34) {
        const score = dx + dy * 0.4;
        if (score < bestDist) {
          bestDist = score;
          best = girl;
        }
      }
    }
    return best;
  }

  function startKiss(girl) {
    const p = MH.player;
    const side = p.x <= girl.x ? -1 : 1;
    p.x = MH.clamp(girl.x + side * 15, 20, MH.view.W - 20);
    p.groundY = MH.view.groundY;
    p.y = MH.view.groundY;
    p.vx = 0;
    p.vy = 0;
    p.onGround = true;
    p.kissing = true;
    p.kissT = 0.72;
    p.kissLock = 0.72;
    p.facing = -side;
    p.invT = Math.max(p.invT, 1.05);
    p.reachT = 0;

    girl.state = "kissing";
    girl.stateT = 0.72;
    girl.facing = side;
    girl.vx = 0;
    girl.windup = 0;

    if (G.comboTimer > 0) G.combo = Math.min(9, G.combo + 1);
    else G.combo = 1;
    G.maxCombo = Math.max(G.maxCombo, G.combo);
    G.comboTimer = 5.2;

    const heal = Math.min(28, MH.MAX_LIFE - G.hp);
    G.hp = Math.min(MH.MAX_LIFE, G.hp + 28);
    G.kisses += 1;
    G.score += 120 * G.combo;
    G.kissCd = 0.55;
    G.kissTarget = null;
    G.shake = Math.max(G.shake, 0.34);
    G.kissFx = { age: 0 };

    const midX = (p.x + girl.x) / 2;
    const midY = MH.view.groundY - 38;
    MH.spawnHeartBurst(midX, midY, 22, ["#ff5f91", "#ff9db8", "#ffd6df", "#ffd166"], 1.1);
    MH.spawnSparks(midX, midY + 5, 14, ["#ffe6c8", "#ff87a8", "#ffd166"], 0.9);
    MH.addFloater(midX, midY - 21, "MWAH!", "#ffd9df", 15, -18, 1.15);
    if (heal > 0) MH.addFloater(p.x, p.y - 58, `+${heal} LIFE`, "#8ff7d9", 8, -20, 1.2);
    if (G.combo > 1) MH.addFloater(midX, midY - 39, `COMBO x${G.combo}`, "#ffd166", 8, -24, 1.1);

    MH.sound.kiss();
    if (G.combo > 1) setTimeout(() => MH.sound.combo(G.combo), 110);
    if (navigator.vibrate) navigator.vibrate(18);
    updateHud(true);
  }

  function tryKiss() {
    if (G.kissCd > 0 || MH.player.kissing) return;
    const target = findKissTarget();
    if (target) {
      startKiss(target);
    } else {
      G.kissCd = 0.28;
      MH.player.reachT = 0.22;
      MH.sound.whiff();
      if (Math.random() > 0.55) {
        MH.addFloater(MH.player.x, MH.player.y - 55, "TOO FAR", "#bba3b1", 7, -14, 0.8);
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Girls & projectiles
  // ---------------------------------------------------------------------------

  function spawnGirl() {
    const present = new Set(MH.girls.filter((g) => g.state === "angry").map((g) => g.type));
    const fresh = TypeKeys.filter((key) => !present.has(key));
    const typeKey = MH.pick(fresh.length ? fresh : TypeKeys);
    const fromLeft = Math.random() < 0.5;
    const girl = makeGirl(typeKey, fromLeft);
    MH.girls.push(girl);
  }

  function fireHeart(girl) {
    const p = MH.player;
    const type = MH.GIRL_TYPES[girl.type];
    const sx = girl.x + girl.facing * 8;
    const sy = girl.y - 38;
    let dx = p.x - sx;
    let dy = p.y - 27 - sy;
    const dist = Math.hypot(dx, dy) || 1;
    dx /= dist;
    dy /= dist;
    const spread = MH.rand(-0.055, 0.055);
    const cos = Math.cos(spread);
    const sin = Math.sin(spread);
    const vx = (dx * cos - dy * sin) * 84;
    const vy = (dx * sin + dy * cos) * 84;
    MH.projectiles.push({
      x: sx,
      y: sy,
      vx,
      vy,
      life: 4.6,
      color: type.projectile,
      seed: Math.random() * 10,
      dead: false,
    });
    MH.spawnHeartBurst(sx, sy, 3, ["#ff9db8", "#ffd6df"], 0.3);
    MH.sound.shoot();
  }

  function damagePlayer(amount, sourceX, heavy) {
    const p = MH.player;
    if (p.invT > 0 || p.kissing || G.state !== "playing") return;
    p.invT = heavy ? 1.35 : 0.95;
    p.hurtT = 0.3;
    G.hp = Math.max(0, G.hp - amount);
    G.combo = 0;
    G.comboTimer = 0;
    p.vx = (p.x >= sourceX ? 1 : -1) * 150;
    if (p.onGround) {
      p.vy = -135;
      p.onGround = false;
    }
    G.shake = Math.max(G.shake, heavy ? 0.6 : 0.38);
    MH.pulseDamage();
    MH.sound.hurt();
    if (navigator.vibrate) navigator.vibrate(heavy ? 45 : 25);
    MH.spawnSparks(p.x, p.y - 24, heavy ? 14 : 9, ["#ff5d7f", "#ffb36e", "#ffe0c6"], heavy ? 1.2 : 0.8);
    MH.addFloater(p.x, p.y - 52, `-${amount}`, "#ff7f96", 8, -26, 0.9);
    updateHud(true);
    if (G.hp <= 0) endGame(false, "life");
  }

  function updateGirls(dt, time) {
    const p = MH.player;
    for (const girl of MH.girls) {
      girl.invT = Math.max(0, girl.invT - dt);
      if (girl.state === "kissing") {
        girl.stateT -= dt;
        girl.vx = 0;
        girl.anim += dt * 2;
        if (girl.stateT <= 0) {
          girl.state = "charmed";
          girl.stateT = 1.1;
          girl.vx = 0;
          if (G.kisses >= MH.GOAL) {
            endGame(true, "kiss");
          }
        }
        continue;
      }

      if (girl.state === "charmed") {
        girl.stateT -= dt;
        girl.anim += dt * 2;
        girl.vx = 0;
        if (girl.stateT <= 0) {
          girl.state = "leaving";
          girl.stateT = 9;
          girl.vx = -girl.facing * 34;
        }
        continue;
      }

      if (girl.state === "leaving") {
        girl.x += girl.vx * dt;
        girl.anim += dt * (3 + Math.abs(girl.vx) * 0.05);
        if (girl.x < -50 || girl.x > MH.view.W + 50) girl.removed = true;
        continue;
      }

      // Aggressive heartbreaker AI.
      const dx = p.x - girl.x;
      const dir = MH.sign(dx) || girl.facing;
      girl.facing = dir;
      const dist = Math.abs(dx);
      const baseSpeed = girl.speed * (1 + Math.min(0.35, G.elapsed / 230));
      girl.vx = dir * baseSpeed * (girl.windup > 0 ? 0.34 : 1);
      if (dist < 17) girl.vx = dir * baseSpeed * 0.18;

      // Soft separation keeps the crowd readable.
      for (const other of MH.girls) {
        if (other === girl || other.state !== "angry") continue;
        const d = girl.x - other.x;
        if (Math.abs(d) < 26 && Math.abs(d) > 0.1) {
          girl.vx += (d > 0 ? 1 : -1) * 66;
        }
      }

      girl.x += girl.vx * dt;
      girl.anim += dt * (2.8 + Math.abs(girl.vx) * 0.07);
      girl.x = MH.clamp(girl.x, -30, MH.view.W + 30);

      if (girl.shootCd > 0) girl.shootCd -= dt;
      if (girl.windup > 0) {
        girl.windup -= dt;
        if (girl.windup <= 0) fireHeart(girl);
      } else if (girl.shootCd <= 0 && dist < 168 && G.elapsed > 3.5 && Math.abs(p.y - girl.y) < 70) {
        girl.windup = 0.42;
        const type = MH.GIRL_TYPES[girl.type];
        girl.shootCd = type.shootRate * MH.rand(0.82, 1.2);
      }

      // Body contact.
      const verticalContact = p.y > MH.view.groundY - 44;
      if (verticalContact && Math.abs(girl.x - p.x) < 18 && p.invT <= 0 && !p.kissing) {
        damagePlayer(13, girl.x, true);
        girl.x += (girl.x >= p.x ? 1 : -1) * 10;
        girl.invT = 0.3;
      }
    }

    MH.girls = MH.girls.filter((g) => !g.removed);
  }

  function updateProjectiles(dt) {
    const p = MH.player;
    for (const heart of MH.projectiles) {
      heart.x += heart.vx * dt;
      heart.y += heart.vy * dt;
      heart.life -= dt;
      if (
        heart.life <= 0 ||
        heart.x < -20 ||
        heart.x > MH.view.W + 20 ||
        heart.y < -20 ||
        heart.y > MH.view.H + 20
      ) {
        heart.dead = true;
        continue;
      }
      if (Math.hypot(heart.x - p.x, heart.y - (p.y - 27)) < 11 && p.invT <= 0 && !p.kissing) {
        heart.dead = true;
        damagePlayer(8, heart.x, false);
      }
    }
    MH.projectiles = MH.projectiles.filter((h) => !h.dead);
  }

  // ---------------------------------------------------------------------------
  // Main update
  // ---------------------------------------------------------------------------

  function updatePlayer(dt) {
    const p = MH.player;
    const axis = MH.getMoveAxis();
    if (p.invT > 0) p.invT -= dt;
    if (p.hurtT > 0) p.hurtT -= dt;
    if (p.reachT > 0) p.reachT -= dt;
    if (p.kissLock > 0) p.kissLock -= dt;

    if (p.kissing) {
      p.kissT -= dt;
      p.vx = 0;
      p.vy = 0;
      p.y = MH.view.groundY;
      p.onGround = true;
      p.anim += dt * 2.5;
      if (p.kissT <= 0) {
        p.kissing = false;
        p.kissLock = 0;
        p.invT = Math.max(p.invT, 0.45);
      }
      return;
    }

    const maxSpeed = 154;
    const accel = p.onGround ? 15 : 6.5;
    const targetVx = axis * maxSpeed;
    p.vx += (targetVx - p.vx) * Math.min(1, dt * accel);
    if (Math.abs(axis) < 0.02 && p.onGround) p.vx *= Math.pow(0.0008, dt);

    if (Math.abs(axis) > 0.06) p.facing = axis > 0 ? 1 : -1;

    p.x += p.vx * dt;
    p.x = MH.clamp(p.x, 20, MH.view.W - 20);

    if (MH.input.jumpQueued) {
      p.jumpBuffer = 0.12;
      MH.input.jumpQueued = false;
    } else {
      p.jumpBuffer = Math.max(0, p.jumpBuffer - dt);
    }

    if (p.onGround) p.coyote = 0.1;
    else p.coyote = Math.max(0, p.coyote - dt);

    if (p.jumpBuffer > 0 && (p.onGround || p.coyote > 0)) {
      p.vy = -372;
      p.onGround = false;
      p.coyote = 0;
      p.jumpBuffer = 0;
      // A quick tap still clears a heartbreaker; holding the button floats higher.
      p.jumpCut = 0.16;
      MH.sound.jump();
      MH.spawnDust(p.x, MH.view.groundY, p.vx > 0 ? 1 : -1);
    }

    if (p.jumpCut > 0) p.jumpCut -= dt;
    if (!MH.input.jumpHeld && p.vy < -145 && p.jumpCut <= 0) {
      p.vy = -145;
    }

    p.vy += 980 * dt;
    p.y += p.vy * dt;

    if (p.y >= MH.view.groundY) {
      if (!p.onGround && p.vy > 110) {
        MH.sound.land();
        MH.spawnDust(p.x, MH.view.groundY, p.vx > 0 ? 1 : -1);
      }
      p.y = MH.view.groundY;
      p.vy = 0;
      p.onGround = true;
    } else {
      p.onGround = false;
    }

    p.anim += dt * (3.5 + Math.abs(p.vx) / 23);
    if (p.onGround && Math.abs(p.vx) > 28) {
      G.stepTimer -= dt * (Math.abs(p.vx) / maxSpeed);
      if (G.stepTimer <= 0) {
        G.stepTimer = 0.22;
        MH.spawnDust(p.x - p.facing * 5, MH.view.groundY, p.facing);
      }
    }
  }

  function updateSpawner(dt) {
    G.spawnTimer -= dt;
    const active = MH.girls.filter((g) => g.state === "angry" || g.state === "kissing").length;
    const maxGirls = G.elapsed < 20 ? 3 : G.elapsed < 46 ? 4 : 5;
    if (G.spawnTimer <= 0) {
      if (active < maxGirls) {
        spawnGirl();
        if (G.elapsed < 2) G.spawnTimer = 0.9;
        else G.spawnTimer = Math.max(1.45, 3.05 - G.elapsed * 0.022) * MH.rand(0.86, 1.16);
      } else {
        G.spawnTimer = 0.55;
      }
    }
    if (active === 0 && G.spawnTimer > 0.5) G.spawnTimer = 0.5;
  }

  function update(dt) {
    if (G.state !== "playing") return;
    const time = MH.view.time;

    G.elapsed += dt;
    G.timeLeft = Math.max(0, G.timeLeft - dt);
    G.kissCd = Math.max(0, G.kissCd - dt);
    G.shake = Math.max(0, G.shake - dt * 2.8);

    if (G.comboTimer > 0) {
      G.comboTimer -= dt;
      if (G.comboTimer <= 0) G.combo = 0;
    }

    updatePlayer(dt);

    if (MH.input.kissQueued) {
      MH.input.kissQueued = false;
      tryKiss();
    }

    G.kissTarget = MH.player.kissing ? null : findKissTarget();
    updateGirls(dt, time);
    updateProjectiles(dt);
    updateSpawner(dt);
    MH.updateParticles(dt);

    if (G.state === "playing" && G.timeLeft <= 0) {
      G.timeLeft = 0;
      endGame(false, "time");
    }

    updateHud();
  }

  function updateEnding(dt) {
    G.shake = Math.max(0, G.shake - dt * 2.8);
    MH.updateParticles(dt);
    G.endTimer -= dt;
    if (G.endTimer <= 0) showResults();
    updateHud();
  }

  // ---------------------------------------------------------------------------
  // Results
  // ---------------------------------------------------------------------------

  function finalScoreValue(win) {
    const timeBonus = win ? Math.round(G.timeLeft * 10) : 0;
    const lifeBonus = Math.round(G.hp * 3);
    const comboBonus = Math.max(0, G.maxCombo - 1) * 25;
    return G.score + timeBonus + lifeBonus + comboBonus;
  }

  function endGame(win, reason) {
    if (G.state !== "playing") return;
    G.state = "ending";
    G.endWin = win;
    G.endReason = reason;
    G.endTimer = win ? 1.7 : 1.15;
    G.kissTarget = null;
    MH.player.kissing = false;
    MH.input.kissQueued = false;
    D.kissBtn.classList.remove("ready", "cooling");
    setScreenVisibility();
    clearInputs();
    if (win) {
      MH.sound.win();
      G.shake = 0.5;
      const { W, groundY } = MH.view;
      for (let i = 0; i < 4; i++) {
        MH.spawnHeartBurst(W * (0.22 + i * 0.18), groundY - 110 - (i % 2) * 35, 11, ["#ff5f91", "#ffd166", "#8ff7d9", "#ffd6df"], 1.3);
      }
    } else {
      MH.sound.lose();
    }
  }

  function showResults() {
    const win = G.endWin;
    G.state = win ? "won" : "lost";
    const final = finalScoreValue(win);
    const isBest = final > MH.bestScore;
    if (isBest) {
      MH.bestScore = final;
      MH.store.set("midnightHearts.best", final);
      D.bestTitle.textContent = `BEST ${MH.formatScore(final)}`;
    }

    D.finalScore.textContent = MH.formatScore(final);
    D.finalKisses.textContent = `${G.kisses}/${MH.GOAL}`;
    D.finalCombo.textContent = `x${G.maxCombo}`;
    D.finalTime.textContent = MH.formatTime(MH.ROUND_TIME - G.timeLeft);
    D.newBest.hidden = !isBest;
    D.overScreen.classList.toggle("win", win);

    if (win) {
      D.overKicker.textContent = "TWELVE HEARTS. ONE NIGHT.";
      D.overHeading.textContent = "SUNRISE KISS";
      D.overMessage.textContent = "You made it to dawn, and the city is still a little in love with you.";
    } else if (G.endReason === "time") {
      D.overKicker.textContent = "THE SUN IS UP";
      D.overHeading.textContent = "TOO LATE, ROMANTIC";
      D.overMessage.textContent = `${G.kisses} hearts melted. The city needed just a little more charm.`;
    } else {
      D.overKicker.textContent = "SUNRISE CAME TOO SOON";
      D.overHeading.textContent = "HEARTBROKEN";
      D.overMessage.textContent = "You ran out of life. A kiss could have saved you.";
    }

    setScreenVisibility();
    updateSoundUI();
  }

  // ---------------------------------------------------------------------------
  // Layout
  // ---------------------------------------------------------------------------

  let lastW = 0;
  let lastH = 0;
  let resizeQueued = false;

  function layout() {
    resizeQueued = false;
    const rect = D.frame.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const aspect = rect.width / rect.height;
    let w = 360;
    let h = w / aspect;
    if (h < 600) {
      h = 600;
      w = h * aspect;
    }
    if (h > 875) {
      h = 875;
      w = h * aspect;
    }
    if (w > 620) {
      w = 620;
      h = w / aspect;
    }
    const W = Math.max(300, Math.round(w));
    const H = Math.max(540, Math.round(h));
    if (W === lastW && H === lastH) return;
    lastW = W;
    lastH = H;

    const oldGround = MH.view.groundY;
    MH.view.W = W;
    MH.view.H = H;
    MH.view.groundY = Math.round(H - 176);
    D.canvas.width = W;
    D.canvas.height = H;
    MH.ctx = D.canvas.getContext("2d", { alpha: false });
    MH.ctx.imageSmoothingEnabled = false;

    if (MH.player) {
      const dy = MH.view.groundY - oldGround;
      MH.player.groundY = MH.view.groundY;
      if (G.state === "playing" || G.state === "ending" || G.state === "paused") {
        MH.player.y += dy;
        if (MH.player.y >= MH.view.groundY) MH.player.y = MH.view.groundY;
      } else {
        MH.player.y = MH.view.groundY;
      }
      MH.player.x = MH.clamp(MH.player.x, 20, W - 20);
    }
    for (const girl of MH.girls) {
      girl.groundY = MH.view.groundY;
      if (girl.state === "angry" || girl.state === "kissing" || girl.state === "charmed" || girl.state === "leaving") {
        girl.y = MH.view.groundY;
      }
      girl.x = MH.clamp(girl.x, -40, W + 40);
    }

    MH.buildBackground();
    MH.initPetals();
    updateHud(true);
  }

  function queueLayout() {
    if (resizeQueued) return;
    resizeQueued = true;
    requestAnimationFrame(layout);
  }

  // ---------------------------------------------------------------------------
  // Event bindings
  // ---------------------------------------------------------------------------

  D.startBtn.addEventListener("click", () => {
    startRound();
  });
  D.againBtn.addEventListener("click", () => {
    startRound();
  });
  D.titleBtn.addEventListener("click", () => {
    MH.sound.click();
    showTitle();
  });
  D.resumeBtn.addEventListener("click", () => {
    MH.sound.click();
    togglePause();
  });
  D.restartPauseBtn.addEventListener("click", () => {
    startRound();
  });
  D.quitBtn.addEventListener("click", () => {
    MH.sound.click();
    showTitle();
  });
  D.pauseBtn.addEventListener("click", () => {
    MH.sound.click();
    togglePause();
  });
  D.soundBtn.addEventListener("click", toggleSound);
  D.titleSoundBtn.addEventListener("click", () => {
    toggleSound();
  });
  D.tiltBtn.addEventListener("click", (event) => {
    event.preventDefault();
    MH.toggleTilt();
  });

  window.addEventListener("resize", queueLayout);
  window.addEventListener("orientationchange", () => setTimeout(queueLayout, 120));
  if (window.ResizeObserver) {
    new ResizeObserver(queueLayout).observe(D.frame);
  }

  // ---------------------------------------------------------------------------
  // Main loop
  // ---------------------------------------------------------------------------

  let lastFrame = performance.now();

  function loop(now) {
    requestAnimationFrame(loop);
    const dt = Math.min(0.04, Math.max(0.001, (now - lastFrame) / 1000));
    lastFrame = now;
    MH.view.time += dt;

    if (G.state !== "paused") MH.updatePetals(dt, MH.view.time);
    if (G.state === "playing") update(dt);
    else if (G.state === "ending") updateEnding(dt);

    MH.renderFrame();
  }

  function boot() {
    layout();
    showTitle();
    updateSoundUI();
    updateHud(true);
    requestAnimationFrame(loop);

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        MH.buildBackground();
      }).catch(() => {});
    }
  }

  boot();
})();
