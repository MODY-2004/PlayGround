import { PAL, pxRect, pxCircle, pxEllipse, pxRing, drawHeartSmall } from './util.js';

/* ------------------------------------------------------------------ */
/* Characters                                                          */
/* ------------------------------------------------------------------ */

export function drawHero(ctx, x, y, opts = {}) {
  const { dir = 'down', t = 0, moving = false, charging = false, alpha = 1 } = opts;
  if (alpha <= 0) return;
  const side = dir === 'left' || dir === 'right';
  const up = dir === 'up';
  const step = moving ? (Math.floor(t * 11) % 2 === 0 ? 1 : 0) : 0;
  const bob = moving ? (Math.floor(t * 11) % 2) : Math.sin(t * 2.1) > 0 ? 0 : 1;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(Math.round(x), Math.round(y));

  // ground shadow
  pxEllipse(ctx, 0, -1, 7, 2, 'rgba(40,28,54,0.22)');
  ctx.translate(0, -bob);

  if (dir === 'left') ctx.scale(-1, 1);

  const hair = '#3a2330';
  const hairHi = '#5c3946';
  const skin = PAL.skin;
  const skinShade = PAL.skinShade;
  const jacket = '#ef5a63';
  const jacketDark = '#c23c4d';
  const jacketHi = '#ff8187';
  const shirt = '#fff0d4';
  const jeans = '#30446f';
  const shoe = '#2b2038';

  // Legs / shoes
  pxRect(ctx, -3, -8 + (step ? 1 : 0), 2, 6 - (step ? 1 : 0), jeans);
  pxRect(ctx, 1, -8 + (step ? 0 : 1), 2, 6 - (step ? 0 : 1), jeans);
  pxRect(ctx, -4, -2, 3, 2, shoe);
  pxRect(ctx, 1, -2, 3, 2, shoe);
  pxRect(ctx, -4, -1, 1, 1, '#564465');
  pxRect(ctx, 3, -1, 1, 1, '#564465');

  // Body
  if (side) {
    pxRect(ctx, -4, -15, 7, 8, jacket);
    pxRect(ctx, -4, -15, 2, 8, jacketDark);
    pxRect(ctx, -1, -15, 2, 5, shirt);
    pxRect(ctx, -4, -9, 7, 1, jacketDark);
  } else {
    pxRect(ctx, -4, -15, 8, 8, jacket);
    pxRect(ctx, -4, -15, 1, 8, jacketHi);
    pxRect(ctx, -1, -15, 2, 5, shirt);
    pxRect(ctx, 2, -15, 1, 8, jacketDark);
    pxRect(ctx, -4, -8, 8, 1, jacketDark);
    pxRect(ctx, -3, -15, 2, 1, shirt);
  }

  // Arms (held together while charging a kiss)
  if (charging) {
    pxRect(ctx, -5, -13, 2, 4, jacket);
    pxRect(ctx, 3, -13, 2, 4, jacket);
    pxRect(ctx, -3, -11, 2, 2, skin);
    pxRect(ctx, 1, -11, 2, 2, skin);
  } else if (side) {
    pxRect(ctx, 1, -14, 2, 5, jacket);
    pxRect(ctx, 2, -10, 2, 2, skin);
  } else {
    pxRect(ctx, -6, -14, 2, 4, jacket);
    pxRect(ctx, 4, -14, 2, 4, jacket);
    pxRect(ctx, -6, -10 + (step ? 0 : 1), 2, 2, skin);
    pxRect(ctx, 4, -10 + (step ? 1 : 0), 2, 2, skin);
  }

  // Neck + head
  pxRect(ctx, -2, -17, 4, 2, skinShade);
  pxRect(ctx, -4, -24, 9, 8, skin);
  pxRect(ctx, -3, -16, 7, 1, skinShade);
  pxRect(ctx, -5, -21, 1, 2, skinShade);
  pxRect(ctx, 4, -21, 1, 2, skinShade);

  // Hair
  pxRect(ctx, -4, -25, 9, 2, hair);
  pxRect(ctx, -5, -24, 1, 6, hair);
  pxRect(ctx, 4, -24, 1, 5, hair);
  pxRect(ctx, -3, -24, 2, 1, hairHi);
  pxRect(ctx, 1, -24, 2, 1, hairHi);

  if (up) {
    pxRect(ctx, -4, -24, 9, 7, hair);
    pxRect(ctx, -5, -23, 1, 5, hair);
    pxRect(ctx, 4, -23, 1, 4, hair);
    pxRect(ctx, -3, -24, 3, 1, hairHi);
    pxRect(ctx, 1, -22, 2, 1, hairHi);
    pxRect(ctx, -1, -17, 2, 1, skinShade);
  } else if (side) {
    pxRect(ctx, -4, -23, 4, 5, hair);
    pxRect(ctx, -4, -18, 2, 2, hair);
    pxRect(ctx, 3, -22, 2, 1, hair);
    pxRect(ctx, 2, -21, 1, 2, PAL.ink);
    pxRect(ctx, 2, -21, 1, 1, PAL.white);
    pxRect(ctx, 4, -19, 1, 1, skinShade);
    pxRect(ctx, 2, -18, 2, 1, '#b9575f');
    pxRect(ctx, 1, -19, 1, 1, '#f08a8a');
  } else {
    pxRect(ctx, -4, -23, 2, 3, hair);
    pxRect(ctx, 2, -23, 2, 2, hair);
    pxRect(ctx, -1, -23, 2, 1, hair);
    pxRect(ctx, -2, -21, 1, 2, PAL.ink);
    pxRect(ctx, 2, -21, 1, 2, PAL.ink);
    pxRect(ctx, -2, -21, 1, 1, PAL.white);
    pxRect(ctx, 2, -21, 1, 1, PAL.white);
    pxRect(ctx, -3, -19, 1, 1, '#f29a9a');
    pxRect(ctx, 3, -19, 1, 1, '#f29a9a');
    pxRect(ctx, -1, -18, 2, 1, '#b9575f');
  }

  ctx.restore();
}

