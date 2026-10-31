import { clamp, lerp } from './util.js';

export class Input {
  constructor({ moveZone, joystick, knob, kissBtn, onKissStart, onKissEnd, onPause, onMute, onTiltState }) {
    this.moveZone = moveZone;
    this.joystick = joystick;
    this.knob = knob;
    this.kissBtn = kissBtn;
    this.onKissStart = onKissStart || (() => {});
    this.onKissEnd = onKissEnd || (() => {});
    this.onPause = onPause || (() => {});
    this.onMute = onMute || (() => {});
    this.onTiltState = onTiltState || (() => {});

    this.keys = new Set();
    this.joy = { x: 0, y: 0 };
    this.joyActive = false;
    this.joyPointer = null;
    this.joyCenter = { x: 0, y: 0 };
    this.joyRadius = 38;
    this.baseSize = 116;

    this.tiltEnabled = false;
    this.tiltSeen = false;
    this.tiltAxis = { x: 0, y: 0 };
    this.tiltTarget = { x: 0, y: 0 };
    this.tiltBase = null;
    this.tiltCalibration = null;
    this._tiltHandler = (e) => this._onTilt(e);

    this.bind();
    this.layout();
  }

  bind() {
    this.moveZone.addEventListener('pointerdown', (e) => this._joyDown(e));
    this.moveZone.addEventListener('pointermove', (e) => this._joyMove(e));
    this.moveZone.addEventListener('pointerup', (e) => this._joyUp(e));
    this.moveZone.addEventListener('pointercancel', (e) => this._joyUp(e));
    this.moveZone.addEventListener('contextmenu', (e) => e.preventDefault());

    this.kissBtn.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (this.kissBtn.setPointerCapture) {
        try {
          this.kissBtn.setPointerCapture(e.pointerId);
        } catch {
          /* ignore */
        }
      }
      this.kissBtn.classList.add('pressing');
      this.onKissStart();
    });
    const endKiss = (e) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      this.kissBtn.classList.remove('pressing');
      this.onKissEnd();
    };
    this.kissBtn.addEventListener('pointerup', endKiss);
    this.kissBtn.addEventListener('pointercancel', endKiss);
    this.kissBtn.addEventListener('contextmenu', (e) => e.preventDefault());

    window.addEventListener('keydown', (e) => this._keyDown(e));
    window.addEventListener('keyup', (e) => this._keyUp(e));
    window.addEventListener('blur', () => {
      this.keys.clear();
      this.resetJoy();
      this.kissBtn.classList.remove('pressing');
      this.onKissEnd();
    });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.keys.clear();
        this.resetJoy();
        this.kissBtn.classList.remove('pressing');
        this.onKissEnd();
      }
    });
    window.addEventListener('resize', () => {
      if (!this.joyActive) this.layout();
    });
  }

  _keyDown(e) {
    const tag = (e.target && e.target.tagName) || '';
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    const key = e.key.toLowerCase();
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(key)) e.preventDefault();
    this.keys.add(key);
    if ((key === ' ' || key === 'e' || key === 'enter') && !e.repeat) {
      this.kissBtn.classList.add('pressing');
      this.onKissStart();
    }
    if (key === 'p' || key === 'escape') this.onPause();
    if (key === 'm') this.onMute();
  }

  _keyUp(e) {
    const key = e.key.toLowerCase();
    this.keys.delete(key);
    if (key === ' ' || key === 'e' || key === 'enter') {
      this.kissBtn.classList.remove('pressing');
      this.onKissEnd();
    }
  }

  layout() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.defaultJoy = {
      x: 26,
      y: h - this.baseSize - 30,
    };
    if (!this.joyActive) {
      this.joystick.style.transform = `translate3d(${this.defaultJoy.x}px, ${this.defaultJoy.y}px, 0)`;
      this.knob.style.transform = 'translate3d(35px, 35px, 0)';
    }
  }

  _joyDown(e) {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    e.preventDefault();
    this.joyActive = true;
    this.joyPointer = e.pointerId;
    if (this.moveZone.setPointerCapture) {
      try {
        this.moveZone.setPointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
    }
    const half = this.baseSize / 2;
    const x = clamp(e.clientX - half, 8, window.innerWidth - this.baseSize - 8);
    const y = clamp(e.clientY - half, 8, window.innerHeight - this.baseSize - 8);
    this.joyCenter = { x: x + half, y: y + half };
    this.joyRadius = 38;
    this.joystick.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    this.joystick.classList.add('active');
    this._applyJoy(0, 0);
  }

  _joyMove(e) {
    if (!this.joyActive || e.pointerId !== this.joyPointer) return;
    e.preventDefault();
    const dx = e.clientX - this.joyCenter.x;
    const dy = e.clientY - this.joyCenter.y;
    this._applyJoy(dx, dy);
  }

  _applyJoy(dx, dy) {
    const len = Math.hypot(dx, dy);
    const max = this.joyRadius;
    let nx = 0;
    let ny = 0;
    if (len > 0.0001) {
      const clamped = Math.min(len, max);
      nx = (dx / len) * (clamped / max);
      ny = (dy / len) * (clamped / max);
    }
    // small deadzone preserves precision without feeling sticky
    const mag = Math.hypot(nx, ny);
    const applied = mag < 0.12 ? 0 : (mag - 0.12) / 0.88;
    if (mag > 0.0001) {
      nx = (nx / mag) * applied;
      ny = (ny / mag) * applied;
    } else {
      nx = 0;
      ny = 0;
    }
    this.joy.x = nx;
    this.joy.y = ny;
    const kx = 35 + clamp((dx / (len || 1)) * Math.min(len, max), -max, max);
    const ky = 35 + clamp((dy / (len || 1)) * Math.min(len, max), -max, max);
    this.knob.style.transform = `translate3d(${kx}px, ${ky}px, 0)`;
  }

  _joyUp(e) {
    if (!this.joyActive || (e && e.pointerId !== this.joyPointer)) return;
    if (e) e.preventDefault();
    this.resetJoy();
  }

  resetJoy() {
    this.joyActive = false;
    this.joyPointer = null;
    this.joy.x = 0;
    this.joy.y = 0;
    this.joystick.classList.remove('active');
    if (this.defaultJoy) {
      this.joystick.style.transform = `translate3d(${this.defaultJoy.x}px, ${this.defaultJoy.y}px, 0)`;
    }
    this.knob.style.transform = 'translate3d(35px, 35px, 0)';
  }

  get axis() {
    if (this.joyActive && (Math.abs(this.joy.x) > 0.02 || Math.abs(this.joy.y) > 0.02)) {
      return { x: this.joy.x, y: this.joy.y };
    }

    let kx = 0;
    let ky = 0;
    if (this.keys.has('arrowleft') || this.keys.has('a')) kx -= 1;
    if (this.keys.has('arrowright') || this.keys.has('d')) kx += 1;
    if (this.keys.has('arrowup') || this.keys.has('w')) ky -= 1;
    if (this.keys.has('arrowdown') || this.keys.has('s')) ky += 1;
    const kl = Math.hypot(kx, ky);
    if (kl > 0) return { x: kx / kl, y: ky / kl };

    if (this.tiltEnabled && this.tiltSeen) {
      return { ...this.tiltAxis };
    }
    return { x: 0, y: 0 };
  }

  update(dt) {
    if (!this.tiltEnabled) return;
    this.tiltAxis.x = lerp(this.tiltAxis.x, this.tiltTarget.x, 1 - Math.exp(-8 * dt));
    this.tiltAxis.y = lerp(this.tiltAxis.y, this.tiltTarget.y, 1 - Math.exp(-8 * dt));
  }

  async enableTilt() {
    if (this.tiltEnabled) return { ok: true, already: true };
    if (!('DeviceOrientationEvent' in window)) {
      return { ok: false, reason: 'unsupported' };
    }
    try {
      if (typeof DeviceOrientationEvent.requestPermission === 'function') {
        const result = await DeviceOrientationEvent.requestPermission();
        if (result !== 'granted') return { ok: false, reason: 'denied' };
      }
    } catch {
      return { ok: false, reason: 'denied' };
    }
    this.tiltEnabled = true;
    this.tiltSeen = false;
    this.tiltBase = null;
    this.tiltCalibration = { x: 0, y: 0, n: 0 };
    window.addEventListener('deviceorientation', this._tiltHandler, true);
    // Warn when the device simply has no usable sensor.
    const captured = this;
    setTimeout(() => {
      if (captured.tiltEnabled && !captured.tiltSeen) {
        captured.onTiltState({ enabled: true, active: false });
      }
    }, 1400);
    return { ok: true };
  }

  disableTilt() {
    this.tiltEnabled = false;
    this.tiltSeen = false;
    this.tiltBase = null;
    this.tiltTarget = { x: 0, y: 0 };
    this.tiltAxis = { x: 0, y: 0 };
    window.removeEventListener('deviceorientation', this._tiltHandler, true);
  }

  recalibrateTilt() {
    this.tiltBase = null;
    this.tiltCalibration = { x: 0, y: 0, n: 0 };
  }

  _onTilt(e) {
    if (e.gamma === null && e.beta === null) return;
    if (e.gamma === null || e.beta === null) return;
    const angle = (screen.orientation && screen.orientation.angle) || window.orientation || 0;
    let rx;
    let ry;
    if (angle === 90) {
      rx = e.beta;
      ry = -e.gamma;
    } else if (angle === 180) {
      rx = -e.gamma;
      ry = -e.beta;
    } else if (angle === 270) {
      rx = -e.beta;
      ry = e.gamma;
    } else {
      rx = e.gamma;
      ry = e.beta;
    }
    if (!Number.isFinite(rx) || !Number.isFinite(ry)) return;
    this.tiltSeen = true;

    if (!this.tiltBase) {
      const c = this.tiltCalibration;
      c.x += rx;
      c.y += ry;
      c.n += 1;
      if (c.n >= 8) {
        this.tiltBase = { x: c.x / c.n, y: c.y / c.n };
        this.onTiltState({ enabled: true, active: true });
      }
      return;
    }

    const dead = 3;
    const travel = 20;
    const map = (v) => {
      const a = Math.abs(v);
      if (a <= dead) return 0;
      return Math.sign(v) * clamp((a - dead) / travel, 0, 1);
    };
    this.tiltTarget.x = map(rx - this.tiltBase.x);
    this.tiltTarget.y = map(ry - this.tiltBase.y);
  }

  vibrate(pattern) {
    try {
      if (navigator.vibrate) navigator.vibrate(pattern);
    } catch {
      /* ignore */
    }
  }

  destroy() {
    this.disableTilt();
  }
}
