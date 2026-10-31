// Small WebAudio chiptune engine. No assets, no autoplay: starts on a tap.

const midiToFreq = (m) => 440 * Math.pow(2, (m - 69) / 12);

export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.musicBus = null;
    this.sfxBus = null;
    this.enabled = true;
    this.playing = false;
    this.step = 0;
    this.nextTime = 0;
    this.chargeOsc = null;
    this.chargeGain = null;
    this._noiseBuffer = null;
  }

  init() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
      return;
    }
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    this.ctx = new Ctx();
    this.master = this.ctx.createGain();
    this.master.gain.value = this.enabled ? 0.85 : 0;
    this.master.connect(this.ctx.destination);

    this.musicBus = this.ctx.createGain();
    this.musicBus.gain.value = 0.3;
    this.musicBus.connect(this.master);

    this.sfxBus = this.ctx.createGain();
    this.sfxBus.gain.value = 0.7;
    this.sfxBus.connect(this.master);

    if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
    this.nextTime = this.ctx.currentTime + 0.1;
  }

  setEnabled(on) {
    this.enabled = on;
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(t);
    this.master.gain.setTargetAtTime(on ? 0.85 : 0.0001, t, 0.05);
    if (!on) this.stopCharge();
  }

  setPlaying(on) {
    this.playing = on;
    if (!this.ctx) return;
    if (on) {
      this.nextTime = Math.max(this.nextTime, this.ctx.currentTime + 0.08);
      this.musicBus.gain.setTargetAtTime(0.3, this.ctx.currentTime, 0.2);
    } else {
      this.musicBus.gain.setTargetAtTime(0.12, this.ctx.currentTime, 0.25);
    }
  }

  duck(on) {
    if (!this.ctx) return;
    this.musicBus.gain.setTargetAtTime(on ? 0.06 : 0.3, this.ctx.currentTime, 0.15);
  }

  update() {
    if (!this.ctx || !this.playing) return;
    const now = this.ctx.currentTime;
    if (this.nextTime < now) this.nextTime = now + 0.05;
    while (this.nextTime < now + 0.24) {
      this._scheduleStep(this.step, this.nextTime);
      this.step = (this.step + 1) % 32;
      this.nextTime += 0.155;
    }
  }

  _scheduleStep(step, t) {
    const bar = Math.floor(step / 8);
    const s = step % 8;
    const chords = [
      [60, 64, 67, 71],
      [57, 60, 64, 67],
      [53, 57, 60, 64],
      [55, 59, 62, 65],
    ];
    const chord = chords[bar];

    if (s === 0) {
      this._tone(midiToFreq(chord[0] - 24), t, 1.0, 'triangle', 0.12, this.musicBus);
      this._tone(midiToFreq(chord[2] - 12), t, 0.8, 'sine', 0.04, this.musicBus);
    }
    if (s === 4) {
      this._tone(midiToFreq(chord[2] - 24), t, 0.55, 'triangle', 0.07, this.musicBus);
    }

    const arp = [0, 2, 1, 3, 2, 1, 3, 2];
    const note = chord[arp[s]] + (s >= 4 ? 12 : 0);
    this._tone(midiToFreq(note), t + 0.005, 0.19, 'square', 0.022, this.musicBus);

    if (s === 6) {
      this._tone(midiToFreq(chord[2] + 24), t, 0.24, 'triangle', 0.02, this.musicBus);
    }

    // Gentle heartbeat percussion.
    if (s === 0 || s === 4) {
      this._tone(120, t, 0.1, 'sine', 0.06, this.musicBus, 55);
    }
    if (s === 2 || s === 6) {
      this._noise(0.025, 0.012, t, this.musicBus, 5200);
    }
  }

  _tone(freq, t, dur, type, vol, bus, glideTo = null) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(Math.max(20, freq), t);
    if (glideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(20, glideTo), t + dur);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(vol, t + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(gain);
    gain.connect(bus || this.sfxBus);
    osc.start(t);
    osc.stop(t + dur + 0.03);
  }

  _noise(dur, vol, t, bus, filterFreq = 2400) {
    if (!this.ctx) return;
    if (!this._noiseBuffer) {
      const length = Math.floor(this.ctx.sampleRate * 0.4);
      const buffer = this.ctx.createBuffer(1, length, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
      this._noiseBuffer = buffer;
    }
    const src = this.ctx.createBufferSource();
    src.buffer = this._noiseBuffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = filterFreq;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(bus || this.sfxBus);
    src.start(t);
    src.stop(t + dur + 0.02);
  }

  ui() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this._tone(760, t, 0.05, 'square', 0.05);
    this._tone(1140, t + 0.04, 0.06, 'square', 0.04);
  }

  kiss(perfect = false) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    if (perfect) {
      const notes = [784, 988, 1175, 1568];
      notes.forEach((f, i) => this._tone(f, t + i * 0.055, 0.18, 'triangle', 0.14));
      this._tone(2093, t + 0.24, 0.3, 'sine', 0.08);
      this._noise(0.12, 0.03, t + 0.05, this.sfxBus, 7000);
    } else {
      this._tone(700, t, 0.08, 'triangle', 0.13, null, 1000);
      this._tone(1050, t + 0.08, 0.12, 'sine', 0.1);
      this._tone(1400, t + 0.15, 0.1, 'sine', 0.05);
    }
  }

  whiff() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this._tone(320, t, 0.12, 'triangle', 0.08, null, 210);
    this._noise(0.08, 0.015, t, this.sfxBus, 1600);
  }

  hurt() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this._tone(210, t, 0.24, 'sawtooth', 0.16, null, 70);
    this._noise(0.22, 0.08, t, this.sfxBus, 1400);
    this._tone(90, t + 0.04, 0.18, 'square', 0.08);
  }

  heal() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    [880, 1108, 1320].forEach((f, i) => this._tone(f, t + i * 0.07, 0.16, 'sine', 0.07));
  }

  wave() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    [523, 659, 784, 1046].forEach((f, i) => this._tone(f, t + i * 0.085, 0.22, 'square', 0.08));
    this._tone(1568, t + 0.34, 0.35, 'triangle', 0.05);
  }

  gameover() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    [392, 349, 294, 196].forEach((f, i) => this._tone(f, t + i * 0.16, 0.4, 'triangle', 0.11));
    this._tone(98, t + 0.6, 0.8, 'sine', 0.08);
  }

  startCharge() {
    if (!this.ctx || this.chargeOsc) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(330, t);
    osc.frequency.linearRampToValueAtTime(880, t + 1.0);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(0.035, t + 0.05);
    osc.connect(gain);
    gain.connect(this.sfxBus);
    osc.start(t);
    this.chargeOsc = osc;
    this.chargeGain = gain;
  }

  setCharge(value) {
    if (!this.ctx || !this.chargeOsc) return;
    const t = this.ctx.currentTime;
    this.chargeOsc.frequency.setTargetAtTime(330 + value * 700, t, 0.03);
    this.chargeGain.gain.setTargetAtTime(0.02 + value * 0.035, t, 0.03);
  }

  stopCharge() {
    if (!this.ctx || !this.chargeOsc) return;
    const t = this.ctx.currentTime;
    try {
      this.chargeGain.gain.setTargetAtTime(0.0001, t, 0.02);
      this.chargeOsc.stop(t + 0.1);
    } catch {
      /* already stopped */
    }
    this.chargeOsc = null;
    this.chargeGain = null;
  }
}
