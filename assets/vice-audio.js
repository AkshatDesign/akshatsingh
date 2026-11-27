/* ==========================================================================
   VICE CITY 3D — NEXT-GEN REALISTIC AUDIO ENGINE (REBUILT FROM SCRATCH)
   - Multi-Cylinder V8/V12 Supercar Synth (3 Harmonics + Tube Saturation + Intake
     Resonance + Automatic 6-Speed Gear Shift Drops + Decel Exhaust Crackle)
   - Dedicated High-Revving 4-Stroke Sportbike (PCJ-600 / Faggio) Engine Mode
   - Mount Chiliad Altitude Howling Mountain Wind & High-Speed Aerodynamic Rush
   - Dual-Resonant Tire Screech, Layered Realistic Gunshots + Brass Casing Clinks,
     Sub-Bass Vehicle Explosions, Realistic Horn, Siren & Lush 1986 FM Radio
   ========================================================================== */
export const RADIO_STATIONS = [
  { id: 'wave',    name: 'Wave 103',     freq: '103.0', genre: 'New Wave · Synth',  bpm: 102, col: '#21E6D1' },
  { id: 'emotion', name: 'Emotion 98.3', freq: '98.3',  genre: '80s Power Ballads', bpm: 76,  col: '#FF85BD' },
  { id: 'fever',   name: 'Fever 105',    freq: '105.0', genre: 'Miami Funk · Disco',bpm: 116, col: '#FFD36B' },
  { id: 'flash',   name: 'Flash FM',     freq: '90.3',  genre: '80s Synthpop',      bpm: 124, col: '#FF2E88' },
  { id: 'vrock',   name: 'V-Rock',       freq: '94.8',  genre: '80s Arena Rock',    bpm: 138, col: '#FF7B2E' }
];

export const RADIO_RJ_CLIPS = [
  { id: 'intro',  host: 'Special Broadcast · Akshat', short: 'ON AIR · SPECIAL RJ',      src: '/assets/aistudio/Intro-RJ_902dec53.mp3' },
  { id: 'radio1', host: 'Tommy "The Hair" Valentino', short: 'ON AIR · TOMMY VALENTINO', src: '/assets/aistudio/Radio-1_d9abebea.mp3' },
  { id: 'radio3', host: 'Arthur Pendleton',           short: 'ON AIR · ARTHUR PENDLETON',src: '/assets/aistudio/radio-3_4cd654ef.mp3' },
  { id: 'radio4', host: 'Mad Dog Miller',             short: 'ON AIR · MAD DOG MILLER',  src: '/assets/aistudio/radio-4_8caf3f4c.mp3' },
  { id: 'radio5', host: 'J. Jonah Jameson',           short: 'ON AIR · J. JONAH JAMESON',src: '/assets/aistudio/radio-5_85ff9f43.mp3' }
];

export const AMBIENT_ZONE_TRACKS = {
  forest:   { src: '/assets/aistudio/freesound_community-bush-bird-noises-61883_89d7d571.mp3', maxVol: 0.62 },
  carnival: { src: '/assets/aistudio/capaholiczsfx-carnival-atmosphere-402695_78236de9.mp3', maxVol: 0.56 },
  malibu:   { src: '/assets/aistudio/freesound_community-club-bar-talking-yelling-band-warming-up-rock-guitar-05-25995_1a8119a9.mp3', maxVol: 0.66 },
  airport:  { src: '/assets/aistudio/freesound_community-airport-ambiance-1-34146_cde61f1c.mp3', maxVol: 0.60 },
  mall:     { src: '/assets/aistudio/mall_f2f11b84.mp3', maxVol: 0.62 }
};

export const PLANE_AUDIO_TRACKS = {
  preTakeoff: {
    src: '/assets/aistudio/freesound_community-180221-airplane-pre-take-off-announcement-small-plane-pineapple-air-bahamas-26095_8bc836bd.mp3',
    maxVol: 0.76
  },
  flightBg: {
    src: '/assets/aistudio/freesound_community-plane-takeoff-22499_8021059c.mp3',
    maxVol: 0.68
  }
};

const STATION_PATTERNS = {
  wave: {
    bass:  [49, 49, 98, 49, 55, 55, 110, 55, 65.41, 65.41, 130.81, 65.41, 58.27, 58.27, 116.54, 58.27],
    lead:  [392, 0, 493.88, 587.33, 0, 440, 523.25, 0, 659.25, 0, 587.33, 523.25, 466.16, 0, 392, 0],
    chord: [196, 246.94, 293.66],
    leadWave: 'triangle', bassWave: 'sawtooth'
  },
  emotion: {
    bass:  [43.65, 0, 0, 87.31, 0, 0, 49, 0, 65.41, 0, 0, 130.81, 0, 0, 55, 0],
    lead:  [349.23, 0, 440, 523.25, 0, 493.88, 0, 440, 392, 0, 493.88, 587.33, 0, 523.25, 440, 0],
    chord: [174.61, 220, 261.63],
    leadWave: 'sine', bassWave: 'triangle'
  },
  fever: {
    bass:  [65.41, 0, 130.81, 73.42, 0, 82.41, 98, 0, 73.42, 0, 146.83, 82.41, 98, 0, 110, 98],
    lead:  [523.25, 659.25, 0, 783.99, 0, 659.25, 587.33, 523.25, 587.33, 0, 659.25, 0, 783.99, 880, 783.99, 0],
    chord: [261.63, 329.63, 392, 466.16],
    leadWave: 'square', bassWave: 'triangle'
  },
  flash: {
    bass:  [55, 55, 110, 55, 65.41, 65.41, 130.81, 65.41, 73.42, 73.42, 146.83, 73.42, 65.41, 65.41, 98, 82.41],
    lead:  [440, 0, 523.25, 0, 659.25, 587.33, 523.25, 0, 587.33, 0, 659.25, 783.99, 659.25, 0, 523.25, 493.88],
    chord: [220, 261.63, 329.63],
    leadWave: 'sawtooth', bassWave: 'sawtooth'
  },
  vrock: {
    bass:  [82.41, 82.41, 82.41, 98, 82.41, 82.41, 110, 98, 73.42, 73.42, 73.42, 82.41, 65.41, 65.41, 73.42, 98],
    lead:  [329.63, 329.63, 0, 392, 440, 0, 392, 329.63, 293.66, 293.66, 0, 329.63, 261.63, 293.66, 329.63, 0],
    chord: [164.81, 246.94, 329.63],
    leadWave: 'sawtooth', bassWave: 'square'
  }
};

function makeWarmSaturationCurve(drive = 2.4) {
  const n = 1024;
  const curve = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const x = (i * 2) / n - 1;
    curve[i] = Math.tanh(x * drive) / Math.tanh(drive);
  }
  return curve;
}

export class ViceAudioEngine {
  constructor() {
    this.ctx = null;
    this.enabled = false;
    this.master = null;
    this.compressor = null;
    this.noiseBuf = null;

    // Multi-harmonic engine graph
    this.engineGain = null;
    this.engineFilter = null;
    this.engineShaper = null;
    this.oscSub = null;
    this.oscMain = null;
    this.oscHarm = null;
    this.oscWhine = null;
    this.whineGain = null;

    // Surface & atmosphere buses
    this.driftGain = null;
    this.driftBpA = null;
    this.driftBpB = null;
    this.windGain = null;
    this.windFilter = null;
    this.rainGain = null;
    this.surfGain = null;
    this.cityGain = null;
    this.heliGain = null;
    this.heliLfo = null;
    this.radioGain = null;
    this.radioBus = null;

    // Engine state for realistic shifts & exhaust backfire
    this.prevSpeedNorm = 0;
    this.prevGear = 1;
    this.lastPopAt = 0;

    // 1986 FM Radio & Random RJ Talk Broadcast state (STRICTLY IN-CAR ONLY)
    this.radioIdx = 0;
    this.radioPower = true;
    this.radioVolume = 60;
    this.radioInCar = false;
    this.radioStep = 0;
    this.radioTimer = null;
    this.rjAudio = null;
    this.rjActive = false;
    this.rjPausedByExit = false;
    this.rjNeedsUnlock = false;
    this.rjClip = null;
    this.rjTimer = null;
    this.rjDeadline = 0;
    this.rjRemainingMs = null;
    this.rjBag = [];
    this.rjLastId = null;
    this.onRadioChange = null;

    // Looping Location-Aware Background Ambience (Forest/Mountains, Carnival Pier, Malibu Club, Airport, North Point Mall)
    this.ambientZones = {};
    for (const key of Object.keys(AMBIENT_ZONE_TRACKS)) {
      const cfg = AMBIENT_ZONE_TRACKS[key];
      this.ambientZones[key] = {
        src: cfg.src,
        maxVol: cfg.maxVol,
        audio: null,
        vol: 0,
        target: 0,
        pendingPlay: false,
        needsUnlock: false
      };
    }

    // Two-Stage In-Plane Audio: Pre-Take-Off Announcement -> Plane Take-Off / Flight Background Loop
    this.planeAudio = {
      active: false,
      phase: 'off', // 'off' | 'pre' | 'flight'
      pre: {
        src: PLANE_AUDIO_TRACKS.preTakeoff.src,
        maxVol: PLANE_AUDIO_TRACKS.preTakeoff.maxVol,
        audio: null,
        vol: 0,
        pendingPlay: false,
        needsUnlock: false
      },
      flight: {
        src: PLANE_AUDIO_TRACKS.flightBg.src,
        maxVol: PLANE_AUDIO_TRACKS.flightBg.maxVol,
        audio: null,
        vol: 0,
        pendingPlay: false,
        needsUnlock: false
      }
    };
  }

