import { Game } from './game.js';
import { Input } from './input.js';
import { AudioEngine } from './audio.js';
import { load, store, clamp } from './util.js';

const app = document.getElementById('app');
const canvas = document.getElementById('game');
const heartsEl = document.getElementById('hearts');
const scoreEl = document.getElementById('score-num');
const waveEl = document.getElementById('wave-num');
const comboBadge = document.getElementById('combo-badge');
const comboEl = document.getElementById('combo-num');
const allyBadge = document.getElementById('ally-badge');
const allyCountEl = document.getElementById('ally-count');
const kissBtn = document.getElementById('kiss-btn');
const kissHint = document.getElementById('kiss-hint');
const ringProgress = document.getElementById('ring-progress');
const toastEl = document.getElementById('toast');
const banner = document.getElementById('banner');
const bannerKicker = document.getElementById('banner-kicker');
const bannerTitle = document.getElementById('banner-title');
const bannerSub = document.getElementById('banner-sub');

const titleScreen = document.getElementById('title-screen');
const pauseScreen = document.getElementById('pause-screen');
const gameoverScreen = document.getElementById('gameover-screen');

const playBtn = document.getElementById('play-btn');
const tiltBtn = document.getElementById('tilt-btn');
const soundBtn = document.getElementById('sound-btn');
const pauseBtn = document.getElementById('pause-btn');
const resumeBtn = document.getElementById('resume-btn');
const quitBtn = document.getElementById('quit-btn');
const retryBtn = document.getElementById('retry-btn');
const homeBtn = document.getElementById('home-btn');
const pauseTiltBtn = document.getElementById('pause-tilt-btn');
const pauseSoundBtn = document.getElementById('pause-sound-btn');

const titleBest = document.getElementById('title-best');
const finalScore = document.getElementById('final-score');
const finalWave = document.getElementById('final-wave');
const finalKisses = document.getElementById('final-kisses');
const finalPerfect = document.getElementById('final-perfect');
const finalBest = document.getElementById('final-best');
const pauseWave = document.getElementById('pause-wave');
const pauseScore = document.getElementById('pause-score');
const pauseFans = document.getElementById('pause-fans');

const RING_C = 282.743;
const FORMAT = (n) => String(Math.max(0, Math.round(n))).padStart(6, '0');

/* ------------------------------------------------------------------ */
/* Hearts HUD                                                          */
/* ------------------------------------------------------------------ */

const HEART_ROWS = [
  '.##..###.',
  '#########',
  '#########',
  '#########',
  '.#######.',
  '..#####..',
  '...###...',
  '....#....',
];

function heartMarkup() {
  let rects = '';
  HEART_ROWS.forEach((row, y) => {
    [...row].forEach((ch, x) => {
      if (ch === '#') rects += `<rect x="${x}" y="${y}" width="1" height="1"></rect>`;
    });
  });
  return `<svg viewBox="0 0 9 8" aria-hidden="true">${rects}</svg>`;
}

const heartEls = [];
for (let i = 0; i < 6; i++) {
  const el = document.createElement('span');
  el.className = 'heart full';
  el.innerHTML = heartMarkup();
  heartsEl.appendChild(el);
  heartEls.push(el);
}

let lastHud = { hp: 6, score: 0, wave: 1, combo: 0, allies: 0 };
let hudPulseTimer = null;
let scoreTimer = null;