export const GIRL_TYPES = {
  rose: {
    id: 'rose',
    label: 'ROSE',
    dress: '#ff7fa8',
    dressDark: '#d9507c',
    trim: '#ffe3ec',
    hair: '#7b4638',
    hairHi: '#a86a54',
    accent: '#ffd166',
    style: 'twin',
    speed: 48,
    needed: 1,
  },
  violet: {
    id: 'violet',
    label: 'VIOLET',
    dress: '#a888ff',
    dressDark: '#7d5bd0',
    trim: '#ece2ff',
    hair: '#4b3b63',
    hairHi: '#7c68a1',
    accent: '#ffe27a',
    style: 'bob',
    speed: 64,
    needed: 1,
  },
  aqua: {
    id: 'aqua',
    label: 'MARINA',
    dress: '#6fd6cf',
    dressDark: '#3ea9a9',
    trim: '#e3fff9',
    hair: '#3e8e9d',
    hairHi: '#6fc2c8',
    accent: '#fff0f5',
    style: 'long',
    speed: 56,
    needed: 1,
  },
  queen: {
    id: 'queen',
    label: 'QUEEN',
    dress: '#ee5b6a',
    dressDark: '#bc344d',
    trim: '#ffe29a',
    hair: '#edc368',
    hairHi: '#ffe8a3',
    accent: '#ffd166',
    style: 'queen',
    speed: 42,
    needed: 2,
  },
};

