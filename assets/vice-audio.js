/* ==========================================================================
   VICE CITY 3D — SYNTHESIZED V12 ENGINE, WEAPONS, WEATHER & 1986 FM RADIO
   ========================================================================== */
export const RADIO_STATIONS = [
  { id: 'wave',    name: 'Wave 103',     freq: '103.0', genre: 'New Wave · Synth', bpm: 96,  col: '#21E6D1' },
  { id: 'emotion', name: 'Emotion 98.3', freq: '98.3',  genre: '80s Power Ballads', bpm: 72, col: '#FF85BD' },
  { id: 'fever',   name: 'Fever 105',    freq: '105.0', genre: 'Miami Funk · Disco', bpm: 112, col: '#FFD36B' },
  { id: 'flash',   name: 'Flash FM',     freq: '90.3',  genre: '80s Synthpop', bpm: 124, col: '#FF2E88' },
  { id: 'vrock',   name: 'V-Rock',       freq: '94.8',  genre: '80s Arena Rock', bpm: 138, col: '#FF7B2E' }
];

const STATION_PATTERNS = {
  wave: {
    bass: [49, 49, 98, 49, 55, 55, 110, 55, 65.41, 65.41, 130.81, 65.41, 58.27, 58.27, 116.54, 58.27],
    lead: [392, 0, 493.88, 587.33, 0, 440, 523.25, 0, 659.25, 0, 587.33, 523.25, 466.16, 0, 392, 0],
    leadWave: 'triangle', bassWave: 'sawtooth'
  },
  emotion: {
    bass: [43.65, 0, 0, 87.31, 0, 0, 49, 0, 65.41, 0, 0, 130.81, 0, 0, 55, 0],
    lead: [349.23, 0, 440, 523.25, 0, 493.88, 0, 440, 392, 0, 493.88, 587.33, 0, 523.25, 440, 0],
    leadWave: 'triangle', bassWave: 'triangle'
  },
  fever: {
    bass: [65.41, 0, 130.81, 73.42, 0, 82.41, 98, 0, 73.42, 0, 146.83, 82.41, 98, 0, 110, 98],
    lead: [523.25, 659.25, 0, 783.99, 0, 659.25, 587.33, 523.25, 587.33, 0, 659.25, 0, 783.99, 880, 783.99, 0],
    leadWave: 'square', bassWave: 'triangle'
  },
  flash: {
    bass: [55, 55, 110, 55, 65.41, 65.41, 130.81, 65.41, 73.42, 73.42, 146.83, 73.42, 65.41, 65.41, 98, 82.41],
    lead: [440, 0, 523.25, 0, 659.25, 587.33, 523.25, 0, 587.33, 0, 659.25, 783.99, 659.25, 0, 523.25, 493.88],
    leadWave: 'sawtooth', bassWave: 'sawtooth'
  },
  vrock: {
    bass: [82.41, 82.41, 82.41, 98, 82.41, 82.41, 110, 98, 73.42, 73.42, 73.42, 82.41, 65.41, 65.41, 73.42, 98],
    lead: [329.63, 329.63, 0, 392, 440, 0, 392, 329.63, 293.66, 293.66, 0, 329.63, 261.63, 293.66, 329.63, 0],
    leadWave: 'sawtooth', bassWave: 'square'
  }
};

export class ViceAudioEngine {
  constructor() {
    this.ctx = null;
    this.enabled = false;
    this.engineGain = null;
    this.oscA = null;
    this.oscB = null;
    this.filter = null;
    this.driftGain = null;
    this.rainGain = null;
    this.radioGain = null;
    this.noiseBuf = null;

    this.radioIdx = 0; // Start on Wave 103 (103.0 FM) matching main website
    this.radioPower = true;
    this.radioVolume = 60;
    this.radioInCar = true;
    this.radioStep = 0;
    this.radioTimer = null;
  }