function applyHud(data) {
  const prev = lastHud;
  const hp = clamp(Math.round(data.hp), 0, data.maxHp);
  heartEls.forEach((el, i) => {
    const full = i < hp;
    el.classList.toggle('full', full);
    el.classList.toggle('empty', !full);
  });
  if (hp > prev.hp) {
    for (let i = prev.hp; i < hp && i < heartEls.length; i++) {
      const el = heartEls[i];
      el.classList.remove('pulse');
      void el.offsetWidth;
      el.classList.add('pulse');
    }
  }
  waveEl.textContent = String(data.wave || 1);
  scoreEl.textContent = FORMAT(data.score);
  if (data.score !== prev.score && data.score > 0) {
    const box = scoreEl.parentElement;
    box.classList.remove('bump');
    void box.offsetWidth;
    box.classList.add('bump');
    clearTimeout(scoreTimer);
    scoreTimer = setTimeout(() => box.classList.remove('bump'), 240);
  }
  const combo = data.combo || 0;
  if (combo >= 2) {
    comboBadge.hidden = false;
    comboEl.textContent = `X${combo}`;
    if (combo !== prev.combo) {
      comboBadge.style.animation = 'none';
      void comboBadge.offsetWidth;
      comboBadge.style.animation = '';
    }
  } else {
    comboBadge.hidden = true;
  }
  const allies = data.allies || 0;
  allyBadge.hidden = allies <= 0;
  allyCountEl.textContent = String(allies);

  app.classList.toggle('low-hp', hp <= 2 && data.state !== 'title' && data.state !== 'gameover');
  pauseWave.textContent = String(data.wave || 1);
  pauseScore.textContent = FORMAT(data.score);
  pauseFans.textContent = String(allies);
  lastHud = { ...data, hp };
}

/* ------------------------------------------------------------------ */
/* Toast + banner                                                      */
/* ------------------------------------------------------------------ */

let toastTimer = null;
function showToast(message, duration = 2300) {
  toastEl.textContent = message;
  toastEl.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('show'), duration);
}

let bannerTimer = null;
function showBanner(kicker, title, sub, clear = false) {
  bannerKicker.textContent = kicker;
  bannerTitle.textContent = title;
  bannerSub.textContent = sub;
  banner.classList.remove('show', 'clear');
  void banner.offsetWidth;
  banner.classList.add('show');
  if (clear) banner.classList.add('clear');
  clearTimeout(bannerTimer);
  bannerTimer = setTimeout(() => banner.classList.remove('show'), 1800);
}

function hideBanner() {
  clearTimeout(bannerTimer);
  banner.classList.remove('show');
}

/* ------------------------------------------------------------------ */
/* Engines                                                             */
/* ------------------------------------------------------------------ */

const audio = new AudioEngine();
let soundOn = load('heartrush.sound.v1', 'on') !== 'off';
let tiltOn = false;

const game = new Game(
  canvas,
  {
    onHud: applyHud,
    onWave: (wave, count) => {
      if (game.state !== 'playing') return;
      showBanner(
        'GET READY',
        `WAVE ${wave}`,
        wave === 1 ? 'KISS THEM ALL' : `${count} LOVESTRUCK GIRLS`,
        false
      );
    },
    onWaveClear: ({ bonus, healed }) => {
      showBanner(
        'LOVELY',
        'WAVE CLEAR',
        healed ? `+${bonus} PTS · +1 LOVE` : `+${bonus} PTS`,
        true
      );
    },
    onGameOver: (stats) => {
      finalScore.textContent = FORMAT(stats.score);
      finalWave.textContent = String(stats.wave);
      finalKisses.textContent = String(stats.kissed);
      finalPerfect.textContent = String(stats.perfects);
      finalBest.textContent = FORMAT(stats.best);
      titleBest.textContent = FORMAT(stats.best);
      audio.setPlaying(false);
      audio.duck(false);
      hideBanner();
      setState('gameover');
      showToast('THE PARK STILL LOVES YOU. TRY AGAIN?', 2600);
    },
  },
  audio
);

const input = new Input({
  moveZone: document.getElementById('move-zone'),
  joystick: document.getElementById('joystick'),
  knob: document.getElementById('joy-knob'),
  kissBtn,
  onKissStart: () => game.startCharge(),
  onKissEnd: () => game.releaseKiss(),
  onPause: () => togglePause(),
  onMute: () => toggleSound(),
  onTiltState: (state) => {
    if (state.active) {
      if (tiltOn) showToast('TILT READY — LEAN TO MOVE', 1600);
    } else if (tiltOn) {
      input.disableTilt();
      tiltOn = false;
      syncTiltButtons();
      showToast('NO MOTION DATA HERE — TOUCH STILL WORKS', 2400);
    }
  },
});