export function drawGirl(ctx, x, y, opts = {}) {
  const {
    type = GIRL_TYPES.rose,
    dir = 'down',
    t = 0,
    moving = false,
    charmed = false,
    stage = 0,
    alpha = 1,
  } = opts;
  if (alpha <= 0) return;
  const up = dir === 'up';
  const side = dir === 'left' || dir === 'right';
  const step = moving ? Math.floor(t * 10) % 2 : 0;
  const bob = moving ? step : Math.sin(t * 2.4 + x) > 0 ? 0 : 1;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(Math.round(x), Math.round(y));
  pxEllipse(ctx, 0, -1, 6, 2, 'rgba(40,28,54,0.22)');
  ctx.translate(0, -bob);
  if (dir === 'left') ctx.scale(-1, 1);

  const { dress, dressDark, trim, hair, hairHi, accent } = type;
  const longHair = type.style === 'long' || type.style === 'queen';

  // Long hair behind the body.
  if (longHair) {
    const drop = type.style === 'queen' ? 9 : 7;
    pxRect(ctx, -5, -22, 10, drop + 6, hair);
    pxRect(ctx, -6, -21, 2, drop, hair);
    pxRect(ctx, 4, -21, 2, drop, hair);
    pxRect(ctx, -4, -22, 3, 1, hairHi);
    pxRect(ctx, 2, -20, 1, drop - 1, hairHi);
  }

  // Legs and shoes
  pxRect(ctx, -2, -6 + (step ? 1 : 0), 1, 4 - (step ? 1 : 0), PAL.skin);
  pxRect(ctx, 1, -6 + (step ? 0 : 1), 1, 4 - (step ? 0 : 1), PAL.skin);
  pxRect(ctx, -3, -2, 2, 2, '#56405e');
  pxRect(ctx, 1, -2, 2, 2, '#56405e');

  // Dress — a soft flared shape.
  pxRect(ctx, -3, -15, 6, 1, dress);
  pxRect(ctx, -4, -14, 8, 2, dress);
  pxRect(ctx, -4, -12, 8, 2, dress);
  pxRect(ctx, -5, -10, 10, 2, dress);
  pxRect(ctx, -6, -8, 12, 2, dress);
  pxRect(ctx, -7, -7, 14, 1, dressDark);
  pxRect(ctx, -4, -14, 1, 6, dressDark);
  pxRect(ctx, -2, -11, 4, 1, trim);
  pxRect(ctx, -1, -10, 2, 1, accent);
  pxRect(ctx, -6, -8, 12, 1, trim);
  pxRect(ctx, -6, -7, 12, 1, dressDark);

  // Arms
  if (charmed) {
    pxRect(ctx, -6, -13, 2, 3, dress);
    pxRect(ctx, 4, -13, 2, 3, dress);
    pxRect(ctx, -6, -11, 2, 2, PAL.skin);
    pxRect(ctx, 4, -11, 2, 2, PAL.skin);
  } else {
    pxRect(ctx, -6, -14, 2, 3, dress);
    pxRect(ctx, 4, -14, 2, 3, dress);
    pxRect(ctx, -6, -11 + (step ? 0 : 1), 2, 2, PAL.skin);
    pxRect(ctx, 4, -11 + (step ? 1 : 0), 2, 2, PAL.skin);
  }

  // Head
  pxRect(ctx, -4, -23, 9, 7, PAL.skin);
  pxRect(ctx, -3, -16, 7, 1, PAL.skinShade);
  pxRect(ctx, -4, -22, 1, 5, PAL.skinShade);
  pxRect(ctx, 4, -22, 1, 5, PAL.skinShade);

  // Hair cap + bangs
  pxRect(ctx, -4, -24, 9, 2, hair);
  pxRect(ctx, -5, -23, 1, 5, hair);
  pxRect(ctx, 4, -23, 1, 4, hair);
  pxRect(ctx, -3, -24, 3, 1, hairHi);
  pxRect(ctx, 1, -22, 2, 1, hair);
  pxRect(ctx, -2, -22, 2, 1, hair);
  pxRect(ctx, 4, -22, 1, 2, hair);

  if (up) {
    pxRect(ctx, -4, -23, 9, 6, hair);
    pxRect(ctx, -5, -22, 1, 4, hair);
    pxRect(ctx, 4, -22, 1, 3, hair);
    pxRect(ctx, -3, -23, 3, 1, hairHi);
    pxRect(ctx, 1, -21, 2, 1, hairHi);
  } else {
    // Face
    const eyeY = -20;
    if (charmed) {
      drawHeartSmall(ctx, -2, eyeY, 1, PAL.pinkDark);
      drawHeartSmall(ctx, 2, eyeY, 1, PAL.pinkDark);
      pxRect(ctx, -3, -18, 2, 1, '#ff9ab5');
      pxRect(ctx, 2, -18, 2, 1, '#ff9ab5');
      pxRect(ctx, -1, -17, 2, 1, '#b9575f');
    } else if (side) {
      pxRect(ctx, 2, eyeY, 1, 2, PAL.ink);
      pxRect(ctx, 2, eyeY, 1, 1, PAL.white);
      pxRect(ctx, -2, -18, 2, 1, '#f291a5');
      pxRect(ctx, 2, -17, 2, 1, '#b9575f');
      pxRect(ctx, 4, -18, 1, 1, PAL.skinShade);
    } else {
      pxRect(ctx, -2, eyeY, 1, 2, PAL.ink);
      pxRect(ctx, 2, eyeY, 1, 2, PAL.ink);
      pxRect(ctx, -2, eyeY, 1, 1, PAL.white);
      pxRect(ctx, 2, eyeY, 1, 1, PAL.white);
      pxRect(ctx, -3, -18, 2, 1, '#f291a5');
      pxRect(ctx, 2, -18, 2, 1, '#f291a5');
      pxRect(ctx, -1, -17, 2, 1, '#b9575f');
    }
    if (stage > 0) {
      // A second-chance queen gets smitten little hearts.
      drawHeartSmall(ctx, -3, -22, 1, PAL.pink);
      drawHeartSmall(ctx, 3, -22, 1, PAL.pink);
    }
  }

  // Style flourishes
  if (type.style === 'twin') {
    pxRect(ctx, -8, -22, 3, 8, hair);
    pxRect(ctx, 5, -22, 3, 8, hair);
    pxRect(ctx, -8, -21, 1, 5, hairHi);
    pxRect(ctx, 7, -21, 1, 5, hairHi);
    pxRect(ctx, -7, -23, 2, 1, PAL.pinkLight);
    pxRect(ctx, 5, -23, 2, 1, PAL.pinkLight);
    pxRect(ctx, -7, -23, 1, 1, PAL.pink);
    pxRect(ctx, 6, -23, 1, 1, PAL.pink);
  } else if (type.style === 'bob') {
    pxRect(ctx, -5, -23, 1, 6, hair);
    pxRect(ctx, 4, -23, 1, 6, hair);
    pxRect(ctx, -5, -17, 2, 1, hair);
    pxRect(ctx, 3, -17, 2, 1, hair);
    // star clip
    pxRect(ctx, 3, -22, 1, 1, accent);
    pxRect(ctx, 2, -21, 3, 1, accent);
    pxRect(ctx, 3, -20, 1, 1, accent);
  } else if (type.style === 'long') {
    pxRect(ctx, -5, -23, 1, 8, hair);
    pxRect(ctx, 4, -23, 1, 8, hair);
    pxRect(ctx, -1, -24, 2, 1, accent || PAL.white);
    pxRect(ctx, 1, -24, 1, 1, PAL.pink);
  } else if (type.style === 'queen') {
    pxRect(ctx, -4, -26, 8, 2, PAL.gold);
    pxRect(ctx, -4, -27, 1, 1, PAL.gold);
    pxRect(ctx, -1, -28, 1, 2, PAL.gold);
    pxRect(ctx, 3, -27, 1, 1, PAL.gold);
    pxRect(ctx, -1, -26, 1, 1, PAL.pinkDark);
    pxRect(ctx, -5, -23, 1, 6, hair);
    pxRect(ctx, 4, -23, 1, 6, hair);
    pxRect(ctx, -5, -20, 2, 1, hairHi);
    pxRect(ctx, 3, -19, 2, 1, hairHi);
  }

  ctx.restore();
}