  init() {
    if (this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    const master = this.ctx.createGain();
    master.gain.value = 0.26;
    master.connect(this.ctx.destination);
    this.master = master;

    // Shared white noise buffer for drift screech, gunshots, explosions, thunder & rain
    const buf = this.ctx.createBuffer(1, this.ctx.sampleRate * 2.0, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    this.noiseBuf = buf;

    // V12 Engine synth
    this.filter = this.ctx.createBiquadFilter();
    this.filter.type = 'lowpass';
    this.filter.frequency.value = 220;
    this.filter.Q.value = 2.4;

    this.engineGain = this.ctx.createGain();
    this.engineGain.gain.value = 0.0;
    this.filter.connect(this.engineGain);
    this.engineGain.connect(master);

    this.oscA = this.ctx.createOscillator();
    this.oscA.type = 'sawtooth';
    this.oscA.frequency.value = 54;
    this.oscA.connect(this.filter);
    this.oscA.start();

    this.oscB = this.ctx.createOscillator();
    this.oscB.type = 'triangle';
    this.oscB.frequency.value = 108;
    this.oscB.connect(this.filter);
    this.oscB.start();

    // Tire Drift Screech
    const noise = this.ctx.createBufferSource();
    noise.buffer = buf;
    noise.loop = true;
    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 1350;
    bp.Q.value = 3.2;
    this.driftGain = this.ctx.createGain();
    this.driftGain.gain.value = 0;
    noise.connect(bp);
    bp.connect(this.driftGain);
    this.driftGain.connect(master);
    noise.start();

    // Tropical Rain Ambience Loop
    const rainNoise = this.ctx.createBufferSource();
    rainNoise.buffer = buf;
    rainNoise.loop = true;
    const rainLP = this.ctx.createBiquadFilter();
    rainLP.type = 'bandpass';
    rainLP.frequency.value = 1750;
    rainLP.Q.value = 0.65;
    this.rainGain = this.ctx.createGain();
    this.rainGain.gain.value = 0;
    rainNoise.connect(rainLP);
    rainLP.connect(this.rainGain);
    this.rainGain.connect(master);
    rainNoise.start();

    // In-Car FM Radio Master Bus (slightly warm 80s stereo filter)
    const radioLP = this.ctx.createBiquadFilter();
    radioLP.type = 'lowpass';
    radioLP.frequency.value = 3800;
    this.radioGain = this.ctx.createGain();
    this.radioGain.gain.value = 0.34;
    radioLP.connect(this.radioGain);
    this.radioGain.connect(master);
    this.radioBus = radioLP;
  }

  setEnabled(flag) {
    this.enabled = flag;
    if (flag) {
      this.init();
      if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
      this.startRadioLoop();
    } else {
      this.stopRadioLoop();
      if (this.engineGain && this.ctx) {
        this.engineGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.08);
        if (this.driftGain) this.driftGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05);
        if (this.rainGain) this.rainGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.08);
      }
    }
  }

  setRainLevel(level) {
    if (!this.rainGain || !this.ctx) return;
    const target = this.enabled ? Math.min(0.22, level * 0.18) : 0;
    this.rainGain.gain.setTargetAtTime(target, this.ctx.currentTime, 0.25);
  }

  updateRadioGain() {
    if (!this.radioGain || !this.ctx) return;
    const active = this.enabled && this.radioPower && this.radioInCar;
    const vol = (this.radioVolume / 100) * 0.56;
    this.radioGain.gain.setTargetAtTime(active ? vol : 0.0, this.ctx.currentTime, 0.12);
  }

  setRadioInCar(inCar) {
    this.radioInCar = inCar;
    this.updateRadioGain();
  }

  setRadioPower(on) {
    this.radioPower = !!on;
    this.updateRadioGain();
    if (this.radioPower) this.startRadioLoop();
    else this.stopRadioLoop();
  }

  setRadioVolume(vol) {
    this.radioVolume = Math.max(0, Math.min(100, Math.round(vol)));
    this.updateRadioGain();
  }

  setRadioStation(idx) {
    this.radioIdx = ((idx % RADIO_STATIONS.length) + RADIO_STATIONS.length) % RADIO_STATIONS.length;
    this.radioPower = true;
    this.radioStep = 0;
    this.radioStatic();
    this.updateRadioGain();
    this.startRadioLoop();
    return RADIO_STATIONS[this.radioIdx];
  }

  getRadioStation() {
    return RADIO_STATIONS[this.radioIdx];
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
    if (!this.enabled || !this.radioPower || !st || st.bpm <= 0) return;
    const stepMs = Math.round((60 / st.bpm / 4) * 1000); // 16th-note clock
    this.radioTimer = window.setInterval(() => {
      if (!this.enabled || !this.radioPower || !this.ctx || !this.radioInCar || this.ctx.state !== 'running') return;
      this.playRadioStep(st.id, this.radioStep);
      this.radioStep = (this.radioStep + 1) % 16;
    }, stepMs);
  }

  playRadioStep(id, step) {
    const pat = STATION_PATTERNS[id];
    if (!pat || !this.radioBus) return;
    const now = this.ctx.currentTime;

    // 1. Punchy 1986 LinnDrum Kick (beats 0, 4, 8, 12; syncopated on Fever)
    const kickHit = id === 'fever' ? (step === 0 || step === 6 || step === 8 || step === 14) : (step % 4 === 0);
    if (kickHit) {
      const k = this.ctx.createOscillator();
      const kg = this.ctx.createGain();
      k.type = 'sine';
      k.frequency.setValueAtTime(140, now);
      k.frequency.exponentialRampToValueAtTime(38, now + 0.11);
      kg.gain.setValueAtTime(0.42, now);
      kg.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
      k.connect(kg); kg.connect(this.radioBus);
      k.start(now); k.stop(now + 0.15);
    }

    // 2. Gated 80s Snare on 4 & 12
    if ((step === 4 || step === 12) && this.noiseBuf) {
      const sn = this.ctx.createBufferSource();
      sn.buffer = this.noiseBuf;
      const hp = this.ctx.createBiquadFilter();
      hp.type = 'bandpass'; hp.frequency.value = 1800; hp.Q.value = 1.1;
      const sg = this.ctx.createGain();
      sg.gain.setValueAtTime(0.26, now);
      sg.gain.exponentialRampToValueAtTime(0.001, now + 0.13);
      sn.connect(hp); hp.connect(sg); sg.connect(this.radioBus);
      sn.start(now); sn.stop(now + 0.14);
    }

    // 3. Crisp Hi-Hat on off-beats
    if (step % 2 === 1 && this.noiseBuf) {
      const hh = this.ctx.createBufferSource();
      hh.buffer = this.noiseBuf;
      const hp = this.ctx.createBiquadFilter();
      hp.type = 'highpass'; hp.frequency.value = 6800;
      const hg = this.ctx.createGain();
      hg.gain.setValueAtTime(0.075, now);
      hg.gain.exponentialRampToValueAtTime(0.001, now + 0.045);
      hh.connect(hp); hp.connect(hg); hg.connect(this.radioBus);
      hh.start(now); hh.stop(now + 0.05);
    }

    // 4. Analog Bassline
    const bf = pat.bass[step];
    if (bf > 0) {
      const bo = this.ctx.createOscillator();
      const bflt = this.ctx.createBiquadFilter();
      const bg = this.ctx.createGain();
      bo.type = pat.bassWave;
      bo.frequency.setValueAtTime(bf, now);
      bflt.type = 'lowpass';
      bflt.frequency.setValueAtTime(620, now);
      bflt.frequency.exponentialRampToValueAtTime(190, now + 0.14);
      bg.gain.setValueAtTime(0.24, now);
      bg.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
      bo.connect(bflt); bflt.connect(bg); bg.connect(this.radioBus);
      bo.start(now); bo.stop(now + 0.17);
    }

    // 5. Synth Lead / Riff
    const lf = pat.lead[step];
    if (lf > 0) {
      const lo = this.ctx.createOscillator();
      const lg = this.ctx.createGain();
      lo.type = pat.leadWave;
      lo.frequency.setValueAtTime(lf, now);
      lg.gain.setValueAtTime(0.001, now);
      lg.gain.linearRampToValueAtTime(id === 'vrock' ? 0.16 : 0.13, now + 0.015);
      lg.gain.exponentialRampToValueAtTime(0.001, now + 0.20);
      lo.connect(lg); lg.connect(this.radioBus);
      lo.start(now); lo.stop(now + 0.22);
    }
  }

  radioStatic() {
    if (!this.enabled || !this.ctx || !this.noiseBuf) return;
    const now = this.ctx.currentTime;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass'; bp.frequency.value = 2400; bp.Q.value = 1.8;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.18, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    src.connect(bp); bp.connect(g); g.connect(this.master);
    src.start(now); src.stop(now + 0.16);
  }

  update(speedNorm, nitro, drifting) {
    if (!this.enabled || !this.ctx || !this.oscA) return;
    const now = this.ctx.currentTime;
    const gearPos = (speedNorm * 4.4) % 1;
    const baseFreq = 52 + speedNorm * 95 + gearPos * 42 + (nitro ? 28 : 0);
    this.oscA.frequency.setTargetAtTime(baseFreq, now, 0.05);
    this.oscB.frequency.setTargetAtTime(baseFreq * 1.99, now, 0.05);
    this.filter.frequency.setTargetAtTime(210 + speedNorm * 900 + (nitro ? 550 : 0), now, 0.06);
    const engineTarget = speedNorm <= 0.001 ? 0.0 : (0.12 + speedNorm * 0.22 + (nitro ? 0.09 : 0));
    this.engineGain.gain.setTargetAtTime(engineTarget, now, 0.06);
    this.driftGain.gain.setTargetAtTime(drifting ? 0.12 : 0, now, 0.06);
  }

  horn() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();
    const now = this.ctx.currentTime;
    [415, 523.25].forEach((freq) => {
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = 'sawtooth';
      o.frequency.value = freq;
      g.gain.setValueAtTime(0.001, now);
      g.gain.linearRampToValueAtTime(0.08, now + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.34);
      o.connect(g); g.connect(this.master);
      o.start(now); o.stop(now + 0.36);
    });
  }

  gunshot(type = 'pistol') {
    if (!this.enabled || !this.ctx || !this.noiseBuf) return;
    const now = this.ctx.currentTime;
    if (type === 'bazooka') {
      // RPG Rocket launch whoosh + deep thump
      const src = this.ctx.createBufferSource();
      src.buffer = this.noiseBuf;
      const bp = this.ctx.createBiquadFilter();
      bp.type = 'bandpass'; bp.frequency.setValueAtTime(900, now); bp.frequency.exponentialRampToValueAtTime(280, now + 0.42);
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.36, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.44);
      src.connect(bp); bp.connect(g); g.connect(this.master);
      src.start(now); src.stop(now + 0.46);

      const th = this.ctx.createOscillator();
      const tg = this.ctx.createGain();
      th.type = 'sine';
      th.frequency.setValueAtTime(140, now); th.frequency.exponentialRampToValueAtTime(34, now + 0.24);
      tg.gain.setValueAtTime(0.42, now); tg.gain.exponentialRampToValueAtTime(0.001, now + 0.26);
      th.connect(tg); tg.connect(this.master);
      th.start(now); th.stop(now + 0.28);
      return;
    }

    if (type === 'bat') {
      // Heavy aluminum/wood baseball bat crack
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = 'triangle';
      o.frequency.setValueAtTime(520, now);
      o.frequency.exponentialRampToValueAtTime(140, now + 0.09);
      g.gain.setValueAtTime(0.42, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.11);
      o.connect(g); g.connect(this.master);
      o.start(now); o.stop(now + 0.12);
      const ping = this.ctx.createOscillator();
      const pg = this.ctx.createGain();
      ping.type = 'sine';
      ping.frequency.setValueAtTime(1320, now);
      ping.frequency.exponentialRampToValueAtTime(980, now + 0.14);
      pg.gain.setValueAtTime(0.14, now);
      pg.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      ping.connect(pg); pg.connect(this.master);
      ping.start(now); ping.stop(now + 0.16);
      return;
    }

    if (type === 'shotgun') {
      // Booming 12-gauge pump shotgun blast + mechanical rack
      const src = this.ctx.createBufferSource();
      src.buffer = this.noiseBuf;
      const lp = this.ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.setValueAtTime(2200, now);
      lp.frequency.exponentialRampToValueAtTime(220, now + 0.28);
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.56, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.30);
      src.connect(lp); lp.connect(g); g.connect(this.master);
      src.start(now); src.stop(now + 0.32);

      const sub = this.ctx.createOscillator();
      const sg = this.ctx.createGain();
      sub.type = 'sine';
      sub.frequency.setValueAtTime(145, now);
      sub.frequency.exponentialRampToValueAtTime(34, now + 0.18);
      sg.gain.setValueAtTime(0.48, now);
      sg.gain.exponentialRampToValueAtTime(0.001, now + 0.20);
      sub.connect(sg); sg.connect(this.master);
      sub.start(now); sub.stop(now + 0.22);

      // Pump-action chik-chak at +0.26s
      const rk = this.ctx.createBufferSource();
      rk.buffer = this.noiseBuf;
      const hp = this.ctx.createBiquadFilter();
      hp.type = 'bandpass'; hp.frequency.value = 3400; hp.Q.value = 3.0;
      const rg = this.ctx.createGain();
      rg.gain.setValueAtTime(0.001, now + 0.24);
      rg.gain.linearRampToValueAtTime(0.14, now + 0.26);
      rg.gain.exponentialRampToValueAtTime(0.001, now + 0.34);
      rk.connect(hp); hp.connect(rg); rg.connect(this.master);
      rk.start(now + 0.24); rk.stop(now + 0.36);
      return;
    }

    // Crisp Pistol, Uzi SMG, or Rapid Rifle crack
    const isSmg = type === 'smg';
    const isRifle = type === 'rifle';
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    const flt = this.ctx.createBiquadFilter();
    flt.type = 'bandpass';
    flt.frequency.setValueAtTime(isSmg ? 2400 : (isRifle ? 1950 : 1450), now);
    flt.Q.value = isSmg ? 1.25 : (isRifle ? 0.9 : 0.7);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(isSmg ? 0.26 : (isRifle ? 0.34 : 0.38), now);
    g.gain.exponentialRampToValueAtTime(0.001, now + (isSmg ? 0.06 : (isRifle ? 0.085 : 0.13)));
    src.connect(flt); flt.connect(g); g.connect(this.master);
    src.start(now); src.stop(now + (isSmg ? 0.07 : (isRifle ? 0.095 : 0.14)));

    const punch = this.ctx.createOscillator();
    const pg = this.ctx.createGain();
    punch.type = 'triangle';
    punch.frequency.setValueAtTime(isSmg ? 290 : (isRifle ? 240 : 190), now);
    punch.frequency.exponentialRampToValueAtTime(48, now + 0.055);
    pg.gain.setValueAtTime(isSmg ? 0.22 : 0.28, now);
    pg.gain.exponentialRampToValueAtTime(0.001, now + 0.065);
    punch.connect(pg); pg.connect(this.master);
    punch.start(now); punch.stop(now + 0.075);
  }

  carjack() {
    if (!this.enabled || !this.ctx) return;
    this.carDoor();
    const now = this.ctx.currentTime;
    // Brief car alarm chirp + engine rev surge
    [880, 1175].forEach((f, idx) => {
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = 'square';
      o.frequency.value = f;
      const t0 = now + 0.08 + idx * 0.11;
      g.gain.setValueAtTime(0.001, t0);
      g.gain.linearRampToValueAtTime(0.09, t0 + 0.01);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.08);
      o.connect(g); g.connect(this.master);
      o.start(t0); o.stop(t0 + 0.09);
    });
  }

  explosion() {
    if (!this.enabled || !this.ctx || !this.noiseBuf) return;
    const now = this.ctx.currentTime;
    // Sub-bass shockwave boom
    const sub = this.ctx.createOscillator();
    const sg = this.ctx.createGain();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(115, now);
    sub.frequency.exponentialRampToValueAtTime(22, now + 0.65);
    sg.gain.setValueAtTime(0.62, now);
    sg.gain.exponentialRampToValueAtTime(0.001, now + 0.72);
    sub.connect(sg); sg.connect(this.master);
    sub.start(now); sub.stop(now + 0.75);

    // Roaring fiery blast noise
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    const lp = this.ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(1600, now);
    lp.frequency.exponentialRampToValueAtTime(140, now + 0.85);
    const ng = this.ctx.createGain();
    ng.gain.setValueAtTime(0.54, now);
    ng.gain.exponentialRampToValueAtTime(0.001, now + 0.92);
    src.connect(lp); lp.connect(ng); ng.connect(this.master);
    src.start(now); src.stop(now + 0.95);
  }

  thunder() {
    if (!this.enabled || !this.ctx || !this.noiseBuf) return;
    const now = this.ctx.currentTime;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    const lp = this.ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(320, now);
    lp.frequency.exponentialRampToValueAtTime(75, now + 1.5);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.01, now);
    g.gain.linearRampToValueAtTime(0.38, now + 0.14);
    g.gain.exponentialRampToValueAtTime(0.001, now + 1.65);
    src.connect(lp); lp.connect(g); g.connect(this.master);
    src.start(now); src.stop(now + 1.7);
  }

  impact(intensity = 0.6) {
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = 'triangle';
    o.frequency.setValueAtTime(115, now);
    o.frequency.exponentialRampToValueAtTime(36, now + 0.14);
    g.gain.setValueAtTime(Math.min(0.32, 0.1 + intensity * 0.22), now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
    o.connect(g); g.connect(this.master);
    o.start(now); o.stop(now + 0.18);
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

    const o2 = this.ctx.createOscillator();
    const g2 = this.ctx.createGain();
    o2.type = 'triangle';
    o2.frequency.setValueAtTime(660, now + 0.05);
    o2.frequency.setValueAtTime(990, now + 0.11);
    g2.gain.setValueAtTime(0.001, now);
    g2.gain.linearRampToValueAtTime(0.11, now + 0.06);
    g2.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
    o2.connect(g2); g2.connect(this.master);
    o2.start(now + 0.04); o2.stop(now + 0.26);
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
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(160, now);
    o.frequency.exponentialRampToValueAtTime(620, now + 0.28);
    g.gain.setValueAtTime(0.001, now);
    g.gain.linearRampToValueAtTime(0.16, now + 0.04);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.34);
    o.connect(g); g.connect(this.master);
    o.start(now); o.stop(now + 0.36);
  }

  jump() {
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(220, now);
    o.frequency.exponentialRampToValueAtTime(520, now + 0.22);
    g.gain.setValueAtTime(0.001, now);
    g.gain.linearRampToValueAtTime(0.18, now + 0.03);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.26);
    o.connect(g); g.connect(this.master);
    o.start(now); o.stop(now + 0.28);
  }

  punch() {
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = 'triangle';
    o.frequency.setValueAtTime(340, now);
    o.frequency.exponentialRampToValueAtTime(110, now + 0.09);
    g.gain.setValueAtTime(0.001, now);
    g.gain.linearRampToValueAtTime(0.15, now + 0.015);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.11);
    o.connect(g); g.connect(this.master);
    o.start(now); o.stop(now + 0.12);
  }

  hitNpc(isKO = false) {
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(isKO ? 175 : 210, now);
    o.frequency.exponentialRampToValueAtTime(isKO ? 36 : 58, now + (isKO ? 0.18 : 0.11));
    g.gain.setValueAtTime(isKO ? 0.34 : 0.24, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + (isKO ? 0.20 : 0.12));
    o.connect(g); g.connect(this.master);
    o.start(now); o.stop(now + (isKO ? 0.22 : 0.14));

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
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(140, now);
    o.frequency.exponentialRampToValueAtTime(48, now + 0.09);
    g.gain.setValueAtTime(0.22, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.11);
    o.connect(g); g.connect(this.master);
    o.start(now); o.stop(now + 0.12);
  }
}