  init() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') {
        try { this.ctx.resume().catch(() => {}); } catch (_) {}
      }
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const preUnlocked = (typeof window !== 'undefined' && window.__VICE_UNLOCKED_AC__ && window.__VICE_UNLOCKED_AC__.state !== 'closed')
      ? window.__VICE_UNLOCKED_AC__
      : null;
    this.ctx = preUnlocked || new AC();
    if (this.ctx.state === 'suspended') {
      try { this.ctx.resume().catch(() => {}); } catch (_) {}
    }

    // Master dynamics compressor prevents clipping during explosions + V12 rev + FM Radio
    this.compressor = this.ctx.createDynamicsCompressor();
    this.compressor.threshold.value = -14;
    this.compressor.knee.value = 18;
    this.compressor.ratio.value = 6;
    this.compressor.attack.value = 0.004;
    this.compressor.release.value = 0.16;

    const master = this.ctx.createGain();
    master.gain.value = 0.30;
    master.connect(this.compressor);
    this.compressor.connect(this.ctx.destination);
    this.master = master;

    // Shared 2.5s high-density pink-weighted noise buffer for organic rumble, wind, guns & surf
    const len = Math.floor(this.ctx.sampleRate * 2.5);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    this.noiseBuf = buf;

    // 1. MULTI-CYLINDER V8/V12 & 4-STROKE BIKE ENGINE SYNTH
    const engineMix = this.ctx.createGain();
    engineMix.gain.value = 0.82;

    this.engineShaper = this.ctx.createWaveShaper();
    this.engineShaper.curve = makeWarmSaturationCurve(2.6);
    this.engineShaper.oversample = '2x';

    this.engineFilter = this.ctx.createBiquadFilter();
    this.engineFilter.type = 'lowpass';
    this.engineFilter.frequency.value = 260;
    this.engineFilter.Q.value = 3.1;

    this.engineGain = this.ctx.createGain();
    this.engineGain.gain.value = 0.0;

    engineMix.connect(this.engineShaper);
    this.engineShaper.connect(this.engineFilter);
    this.engineFilter.connect(this.engineGain);
    this.engineGain.connect(master);

    // Sub-crank rumble (fundamental firing pulse)
    this.oscSub = this.ctx.createOscillator();
    this.oscSub.type = 'triangle';
    this.oscSub.frequency.value = 36;
    const subG = this.ctx.createGain();
    subG.gain.value = 0.62;
    this.oscSub.connect(subG); subG.connect(engineMix);
    this.oscSub.start();

    // Main cylinder bank growl
    this.oscMain = this.ctx.createOscillator();
    this.oscMain.type = 'sawtooth';
    this.oscMain.frequency.value = 72;
    const mainG = this.ctx.createGain();
    mainG.gain.value = 0.48;
    this.oscMain.connect(mainG); mainG.connect(engineMix);
    this.oscMain.start();

    // Detuned V-bank harmonic (1.5x fifth + slight analog drift for true Italian V12/V8 texture!)
    this.oscHarm = this.ctx.createOscillator();
    this.oscHarm.type = 'sawtooth';
    this.oscHarm.frequency.value = 108.4;
    const harmG = this.ctx.createGain();
    harmG.gain.value = 0.28;
    this.oscHarm.connect(harmG); harmG.connect(engineMix);
    this.oscHarm.start();

    // Supercharger / high-rev intake scream (prominent on Nitro & PCJ-600 sportbike)
    this.oscWhine = this.ctx.createOscillator();
    this.oscWhine.type = 'sine';
    this.oscWhine.frequency.value = 240;
    this.whineGain = this.ctx.createGain();
    this.whineGain.gain.value = 0.0;
    this.oscWhine.connect(this.whineGain);
    this.whineGain.connect(this.engineGain);
    this.oscWhine.start();

    // 2. DUAL-RESONANT RUBBER TIRE SCREECH
    const driftNoise = this.ctx.createBufferSource();
    driftNoise.buffer = buf;
    driftNoise.loop = true;

    this.driftBpA = this.ctx.createBiquadFilter();
    this.driftBpA.type = 'bandpass';
    this.driftBpA.frequency.value = 1180;
    this.driftBpA.Q.value = 5.5;

    this.driftBpB = this.ctx.createBiquadFilter();
    this.driftBpB.type = 'bandpass';
    this.driftBpB.frequency.value = 2360;
    this.driftBpB.Q.value = 6.2;

    this.driftGain = this.ctx.createGain();
    this.driftGain.gain.value = 0;

    driftNoise.connect(this.driftBpA);
    driftNoise.connect(this.driftBpB);
    this.driftBpA.connect(this.driftGain);
    this.driftBpB.connect(this.driftGain);
    this.driftGain.connect(master);
    driftNoise.start();

    // 3. ALTITUDE MOUNTAIN WIND & HIGH-SPEED AERODYNAMIC RUSH (Mount Chiliad Summit Feel!)
    const windNoise = this.ctx.createBufferSource();
    windNoise.buffer = buf;
    windNoise.loop = true;
    this.windFilter = this.ctx.createBiquadFilter();
    this.windFilter.type = 'bandpass';
    this.windFilter.frequency.value = 340;
    this.windFilter.Q.value = 2.6;
    this.windGain = this.ctx.createGain();
    this.windGain.gain.value = 0;
    windNoise.connect(this.windFilter);
    this.windFilter.connect(this.windGain);
    this.windGain.connect(master);
    windNoise.start();

    // 4. TROPICAL RAIN AMBIENCE
    const rainNoise = this.ctx.createBufferSource();
    rainNoise.buffer = buf;
    rainNoise.loop = true;
    const rainLP = this.ctx.createBiquadFilter();
    rainLP.type = 'bandpass';
    rainLP.frequency.value = 1850;
    rainLP.Q.value = 0.58;
    this.rainGain = this.ctx.createGain();
    this.rainGain.gain.value = 0;
    rainNoise.connect(rainLP);
    rainLP.connect(this.rainGain);
    this.rainGain.connect(master);
    rainNoise.start();

    // 5. WARM 1986 STEREO FM RADIO BUS
    const radioLP = this.ctx.createBiquadFilter();
    radioLP.type = 'lowpass';
    radioLP.frequency.value = 4600;
    const radioShelf = this.ctx.createBiquadFilter();
    radioShelf.type = 'lowshelf';
    radioShelf.frequency.value = 140;
    radioShelf.gain.value = 3.5;
    this.radioGain = this.ctx.createGain();
    this.radioGain.gain.value = 0.34;
    radioLP.connect(radioShelf);
    radioShelf.connect(this.radioGain);
    this.radioGain.connect(master);
    this.radioBus = radioLP;

    // 6. OCEAN WAVES SURF BED (LFO-modulated Atlantic surf near beaches, piers & boats)
    const surfNoise = this.ctx.createBufferSource();
    surfNoise.buffer = buf;
    surfNoise.loop = true;
    const surfLP = this.ctx.createBiquadFilter();
    surfLP.type = 'lowpass';
    surfLP.frequency.value = 520;
    const surfLfo = this.ctx.createOscillator();
    surfLfo.type = 'sine';
    surfLfo.frequency.value = 0.14;
    const surfLfoGain = this.ctx.createGain();
    surfLfoGain.gain.value = 210;
    surfLfo.connect(surfLfoGain);
    surfLfoGain.connect(surfLP.frequency);
    this.surfGain = this.ctx.createGain();
    this.surfGain.gain.value = 0;
    surfNoise.connect(surfLP);
    surfLP.connect(this.surfGain);
    this.surfGain.connect(master);
    surfNoise.start();
    surfLfo.start();

    // 7. DOWNTOWN CITY AMBIENT BED (Soft distant urban street hum)
    const cityNoise = this.ctx.createBufferSource();
    cityNoise.buffer = buf;
    cityNoise.loop = true;
    const cityLP = this.ctx.createBiquadFilter();
    cityLP.type = 'bandpass';
    cityLP.frequency.value = 185;
    cityLP.Q.value = 0.7;
    this.cityGain = this.ctx.createGain();
    this.cityGain.gain.value = 0;
    cityNoise.connect(cityLP);
    cityLP.connect(this.cityGain);
    this.cityGain.connect(master);
    cityNoise.start();

    // 8. HELICOPTER ROTOR BLADE SLAP SYNTH
    const heliNoise = this.ctx.createBufferSource();
    heliNoise.buffer = buf;
    heliNoise.loop = true;
    const heliLP = this.ctx.createBiquadFilter();
    heliLP.type = 'lowpass';
    heliLP.frequency.value = 260;
    const heliMod = this.ctx.createGain();
    heliMod.gain.value = 0.55;
    this.heliLfo = this.ctx.createOscillator();
    this.heliLfo.type = 'sine';
    this.heliLfo.frequency.value = 13.5;
    const heliLfoAmp = this.ctx.createGain();
    heliLfoAmp.gain.value = 0.45;
    this.heliLfo.connect(heliLfoAmp);
    heliLfoAmp.connect(heliMod.gain);
    this.heliGain = this.ctx.createGain();
    this.heliGain.gain.value = 0;
    heliNoise.connect(heliLP);
    heliLP.connect(heliMod);
    heliMod.connect(this.heliGain);
    this.heliGain.connect(master);
    heliNoise.start();
    this.heliLfo.start();
  }

  canPlayRadio() {
    return Boolean(this.enabled && this.radioPower && this.radioInCar);
  }

  notifyRadioChange() {
    if (typeof this.onRadioChange === 'function') {
      try { this.onRadioChange(); } catch (_) {}
    }
  }

  getActiveRJ() {
    return this.canPlayRadio() && this.rjActive && !this.rjPausedByExit && this.rjClip ? this.rjClip : null;
  }

  setEnabled(flag) {
    this.enabled = Boolean(flag);
    if (this.enabled) {
      this.init();
      if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
      this.resumeRadioInPlace();
      this.resumeUnlockedAmbient();
    } else {
      this.stopRadioLoop();
      this.stopRJ(false);
      this.pauseAllAmbientZones();
      if (this.ctx) {
        const now = this.ctx.currentTime;
        if (this.engineGain) this.engineGain.gain.setTargetAtTime(0, now, 0.08);
        if (this.driftGain)  this.driftGain.gain.setTargetAtTime(0, now, 0.05);
        if (this.windGain)   this.windGain.gain.setTargetAtTime(0, now, 0.12);
        if (this.rainGain)   this.rainGain.gain.setTargetAtTime(0, now, 0.08);
        if (this.surfGain)   this.surfGain.gain.setTargetAtTime(0, now, 0.10);
        if (this.cityGain)   this.cityGain.gain.setTargetAtTime(0, now, 0.10);
        if (this.heliGain)   this.heliGain.gain.setTargetAtTime(0, now, 0.08);
        if (this.radioGain)  this.radioGain.gain.setTargetAtTime(0, now, 0.05);
      }
    }
    this.notifyRadioChange();
  }

  ensureAmbientAudio(key) {
    const z = this.ambientZones[key];
    if (!z) return null;
    if (!z.audio) {
      const el = new Audio(z.src);
      el.loop = true;
      el.preload = 'auto';
      el.volume = 0;
      z.audio = el;
    }
    return z.audio;
  }

  pauseAllAmbientZones() {
    for (const key of Object.keys(this.ambientZones)) {
      const z = this.ambientZones[key];
      z.vol = 0;
      z.target = 0;
      z.pendingPlay = false;
      z.needsUnlock = false;
      if (z.audio) {
        try {
          z.audio.volume = 0;
          z.audio.pause();
        } catch (_) {}
      }
    }
    this.pausePlaneAudioInPlace();
  }

  ensurePlaneAudio(which) {
    const slot = this.planeAudio && this.planeAudio[which];
    if (!slot) return null;
    if (!slot.audio) {
      const el = new Audio(slot.src);
      el.loop = which === 'flight';
      el.preload = 'auto';
      el.volume = 0;
      if (which === 'pre') {
        const onPreFinished = () => {
          if (!this.planeAudio.active || this.planeAudio.phase !== 'pre') return;
          this.planeAudio.phase = 'flight';
          slot.vol = 0;
          try { el.volume = 0; el.pause(); } catch (_) {}
          this._playPlaneSlot('flight', true);
        };
        el.onended = onPreFinished;
        el.onerror = onPreFinished;
      }
      slot.audio = el;
    }
    return slot.audio;
  }

  _playPlaneSlot(which, resetTime = false) {
    const slot = this.planeAudio && this.planeAudio[which];
    if (!slot || !this.enabled) return;
    const el = this.ensurePlaneAudio(which);
    if (!el) return;
    if (resetTime) {
      try { el.currentTime = 0; } catch (_) {}
    }
    slot.needsUnlock = false;
    slot.vol = Math.max(slot.vol, slot.maxVol * 0.65);
    try { el.volume = Math.max(0, Math.min(1, slot.vol)); } catch (_) {}
    if (!el.paused || slot.pendingPlay) return;
    slot.pendingPlay = true;
    try {
      const p = el.play();
      if (p && typeof p.then === 'function') {
        p.then(() => { slot.pendingPlay = false; }).catch(() => { slot.pendingPlay = false; slot.needsUnlock = true; });
      } else {
        slot.pendingPlay = false;
      }
    } catch (_) {
      slot.pendingPlay = false;
      slot.needsUnlock = true;
    }
  }

  startPlaneSequence() {
    this.stopPlaneSequence();
    this.planeAudio.active = true;
    this.planeAudio.phase = 'pre';
    // Preload both tracks so the handoff from pre-take-off announcement to plane flight BG is seamless
    this.ensurePlaneAudio('pre');
    this.ensurePlaneAudio('flight');
    if (this.enabled) {
      this._playPlaneSlot('pre', true);
    }
  }

  pausePlaneAudioInPlace() {
    if (!this.planeAudio) return;
    for (const which of ['pre', 'flight']) {
      const slot = this.planeAudio[which];
      if (!slot) continue;
      slot.vol = 0;
      slot.pendingPlay = false;
      slot.needsUnlock = false;
      if (slot.audio) {
        try {
          slot.audio.volume = 0;
          slot.audio.pause();
        } catch (_) {}
      }
    }
  }

  stopPlaneSequence() {
    if (!this.planeAudio) return;
    this.planeAudio.active = false;
    this.planeAudio.phase = 'off';
    for (const which of ['pre', 'flight']) {
      const slot = this.planeAudio[which];
      if (!slot) continue;
      slot.vol = 0;
      slot.pendingPlay = false;
      slot.needsUnlock = false;
      if (slot.audio) {
        try {
          slot.audio.volume = 0;
          slot.audio.pause();
          slot.audio.currentTime = 0;
        } catch (_) {}
      }
    }
  }

  updatePlaneAudio(inPlane, dt = 0.05) {
    if (!inPlane) {
      if (this.planeAudio.active || this.planeAudio.phase !== 'off') {
        this.stopPlaneSequence();
      }
      return;
    }
    if (!this.planeAudio.active) {
      this.startPlaneSequence();
    }
    if (!this.enabled) {
      this.pausePlaneAudioInPlace();
      return;
    }

    const smooth = 1 - Math.exp(-Math.min(0.25, Math.max(0.005, dt)) * 4.2);
    const pre = this.planeAudio.pre;
    const flt = this.planeAudio.flight;

    if (this.planeAudio.phase === 'pre') {
      const preEl = this.ensurePlaneAudio('pre');
      if (preEl && preEl.ended) {
        this.planeAudio.phase = 'flight';
        pre.vol = 0;
        try { preEl.volume = 0; preEl.pause(); } catch (_) {}
        this._playPlaneSlot('flight', true);
      } else if (preEl) {
        pre.vol += (pre.maxVol - pre.vol) * smooth;
        try { preEl.volume = Math.max(0, Math.min(1, pre.vol)); } catch (_) {}
        if (preEl.paused && !pre.pendingPlay && !pre.needsUnlock) {
          this._playPlaneSlot('pre', false);
        }
      }
      if (flt.audio && !flt.audio.paused) {
        flt.vol = 0;
        try { flt.audio.volume = 0; flt.audio.pause(); } catch (_) {}
      }
    } else if (this.planeAudio.phase === 'flight') {
      if (pre.audio && !pre.audio.paused) {
        pre.vol = 0;
        try { pre.audio.volume = 0; pre.audio.pause(); } catch (_) {}
      }
      const fltEl = this.ensurePlaneAudio('flight');
      if (fltEl) {
        flt.vol += (flt.maxVol - flt.vol) * smooth;
        try { fltEl.volume = Math.max(0, Math.min(1, flt.vol)); } catch (_) {}
        if (fltEl.paused && !flt.pendingPlay && !flt.needsUnlock) {
          this._playPlaneSlot('flight', false);
        }
      }
    }
  }

  resumeUnlockedAmbient() {
    if (!this.enabled) return;
    if (this.ctx && this.ctx.state === 'suspended') {
      try { this.ctx.resume(); } catch (_) {}
    }
    for (const key of Object.keys(this.ambientZones)) {
      const z = this.ambientZones[key];
      if ((z.needsUnlock || z.vol > 0.008) && z.audio && z.audio.paused && !z.pendingPlay) {
        z.needsUnlock = false;
        z.pendingPlay = true;
        try {
          const p = z.audio.play();
          if (p && typeof p.then === 'function') {
            p.then(() => { z.pendingPlay = false; }).catch(() => { z.pendingPlay = false; z.needsUnlock = true; });
          } else {
            z.pendingPlay = false;
          }
        } catch (_) {
          z.pendingPlay = false;
          z.needsUnlock = true;
        }
      }
    }
    if (this.canPlayRadio() && this.rjActive && this.rjAudio && (this.rjNeedsUnlock || (this.rjAudio.paused && !this.rjPausedByExit))) {
      this.rjNeedsUnlock = false;
      this.rjAudio.volume = Math.max(0, Math.min(1, (this.radioVolume / 100) * 0.92));
      try {
        const p = this.rjAudio.play();
        if (p && typeof p.catch === 'function') {
          p.catch(() => { this.rjNeedsUnlock = true; });
        }
      } catch (_) {
        this.rjNeedsUnlock = true;
      }
      this.notifyRadioChange();
    }
    if (this.planeAudio && this.planeAudio.active) {
      const activeWhich = this.planeAudio.phase === 'pre' ? 'pre' : (this.planeAudio.phase === 'flight' ? 'flight' : null);
      if (activeWhich) {
        const slot = this.planeAudio[activeWhich];
        if (slot && (slot.needsUnlock || !slot.audio || slot.audio.paused) && !slot.pendingPlay) {
          this._playPlaneSlot(activeWhich, false);
        }
      }
    }
  }

  setAmbientZones(weights, dt = 0.05) {
    const smooth = 1 - Math.exp(-Math.min(0.25, Math.max(0.005, dt)) * 3.0);
    const duck = this.canPlayRadio() ? 0.56 : 1.0;
    for (const key of Object.keys(this.ambientZones)) {
      const z = this.ambientZones[key];
      const w = (this.enabled && weights && weights[key] > 0) ? Math.min(1, weights[key]) : 0;
      z.target = w * z.maxVol * duck;
      z.vol += (z.target - z.vol) * smooth;
      if (z.vol < 0.005 && z.target <= 0.001) {
        z.vol = 0;
        if (z.audio && !z.audio.paused) {
          try {
            z.audio.volume = 0;
            z.audio.pause();
          } catch (_) {}
        }
        continue;
      }
      if (!this.enabled) continue;
      const el = this.ensureAmbientAudio(key);
      if (!el) continue;
      try { el.volume = Math.max(0, Math.min(1, z.vol)); } catch (_) {}
      if (el.paused && !z.pendingPlay && !z.needsUnlock && z.vol > 0.008) {
        z.pendingPlay = true;
        try {
          const p = el.play();
          if (p && typeof p.then === 'function') {
            p.then(() => { z.pendingPlay = false; }).catch(() => { z.pendingPlay = false; z.needsUnlock = true; });
          } else {
            z.pendingPlay = false;
          }
        } catch (_) {
          z.pendingPlay = false;
          z.needsUnlock = true;
        }
      }
    }
  }

  getAmbientLevels() {
    const out = {};
    for (const key of Object.keys(this.ambientZones)) {
      const z = this.ambientZones[key];
      out[key] = {
        vol: Number(z.vol.toFixed(3)),
        target: Number(z.target.toFixed(3)),
        playing: Boolean(z.audio && !z.audio.paused),
        src: z.src
      };
    }
    out.plane = {
      active: Boolean(this.planeAudio && this.planeAudio.active),
      phase: this.planeAudio ? this.planeAudio.phase : 'off',
      prePlaying: Boolean(this.planeAudio && this.planeAudio.pre.audio && !this.planeAudio.pre.audio.paused),
      flightPlaying: Boolean(this.planeAudio && this.planeAudio.flight.audio && !this.planeAudio.flight.audio.paused)
    };
    return out;
  }

  setRainLevel(level) {
    if (!this.rainGain || !this.ctx) return;
    const target = this.enabled ? Math.min(0.24, level * 0.20) : 0;
    this.rainGain.gain.setTargetAtTime(target, this.ctx.currentTime, 0.25);
  }

  updateRadioGain() {
    const active = this.canPlayRadio();
    if (this.rjAudio) {
      if (!active) {
        try { this.rjAudio.pause(); } catch (_) {}
      } else {
        this.rjAudio.volume = Math.max(0, Math.min(1, (this.radioVolume / 100) * 0.92));
      }
    }
    if (!this.radioGain || !this.ctx) return;
    const musicVol = (active && !this.rjActive) ? (this.radioVolume / 100) * 0.54 : 0.0;
    this.radioGain.gain.setTargetAtTime(musicVol, this.ctx.currentTime, active ? 0.10 : 0.04);
  }

  pauseRadioInPlace() {
    // Pause music sequencer step & RJ audio at exact currentTime so re-entering resumes right where it left off
    this.stopRadioLoop();
    this.rjNeedsUnlock = false;
    if (this.rjActive && this.rjAudio) {
      try { this.rjAudio.pause(); } catch (_) {}
      this.rjPausedByExit = true;
    } else if (this.rjTimer) {
      this.rjRemainingMs = Math.max(800, this.rjDeadline - Date.now());
      this.clearRJTimer();
    }
    this.updateRadioGain();
  }

  resumeRadioInPlace() {
    this.updateRadioGain();
    if (!this.canPlayRadio()) {
      this.stopRadioLoop();
      return;
    }
    if (!this.radioTimer) this.startRadioLoop();
    if (this.rjActive && this.rjAudio && (this.rjPausedByExit || this.rjNeedsUnlock)) {
      this.rjPausedByExit = false;
      this.rjNeedsUnlock = false;
      this.rjAudio.volume = Math.max(0, Math.min(1, (this.radioVolume / 100) * 0.92));
      try {
        const p = this.rjAudio.play();
        if (p && typeof p.catch === 'function') {
          p.catch(() => { this.rjNeedsUnlock = true; });
        }
      } catch (_) {
        this.rjNeedsUnlock = true;
      }
    } else if (!this.rjActive && !this.rjTimer) {
      const rem = this.rjRemainingMs;
      this.rjRemainingMs = null;
      this.scheduleNextRJ(true, rem);
    }
  }

  setRadioInCar(inCar) {
    const next = Boolean(inCar);
    const changed = this.radioInCar !== next;
    this.radioInCar = next;
    if (!next) {
      // Strictly ZERO radio music and ZERO RJ voice outside a car, preserving playback position for re-entry
      this.pauseRadioInPlace();
      if (changed) this.notifyRadioChange();
      return;
    }
    this.resumeRadioInPlace();
    if (changed) this.notifyRadioChange();
  }

  setRadioPower(on) {
    this.radioPower = !!on;
    if (this.canPlayRadio()) {
      this.resumeRadioInPlace();
    } else {
      this.pauseRadioInPlace();
    }
    this.notifyRadioChange();
  }

  setRadioVolume(vol) {
    this.radioVolume = Math.max(0, Math.min(100, Math.round(vol)));
    this.updateRadioGain();
  }

  setRadioStation(idx) {
    if (!this.radioInCar) return RADIO_STATIONS[this.radioIdx];
    this.radioIdx = ((idx % RADIO_STATIONS.length) + RADIO_STATIONS.length) % RADIO_STATIONS.length;
    this.radioPower = true;
    this.radioStep = 0;
    this.stopRJ(false);
    this.radioStatic();
    this.updateRadioGain();
    if (this.canPlayRadio()) {
      this.startRadioLoop();
      this.scheduleNextRJ(true);
    }
    this.notifyRadioChange();
    return RADIO_STATIONS[this.radioIdx];
  }

  getRadioStation() {
    return RADIO_STATIONS[this.radioIdx];
  }

  clearRJTimer() {
    if (this.rjTimer) {
      window.clearTimeout(this.rjTimer);
      this.rjTimer = null;
    }
    this.rjDeadline = 0;
  }

  pickRandomRJClip(explicitIdx = null) {
    if (typeof explicitIdx === 'number' && RADIO_RJ_CLIPS[explicitIdx]) {
      this.rjLastId = RADIO_RJ_CLIPS[explicitIdx].id;
      return RADIO_RJ_CLIPS[explicitIdx];
    }
    if (this.rjBag.length === 0) {
      this.rjBag = [...RADIO_RJ_CLIPS];
      for (let i = this.rjBag.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const tmp = this.rjBag[i];
        this.rjBag[i] = this.rjBag[j];
        this.rjBag[j] = tmp;
      }
      // Avoid immediate back-to-back repeat across bag refills
      if (this.rjBag.length > 1 && this.rjBag[this.rjBag.length - 1].id === this.rjLastId) {
        const first = this.rjBag.shift();
        this.rjBag.push(first);
      }
    }
    const picked = this.rjBag.pop();
    this.rjLastId = picked ? picked.id : null;
    return picked;
  }

  scheduleNextRJ(isFreshStation = false, explicitDelayMs = null) {
    this.clearRJTimer();
    if (!this.canPlayRadio() || this.rjActive) return;
    // Play station music for a random window, then cut in a random RJ talk break
    const minMs = isFreshStation ? 8500 : 12500;
    const maxMs = isFreshStation ? 15500 : 22000;
    const delayMs = (typeof explicitDelayMs === 'number' && explicitDelayMs > 0)
      ? Math.round(explicitDelayMs)
      : Math.round(minMs + Math.random() * (maxMs - minMs));
    this.rjDeadline = Date.now() + delayMs;
    this.rjTimer = window.setTimeout(() => {
      this.rjTimer = null;
      this.rjDeadline = 0;
      if (!this.canPlayRadio() || this.rjActive) return;
      this.triggerRandomRJ();
    }, delayMs);
  }

  stopRJ(notify = true) {
    this.clearRJTimer();
    this.rjRemainingMs = null;
    this.rjPausedByExit = false;
    this.rjNeedsUnlock = false;
    const hadRJ = this.rjActive || Boolean(this.rjAudio);
    if (this.rjAudio) {
      try {
        this.rjAudio.onended = null;
        this.rjAudio.onerror = null;
        this.rjAudio.pause();
        this.rjAudio.currentTime = 0;
      } catch (_) {}
      this.rjAudio = null;
    }
    this.rjActive = false;
    this.rjClip = null;
    if (hadRJ) {
      this.updateRadioGain();
      if (notify) this.notifyRadioChange();
    }
  }

  playSpecialIntroRJ() {
    this.radioInCar = true;
    this.radioPower = true;
    if (!this.enabled) return null;
    this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      try { this.ctx.resume(); } catch (_) {}
    }
    const introIdx = RADIO_RJ_CLIPS.findIndex((c) => c.id === 'intro');
    const prewarmed = (typeof window !== 'undefined' && window.__VICE_INTRO_RJ_AUDIO__) ? window.__VICE_INTRO_RJ_AUDIO__ : null;
    if (prewarmed && typeof window !== 'undefined') {
      prewarmed.__claimed = true;
      window.__VICE_INTRO_RJ_AUDIO__ = null;
    }
    const clip = this.triggerRandomRJ(introIdx >= 0 ? introIdx : 0, prewarmed);
    if (!this.radioTimer) this.startRadioLoop();
    return clip;
  }

  triggerRandomRJ(explicitIdx = null, existingAudioEl = null) {
    if (!this.canPlayRadio()) return null;
    this.stopRJ(false);
    const clip = this.pickRandomRJClip(explicitIdx);
    if (!clip) return null;

    let audioEl = null;
    if (existingAudioEl && typeof existingAudioEl.play === 'function') {
      audioEl = existingAudioEl;
      if (audioEl.paused) {
        try { audioEl.currentTime = 0; } catch (_) {}
      }
    } else {
      audioEl = new Audio(clip.src);
      audioEl.preload = 'auto';
    }
    audioEl.volume = Math.max(0, Math.min(1, (this.radioVolume / 100) * 0.92));
    this.rjAudio = audioEl;
    this.rjClip = clip;
    this.rjActive = true;
    this.rjNeedsUnlock = false;
    this.updateRadioGain();
    this.notifyRadioChange();

    const finishBreak = () => {
      if (this.rjAudio !== audioEl) return;
      this.rjAudio = null;
      this.rjActive = false;
      this.rjNeedsUnlock = false;
      this.rjClip = null;
      this.updateRadioGain();
      this.notifyRadioChange();
      if (this.canPlayRadio()) {
        this.scheduleNextRJ(false);
      }
    };

    audioEl.onended = finishBreak;
    audioEl.onerror = finishBreak;

    try {
      const p = audioEl.play();
      if (p && typeof p.catch === 'function') {
        p.catch((err) => {
          if (this.rjAudio !== audioEl) return;
          const isAutoplayBlock = !audioEl.error && (!err || err.name === 'NotAllowedError' || err.name === 'AbortError');
          if (isAutoplayBlock) {
            // Keep the RJ clip armed so the very next pointer/key gesture starts it immediately
            this.rjNeedsUnlock = true;
            this.notifyRadioChange();
          } else {
            finishBreak();
          }
        });
      }
    } catch (_) {
      finishBreak();
    }
    return clip;
  }

  stopRadioLoop() {
    if (this.radioTimer) {
      window.clearInterval(this.radioTimer);
      this.radioTimer = null;
    }
  }

  startRadioLoop() {
    this.stopRadioLoop();
    const st = RADIO_STATIONS[this.radioIdx];
    if (!this.canPlayRadio() || !st || st.bpm <= 0) return;
    const stepMs = Math.round((60 / st.bpm / 4) * 1000);
    this.radioTimer = window.setInterval(() => {
      if (!this.canPlayRadio() || this.rjActive || !this.ctx || this.ctx.state !== 'running') return;
      this.playRadioStep(st.id, this.radioStep);
      this.radioStep = (this.radioStep + 1) % 16;
    }, stepMs);
  }

  playRadioStep(id, step) {
    const pat = STATION_PATTERNS[id];
    if (!pat || !this.radioBus) return;
    const now = this.ctx.currentTime;

    // 1. Punchy 1986 LinnDrum Kick
    const kickHit = id === 'fever' ? (step === 0 || step === 6 || step === 8 || step === 14) : (step % 4 === 0);
    if (kickHit) {
      const k = this.ctx.createOscillator();
      const kg = this.ctx.createGain();
      k.type = 'sine';
      k.frequency.setValueAtTime(148, now);
      k.frequency.exponentialRampToValueAtTime(36, now + 0.11);
      kg.gain.setValueAtTime(0.42, now);
      kg.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      k.connect(kg); kg.connect(this.radioBus);
      k.start(now); k.stop(now + 0.16);
    }

    // 2. Gated 80s Reverb Snare on 4 & 12
    if ((step === 4 || step === 12) && this.noiseBuf) {
      const sn = this.ctx.createBufferSource();
      sn.buffer = this.noiseBuf;
      const bp = this.ctx.createBiquadFilter();
      bp.type = 'bandpass'; bp.frequency.value = 1950; bp.Q.value = 1.05;
      const sg = this.ctx.createGain();
      sg.gain.setValueAtTime(0.25, now);
      sg.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
      sn.connect(bp); bp.connect(sg); sg.connect(this.radioBus);
      sn.start(now); sn.stop(now + 0.17);
    }

    // 3. Crisp Hi-Hat
    if (step % 2 === 1 && this.noiseBuf) {
      const hh = this.ctx.createBufferSource();
      hh.buffer = this.noiseBuf;
      const hp = this.ctx.createBiquadFilter();
      hp.type = 'highpass'; hp.frequency.value = 7200;
      const hg = this.ctx.createGain();
      hg.gain.setValueAtTime(0.068, now);
      hg.gain.exponentialRampToValueAtTime(0.001, now + 0.042);
      hh.connect(hp); hp.connect(hg); hg.connect(this.radioBus);
      hh.start(now); hh.stop(now + 0.048);
    }

    // 4. Warm Polyphonic Juno-106 Synth Pad Chord on bar start (step 0 & 8)
    if ((step === 0 || step === 8) && pat.chord) {
      pat.chord.forEach((cf, idx) => {
        const co = this.ctx.createOscillator();
        const cg = this.ctx.createGain();
        co.type = idx % 2 === 0 ? 'sawtooth' : 'triangle';
        co.frequency.setValueAtTime(cf * (step === 8 ? 1.122 : 1.0), now);
        cg.gain.setValueAtTime(0.001, now);
        cg.gain.linearRampToValueAtTime(0.042, now + 0.06);
        cg.gain.exponentialRampToValueAtTime(0.001, now + 0.52);
        co.connect(cg); cg.connect(this.radioBus);
        co.start(now); co.stop(now + 0.55);
      });
    }

    // 5. Analog Moog Bassline
    const bf = pat.bass[step];
    if (bf > 0) {
      const bo = this.ctx.createOscillator();
      const bflt = this.ctx.createBiquadFilter();
      const bg = this.ctx.createGain();
      bo.type = pat.bassWave;
      bo.frequency.setValueAtTime(bf, now);
      bflt.type = 'lowpass';
      bflt.frequency.setValueAtTime(680, now);
      bflt.frequency.exponentialRampToValueAtTime(180, now + 0.14);
      bg.gain.setValueAtTime(0.23, now);
      bg.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
      bo.connect(bflt); bflt.connect(bg); bg.connect(this.radioBus);
      bo.start(now); bo.stop(now + 0.17);
    }

    // 6. Detuned Chorus Synth Lead / Arena Guitar Riff
    const lf = pat.lead[step];
    if (lf > 0) {
      for (const det of [-4.5, 4.5]) {
        const lo = this.ctx.createOscillator();
        const lg = this.ctx.createGain();
        lo.type = pat.leadWave;
        lo.frequency.setValueAtTime(lf, now);
        lo.detune.value = det;
        lg.gain.setValueAtTime(0.001, now);
        lg.gain.linearRampToValueAtTime(id === 'vrock' ? 0.082 : 0.066, now + 0.015);
        lg.gain.exponentialRampToValueAtTime(0.001, now + 0.21);
        lo.connect(lg); lg.connect(this.radioBus);
        lo.start(now); lo.stop(now + 0.23);
      }
    }
  }

  radioStatic() {
    if (!this.enabled || !this.radioInCar || !this.ctx || !this.noiseBuf) return;
    const now = this.ctx.currentTime;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass'; bp.frequency.value = 2500; bp.Q.value = 1.9;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.16, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
    src.connect(bp); bp.connect(g); g.connect(this.master);
    src.start(now); src.stop(now + 0.15);
  }

  exhaustPop() {
    if (!this.enabled || !this.ctx || !this.noiseBuf) return;
    const now = this.ctx.currentTime;
    if (now - this.lastPopAt < 0.18) return;
    this.lastPopAt = now;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass'; bp.frequency.value = 380 + Math.random() * 240; bp.Q.value = 1.6;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.22, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.065);
    src.connect(bp); bp.connect(g); g.connect(this.master);
    src.start(now); src.stop(now + 0.075);
  }

  update(speedNorm, nitro = false, drifting = false, isBike = false, altitude = 0, gear = 0) {
    if (!this.enabled || !this.ctx || !this.oscMain) return;
    const now = this.ctx.currentTime;
    const spd = Math.max(0, Math.min(1.35, speedNorm));

    // Automatic 6-speed gearbox RPM sawtooth with authentic upshift dip
    const computedGear = gear > 0 ? gear : Math.max(1, Math.min(6, Math.floor(spd * 5.6) + 1));
    const gearMin = (computedGear - 1) / 5.6;
    const gearMax = computedGear / 5.6;
    const rpmInGear = Math.max(0, Math.min(1, (spd - gearMin * 0.72) / Math.max(0.12, gearMax - gearMin * 0.72)));

    // Trigger realistic exhaust burble/pop on sharp lift-off or hard upshift
    if (this.prevSpeedNorm - spd > 0.032 && spd > 0.28) this.exhaustPop();
    if (computedGear > this.prevGear && spd > 0.32 && !isBike) this.exhaustPop();
    this.prevSpeedNorm = spd;
    this.prevGear = computedGear;

    const idleHz = isBike ? 64 : 36;
    const revSpan = isBike ? 158 : 78;
    const baseHz = idleHz + rpmInGear * revSpan + spd * (isBike ? 48 : 30) + (nitro ? (isBike ? 34 : 24) : 0);

    this.oscSub.frequency.setTargetAtTime(baseHz * 0.5, now, 0.035);
    this.oscMain.frequency.setTargetAtTime(baseHz, now, 0.035);
    this.oscHarm.frequency.setTargetAtTime(baseHz * (isBike ? 2.01 : 1.504), now, 0.035);
    this.oscWhine.frequency.setTargetAtTime(baseHz * (isBike ? 4.02 : 3.45), now, 0.04);

    const cutoff = (isBike ? 360 : 210) + rpmInGear * (isBike ? 1550 : 960) + spd * 540 + (nitro ? 680 : 0);
    this.engineFilter.frequency.setTargetAtTime(cutoff, now, 0.045);

    const activeVehicle = spd > 0.0005 || nitro;
    const engVol = activeVehicle ? (0.11 + Math.min(1, spd) * 0.19 + rpmInGear * 0.07 + (nitro ? 0.08 : 0)) : 0.0;
    this.engineGain.gain.setTargetAtTime(engVol, now, 0.055);
    this.whineGain.gain.setTargetAtTime(activeVehicle ? ((isBike ? 0.11 : 0.035) * rpmInGear + (nitro ? 0.14 : 0)) : 0, now, 0.05);

    // Modulated dual-band tire screech
    if (drifting && spd > 0.12) {
      const wobble = Math.sin(now * 26) * 110;
      this.driftBpA.frequency.setTargetAtTime(1120 + spd * 340 + wobble, now, 0.04);
      this.driftBpB.frequency.setTargetAtTime(2240 + spd * 580 - wobble, now, 0.04);
      this.driftGain.gain.setTargetAtTime(Math.min(0.16, 0.06 + spd * 0.10), now, 0.05);
    } else {
      this.driftGain.gain.setTargetAtTime(0, now, 0.06);
    }

    // Mount Chiliad Altitude Howling Wind + High-Speed Air Rush
    const altNorm = Math.max(0, Math.min(1, (altitude - 18) / 88));
    const speedWind = Math.max(0, spd - 0.35) * 0.11;
    const windTarget = Math.min(0.24, altNorm * 0.18 + speedWind);
    const windHz = 260 + altNorm * 420 + Math.sin(now * 0.9) * (65 + altNorm * 95) + spd * 240;
    this.windFilter.frequency.setTargetAtTime(windHz, now, 0.14);
    this.windGain.gain.setTargetAtTime(windTarget, now, 0.18);
  }

  horn(tune = 'classic') {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();
    const now = this.ctx.currentTime;

    const playNote = (freqs, t0, dur, wave = 'sawtooth', vol = 0.085, lpFreq = 1850) => {
      freqs.forEach((freq) => {
        const o = this.ctx.createOscillator();
        const lp = this.ctx.createBiquadFilter();
        const g = this.ctx.createGain();
        o.type = wave;
        o.frequency.setValueAtTime(freq, now + t0);
        lp.type = 'lowpass';
        lp.frequency.value = lpFreq;
        g.gain.setValueAtTime(0.001, now + t0);
        g.gain.linearRampToValueAtTime(vol, now + t0 + 0.016);
        g.gain.setValueAtTime(vol * 0.92, now + t0 + Math.max(0.02, dur - 0.06));
        g.gain.exponentialRampToValueAtTime(0.001, now + t0 + dur);
        o.connect(lp); lp.connect(g); g.connect(this.master);
        o.start(now + t0); o.stop(now + t0 + dur + 0.03);
      });
    };

    if (tune === 'cucaracha') {
      // Classic 6-note La Cucaracha brass horn!
      const seq = [
        [261.6, 0.00, 0.11], [261.6, 0.12, 0.11], [261.6, 0.24, 0.11],
        [349.2, 0.36, 0.24], [440.0, 0.62, 0.18],
        [261.6, 0.84, 0.11], [261.6, 0.96, 0.11], [261.6, 1.08, 0.11],
        [349.2, 1.20, 0.24], [440.0, 1.46, 0.26]
      ];
      seq.forEach(([f, t, d]) => playNote([f, f * 1.5], t, d, 'sawtooth', 0.072, 2200));
      return;
    }
    if (tune === 'dixie') {
      // High-energy Vice 80s musical fanfare horn!
      const seq = [
        [392.0, 0.00, 0.11], [329.6, 0.11, 0.11], [261.6, 0.22, 0.18],
        [261.6, 0.42, 0.11], [293.7, 0.54, 0.11], [329.6, 0.66, 0.11],
        [349.2, 0.78, 0.11], [392.0, 0.90, 0.20], [392.0, 1.12, 0.20],
        [329.6, 1.34, 0.28]
      ];
      seq.forEach(([f, t, d]) => playNote([f, f * 2.0], t, d, 'sawtooth', 0.064, 2400));
      return;
    }
    if (tune === 'airhorn') {
      // Deep triple-trumpet stadium/truck airhorn
      playNote([185, 233.1, 293.7, 370], 0.0, 0.58, 'sawtooth', 0.078, 1450);
      return;
    }
    if (tune === 'synth80s') {
      // Vice City neon Juno-106 major-7th synth chord stab
      playNote([261.6, 329.6, 392.0, 493.9, 523.2], 0.0, 0.52, 'triangle', 0.075, 3200);
      playNote([523.2, 659.3], 0.05, 0.42, 'sawtooth', 0.04, 2600);
      return;
    }
    if (tune === 'siren') {
      // Quick twin-chirp police whoop-whoop!
      [0, 0.24].forEach((off) => {
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.type = 'sawtooth';
        o.frequency.setValueAtTime(520, now + off);
        o.frequency.exponentialRampToValueAtTime(1240, now + off + 0.17);
        g.gain.setValueAtTime(0.001, now + off);
        g.gain.linearRampToValueAtTime(0.11, now + off + 0.025);
        g.gain.exponentialRampToValueAtTime(0.001, now + off + 0.20);
        o.connect(g); g.connect(this.master);
        o.start(now + off); o.stop(now + off + 0.22);
      });
      return;
    }
    // Classic dual-tone Fiamm Italian sports car horn (420 Hz + 528 Hz filtered)
    playNote([420, 528], 0.0, 0.36, 'sawtooth', 0.095, 1850);
  }

  hydraulicsBounce() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx || !this.noiseBuf) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();
    const now = this.ctx.currentTime;
    // Pneumatic hydraulic hiss burst
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(2600, now);
    bp.frequency.exponentialRampToValueAtTime(920, now + 0.18);
    bp.Q.value = 2.2;
    const hg = this.ctx.createGain();
    hg.gain.setValueAtTime(0.18, now);
    hg.gain.exponentialRampToValueAtTime(0.001, now + 0.19);
    src.connect(bp); bp.connect(hg); hg.connect(this.master);
    src.start(now); src.stop(now + 0.21);
    // Low hydraulic pump thump
    const th = this.ctx.createOscillator();
    const tg = this.ctx.createGain();
    th.type = 'sine';
    th.frequency.setValueAtTime(112, now);
    th.frequency.exponentialRampToValueAtTime(42, now + 0.14);
    tg.gain.setValueAtTime(0.24, now);
    tg.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
    th.connect(tg); tg.connect(this.master);
    th.start(now); th.stop(now + 0.17);
  }

  volleyballHit(isSpike = false) {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx || !this.noiseBuf) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();
    const now = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(isSpike ? 245 : 185, now);
    o.frequency.exponentialRampToValueAtTime(68, now + 0.11);
    g.gain.setValueAtTime(isSpike ? 0.34 : 0.24, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    o.connect(g); g.connect(this.master);
    o.start(now); o.stop(now + 0.14);
    const slap = this.ctx.createBufferSource();
    slap.buffer = this.noiseBuf;
    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass'; bp.frequency.value = isSpike ? 1650 : 1200; bp.Q.value = 1.6;
    const sg = this.ctx.createGain();
    sg.gain.setValueAtTime(isSpike ? 0.22 : 0.13, now);
    sg.gain.exponentialRampToValueAtTime(0.001, now + 0.065);
    slap.connect(bp); bp.connect(sg); sg.connect(this.master);
    slap.start(now); slap.stop(now + 0.08);
  }

  gunshot(type = 'pistol') {
    if (!this.enabled || !this.ctx || !this.noiseBuf) return;
    const now = this.ctx.currentTime;

    if (type === 'bazooka') {
      const src = this.ctx.createBufferSource();
      src.buffer = this.noiseBuf;
      const bp = this.ctx.createBiquadFilter();
      bp.type = 'bandpass'; bp.frequency.setValueAtTime(1050, now); bp.frequency.exponentialRampToValueAtTime(240, now + 0.48);
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.42, now); g.gain.exponentialRampToValueAtTime(0.001, now + 0.50);
      src.connect(bp); bp.connect(g); g.connect(this.master);
      src.start(now); src.stop(now + 0.52);

      const th = this.ctx.createOscillator();
      const tg = this.ctx.createGain();
      th.type = 'sine'; th.frequency.setValueAtTime(155, now); th.frequency.exponentialRampToValueAtTime(30, now + 0.28);
      tg.gain.setValueAtTime(0.50, now); tg.gain.exponentialRampToValueAtTime(0.001, now + 0.30);
      th.connect(tg); tg.connect(this.master);
      th.start(now); th.stop(now + 0.32);
      return;
    }

    if (type === 'bat') {
      // Realistic air whoosh + solid hardwood crack
      const wSrc = this.ctx.createBufferSource();
      wSrc.buffer = this.noiseBuf;
      const wBp = this.ctx.createBiquadFilter();
      wBp.type = 'bandpass'; wBp.frequency.setValueAtTime(520, now); wBp.frequency.exponentialRampToValueAtTime(240, now + 0.14);
      const wg = this.ctx.createGain();
      wg.gain.setValueAtTime(0.24, now); wg.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
      wSrc.connect(wBp); wBp.connect(wg); wg.connect(this.master);
      wSrc.start(now); wSrc.stop(now + 0.17);

      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = 'triangle'; o.frequency.setValueAtTime(480, now); o.frequency.exponentialRampToValueAtTime(125, now + 0.085);
      g.gain.setValueAtTime(0.36, now); g.gain.exponentialRampToValueAtTime(0.001, now + 0.10);
      o.connect(g); g.connect(this.master);
      o.start(now); o.stop(now + 0.11);
      return;
    }

    if (type === 'shotgun') {
      // Heavy 12-gauge blast + urban slapback echo + metallic pump rack
      const src = this.ctx.createBufferSource();
      src.buffer = this.noiseBuf;
      const lp = this.ctx.createBiquadFilter();
      lp.type = 'lowpass'; lp.frequency.setValueAtTime(2800, now); lp.frequency.exponentialRampToValueAtTime(190, now + 0.34);
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.62, now); g.gain.exponentialRampToValueAtTime(0.001, now + 0.36);
      src.connect(lp); lp.connect(g); g.connect(this.master);
      src.start(now); src.stop(now + 0.38);

      const sub = this.ctx.createOscillator();
      const sg = this.ctx.createGain();
      sub.type = 'sine'; sub.frequency.setValueAtTime(155, now); sub.frequency.exponentialRampToValueAtTime(30, now + 0.20);
      sg.gain.setValueAtTime(0.54, now); sg.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      sub.connect(sg); sg.connect(this.master);
      sub.start(now); sub.stop(now + 0.24);

      // Authentic metallic chik-chak pump rack at +0.25s & +0.34s
      [0.25, 0.34].forEach((dt, idx) => {
        const rk = this.ctx.createBufferSource();
        rk.buffer = this.noiseBuf;
        const hp = this.ctx.createBiquadFilter();
        hp.type = 'bandpass'; hp.frequency.value = idx === 0 ? 3100 : 3850; hp.Q.value = 4.2;
        const rg = this.ctx.createGain();
        rg.gain.setValueAtTime(0.001, now + dt);
        rg.gain.linearRampToValueAtTime(0.15, now + dt + 0.012);
        rg.gain.exponentialRampToValueAtTime(0.001, now + dt + 0.065);
        rk.connect(hp); hp.connect(rg); rg.connect(this.master);
        rk.start(now + dt); rk.stop(now + dt + 0.075);
      });
      return;
    }

    // Layered Realistic Pistol / Uzi SMG / M4 Rifle (Supersonic Crack + Muzzle Boom + Urban Tail + Brass Clink)
    const isSmg = type === 'smg';
    const isRifle = type === 'rifle';

    const crack = this.ctx.createBufferSource();
    crack.buffer = this.noiseBuf;
    const flt = this.ctx.createBiquadFilter();
    flt.type = 'bandpass';
    flt.frequency.setValueAtTime(isSmg ? 2550 : (isRifle ? 2100 : 1620), now);
    flt.Q.value = isSmg ? 1.15 : 0.78;
    const cg = this.ctx.createGain();
    cg.gain.setValueAtTime(isSmg ? 0.30 : (isRifle ? 0.38 : 0.42), now);
    cg.gain.exponentialRampToValueAtTime(0.001, now + (isSmg ? 0.065 : (isRifle ? 0.105 : 0.14)));
    crack.connect(flt); flt.connect(cg); cg.connect(this.master);
    crack.start(now); crack.stop(now + (isSmg ? 0.075 : (isRifle ? 0.115 : 0.15)));

    // Chest-punch muzzle thump
    const punch = this.ctx.createOscillator();
    const pg = this.ctx.createGain();
    punch.type = 'triangle';
    punch.frequency.setValueAtTime(isSmg ? 280 : (isRifle ? 220 : 185), now);
    punch.frequency.exponentialRampToValueAtTime(42, now + 0.06);
    pg.gain.setValueAtTime(isSmg ? 0.24 : 0.32, now);
    pg.gain.exponentialRampToValueAtTime(0.001, now + 0.072);
    punch.connect(pg); pg.connect(this.master);
    punch.start(now); punch.stop(now + 0.08);

    // Subtle metallic brass casing clink on concrete (+0.18s)
    if (!isSmg || Math.random() > 0.55) {
      const cl = this.ctx.createOscillator();
      const clg = this.ctx.createGain();
      const tCl = now + 0.16 + Math.random() * 0.06;
      cl.type = 'sine';
      cl.frequency.setValueAtTime(4200 + Math.random() * 900, tCl);
      clg.gain.setValueAtTime(0.026, tCl);
      clg.gain.exponentialRampToValueAtTime(0.001, tCl + 0.035);
      cl.connect(clg); clg.connect(this.master);
      cl.start(tCl); cl.stop(tCl + 0.04);
    }
  }

  carjack() {
    if (!this.enabled || !this.ctx) return;
    this.carDoor();
    const now = this.ctx.currentTime;
    [880, 1175].forEach((f, idx) => {
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = 'square'; o.frequency.value = f;
      const t0 = now + 0.08 + idx * 0.11;
      g.gain.setValueAtTime(0.001, t0);
      g.gain.linearRampToValueAtTime(0.08, t0 + 0.01);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.08);
      o.connect(g); g.connect(this.master);
      o.start(t0); o.stop(t0 + 0.09);
    });
  }

  explosion() {
    if (!this.enabled || !this.ctx || !this.noiseBuf) return;
    const now = this.ctx.currentTime;
    // Deep cinematic sub-bass shockwave
    const sub = this.ctx.createOscillator();
    const sg = this.ctx.createGain();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(124, now);
    sub.frequency.exponentialRampToValueAtTime(20, now + 0.72);
    sg.gain.setValueAtTime(0.68, now);
    sg.gain.exponentialRampToValueAtTime(0.001, now + 0.80);
    sub.connect(sg); sg.connect(this.master);
    sub.start(now); sub.stop(now + 0.82);

    // Fireball roar + rolling debris crackle
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    const lp = this.ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(2100, now);
    lp.frequency.exponentialRampToValueAtTime(110, now + 1.05);
    const ng = this.ctx.createGain();
    ng.gain.setValueAtTime(0.58, now);
    ng.gain.exponentialRampToValueAtTime(0.001, now + 1.12);
    src.connect(lp); lp.connect(ng); ng.connect(this.master);
    src.start(now); src.stop(now + 1.15);
  }

  thunder() {
    if (!this.enabled || !this.ctx || !this.noiseBuf) return;
    const now = this.ctx.currentTime;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    const lp = this.ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(340, now);
    lp.frequency.exponentialRampToValueAtTime(65, now + 1.7);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.01, now);
    g.gain.linearRampToValueAtTime(0.42, now + 0.14);
    g.gain.exponentialRampToValueAtTime(0.001, now + 1.85);
    src.connect(lp); lp.connect(g); g.connect(this.master);
    src.start(now); src.stop(now + 1.9);
  }

  impact(intensity = 0.6) {
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    // Metallic crunch + heavy body thud
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = 'triangle';
    o.frequency.setValueAtTime(128, now);
    o.frequency.exponentialRampToValueAtTime(32, now + 0.15);
    g.gain.setValueAtTime(Math.min(0.36, 0.12 + intensity * 0.24), now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.17);
    o.connect(g); g.connect(this.master);
    o.start(now); o.stop(now + 0.19);

    if (this.noiseBuf) {
      const cr = this.ctx.createBufferSource();
      cr.buffer = this.noiseBuf;
      const bp = this.ctx.createBiquadFilter();
      bp.type = 'bandpass'; bp.frequency.value = 950; bp.Q.value = 1.4;
      const cg = this.ctx.createGain();
      cg.gain.setValueAtTime(Math.min(0.24, intensity * 0.22), now);
      cg.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      cr.connect(bp); bp.connect(cg); cg.connect(this.master);
      cr.start(now); cr.stop(now + 0.13);
    }
  }

  squish() {
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    const o1 = this.ctx.createOscillator();
    const g1 = this.ctx.createGain();
    o1.type = 'sine';
    o1.frequency.setValueAtTime(180, now);
    o1.frequency.exponentialRampToValueAtTime(42, now + 0.13);
    g1.gain.setValueAtTime(0.28, now);
    g1.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    o1.connect(g1); g1.connect(this.master);
    o1.start(now); o1.stop(now + 0.16);
  }

  pickup() {
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    [587.33, 880, 1174.66].forEach((freq, idx) => {
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = 'triangle';
      const t0 = now + idx * 0.055;
      o.frequency.setValueAtTime(freq, t0);
      g.gain.setValueAtTime(0.001, t0);
      g.gain.linearRampToValueAtTime(0.14, t0 + 0.015);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.24);
      o.connect(g); g.connect(this.master);
      o.start(t0); o.stop(t0 + 0.26);
    });
  }

  boost() {
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    // Turbocharger spool-up whoosh + exhaust blow-off
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(180, now);
    o.frequency.exponentialRampToValueAtTime(740, now + 0.30);
    g.gain.setValueAtTime(0.001, now);
    g.gain.linearRampToValueAtTime(0.15, now + 0.04);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.36);
    o.connect(g); g.connect(this.master);
    o.start(now); o.stop(now + 0.38);
  }

  jump() {
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(190, now);
    o.frequency.exponentialRampToValueAtTime(420, now + 0.16);
    g.gain.setValueAtTime(0.001, now);
    g.gain.linearRampToValueAtTime(0.14, now + 0.025);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    o.connect(g); g.connect(this.master);
    o.start(now); o.stop(now + 0.20);
  }

  punch() {
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    if (this.noiseBuf) {
      const w = this.ctx.createBufferSource();
      w.buffer = this.noiseBuf;
      const bp = this.ctx.createBiquadFilter();
      bp.type = 'bandpass'; bp.frequency.setValueAtTime(680, now); bp.frequency.exponentialRampToValueAtTime(260, now + 0.09);
      const wg = this.ctx.createGain();
      wg.gain.setValueAtTime(0.20, now); wg.gain.exponentialRampToValueAtTime(0.001, now + 0.10);
      w.connect(bp); bp.connect(wg); wg.connect(this.master);
      w.start(now); w.stop(now + 0.11);
    }
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = 'triangle';
    o.frequency.setValueAtTime(320, now);
    o.frequency.exponentialRampToValueAtTime(95, now + 0.08);
    g.gain.setValueAtTime(0.14, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.095);
    o.connect(g); g.connect(this.master);
    o.start(now); o.stop(now + 0.10);
  }

  hitNpc(isKO = false) {
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(isKO ? 175 : 210, now);
    o.frequency.exponentialRampToValueAtTime(isKO ? 34 : 55, now + (isKO ? 0.19 : 0.11));
    g.gain.setValueAtTime(isKO ? 0.34 : 0.24, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + (isKO ? 0.21 : 0.12));
    o.connect(g); g.connect(this.master);
    o.start(now); o.stop(now + (isKO ? 0.23 : 0.14));

    if (isKO) {
      const c = this.ctx.createOscillator();
      const cg = this.ctx.createGain();
      c.type = 'triangle';
      c.frequency.setValueAtTime(523.25, now + 0.06);
      c.frequency.setValueAtTime(783.99, now + 0.13);
      cg.gain.setValueAtTime(0.001, now);
      cg.gain.linearRampToValueAtTime(0.14, now + 0.07);
      cg.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
      c.connect(cg); cg.connect(this.master);
      c.start(now + 0.05); c.stop(now + 0.30);
    }
  }

  carDoor() {
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    // Authentic heavy steel latch click + deep coupe door thud
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(145, now);
    o.frequency.exponentialRampToValueAtTime(42, now + 0.11);
    g.gain.setValueAtTime(0.28, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    o.connect(g); g.connect(this.master);
    o.start(now); o.stop(now + 0.13);

    if (this.noiseBuf) {
      const cl = this.ctx.createBufferSource();
      cl.buffer = this.noiseBuf;
      const bp = this.ctx.createBiquadFilter();
      bp.type = 'bandpass'; bp.frequency.value = 2600; bp.Q.value = 3.2;
      const cg = this.ctx.createGain();
      cg.gain.setValueAtTime(0.11, now);
      cg.gain.exponentialRampToValueAtTime(0.001, now + 0.035);
      cl.connect(bp); bp.connect(cg); cg.connect(this.master);
      cl.start(now); cl.stop(now + 0.04);
    }
  }

  policeSiren() {
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    const lp = this.ctx.createBiquadFilter();
    const g = this.ctx.createGain();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(640, now);
    o.frequency.linearRampToValueAtTime(1220, now + 0.36);
    o.frequency.linearRampToValueAtTime(640, now + 0.72);
    lp.type = 'lowpass'; lp.frequency.value = 2400;
    g.gain.setValueAtTime(0.001, now);
    g.gain.linearRampToValueAtTime(0.088, now + 0.06);
    g.gain.setValueAtTime(0.088, now + 0.64);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.74);
    o.connect(lp); lp.connect(g); g.connect(this.master);
    o.start(now); o.stop(now + 0.76);
  }

  cheatChime() {
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = 'triangle';
      o.frequency.setValueAtTime(freq, now + idx * 0.055);
      g.gain.setValueAtTime(0.001, now + idx * 0.055);
      g.gain.linearRampToValueAtTime(0.14, now + idx * 0.055 + 0.015);
      g.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.055 + 0.22);
      o.connect(g); g.connect(this.master);
      o.start(now + idx * 0.055); o.stop(now + idx * 0.055 + 0.24);
    });
  }

  wheelTick() {
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = 'triangle';
    o.frequency.setValueAtTime(920, now);
    o.frequency.exponentialRampToValueAtTime(520, now + 0.032);
    g.gain.setValueAtTime(0.065, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.036);
    o.connect(g); g.connect(this.master);
    o.start(now); o.stop(now + 0.04);
  }

  wheelSelect() {
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    [660, 990].forEach((freq, i) => {
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = 'sine';
      const t0 = now + i * 0.035;
      o.frequency.setValueAtTime(freq, t0);
      g.gain.setValueAtTime(0.075, t0);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.08);
      o.connect(g); g.connect(this.master);
      o.start(t0); o.stop(t0 + 0.09);
    });
  }

  setAtmosphereLevels(surf = 0, city = 0) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const duck = this.canPlayRadio() ? 0.45 : 1.0;
    if (this.surfGain) {
      const sTarget = this.enabled ? Math.min(0.24, Math.max(0, surf) * 0.20 * duck) : 0;
      this.surfGain.gain.setTargetAtTime(sTarget, now, 0.35);
    }
    if (this.cityGain) {
      const cTarget = this.enabled ? Math.min(0.14, Math.max(0, city) * 0.11 * duck) : 0;
      this.cityGain.gain.setTargetAtTime(cTarget, now, 0.4);
    }
  }

  setHeliRotor(active, throttle = 0.5) {
    if (!this.ctx || !this.heliGain) return;
    const now = this.ctx.currentTime;
    const target = (this.enabled && active) ? (0.20 + Math.min(1, Math.max(0, throttle)) * 0.14) : 0;
    this.heliGain.gain.setTargetAtTime(target, now, 0.14);
    if (this.heliLfo && active) {
      this.heliLfo.frequency.setTargetAtTime(11.5 + Math.min(1, Math.max(0, throttle)) * 6.5, now, 0.18);
    }
  }

  footstep(indoor = false) {
    if (!this.enabled || !this.ctx || !this.noiseBuf) return;
    const now = this.ctx.currentTime;
    const playTap = (offset, amp, freq) => {
      const src = this.ctx.createBufferSource();
      src.buffer = this.noiseBuf;
      const bp = this.ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = freq;
      bp.Q.value = indoor ? 3.4 : 1.8;
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(amp, now + offset);
      g.gain.exponentialRampToValueAtTime(0.001, now + offset + (indoor ? 0.085 : 0.055));
      src.connect(bp); bp.connect(g); g.connect(this.master);
      src.start(now + offset); src.stop(now + offset + 0.095);
    };
    playTap(0, indoor ? 0.085 : 0.06, indoor ? 980 : 420);
    if (indoor) {
      // Subtle hall slapback echo inside North Point Mall, Ocean View Hotel & Airport Terminal
      playTap(0.095, 0.036, 860);
      playTap(0.195, 0.016, 720);
    }
  }

  phoneChime() {
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    [880, 1174.66].forEach((f, idx) => {
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = 'sine';
      const t0 = now + idx * 0.055;
      o.frequency.setValueAtTime(f, t0);
      g.gain.setValueAtTime(0.001, t0);
      g.gain.linearRampToValueAtTime(0.09, t0 + 0.012);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.14);
      o.connect(g); g.connect(this.master);
      o.start(t0); o.stop(t0 + 0.16);
    });
  }

  cameraShutter() {
    if (!this.enabled || !this.ctx || !this.noiseBuf) return;
    const now = this.ctx.currentTime;
    [0, 0.075].forEach((off, idx) => {
      const s = this.ctx.createBufferSource();
      s.buffer = this.noiseBuf;
      const hp = this.ctx.createBiquadFilter();
      hp.type = 'highpass'; hp.frequency.value = idx === 0 ? 2200 : 1600;
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.18, now + off);
      g.gain.exponentialRampToValueAtTime(0.001, now + off + 0.045);
      s.connect(hp); hp.connect(g); g.connect(this.master);
      s.start(now + off); s.stop(now + off + 0.05);
    });
  }

  sprayHiss() {
    if (!this.enabled || !this.ctx || !this.noiseBuf) return;
    const now = this.ctx.currentTime;
    const s = this.ctx.createBufferSource();
    s.buffer = this.noiseBuf;
    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass'; bp.frequency.value = 3400; bp.Q.value = 1.2;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.001, now);
    g.gain.linearRampToValueAtTime(0.15, now + 0.06);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
    s.connect(bp); bp.connect(g); g.connect(this.master);
    s.start(now); s.stop(now + 0.7);
  }
}