/* ------------------------------------------------------------------ */
/* Sizing                                                              */
/* ------------------------------------------------------------------ */

function computeSize() {
  const w = Math.max(200, window.innerWidth);
  const h = Math.max(200, window.innerHeight);
  const aspect = w / h;
  const short = 192;
  let vw;
  let vh;
  if (aspect >= 1) {
    vh = short;
    vw = Math.round(short * aspect);
  } else {
    vw = short;
    vh = Math.round(short / aspect);
  }
  const long = Math.max(vw, vh);
  if (long > 430) {
    const k = 430 / long;
    vw = Math.round(vw * k);
    vh = Math.round(vh * k);
  }
  return { vw, vh };
}

function resize() {
  const { vw, vh } = computeSize();
  canvas.width = vw;
  canvas.height = vh;
  game.resize(vw, vh);
  input.layout();
}

/* ------------------------------------------------------------------ */
/* Screens + state                                                     */
/* ------------------------------------------------------------------ */

function setState(state) {
  app.dataset.state = state;
  titleScreen.classList.toggle('open', state === 'title');
  pauseScreen.classList.toggle('open', state === 'paused');
  gameoverScreen.classList.toggle('open', state === 'gameover');
  if (state !== 'playing') {
    kissHint.textContent = 'MOVE CLOSER';
    kissHint.className = 'kiss-hint';
    kissBtn.classList.remove('ready');
  }
  if (state === 'title' || state === 'gameover') app.classList.remove('low-hp');
}

function startGame() {
  if (game.state === 'playing' || game.state === 'paused') return;
  audio.init();
  audio.setEnabled(soundOn);
  audio.setPlaying(true);
  audio.ui();
  hideBanner();
  input.resetJoy();
  game.startGame();
  setState('playing');
  syncBestLabels();
}

function pauseGame() {
  if (!game.pause()) return;
  audio.duck(true);
  setState('paused');
  showToast('PAUSED', 900);
}

function resumeGame() {
  if (!game.resume()) return;
  audio.duck(false);
  setState('playing');
  input.layout();
}

function togglePause() {
  if (game.state === 'playing') pauseGame();
  else if (game.state === 'paused') resumeGame();
}

function goTitle() {
  input.resetJoy();
  game.setupTitle();
  audio.setPlaying(false);
  audio.duck(false);
  hideBanner();
  setState('title');
  syncBestLabels();
}

function syncBestLabels() {
  const best = FORMAT(game.best);
  titleBest.textContent = best;
  finalBest.textContent = best;
}

/* ------------------------------------------------------------------ */
/* Sound + tilt toggles                                                */
/* ------------------------------------------------------------------ */

function syncSoundButtons() {
  const label = soundOn ? 'SOUND: ON' : 'SOUND: OFF';
  [soundBtn, pauseSoundBtn].forEach((b) => {
    if (!b) return;
    b.textContent = label;
    b.setAttribute('aria-pressed', String(soundOn));
  });
}

function toggleSound() {
  soundOn = !soundOn;
  audio.init();
  audio.setEnabled(soundOn);
  store('heartrush.sound.v1', soundOn ? 'on' : 'off');
  syncSoundButtons();
  if (soundOn) audio.ui();
  showToast(soundOn ? 'SOUND ON' : 'SOUND OFF', 1100);
}

function syncTiltButtons() {
  const label = tiltOn ? 'TILT: ON' : 'TILT: OFF';
  [tiltBtn, pauseTiltBtn].forEach((b) => {
    if (!b) return;
    b.textContent = label;
    b.setAttribute('aria-pressed', String(tiltOn));
  });
}