/* ------------------------------------------------------------------ */
/* Scenery                                                             */
/* ------------------------------------------------------------------ */

export function drawTree(ctx, x, y, opts = {}) {
  const { kind = 'green', t = 0, seed = 0 } = opts;
  const sway = Math.round(Math.sin(t * 0.8 + seed * 1.7) * 1.2);
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));
  pxEllipse(ctx, 0, -1, 16, 4, 'rgba(40,28,54,0.20)');

  // trunk
  pxRect(ctx, -3, -27, 6, 25, '#75462f');
  pxRect(ctx, -3, -27, 2, 25, '#8d5a3a');
  pxRect(ctx, 1, -24, 1, 18, '#5b3526');
  pxRect(ctx, -5, -5, 3, 5, '#75462f');
  pxRect(ctx, 3, -5, 3, 5, '#5b3526');
  pxRect(ctx, -4, -2, 9, 2, '#66402c');

  const palette =
    kind === 'blossom'
      ? ['#c95d80', '#ec83a2', '#ffa9c1', '#ffd6e2']
      : kind === 'dark'
        ? ['#2f6b48', '#43895a', '#5aa96b', '#88cb86']
        : ['#3f8a55', '#57a865', '#78c67d', '#a8df9b'];

  const cx = sway;
  const cy = -40;
  pxEllipse(ctx, cx + 1, cy + 6, 15, 12, palette[0]);
  pxCircle(ctx, cx - 8, cy + 2, 9, palette[0]);
  pxCircle(ctx, cx + 9, cy + 1, 8, palette[0]);
  pxCircle(ctx, cx, cy - 3, 12, palette[1]);
  pxCircle(ctx, cx - 9, cy - 1, 8, palette[1]);
  pxCircle(ctx, cx + 8, cy - 2, 7, palette[1]);
  pxCircle(ctx, cx - 3, cy - 7, 7, palette[2]);
  pxCircle(ctx, cx + 6, cy - 6, 5, palette[2]);
  pxCircle(ctx, cx - 8, cy - 5, 4, palette[2]);

  // dappled highlights + fruit / blossoms
  pxRect(ctx, cx - 7, cy - 10, 3, 1, palette[3]);
  pxRect(ctx, cx - 4, cy - 11, 2, 1, palette[3]);
  pxRect(ctx, cx + 5, cy - 9, 2, 1, palette[3]);
  pxRect(ctx, cx + 2, cy + 3, 2, 1, palette[3]);
  if (kind === 'blossom') {
    pxRect(ctx, cx - 10, cy + 2, 1, 1, '#fff2f7');
    pxRect(ctx, cx + 11, cy + 4, 1, 1, '#fff2f7');
    pxRect(ctx, cx + 1, cy - 12, 1, 1, '#fff2f7');
  } else {
    pxRect(ctx, cx - 11, cy + 3, 1, 1, '#f2b7c9');
    pxRect(ctx, cx + 3, cy + 5, 1, 1, '#f5d58e');
  }
  ctx.restore();
}

