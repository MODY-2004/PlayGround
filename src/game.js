import {
  PAL,
  clamp,
  lerp,
  dist,
  drawText,
  drawHeart,
  drawHeartSmall,
  pxRect,
  pxRing,
  store,
  load,
  vibrate,
} from './util.js';
import {
  drawHero,
  drawGirl,
  drawTree,
  drawBush,
  drawBench,
  drawLamp,
  drawFlower,
  drawHeartProjectile,
  GIRL_TYPES,
} from './sprites.js';
import { createWorld, WORLD } from './world.js';

const MAX_HP = 6;
const KISS_RANGE = 50;
const CHARGE_TIME = 0.92;
const SWEET_MIN = 0.56;
const SWEET_MAX = 0.86;
const COMBO_TIME = 5;
const BEST_KEY = 'heartrush.best.v1';

export class Game {
  constructor(canvas, callbacks, audio) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.ctx.imageSmoothingEnabled = false;
    this.callbacks = callbacks || {};
    this.audio = audio;
    this.world = createWorld();
    this.vw = 340;
    this.vh = 190;
    this.time = 0;
    this.best = Number(load(BEST_KEY, 0)) || 0;
    this.petals = [];
    this.petalTimer = 0;
    this.nearest = null;
    this.charging = false;
    this.charge = 0;
    this.state = 'title';
    this.setupTitle();
  }

  /* ---------------------------------------------------------------- */
  /* Setup                                                             */
  /* ---------------------------------------------------------------- */

  emitHud(force = false) {
    const data = {
      hp: this.player.hp,
      maxHp: this.player.maxHp,
      wave: this.wave,
      score: this.score,
      combo: this.combo,
      allies: this.allyCount(),
      state: this.state,
    };
    const key = `${data.hp}|${data.maxHp}|${data.wave}|${data.score}|${data.combo}|${data.allies}|${data.state}`;
    if (!force && key === this._hudKey) return;
    this._hudKey = key;
    this.callbacks.onHud?.(data);
  }

  makeGirl(typeId, x, y, state = 'enemy') {
    const type = GIRL_TYPES[typeId] || GIRL_TYPES.rose;
    return {
      x,
      y,
      vx: 0,
      vy: 0,
      type,
      state,
      needed: type.needed,
      stage: 0,
      stun: 0,
      spawn: 0,
      walkT: Math.random() * 10,
      dir: 'down',
      homeX: x,
      homeY: y,
      tx: x,
      ty: y,
      wanderTimer: 0.6 + Math.random() * 2,
      shootTimer: 1.8 + Math.random() * 2,
      phase: Math.random() * 8,
      slot: 0,
      heartTimer: 1 + Math.random() * 3,
      flash: 0,
      charmedT: 0,
    };
  }

  makePlayer(x = 500, y = 620) {
    return {
      x,
      y,
      vx: 0,
      vy: 0,
      dir: 'down',
      walkT: 0,
      hp: MAX_HP,
      maxHp: MAX_HP,
      invuln: 0,
    };
  }

  setupTitle() {
    this.state = 'title';
    this.player = this.makePlayer(500, 622);
    this.girls = [
      this.makeGirl('rose', 442, 512, 'demo'),
      this.makeGirl('violet', 556, 520, 'demo'),
      this.makeGirl('aqua', 500, 472, 'demo'),
    ];
    this.girls[0].dir = 'right';
    this.girls[1].dir = 'left';
    this.projectiles = [];
    this.particles = [];
    this.floats = [];
    this.spawnQueue = [];
    this.waveActive = false;
    this.waveClearTimer = 0;
    this.wave = 0;
    this.waveSpeed = 1;
    this.score = 0;
    this.combo = 0;
    this.comboTimer = 0;
    this.kissed = 0;
    this.perfects = 0;
    this.charging = false;
    this.charge = 0;
    this.freeze = 0;
    this.shake = 0;
    this.hitFlash = 0;
    this.kissFlash = 0;
    this.allyHealTimer = 14;
    this.nearest = null;
    this.cam = { x: 500, y: 535, shake: 0 };
    this.lastKiss = null;
    this.emitHud(true);
  }

  startGame() {
    this.state = 'playing';
    this.player = this.makePlayer(500, 628);
    this.girls = [];
    this.projectiles = [];
    this.particles = [];
    this.floats = [];
    this.spawnQueue = [];
    this.waveActive = false;
    this.waveClearTimer = 0;
    this.wave = 0;
    this.waveSpeed = 1;
    this.score = 0;
    this.combo = 0;
    this.comboTimer = 0;
    this.kissed = 0;
    this.perfects = 0;
    this.charging = false;
    this.charge = 0;
    this.freeze = 0;
    this.shake = 0;
    this.hitFlash = 0;
    this.kissFlash = 0;
    this.allyHealTimer = 14;
    this.nearest = null;
    this.lastKiss = null;
    this.cam.x = this.player.x;
    this.cam.y = this.player.y;
    this.cam.shake = 0;
    this.startWave(1);
    this.emitHud(true);
  }

  resize(vw, vh) {
    this.vw = Math.max(150, Math.round(vw));
    this.vh = Math.max(150, Math.round(vh));
    this.cam.x = clamp(this.cam.x, this.vw / 2, WORLD - this.vw / 2);
    this.cam.y = clamp(this.cam.y, this.vh / 2, WORLD - this.vh / 2);
    this.seedPetals();
  }

  pause() {
    if (this.state !== 'playing') return false;
    this.state = 'paused';
    this.cancelCharge();
    return true;
  }

  resume() {
    if (this.state !== 'paused') return false;
    this.state = 'playing';
    return true;
  }

  /* ---------------------------------------------------------------- */
  /* Waves & scoring                                                   */
  /* ---------------------------------------------------------------- */

  startWave(n) {
    this.wave = n;
    this.waveActive = true;
    this.waveSpeed = 1 + (n - 1) * 0.04;
    this.spawnQueue = [];

    const base = Math.min(2 + Math.floor((n - 1) * 1.15), 7);
    const queen = n >= 4 && n % 4 === 0;
    const types = [];
    for (let i = 0; i < base; i++) {
      const roll = Math.random();
      let type = 'rose';
      if (n >= 3 && roll < 0.28) type = 'aqua';
      else if (n >= 2 && roll < 0.58) type = 'violet';
      types.push(type);
    }
    if (queen) types.push('queen');

    const created = [];
    types.forEach((typeId, i) => {
      let p = this.world.spawnPoint(this.player.x, this.player.y, 145, 235);
      for (let attempt = 0; attempt < 10; attempt++) {
        const tooClose = created.some((c) => dist(c.x, c.y, p.x, p.y) < 54);
        if (!tooClose) break;
        p = this.world.spawnPoint(this.player.x, this.player.y, 145, 235);
      }
      created.push(p);
      this.spawnQueue.push({ typeId, x: p.x, y: p.y, t: 0.35 + i * 0.26 });
    });

    this.callbacks.onWave?.(n, types.length);
    this.audio.wave();
    this.emitHud(true);
  }

  updateSpawnQueue(dt) {
    for (let i = this.spawnQueue.length - 1; i >= 0; i--) {
      const q = this.spawnQueue[i];
      q.t -= dt;
      if (q.t <= 0) {
        let x = q.x;
        let y = q.y;
        if (dist(x, y, this.player.x, this.player.y) < 48) {
          const p = this.world.spawnPoint(this.player.x, this.player.y, 130, 220);
          x = p.x;
          y = p.y;
        }
        const g = this.makeGirl(q.typeId, x, y, 'enemy');
        g.spawn = 0.72;
        this.girls.push(g);
        this.spawnQueue.splice(i, 1);
        this.burstHearts(x, y - 10, 6, { speed: 30, color: PAL.pinkPale });
        this.particles.push({
          type: 'ring',
          x,
          y: y - 3,
          r: 2,
          vr: 34,
          life: 0.55,
          maxLife: 0.55,
          color: PAL.pink,
        });
      }
    }
  }

  clearWave() {
    this.waveActive = false;
    this.waveClearTimer = 1.9;
    const bonus = 400 * this.wave;
    this.score += bonus;
    const before = this.player.hp;
    this.player.hp = Math.min(this.player.maxHp, this.player.hp + 1);
    this.callbacks.onWaveClear?.({ wave: this.wave, bonus, healed: this.player.hp > before });
    this.audio.heal();
    this.burstHearts(this.player.x, this.player.y - 14, 12, { speed: 42 });
    this.emitHud(true);
  }

  checkWave() {
    if (this.state !== 'playing' || !this.waveActive || this.spawnQueue.length > 0) return;
    if (this.girls.some((g) => g.state === 'enemy')) return;
    this.clearWave();
  }

  addScore(amount) {
    this.score += amount;
  }

  allyCount() {
    let n = 0;
    for (const g of this.girls) if (g.state === 'ally') n++;
    return n;
  }

  trimAllies() {
    const allies = this.girls.filter((g) => g.state === 'ally').sort((a, b) => b.charmedT - a.charmedT);
    for (let i = 6; i < allies.length; i++) {
      const g = allies[i];
      const idx = this.girls.indexOf(g);
      if (idx >= 0) this.girls.splice(idx, 1);
      this.burstHearts(g.x, g.y - 12, 8, { speed: 34, sparkle: true });
      this.addFloat('THANK YOU!', g.x, g.y - 30, {
        color: PAL.pinkPale,
        life: 1.2,
        vy: -14,
      });
    }
  }

  /* ---------------------------------------------------------------- */
  /* Kiss input                                                        */
  /* ---------------------------------------------------------------- */

  findKissTarget(range = KISS_RANGE) {
    let best = null;
    let bestD = range * range;
    for (const g of this.girls) {
      if (g.state !== 'enemy' || g.spawn > 0) continue;
      const d = (g.x - this.player.x) ** 2 + (g.y - this.player.y) ** 2;
      if (d < bestD) {
        bestD = d;
        best = g;
      }
    }
    return best;
  }

  startCharge() {
    if (this.state !== 'playing' || this.charging) return;
    this.charging = true;
    this.charge = 0;
    this.audio.init();
    this.audio.startCharge();
  }

  cancelCharge() {
    if (!this.charging) return;
    this.charging = false;
    this.charge = 0;
    this.audio.stopCharge();
  }

  releaseKiss() {
    if (!this.charging) return null;
    const charge = this.charge;
    const perfect = charge >= SWEET_MIN && charge <= SWEET_MAX;
    this.charging = false;
    this.charge = 0;
    this.audio.stopCharge();

    if (this.state !== 'playing') return null;
    const target = this.findKissTarget(KISS_RANGE + 4);
    if (!target) {
      this.addFloat('TOO FAR!', this.player.x, this.player.y - 36, {
        color: PAL.pinkLight,
        life: 0.9,
        vy: -14,
      });
      this.audio.whiff();
      return { miss: true, perfect: false };
    }

    this.player.dir = target.x < this.player.x ? 'left' : 'right';
    const mx = (this.player.x + target.x) / 2;
    const my = (this.player.y + target.y) / 2 - 18;

    this.combo = Math.min(9, this.combo + 1);
    this.comboTimer = COMBO_TIME;
    const queenBonus = target.type.id === 'queen' ? 1.5 : 1;
    const gain = Math.round((perfect ? 240 : 120) * this.combo * queenBonus);
    this.score += gain;

    const heal = perfect ? 2 : 1;
    const before = this.player.hp;
    this.player.hp = Math.min(this.player.maxHp, this.player.hp + heal);
    const healed = this.player.hp - before;

    target.stage += 1;
    const converted = target.stage >= target.needed;

    if (converted) {
      target.state = 'ally';
      target.slot = this.allyCount() - 1;
      target.stun = 0;
      target.spawn = 0;
      target.charmedT = 0;
      this.trimAllies();
      this.kissed += 1;
      this.allyHealTimer = Math.min(this.allyHealTimer, 9);
      this.burstHearts(mx, my, 16, { speed: 52, sparkle: true });
      this.particles.push({
        type: 'ring',
        x: mx,
        y: my + 10,
        r: 3,
        vr: 62,
        life: 0.5,
        maxLife: 0.5,
        color: perfect ? PAL.gold : PAL.pink,
      });
      this.addFloat('MWAH!', mx, my - 16, {
        color: perfect ? PAL.gold : PAL.pinkLight,
        life: 1.2,
        vy: -22,
      });
      if (healed > 0) {
        this.addFloat(perfect ? `PERFECT +${healed}` : `+${healed} LOVE`, mx, my - 2, {
          color: perfect ? PAL.gold : PAL.pinkPale,
          life: 1.05,
          vy: -14,
        });
      }
      if (target.type.id === 'queen') {
        this.addFloat('QUEEN CHARMED!', mx, my - 30, { color: PAL.gold, life: 1.4, vy: -12 });
      }
    } else {
      target.stun = 2.1;
      target.flash = 0.3;
      this.burstHearts(mx, my, 10, { speed: 40, sparkle: true });
      this.addFloat('ONE MORE!', mx, my - 12, { color: PAL.gold, life: 1.1, vy: -18 });
    }

    if (perfect) this.perfects += 1;

    this.freeze = 0.12;
    this.kissFlash = 0.42;
    this.shake = Math.max(this.shake, 2);
    this.audio.kiss(perfect);
    vibrate(perfect ? [12, 25, 16] : 14);
    this.lastKiss = { x: mx, y: my, perfect };
    if (this.combo >= 3 && this.combo % 3 === 0) {
      this.addFloat(`COMBO X${this.combo}`, this.player.x, this.player.y - 50, {
        color: PAL.pink,
        life: 1.1,
        vy: -12,
      });
    }
    this.addFloat(`+${gain}`, target.x, target.y - 36, {
      color: PAL.cream,
      life: 0.8,
      vy: -16,
      shadow: PAL.ink,
    });

    this.checkWave();
    this.emitHud(true);
    return { perfect, heal: healed, target: target.type.id, converted };
  }

  /* ---------------------------------------------------------------- */
  /* Update                                                            */
  /* ---------------------------------------------------------------- */

  update(dt, axis) {
    this.time += dt;
    this.updatePetals(dt);
    if (this.state === 'paused') return;

    if (this.state === 'title') {
      this.updateTitle(dt);
      this.updateParticles(dt);
      this.updateFloats(dt);
      return;
    }

    if (this.state === 'gameover') {
      this.updateParticles(dt);
      this.updateFloats(dt);
      this.shake = Math.max(0, this.shake - dt * 18);
      this.hitFlash = Math.max(0, this.hitFlash - dt * 2);
      this.kissFlash = Math.max(0, this.kissFlash - dt * 2);
      this.cameraFollow(dt, true);
      return;
    }

    if (this.freeze > 0) {
      this.freeze -= dt;
      this.updateParticles(dt * 0.5);
      this.updateFloats(dt * 0.7);
      this.shake = Math.max(0, this.shake - dt * 30);
      this.updateChargeAudio();
      return;
    }

    const player = this.player;
    player.invuln = Math.max(0, player.invuln - dt);
    this.shake = Math.max(0, this.shake - dt * 20);
    this.hitFlash = Math.max(0, this.hitFlash - dt * 2.4);
    this.kissFlash = Math.max(0, this.kissFlash - dt * 2);

    if (this.combo > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) {
        this.combo = 0;
        this.emitHud(true);
      }
    }

    if (this.charging) {
      this.charge = Math.min(1, this.charge + dt / CHARGE_TIME);
      this.updateChargeAudio();
    }

    this.updatePlayer(dt, axis);
    this.updateSpawnQueue(dt);
    this.updateGirls(dt);
    this.updateProjectiles(dt);
    this.updateAllies(dt);

    this.nearest = this.findKissTarget(KISS_RANGE);

    this.checkWave();
    if (this.waveClearTimer > 0 && !this.waveActive) {
      this.waveClearTimer -= dt;
      if (this.waveClearTimer <= 0 && this.state === 'playing') {
        this.startWave(this.wave + 1);
      }
    }

    this.updateParticles(dt);
    this.updateFloats(dt);
    this.cameraFollow(dt);
    this.emitHud();
  }

  updateChargeAudio() {
    if (this.charging) this.audio.setCharge(this.charge);
  }

  updatePlayer(dt, axis) {
    const p = this.player;
    const allies = this.allyCount();
    const bonus = 1 + Math.min(allies, 6) * 0.05;
    const speed = 88 * bonus * (this.charging ? 0.62 : 1);
    let ax = axis.x;
    let ay = axis.y;
    const mag = Math.hypot(ax, ay);
    if (mag > 1) {
      ax /= mag;
      ay /= mag;
    }
    const moving = mag > 0.08;
    const targetVx = ax * speed;
    const targetVy = ay * speed;
    const smooth = 1 - Math.exp(-(moving ? 15 : 11) * dt);
    p.vx = lerp(p.vx, targetVx, smooth);
    p.vy = lerp(p.vy, targetVy, smooth);
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    const res = this.world.resolveCircle(p.x, p.y, 7);
    p.x = res.x;
    p.y = res.y;

    if (this.charging && this.nearest) {
      p.dir = this.nearest.x < p.x ? 'left' : 'right';
    } else if (moving) {
      if (Math.abs(ax) > Math.abs(ay) + 0.05) p.dir = ax < 0 ? 'left' : 'right';
      else if (Math.abs(ay) > 0.05) p.dir = ay < 0 ? 'up' : 'down';
    }
    p.walkT += dt * (0.3 + Math.hypot(p.vx, p.vy) / 26);
  }

  updateGirls(dt) {
    const player = this.player;
    const enemies = [];
    for (const g of this.girls) {
      if (g.state === 'ally') continue;
      if (g.flash > 0) g.flash -= dt;

      if (g.spawn > 0) {
        g.spawn -= dt;
        g.spawn = Math.max(0, g.spawn);
        continue;
      }

      if (g.state === 'demo') {
        this.wanderGirl(g, dt, 0.35);
        g.heartTimer -= dt;
        if (g.heartTimer <= 0) {
          g.heartTimer = 2.2 + Math.random() * 2.8;
          this.particles.push({
            type: 'heart',
            x: g.x + (Math.random() * 6 - 3),
            y: g.y - 26,
            vx: (Math.random() - 0.5) * 8,
            vy: -9,
            life: 1.3,
            maxLife: 1.3,
            size: 1,
            color: Math.random() > 0.5 ? PAL.pink : PAL.pinkLight,
            gravity: 0,
            drag: 0.2,
          });
        }
        continue;
      }

      enemies.push(g);
      g.stun = Math.max(0, g.stun - dt);
      g.shootTimer -= dt;

      const pdx = player.x - g.x;
      const pdy = player.y - g.y;
      const pd = Math.hypot(pdx, pdy) || 0.001;
      const chasing = g.stun <= 0 && this.state === 'playing' && pd < 230;
      let desiredVx = 0;
      let desiredVy = 0;
      let sp = 0;

      if (g.stun > 0) {
        g.vx *= Math.pow(0.04, dt);
        g.vy *= Math.pow(0.04, dt);
      } else if (chasing) {
        sp = g.type.speed * this.waveSpeed;
        desiredVx = (pdx / pd) * sp;
        desiredVy = (pdy / pd) * sp;
        if (g.type.id === 'violet') {
          const wob = Math.sin(this.time * 5.2 + g.phase) * 0.42;
          const nx = -pdy / pd;
          const ny = pdx / pd;
          desiredVx += nx * sp * wob;
          desiredVy += ny * sp * wob;
        }
      } else {
        this.wanderGirl(g, dt, 0.42);
        continue;
      }

      const smooth = 1 - Math.exp(-6 * dt);
      g.vx = lerp(g.vx, desiredVx, smooth);
      g.vy = lerp(g.vy, desiredVy, smooth);
      g.x += g.vx * dt;
      g.y += g.vy * dt;
      const res = this.world.resolveCircle(g.x, g.y, 7);
      if (res.hit && chasing) {
        // Slide around scenery instead of grinding into it.
        const nx = -pdy / pd;
        const ny = pdx / pd;
        const side = Math.sin(g.phase + this.time * 1.7) > 0 ? 1 : -1;
        g.x += nx * side * 14 * dt;
        g.y += ny * side * 14 * dt;
        const res2 = this.world.resolveCircle(g.x, g.y, 7);
        g.x = res2.x;
        g.y = res2.y;
      } else {
        g.x = res.x;
        g.y = res.y;
      }

      if (Math.abs(g.vx) > Math.abs(g.vy) + 3) g.dir = g.vx < 0 ? 'left' : 'right';
      else if (Math.abs(g.vy) > 3) g.dir = g.vy < 0 ? 'up' : 'down';
      g.walkT += dt * (0.6 + Math.hypot(g.vx, g.vy) / 34);

      // Dreamy girls blow heart bolts from a little distance.
      if (
        g.type.id === 'aqua' &&
        g.stun <= 0 &&
        pd < 195 &&
        pd > 42 &&
        g.shootTimer <= 0 &&
        this.state === 'playing'
      ) {
        const lead = 0.22;
        const tx = player.x + player.vx * lead;
        const ty = player.y + player.vy * lead;
        const a = Math.atan2(ty - (g.y - 8), tx - g.x);
        const speed = 104;
        this.projectiles.push({
          x: g.x,
          y: g.y - 9,
          vx: Math.cos(a) * speed,
          vy: Math.sin(a) * speed,
          life: 3.4,
          phase: Math.random() * 7,
        });
        g.shootTimer = 2.3 + Math.random() * 1.3;
        g.flash = 0.2;
      }

      // contact damage
      if (this.state === 'playing' && player.invuln <= 0 && pd < 10.5) {
        this.hurtPlayer(g);
      }
    }

    // gentle separation so the lovestruck don't stack into one sprite
    for (let i = 0; i < enemies.length; i++) {
      for (let j = i + 1; j < enemies.length; j++) {
        const a = enemies[i];
        const b = enemies[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const d = Math.hypot(dx, dy);
        if (d > 0.001 && d < 12) {
          const push = (12 - d) * 0.5;
          const nx = dx / d;
          const ny = dy / d;
          a.x -= nx * push;
          a.y -= ny * push;
          b.x += nx * push;
          b.y += ny * push;
        }
      }
    }
  }

  wanderGirl(g, dt, speedScale) {
    g.wanderTimer -= dt;
    const dx = g.tx - g.x;
    const dy = g.ty - g.y;
    const d = Math.hypot(dx, dy);
    if (g.wanderTimer <= 0 || d < 8) {
      const p = this.world.wanderPoint(g.homeX, g.homeY, 120);
      g.tx = p.x;
      g.ty = p.y;
      g.wanderTimer = 1.6 + Math.random() * 2.8;
    }
    if (d > 2) {
      const sp = g.type.speed * speedScale;
      g.vx = lerp(g.vx, (dx / d) * sp, 1 - Math.exp(-3 * dt));
      g.vy = lerp(g.vy, (dy / d) * sp, 1 - Math.exp(-3 * dt));
      g.x += g.vx * dt;
      g.y += g.vy * dt;
      const res = this.world.resolveCircle(g.x, g.y, 7);
      g.x = res.x;
      g.y = res.y;
      if (Math.abs(g.vx) > Math.abs(g.vy) + 1) g.dir = g.vx < 0 ? 'left' : 'right';
      else if (Math.abs(g.vy) > 1) g.dir = g.vy < 0 ? 'up' : 'down';
      g.walkT += dt * (0.35 + Math.hypot(g.vx, g.vy) / 40);
    } else {
      g.vx *= 0.8;
      g.vy *= 0.8;
    }
  }

  updateAllies(dt) {
    const player = this.player;
    let slot = 0;
    let count = this.allyCount();
    for (const g of this.girls) {
      if (g.state !== 'ally') continue;
      g.charmedT += dt;
      const angle = -Math.PI / 2 + (slot - (count - 1) / 2) * 0.78;
      const tx = player.x + Math.cos(angle) * (24 + (slot % 2) * 8);
      const ty = player.y + Math.sin(angle) * 12 + 18;
      const dx = tx - g.x;
      const dy = ty - g.y;
      const d = Math.hypot(dx, dy);
      if (d > 2.5) {
        const sp = Math.min(96, d * 4.2);
        g.x += (dx / d) * sp * dt;
        g.y += (dy / d) * sp * dt;
        if (Math.abs(dx) > Math.abs(dy)) g.dir = dx < 0 ? 'left' : 'right';
        else g.dir = dy < 0 ? 'up' : 'down';
        g.walkT += dt * (0.4 + sp / 60);
      }
      g.heartTimer -= dt;
      if (g.heartTimer <= 0) {
        g.heartTimer = 2.4 + Math.random() * 2.5;
        this.particles.push({
          type: 'heart',
          x: g.x + (Math.random() * 8 - 4),
          y: g.y - 25,
          vx: (Math.random() - 0.5) * 6,
          vy: -10,
          life: 1.4,
          maxLife: 1.4,
          size: 1,
          color: Math.random() > 0.5 ? PAL.pink : PAL.pinkLight,
          gravity: 0,
          drag: 0.2,
        });
      }
      slot++;
    }

    if (count > 0) {
      this.allyHealTimer -= dt;
      if (this.allyHealTimer <= 0) {
        if (player.hp < player.maxHp) {
          player.hp = Math.min(player.maxHp, player.hp + 1);
          this.audio.heal();
          this.burstHearts(player.x, player.y - 18, 8, { speed: 32 });
          this.addFloat('LOVE HEALS +1', player.x, player.y - 36, {
            color: PAL.pinkPale,
            life: 1.2,
            vy: -14,
          });
          this.emitHud(true);
          this.allyHealTimer = 14;
        } else {
          this.allyHealTimer = 6;
        }
      }
    }
  }

  updateProjectiles(dt) {
    const player = this.player;
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.phase += dt;
      let dead = p.life <= 0;
      if (!dead && !this.world.canStand(p.x, p.y, 1)) dead = true;
      if (!dead && player.invuln <= 0 && dist(p.x, p.y, player.x, player.y - 8) < 9) {
        this.hurtPlayer(null);
        dead = true;
      }
      if (dead) {
        this.burstHearts(p.x, p.y, 4, {
          speed: 24,
          color: PAL.pinkLight,
          gravity: 40,
        });
        this.projectiles.splice(i, 1);
      }
    }
  }

  hurtPlayer(source) {
    const player = this.player;
    if (this.state !== 'playing' || player.invuln > 0 || player.hp <= 0) return;
    player.hp -= 1;
    player.invuln = 1.5;
    this.combo = 0;
    this.comboTimer = 0;
    this.cancelCharge();
    this.shake = 8;
    this.hitFlash = 0.5;
    this.freeze = 0.05;

    let nx = 1;
    let ny = 0;
    if (source) {
      const dx = player.x - source.x;
      const dy = player.y - source.y;
      const d = Math.hypot(dx, dy) || 1;
      nx = dx / d;
      ny = dy / d;
      source.stun = Math.max(source.stun, 0.7);
      source.x += nx * 5;
      source.y += ny * 5;
    }
    player.x += nx * 12;
    player.y += ny * 12;
    const res = this.world.resolveCircle(player.x, player.y, 7);
    player.x = res.x;
    player.y = res.y;

    for (let i = 0; i < 9; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = 20 + Math.random() * 55;
      this.particles.push({
        type: 'heart',
        x: player.x,
        y: player.y - 10,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s - 20,
        life: 0.7 + Math.random() * 0.5,
        maxLife: 1.1,
        size: Math.random() > 0.5 ? 2 : 1,
        color: Math.random() > 0.5 ? '#ff4f70' : PAL.pink,
        gravity: 90,
        drag: 1.2,
      });
    }
    for (let i = 0; i < 5; i++) {
      this.particles.push({
        type: 'dust',
        x: player.x + (Math.random() - 0.5) * 8,
        y: player.y - Math.random() * 6,
        vx: (Math.random() - 0.5) * 30,
        vy: -8 - Math.random() * 16,
        life: 0.4,
        maxLife: 0.4,
        size: 2,
        color: '#d9b98b',
        gravity: 20,
        drag: 3,
      });
    }
    this.addFloat('-1 LOVE', player.x, player.y - 38, {
      color: '#ff7d93',
      life: 1,
      vy: -18,
    });
    this.audio.hurt();
    vibrate(55);
    this.emitHud(true);

    if (player.hp <= 0) this.gameOver();
  }

  gameOver() {
    if (this.state === 'gameover') return;
    this.state = 'gameover';
    this.cancelCharge();
    this.best = Math.max(this.best, this.score);
    store(BEST_KEY, this.best);
    this.audio.setPlaying(false);
    this.audio.gameover();
    vibrate([60, 40, 120]);
    const stats = {
      score: this.score,
      best: this.best,
      wave: this.wave,
      kissed: this.kissed,
      perfects: this.perfects,
    };
    this.callbacks.onGameOver?.(stats);
    this.emitHud(true);
  }

  updateTitle(dt) {
    // gentle title-card camera drift
    this.cam.x = 500 + Math.sin(this.time * 0.16) * 7;
    this.cam.y = 540 + Math.cos(this.time * 0.12) * 4;
    const p = this.player;
    p.walkT += dt;
    p.dir = 'down';
    for (const g of this.girls) {
      if (g.spawn > 0) g.spawn = 0;
      this.wanderGirl(g, dt, 0.3);
      g.heartTimer -= dt;
      if (g.heartTimer <= 0) {
        g.heartTimer = 1.6 + Math.random() * 2.2;
        this.particles.push({
          type: 'heart',
          x: g.x + (Math.random() * 8 - 4),
          y: g.y - 24,
          vx: (Math.random() - 0.5) * 6,
          vy: -8,
          life: 1.4,
          maxLife: 1.4,
          size: 1,
          color: Math.random() > 0.5 ? PAL.pink : PAL.pinkPale,
          gravity: 0,
          drag: 0.2,
        });
      }
    }
    this.shake = Math.max(0, this.shake - dt * 20);
    this.hitFlash = Math.max(0, this.hitFlash - dt * 2);
    this.kissFlash = Math.max(0, this.kissFlash - dt * 2);
  }

  cameraFollow(dt, instant = false) {
    const p = this.player;
    const halfW = this.vw / 2;
    const halfH = this.vh / 2;
    let tx = clamp(p.x, halfW, WORLD - halfW);
    let ty = clamp(p.y - 8, halfH, WORLD - halfH);
    if (instant) {
      this.cam.x = tx;
      this.cam.y = ty;
      return;
    }
    const t = 1 - Math.exp(-5.5 * dt);
    this.cam.x = lerp(this.cam.x, tx, t);
    this.cam.y = lerp(this.cam.y, ty, t);
  }

  /* ---------------------------------------------------------------- */
  /* FX                                                                */
  /* ---------------------------------------------------------------- */

  addFloat(text, x, y, opts = {}) {
    this.floats.push({
      text,
      x,
      y,
      life: opts.life || 1,
      maxLife: opts.life || 1,
      vy: opts.vy ?? -18,
      color: opts.color || PAL.cream,
      shadow: opts.shadow || PAL.ink,
      scale: opts.scale || 1,
    });
    if (this.floats.length > 30) this.floats.shift();
  }

  burstHearts(x, y, count = 10, opts = {}) {
    const colors = [PAL.pink, PAL.pinkLight, PAL.pinkPale, PAL.cream];
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = (opts.speed || 40) * (0.35 + Math.random());
      this.particles.push({
        type: 'heart',
        x: x + (Math.random() - 0.5) * 6,
        y: y + (Math.random() - 0.5) * 4,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s - 25,
        life: 0.7 + Math.random() * 0.7,
        maxLife: 1.4,
        size: Math.random() > 0.62 ? 2 : 1,
        color: opts.color || colors[Math.floor(Math.random() * colors.length)],
        gravity: opts.gravity ?? 55,
        drag: 1,
      });
    }
    if (opts.sparkle) {
      for (let i = 0; i < Math.round(count * 0.7); i++) {
        const a = Math.random() * Math.PI * 2;
        const s = 25 + Math.random() * 70;
        this.particles.push({
          type: 'spark',
          x,
          y,
          vx: Math.cos(a) * s,
          vy: Math.sin(a) * s,
          life: 0.35 + Math.random() * 0.45,
          maxLife: 0.8,
          size: Math.random() > 0.75 ? 2 : 1,
          color: Math.random() > 0.5 ? PAL.gold : PAL.cream,
          gravity: 30,
          drag: 2,
        });
      }
    }
    if (this.particles.length > 320) this.particles.splice(0, this.particles.length - 320);
  }

  updateParticles(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }
      if (p.type === 'ring') {
        p.r += p.vr * dt;
        continue;
      }
      p.vy += (p.gravity || 0) * dt;
      const drag = Math.max(0, 1 - (p.drag || 0) * dt);
      p.vx *= drag;
      p.vy *= drag;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
  }

  updateFloats(dt) {
    for (let i = this.floats.length - 1; i >= 0; i--) {
      const f = this.floats[i];
      f.life -= dt;
      f.y += f.vy * dt;
      f.vy *= 1 - 1.4 * dt;
      if (f.life <= 0) this.floats.splice(i, 1);
    }
  }

  seedPetals() {
    const target = Math.round(clamp((this.vw * this.vh) / 4200, 10, 28));
    while (this.petals.length < target) {
      this.petals.push({
        x: Math.random() * this.vw,
        y: Math.random() * this.vh,
        vx: -7 - Math.random() * 13,
        vy: 8 + Math.random() * 12,
        size: Math.random() > 0.6 ? 2 : 1,
        phase: Math.random() * 6,
        color: Math.random() > 0.4 ? PAL.pinkPale : PAL.cream,
      });
    }
    while (this.petals.length > target) this.petals.pop();
  }

  updatePetals(dt) {
    const count = Math.round(clamp((this.vw * this.vh) / 4200, 10, 28));
    if (this.petals.length < count) this.seedPetals();
    for (const p of this.petals) {
      p.phase += dt;
      p.x += (p.vx + Math.sin(p.phase * 1.7) * 4) * dt;
      p.y += (p.vy + Math.cos(p.phase) * 2) * dt;
      if (p.y > this.vh + 4) {
        p.y = -4;
        p.x = Math.random() * this.vw;
      }
      if (p.x < -4) {
        p.x = this.vw + 3;
        p.y = Math.random() * this.vh;
      }
    }
  }

  /* ---------------------------------------------------------------- */
  /* Render                                                            */
  /* ---------------------------------------------------------------- */

  render() {
    const ctx = this.ctx;
    const vw = this.vw;
    const vh = this.vh;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, vw, vh);

    const shake = this.shake;
    const sx = shake > 0 ? (Math.random() - 0.5) * shake : 0;
    const sy = shake > 0 ? (Math.random() - 0.5) * shake : 0;
    const camX = Math.round(clamp(this.cam.x - vw / 2 + sx, 0, WORLD - vw));
    const camY = Math.round(clamp(this.cam.y - vh / 2 + sy, 0, WORLD - vh));
    this.view = { x: camX, y: camY };

    ctx.drawImage(this.world.ground, camX, camY, vw, vh, 0, 0, vw, vh);

    ctx.save();
    ctx.translate(-camX, -camY);

    this.drawPond(ctx, camX, camY);

    // small ground flowers sway behind everything
    for (const f of this.world.flowers) {
      if (!this.inView(f.x, f.y, 12)) continue;
      drawFlower(ctx, f.x, f.y, this.time + f.seed, f.color);
    }

    const items = [];
    for (const t of this.world.trees) {
      if (!this.inView(t.x, t.y, 70)) continue;
      items.push({
        y: t.y,
        draw: () => drawTree(ctx, t.x, t.y, { kind: t.kind, t: this.time, seed: t.seed }),
      });
    }
    for (const b of this.world.bushes) {
      if (!this.inView(b.x, b.y, 30)) continue;
      items.push({
        y: b.y,
        draw: () => drawBush(ctx, b.x, b.y, { kind: b.kind, t: this.time, seed: b.seed }),
      });
    }
    for (const b of this.world.benches) {
      if (!this.inView(b.x, b.y, 40)) continue;
      items.push({ y: b.y, draw: () => drawBench(ctx, b.x, b.y) });
    }
    for (const l of this.world.lamps) {
      if (!this.inView(l.x, l.y, 45)) continue;
      items.push({ y: l.y, draw: () => drawLamp(ctx, l.x, l.y, this.time) });
    }

    for (const g of this.girls) {
      if (!this.inView(g.x, g.y, 50)) continue;
      const alpha =
        g.spawn > 0 ? clamp(0.35 + (0.72 - g.spawn) / 0.72, 0, 1) : 1;
      const moving = Math.hypot(g.vx, g.vy) > 4;
      items.push({
        y: g.y,
        draw: () => {
          drawGirl(ctx, g.x, g.y, {
            type: g.type,
            dir: g.dir,
            t: g.walkT,
            moving,
            charmed: g.state === 'ally',
            stage: g.stage,
            alpha,
          });
          if (g.state === 'ally') {
            const bob = Math.sin(this.time * 3 + g.phase) * 1.5;
            drawHeartSmall(ctx, g.x + 7, g.y - 28 + bob, 1, PAL.pink);
          }
        },
      });
    }

    const playerAlpha =
      this.player.invuln > 0 && Math.floor(this.player.invuln * 14) % 2 === 1
        ? 0.35
        : 1;
    items.push({
      y: this.player.y,
      draw: () =>
        drawHero(ctx, this.player.x, this.player.y, {
          dir: this.player.dir,
          t: this.player.walkT,
          moving: Math.hypot(this.player.vx, this.player.vy) > 6,
          charging: this.charging,
          alpha: playerAlpha,
        }),
    });

    items.sort((a, b) => a.y - b.y);
    for (const item of items) item.draw();

    // kiss target marker
    if (this.state === 'playing' && this.nearest) {
      const g = this.nearest;
      const bob = Math.sin(this.time * 7) * 1.6;
      drawHeart(ctx, g.x, g.y - 34 + bob, 2, PAL.pinkDark);
      drawHeart(ctx, g.x, g.y - 34 + bob, 1, PAL.pinkPale);
      ctx.globalAlpha = 0.45;
      pxRing(ctx, g.x, g.y, 12, PAL.pinkPale, 1);
      ctx.globalAlpha = 1;
    }

    // charging aura
    if (this.charging) {
      const c = this.charge;
      const sweet = c >= SWEET_MIN && c <= SWEET_MAX;
      ctx.globalAlpha = 0.35 + c * 0.25;
      pxRing(ctx, this.player.x, this.player.y, 13 + Math.round(c * 3), sweet ? PAL.gold : PAL.pink, 1);
      ctx.globalAlpha = 1;
      const hb = Math.sin(this.time * 12) * 1;
      drawHeart(
        ctx,
        this.player.x,
        this.player.y - 34 + hb,
        c > 0.5 ? 2 : 1,
        sweet ? PAL.gold : PAL.pinkLight
      );
    }

    for (const p of this.projectiles) {
      if (!this.inView(p.x, p.y, 20)) continue;
      drawHeartProjectile(ctx, p.x, p.y, p.phase);
    }

    this.drawParticles(ctx);
    this.drawFloats(ctx);

    ctx.restore();

    if (this.state === 'playing') this.drawOffscreenMarkers(ctx, camX, camY);

    // front petals
    ctx.globalAlpha = 0.85;
    for (const p of this.petals) {
      pxRect(ctx, p.x, p.y, p.size, p.size + 1, p.color);
      if (p.size > 1) pxRect(ctx, p.x + 1, p.y + 1, 1, 1, PAL.pinkLight);
    }
    ctx.globalAlpha = 1;

    // full-screen kiss / hurt flashes
    if (this.kissFlash > 0) {
      ctx.fillStyle = `rgba(255,190,214,${this.kissFlash * 0.5})`;
      ctx.fillRect(0, 0, vw, vh);
    }
    if (this.hitFlash > 0) {
      ctx.fillStyle = `rgba(255,58,96,${this.hitFlash * 0.4})`;
      ctx.fillRect(0, 0, vw, vh);
    }

    // low-health edge pulse is CSS-driven; tiny inner vignette here
    if (this.player.hp <= 2) {
      ctx.globalAlpha = 0.16 + Math.sin(this.time * 6) * 0.05;
      pxRect(ctx, 0, 0, vw, 4, '#ff4f70');
      pxRect(ctx, 0, vh - 4, vw, 4, '#ff4f70');
      pxRect(ctx, 0, 0, 3, vh, '#ff4f70');
      pxRect(ctx, vw - 3, 0, 3, vh, '#ff4f70');
      ctx.globalAlpha = 1;
    }
  }

  inView(x, y, pad = 30) {
    const v = this.view;
    return x > v.x - pad && x < v.x + this.vw + pad && y > v.y - pad && y < v.y + this.vh + pad;
  }

  drawOffscreenMarkers(ctx, camX, camY) {
    const enemies = this.girls
      .filter((g) => g.state === 'enemy' && g.spawn <= 0)
      .sort(
        (a, b) =>
          (a.x - this.player.x) ** 2 +
          (a.y - this.player.y) ** 2 -
          ((b.x - this.player.x) ** 2 + (b.y - this.player.y) ** 2)
      )
      .slice(0, 4);
    for (const g of enemies) {
      if (this.inView(g.x, g.y - 8, 8)) continue;
      const sx = g.x - camX;
      const sy = g.y - camY - 12;
      const mx = clamp(sx, 9, this.vw - 9);
      const my = clamp(sy, 12, this.vh - 12);
      const pulse = 0.65 + Math.sin(this.time * 6 + g.phase) * 0.25;
      ctx.globalAlpha = pulse;
      drawHeart(ctx, mx + 1, my + 1, 1, PAL.ink);
      drawHeart(ctx, mx, my, 1, PAL.pinkLight);
    }
    ctx.globalAlpha = 1;
  }

  drawPond(ctx, camX, camY) {
    const pond = this.world.pond;
    // Only animate when the pond is on screen.
    if (
      pond.x + pond.rx < camX - 20 ||
      pond.x - pond.rx > camX + this.vw + 20 ||
      pond.y + pond.ry < camY - 20 ||
      pond.y - pond.ry > camY + this.vh + 20
    ) {
      return;
    }
    ctx.globalAlpha = 0.55;
    for (let i = 0; i < 7; i++) {
      const a = this.time * 0.5 + i * 1.9;
      const x = pond.x + Math.sin(a) * pond.rx * 0.62;
      const y = pond.y + Math.cos(a * 1.3) * pond.ry * 0.58;
      pxRect(ctx, x, y, 3 + (i % 3), 1, PAL.waterLight);
      if (i % 3 === 0) pxRect(ctx, x + 7, y + 5, 2, 1, PAL.waterLight);
    }
    const f = this.world.fountain;
    if (f && this.inView(f.x, f.y, 40)) {
      ctx.globalAlpha = 0.5;
      for (let i = 0; i < 4; i++) {
        const a = this.time * 0.9 + i * 1.7;
        pxRect(ctx, f.x + Math.cos(a) * 12, f.y + Math.sin(a * 1.4) * 7, 2, 1, PAL.waterLight);
      }
      ctx.globalAlpha = 0.85;
      const rise = (this.time * 9) % 20;
      drawHeart(ctx, f.x + Math.sin(this.time * 2) * 4, f.y - 24 - rise, 1, PAL.pinkPale);
      ctx.globalAlpha = 1;
    }
  }

  drawParticles(ctx) {
    for (const p of this.particles) {
      const a = clamp(p.life / p.maxLife, 0, 1);
      ctx.globalAlpha = a;
      if (p.type === 'heart') {
        drawHeart(ctx, p.x, p.y, p.size || 1, p.color);
      } else if (p.type === 'spark') {
        pxRect(ctx, p.x, p.y, p.size || 1, p.size || 1, p.color);
        if (p.size > 1) {
          pxRect(ctx, p.x - 1, p.y + 1, 1, 1, PAL.cream);
        }
      } else if (p.type === 'dust') {
        pxRect(ctx, p.x, p.y, p.size || 2, p.size || 2, p.color);
      } else if (p.type === 'ring') {
        pxRing(ctx, p.x, p.y, p.r, p.color, 1);
      }
    }
    ctx.globalAlpha = 1;
  }

  drawFloats(ctx) {
    for (const f of this.floats) {
      const a = clamp(f.life / f.maxLife, 0, 1);
      ctx.globalAlpha = Math.min(1, a * 1.8);
      drawText(ctx, f.text, f.x, f.y, {
        color: f.color,
        scale: f.scale,
        align: 'center',
        shadow: f.shadow,
      });
    }
    ctx.globalAlpha = 1;
  }
}