async function toggleTilt() {
  if (tiltOn) {
    input.disableTilt();
    tiltOn = false;
    syncTiltButtons();
    showToast('TILT OFF — BACK TO TOUCH', 1500);
    return;
  }
  const result = await input.enableTilt();
  if (result.ok) {
    tiltOn = true;
    syncTiltButtons();
    showToast('TILT ON — HOLD STEADY TO CALIBRATE', 2000);
  } else if (result.reason === 'denied') {
    showToast('MOTION ACCESS DENIED — USE TOUCH', 2400);
  } else if (result.reason === 'unsupported') {
    showToast('NO MOTION SENSOR — USE TOUCH', 2200);
  } else {
    showToast('TILT UNAVAILABLE — USE TOUCH', 2000);
  }
}

/* ------------------------------------------------------------------ */
/* Kiss UI                                                             */
/* ------------------------------------------------------------------ */

let hintState = '';
function setKissHint(text, mode = '') {
  if (kissHint.textContent !== text) kissHint.textContent = text;
  const next = `kiss-hint${mode ? ' ' + mode : ''}`;
  if (hintState !== next) {
    kissHint.className = next;
    hintState = next;
  }
}

function updateKissUI() {
  const charging = game.charging;
  const charge = game.charge;
  ringProgress.style.strokeDashoffset = String(RING_C * (1 - (charging ? charge : 0)));

  if (game.state !== 'playing') {
    setKissHint('MOVE CLOSER', '');
    kissBtn.classList.remove('ready');
    return;
  }

  if (charging) {
    if (charge < 0.56) setKissHint('HOLD...', 'ready');
    else if (charge <= 0.86) setKissHint('RELEASE NOW!', 'hot');
    else setKissHint('TOO LONG', 'over');
    kissBtn.classList.remove('ready');
  } else if (game.nearest) {
    setKissHint('KISS!', 'ready');
    kissBtn.classList.add('ready');
  } else {
    setKissHint('GET CLOSER', '');
    kissBtn.classList.remove('ready');
  }
}

/* ------------------------------------------------------------------ */
/* Wiring                                                              */
/* ------------------------------------------------------------------ */

playBtn.addEventListener('click', startGame);
pauseBtn.addEventListener('click', () => pauseGame());
resumeBtn.addEventListener('click', resumeGame);
quitBtn.addEventListener('click', goTitle);
retryBtn.addEventListener('click', startGame);
homeBtn.addEventListener('click', goTitle);
tiltBtn.addEventListener('click', toggleTilt);
pauseTiltBtn.addEventListener('click', toggleTilt);
soundBtn.addEventListener('click', toggleSound);
pauseSoundBtn.addEventListener('click', toggleSound);

window.addEventListener('keydown', (e) => {
  if (e.key !== 'Enter') return;
  if (game.state === 'title' || game.state === 'gameover') startGame();
  else if (game.state === 'paused') resumeGame();
});

document.addEventListener('visibilitychange', () => {
  if (document.hidden && game.state === 'playing') pauseGame();
});

window.addEventListener('resize', resize);
window.addEventListener('orientationchange', () => setTimeout(resize, 120));

/* ------------------------------------------------------------------ */
/* Boot + loop                                                         */
/* ------------------------------------------------------------------ */

syncSoundButtons();
syncTiltButtons();
syncBestLabels();
resize();
setState('title');

ringProgress.style.strokeDasharray = String(RING_C);
ringProgress.style.strokeDashoffset = String(RING_C);

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
  last = now;
  input.update(dt);
  game.update(dt, input.axis);
  game.render();
  audio.update();
  updateKissUI();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// Handy for debugging and automated smoke tests.
window.heartRush = {
  game,
  input,
  audio,
  startGame,
  pauseGame,
  resumeGame,
  goTitle,
  toggleTilt,
  setState,
};