export function drawBush(ctx, x, y, opts = {}) {
  const { kind = 'green', t = 0, seed = 0 } = opts;
  const sway = Math.round(Math.sin(t * 1.1 + seed) * 0.8);
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));
  pxEllipse(ctx, 0, -1, 10, 3, 'rgba(40,28,54,0.16)');
  const dark = kind === 'blossom' ? '#b64f73' : '#3e7f50';
  const mid = kind === 'blossom' ? '#e87a9c' : '#57a465';
  const light = kind === 'blossom' ? '#ffb2c8' : '#83c887';
  pxCircle(ctx, sway - 4, -5, 6, dark);
  pxCircle(ctx, sway + 4, -5, 6, dark);
  pxCircle(ctx, sway, -8, 7, dark);
  pxCircle(ctx, sway - 4, -7, 4, mid);
  pxCircle(ctx, sway + 4, -7, 4, mid);
  pxCircle(ctx, sway, -10, 5, mid);
  pxCircle(ctx, sway - 3, -10, 2, light);
  pxCircle(ctx, sway + 3, -8, 2, light);
  ctx.restore();
}

export function drawBench(ctx, x, y) {
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));
  pxEllipse(ctx, 0, -1, 18, 4, 'rgba(40,28,54,0.18)');
  pxRect(ctx, -14, -8, 3, 8, '#6c422a');
  pxRect(ctx, 11, -8, 3, 8, '#6c422a');
  pxRect(ctx, -15, -11, 30, 4, '#a56a3d');
  pxRect(ctx, -15, -11, 30, 1, '#c88851');
  pxRect(ctx, -15, -8, 30, 1, '#7d4c2e');
  pxRect(ctx, -15, -19, 30, 3, '#a56a3d');
  pxRect(ctx, -15, -19, 30, 1, '#c88851');
  pxRect(ctx, -14, -16, 2, 5, '#7d4c2e');
  pxRect(ctx, 12, -16, 2, 5, '#7d4c2e');
  for (let i = -12; i < 14; i += 6) pxRect(ctx, i, -10, 1, 2, '#8a5733');
  ctx.restore();
}

