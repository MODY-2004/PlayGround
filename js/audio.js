(() => {
  "use strict";
  const MH = (window.MH = window.MH || {});

  const NOTES = {
    // A minor, F major 7, C major, G major — a soft rooftop loop.
    chords: [
      [220.0, 261.63, 329.63, 392.0],
      [174.61, 220.0, 261.63, 329.63],
      [196.0, 261.63, 329.63, 392.0],
      [196.0, 246.94, 293.66, 392.0],
    ],
    bass: [110.0, 87.31, 130.81, 98.0],
    arp: [0, 2, 1, 3, 2, 1, 3, 0],
  };

  class SoundEngine {
    constructor() {
      this.ctx = null;
      this.master = null;
      this.musicBus = null;
      this.sfxBus = null;
      this.step = 0;
      this.nextTime = 0;
      this.timer = null;
      this.muted = false;
      this.started = false;
      this.bpm = 82;
      try {
        this.muted = localStorage.getItem("midnightHearts.muted") === "1";
      } catch (_) {
        this.muted = false;
      }
    }

    init() {
      if (this.ctx) {
        if (this.ctx.state === "suspended") this.ctx.resume().catch(() => {});
        return;
      }
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      try {
        this.ctx = new AC();
      } catch (_) {
        return;
      }
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.72;
      this.master.connect(this.ctx.destination);

      this.musicBus = this.ctx.createGain();
      this.musicBus.gain.value = 0.24;
      this.musicBus.connect(this.master);

      this.sfxBus = this.ctx.createGain();
      this.sfxBus.gain.value = 0.75;
      this.sfxBus.connect(this.master);

      this.nextTime = this.ctx.currentTime + 0.08;
      this.step = 0;
      this.timer = setInterval(() => this.schedule(), 90);
      if (this.ctx.state === "suspended") this.ctx.resume().catch(() => {});
    }

    schedule() {
      if (!this.ctx) return;
      if (this.ctx.state === "suspended") return;
      const ahead = 0.28;
      while (this.nextTime < this.ctx.currentTime + ahead) {
        this.playStep(this.step, this.nextTime);
        const eighth = 60 / this.bpm / 2;
        this.nextTime += eighth;
        this.step = (this.step + 1) % 32;
        if (this.step === 0) this.nextTime += 0.01;
      }
    }

    playStep(step, when) {
      const eighth = 60 / this.bpm / 2;
      const bar = Math.floor(step / 8) % 4;
      const pos = step % 8;
      const chord = NOTES.chords[bar];

      if (pos === 0) {
        this.note(NOTES.bass[bar], when, eighth * 7.4, "triangle", 0.12, this.musicBus, 620);
        this.note(chord[0] / 2, when, eighth * 7.4, "sine", 0.055, this.musicBus, 1000);
      }

      const arpIndex = NOTES.arp[pos];
      const freq = chord[arpIndex] * (pos === 7 ? 2 : 1);
      this.note(freq, when + 0.005, eighth * 0.9, "triangle", 0.047, this.musicBus, 1900);
      if (pos === 2 || pos === 5) {
        this.note(chord[(arpIndex + 2) % 4] * 2, when + 0.02, eighth * 0.65, "sine", 0.018, this.musicBus, 2400);
      }

      if (pos === 0 || pos === 4) {
        this.softKick(when);
      }
      if (pos === 2 || pos === 6) {
        this.brush(when, 0.018);
      }
    }

    note(freq, when, duration, type, volume, destination, cutoff) {
      if (!this.ctx || !destination) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = cutoff || 2000;
      osc.type = type;
      osc.frequency.setValueAtTime(Math.max(20, freq), when);
      gain.gain.setValueAtTime(0.0001, when);
      gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, volume), when + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, when + Math.max(0.05, duration));
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(destination);
      osc.start(when);
      osc.stop(when + duration + 0.04);
    }

    sweep(freqA, freqB, duration, type, volume, destination) {
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freqA, now);
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, freqB), now + duration);
      gain.gain.setValueAtTime(volume, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      osc.connect(gain);
      gain.connect(destination || this.sfxBus);
      osc.start(now);
      osc.stop(now + duration + 0.02);
    }

    softKick(when) {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(98, when);
      osc.frequency.exponentialRampToValueAtTime(42, when + 0.12);
      gain.gain.setValueAtTime(0.0001, when);
      gain.gain.exponentialRampToValueAtTime(0.065, when + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, when + 0.2);
      osc.connect(gain);
      gain.connect(this.musicBus);
      osc.start(when);
      osc.stop(when + 0.24);
    }

    brush(when, volume) {
      if (!this.ctx) return;
      const length = Math.floor(this.ctx.sampleRate * 0.04);
      const buffer = this.ctx.createBuffer(1, length, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
      const src = this.ctx.createBufferSource();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();
      filter.type = "highpass";
      filter.frequency.value = 5200;
      gain.gain.setValueAtTime(volume, when);
      gain.gain.exponentialRampToValueAtTime(0.0001, when + 0.035);
      src.buffer = buffer;
      src.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicBus);
      src.start(when);
    }

    setMuted(muted) {
      this.muted = muted;
      try {
        localStorage.setItem("midnightHearts.muted", muted ? "1" : "0");
      } catch (_) {}
      if (this.ctx && this.master) {
        const now = this.ctx.currentTime;
        this.master.gain.cancelScheduledValues(now);
        this.master.gain.setTargetAtTime(muted ? 0 : 0.72, now, 0.03);
      }
    }

    toggleMuted() {
      this.setMuted(!this.muted);
      return this.muted;
    }

    click() {
      if (this.muted) return;
      this.init();
      this.sweep(520, 690, 0.06, "square", 0.035);
    }

    jump() {
      if (this.muted) return;
      this.sweep(290, 610, 0.15, "square", 0.045);
    }

    land() {
      if (this.muted) return;
      this.sweep(150, 70, 0.09, "triangle", 0.04);
    }

    kiss() {
      if (this.muted) return;
      this.chime(784, 0.0, 0.22, 0.11);
      this.chime(1046.5, 0.075, 0.26, 0.1);
      this.chime(1568, 0.16, 0.36, 0.07);
      this.sweep(230, 430, 0.1, "sine", 0.035);
    }

    chime(freq, delay, duration, volume) {
      if (!this.ctx) return;
      const t = this.ctx.currentTime + delay;
      this.note(freq, t, duration, "triangle", volume, this.sfxBus, 5000);
      this.note(freq * 2, t, duration * 0.7, "sine", volume * 0.35, this.sfxBus, 6000);
    }

    hurt() {
      if (this.muted) return;
      this.sweep(190, 52, 0.28, "sawtooth", 0.075);
      this.sweep(95, 40, 0.32, "square", 0.035);
    }

    whiff() {
      if (this.muted) return;
      this.sweep(430, 250, 0.12, "triangle", 0.025);
    }

    shoot() {
      if (this.muted) return;
      this.sweep(540, 980, 0.16, "triangle", 0.025);
    }

    combo(level) {
      if (this.muted) return;
      this.chime(880 + Math.min(level, 8) * 65, 0, 0.18, 0.045);
    }

    win() {
      if (this.muted) return;
      const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5];
      notes.forEach((f, i) => this.chime(f, i * 0.13, 0.4, 0.1));
    }

    lose() {
      if (this.muted) return;
      const notes = [392, 349.23, 293.66, 220];
      notes.forEach((f, i) => this.chime(f, i * 0.16, 0.5, 0.08));
    }
  }

  MH.SoundEngine = SoundEngine;
  MH.sound = new SoundEngine();
})();
