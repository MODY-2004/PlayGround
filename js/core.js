(() => {
  "use strict";
  const MH = (window.MH = window.MH || {});
  const $ = (id) => document.getElementById(id);

  MH.GOAL = 12;
  MH.ROUND_TIME = 75;
  MH.MAX_LIFE = 100;
  MH.PLAYER_SCALE = 1.18;
  MH.GIRL_SCALE = 1.13;

  MH.DOM = {
    canvas: $("game"),
    frame: $("gameFrame"),
    hud: $("hud"),
    titleScreen: $("titleScreen"),
    pauseScreen: $("pauseScreen"),
    overScreen: $("overScreen"),
    lifeFill: $("lifeFill"),
    lifeBar: $("lifeBar"),
    lifeText: $("lifeText"),
    kissCount: $("kissCount"),
    comboChip: $("comboChip"),
    timerText: $("timerText"),
    timerBox: document.querySelector(".timer"),
    toast: $("toast"),
    damageFlash: $("damageFlash"),
    kissBtn: $("kissBtn"),
    jumpBtn: $("jumpBtn"),
    touchControls: $("touchControls"),
    tiltBtn: $("tiltBtn"),
    soundBtn: $("soundBtn"),
    soundGlyph: $("soundGlyph"),
    titleSoundBtn: $("titleSoundBtn"),
    pauseBtn: $("pauseBtn"),
    joystick: $("joystick"),
    joystickKnob: $("joystickKnob"),
    startBtn: $("startBtn"),
    resumeBtn: $("resumeBtn"),
    restartPauseBtn: $("restartPauseBtn"),
    quitBtn: $("quitBtn"),
    againBtn: $("againBtn"),
    titleBtn: $("titleBtn"),
    finalScore: $("finalScore"),
    finalKisses: $("finalKisses"),
    finalCombo: $("finalCombo"),
    finalTime: $("finalTime"),
    overKicker: $("overKicker"),
    overHeading: $("overHeading"),
    overMessage: $("overMessage"),
    newBest: $("newBest"),
    bestTitle: $("bestTitle"),
  };

  MH.ctx = MH.DOM.canvas.getContext("2d", { alpha: false });
  MH.bgCanvas = document.createElement("canvas");
  MH.bgCtx = MH.bgCanvas.getContext("2d", { alpha: false });

  MH.view = { W: 360, H: 640, groundY: 464, time: 0, dprScale: 1 };
  MH.input = {
    keyboardAxis: 0,
    joyAxis: 0,
    tiltAxis: 0,
    joystickActive: false,
    jumpQueued: false,
    jumpHeld: false,
    kissQueued: false,
  };

  MH.clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  MH.lerp = (a, b, t) => a + (b - a) * t;
  MH.rand = (min, max) => min + Math.random() * (max - min);
  MH.pick = (arr) => arr[(Math.random() * arr.length) | 0];
  MH.sign = (v) => (v < 0 ? -1 : v > 0 ? 1 : 0);
  MH.mod = (n, m) => ((n % m) + m) % m;
  MH.formatTime = (seconds) => {
    const s = Math.max(0, Math.ceil(seconds));
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  };
  MH.formatScore = (score) => String(Math.max(0, Math.floor(score))).padStart(6, "0");

  MH.mulberry32 = (seed) => {
    let a = seed >>> 0;
    return () => {
      a += 0x6d2b79f5;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };

  MH.store = {
    get(key, fallback) {
      try {
        const value = localStorage.getItem(key);
        return value === null ? fallback : value;
      } catch (_) {
        return fallback;
      }
    },
    set(key, value) {
      try {
        localStorage.setItem(key, String(value));
      } catch (_) {}
    },
  };

  MH.bestScore = Number(MH.store.get("midnightHearts.best", "0")) || 0;

  let toastTimer = null;
  MH.toast = (message, duration = 2100) => {
    const el = MH.DOM.toast;
    el.textContent = message;
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("show"), duration);
  };

  MH.pulseDamage = () => {
    const el = MH.DOM.damageFlash;
    el.classList.add("on");
    setTimeout(() => el.classList.remove("on"), 90);
  };

  // ---------------------------------------------------------------------------
  // Touch joystick
  // ---------------------------------------------------------------------------

  const joystick = MH.DOM.joystick;
  const knob = MH.DOM.joystickKnob;
  let joyPointer = null;

  function setJoystickFromEvent(event) {
    const rect = joystick.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    let dx = event.clientX - cx;
    let dy = event.clientY - cy;
    const max = rect.width * 0.34;
    const length = Math.hypot(dx, dy) || 1;
    if (length > max) {
      dx = (dx / length) * max;
      dy = (dy / length) * max;
    }
    knob.style.transform = `translate(${dx}px, ${dy}px)`;
    let axis = dx / max;
    if (Math.abs(axis) < 0.12) axis = 0;
    MH.input.joyAxis = MH.clamp(axis, -1, 1);
  }

  function releaseJoystick(event) {
    if (event && joyPointer !== null && event.pointerId !== joyPointer) return;
    joyPointer = null;
    MH.input.joystickActive = false;
    MH.input.joyAxis = 0;
    joystick.classList.remove("active");
    knob.style.transform = "translate(0px, 0px)";
  }

  joystick.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    joyPointer = event.pointerId;
    MH.input.joystickActive = true;
    joystick.classList.add("active");
    try {
      joystick.setPointerCapture(event.pointerId);
    } catch (_) {}
    setJoystickFromEvent(event);
    MH.sound.click();
  });
  joystick.addEventListener("pointermove", (event) => {
    if (joyPointer === null || event.pointerId !== joyPointer) return;
    event.preventDefault();
    setJoystickFromEvent(event);
  });
  joystick.addEventListener("pointerup", releaseJoystick);
  joystick.addEventListener("pointercancel", releaseJoystick);
  joystick.addEventListener("lostpointercapture", releaseJoystick);

  // ---------------------------------------------------------------------------
  // Action controls
  // ---------------------------------------------------------------------------

  function pressJump(event) {
    if (event) event.preventDefault();
    MH.input.jumpQueued = true;
    MH.input.jumpHeld = true;
  }
  function releaseJump() {
    MH.input.jumpHeld = false;
  }
  function pressKiss(event) {
    if (event) event.preventDefault();
    MH.input.kissQueued = true;
  }

  MH.DOM.jumpBtn.addEventListener("pointerdown", pressJump);
  MH.DOM.jumpBtn.addEventListener("pointerup", releaseJump);
  MH.DOM.jumpBtn.addEventListener("pointercancel", releaseJump);
  MH.DOM.jumpBtn.addEventListener("pointerleave", releaseJump);
  MH.DOM.kissBtn.addEventListener("pointerdown", pressKiss);

  // Keyboard and assistive-tech activation (click detail 0). Pointer taps are
  // already handled on pointerdown, so ignore their synthetic clicks.
  MH.DOM.jumpBtn.addEventListener("click", (event) => {
    if (event.detail !== 0 || MH.input.jumpQueued) return;
    pressJump(event);
    setTimeout(releaseJump, 140);
  });
  MH.DOM.kissBtn.addEventListener("click", (event) => {
    if (event.detail !== 0) return;
    pressKiss(event);
  });

  const GAME_KEYS = new Set([
    "ArrowLeft",
    "ArrowRight",
    "ArrowUp",
    "ArrowDown",
    "KeyA",
    "KeyD",
    "KeyW",
    "Space",
    "KeyE",
    "KeyF",
    "KeyK",
    "KeyP",
    "KeyM",
    "KeyT",
    "Escape",
  ]);

  function refreshKeyboardAxis() {
    const L = MH.keys.left ? 1 : 0;
    const R = MH.keys.right ? 1 : 0;
    MH.input.keyboardAxis = R - L;
  }

  MH.keys = { left: false, right: false };

  window.addEventListener("keydown", (event) => {
    if (GAME_KEYS.has(event.code)) event.preventDefault();
    if (event.repeat) {
      if (event.code === "Space" || event.code === "KeyW" || event.code === "ArrowUp") {
        MH.input.jumpHeld = true;
      }
      return;
    }
    switch (event.code) {
      case "ArrowLeft":
      case "KeyA":
        MH.keys.left = true;
        refreshKeyboardAxis();
        break;
      case "ArrowRight":
      case "KeyD":
        MH.keys.right = true;
        refreshKeyboardAxis();
        break;
      case "ArrowUp":
      case "KeyW":
      case "Space":
        MH.input.jumpQueued = true;
        MH.input.jumpHeld = true;
        break;
      case "KeyE":
      case "KeyF":
      case "KeyK":
        MH.input.kissQueued = true;
        break;
      case "KeyP":
      case "Escape":
        if (MH.game) MH.game.togglePause();
        break;
      case "KeyM":
        if (MH.game) MH.game.toggleSound();
        break;
      case "KeyT":
        if (MH.game) MH.game.toggleTilt();
        break;
      default:
        break;
    }
  });

  window.addEventListener("keyup", (event) => {
    switch (event.code) {
      case "ArrowLeft":
      case "KeyA":
        MH.keys.left = false;
        refreshKeyboardAxis();
        break;
      case "ArrowRight":
      case "KeyD":
        MH.keys.right = false;
        refreshKeyboardAxis();
        break;
      case "ArrowUp":
      case "KeyW":
      case "Space":
        MH.input.jumpHeld = false;
        break;
      default:
        break;
    }
  });

  window.addEventListener("blur", () => {
    MH.keys.left = false;
    MH.keys.right = false;
    refreshKeyboardAxis();
    MH.input.jumpHeld = false;
    releaseJoystick();
  });

  MH.getMoveAxis = () => {
    if (MH.input.joystickActive) return MH.input.joyAxis;
    if (MH.input.keyboardAxis !== 0) return MH.input.keyboardAxis;
    if (MH.motion.enabled) return MH.input.tiltAxis;
    return 0;
  };

  // ---------------------------------------------------------------------------
  // Optional accelerometer tilt (with iOS motion permission)
  // ---------------------------------------------------------------------------

  MH.motion = {
    enabled: false,
    supported: typeof window.DeviceOrientationEvent !== "undefined",
    listening: false,
    center: null,
    seenEvent: false,
  };

  function handleOrientation(event) {
    if (!MH.motion.enabled) return;
    const angle =
      (screen.orientation && screen.orientation.angle) ||
      (typeof window.orientation === "number" ? window.orientation : 0);
    let raw;
    if (Math.abs(angle) === 90) {
      raw = typeof event.beta === "number" ? event.beta : 0;
    } else {
      raw = typeof event.gamma === "number" ? event.gamma : 0;
    }
    if (!Number.isFinite(raw)) return;
    MH.motion.seenEvent = true;

    if (MH.motion.center === null) MH.motion.center = raw;
    // Follow slow drift, but keep immediate tilt response.
    MH.motion.center = MH.lerp(MH.motion.center, raw, 0.008);
    let axis = (raw - MH.motion.center) / 18;
    if (Math.abs(axis) < 0.08) axis = 0;
    MH.input.tiltAxis = MH.clamp(axis, -1, 1);
  }

  MH.toggleTilt = async () => {
    if (MH.motion.enabled) {
      MH.motion.enabled = false;
      MH.input.tiltAxis = 0;
      MH.motion.center = null;
      MH.motion.seenEvent = false;
      window.removeEventListener("deviceorientation", handleOrientation, true);
      MH.motion.listening = false;
      MH.DOM.tiltBtn.classList.remove("on");
      MH.DOM.tiltBtn.setAttribute("aria-pressed", "false");
      MH.DOM.tiltBtn.setAttribute("aria-label", "Enable tilt controls");
      MH.toast("TILT OFF · TOUCH AND KEYS STILL WORK");
      return false;
    }

    if (typeof window.DeviceOrientationEvent === "undefined") {
      MH.toast("TILT ISN'T AVAILABLE ON THIS DEVICE");
      return false;
    }

    try {
      const DOE = window.DeviceOrientationEvent;
      if (typeof DOE.requestPermission === "function") {
        const permission = await DOE.requestPermission();
        if (permission !== "granted") {
          MH.toast("MOTION PERMISSION DECLINED · TILT OFF");
          return false;
        }
      }
      if (!MH.motion.listening) {
        window.addEventListener("deviceorientation", handleOrientation, true);
        MH.motion.listening = true;
      }
      MH.motion.enabled = true;
      MH.motion.center = null;
      MH.motion.seenEvent = false;
      MH.input.tiltAxis = 0;
      MH.DOM.tiltBtn.classList.add("on");
      MH.DOM.tiltBtn.setAttribute("aria-pressed", "true");
      MH.DOM.tiltBtn.setAttribute("aria-label", "Disable tilt controls");
      MH.sound.click();
      setTimeout(() => {
        if (MH.motion.enabled && !MH.motion.seenEvent) {
          MH.toast("TILT ON · LEAN LEFT OR RIGHT TO MOVE");
        } else if (MH.motion.enabled) {
          MH.toast("TILT ON · LEAN LEFT OR RIGHT TO MOVE");
        }
      }, 450);
      return true;
    } catch (_) {
      MH.toast("MOTION PERMISSION BLOCKED · USE TOUCH");
      return false;
    }
  };

  // ---------------------------------------------------------------------------
  // Initial HUD state
  // ---------------------------------------------------------------------------

  MH.DOM.bestTitle.textContent = `BEST ${MH.formatScore(MH.bestScore)}`;
  MH.DOM.soundBtn.classList.toggle("muted", MH.sound.muted);
  MH.DOM.soundBtn.setAttribute("aria-pressed", String(MH.sound.muted));
  MH.DOM.soundBtn.setAttribute("aria-label", MH.sound.muted ? "Unmute sound" : "Mute sound");
  MH.DOM.soundGlyph.textContent = MH.sound.muted ? "×" : "♪";
  MH.DOM.titleSoundBtn.textContent = `SOUND: ${MH.sound.muted ? "OFF" : "ON"}`;

  document.addEventListener("visibilitychange", () => {
    if (document.hidden && MH.game) MH.game.autoPause();
  });
})();