export function drawLamp(ctx, x, y, t = 0) {
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));
  pxEllipse(ctx, 0, -1, 5, 2, 'rgba(40,28,54,0.20)');
  const glow = 0.5 + Math.sin(t * 2) * 0.08;
  ctx.globalAlpha = glow;
  pxCircle(ctx, 0, -33, 9, '#ffe9a8');
  ctx.globalAlpha = 1;
  pxRect(ctx, -1, -29, 2, 27, '#4c3a55');
  pxRect(ctx, -3, -3, 6, 2, '#4c3a55');
  pxRect(ctx, -2, -2, 4, 2, '#3a2c42');
  pxRect(ctx, -4, -36, 8, 6, '#3a2c42');
  pxRect(ctx, -3, -35, 6, 4, '#ffd166');
  pxRect(ctx, -2, -35, 3, 2, '#fff6c9');
  pxRect(ctx, -5, -37, 10, 2, '#3a2c42');
  pxRect(ctx, -2, -38, 4, 1, '#3a2c42');
  ctx.restore();
}

export function drawFlower(ctx, x, y, t, color) {
  const sway = Math.sin(t * 1.8 + x * 0.3) > 0 ? 0 : 1;
  pxRect(ctx, Math.round(x) + sway, Math.round(y) - 3, 1, 3, '#3e7f50');
  pxRect(ctx, Math.round(x) - 1 + sway, Math.round(y) - 5, 3, 1, color);
  pxRect(ctx, Math.round(x) + sway, Math.round(y) - 6, 1, 3, color);
  pxRect(ctx, Math.round(x) + sway, Math.round(y) - 5, 1, 1, '#fff6c9');
}

export function drawHeartProjectile(ctx, x, y, t) {
  const bob = Math.sin(t * 12) * 0.5;
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y + bob));
  ctx.globalAlpha = 0.25;
  pxRect(ctx, -6, 2, 4, 1, PAL.pinkLight);
  pxRect(ctx, -9, 3, 3, 1, PAL.pinkLight);
  ctx.globalAlpha = 1;
  drawHeartSmall(ctx, 0, 0, 2, PAL.pinkDark);
  drawHeartSmall(ctx, 0, 0, 1, PAL.pink);
  pxRect(ctx, -1, -2, 1, 1, PAL.pinkPale);
  ctx.restore();
}
