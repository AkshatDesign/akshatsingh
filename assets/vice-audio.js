/* ==========================================================================
   VICE CITY 3D — SYNTHESIZED V12 ENGINE, COLLISION CRUNCH & GTA SQUISH SFX
   ========================================================================== */
export class ViceAudioEngine {
  constructor() {
    this.ctx = null;
    this.enabled = false;
    this.engineGain = null;
    this.oscA = null;
    this.oscB = null;
    this.filter = null;
    this.driftGain = null;
  }

  init() {
    if (this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    const master = this.ctx.createGain();
    master.gain.value = 0.24;
    master.connect(this.ctx.destination);
    this.master = master;

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

    const buf = this.ctx.createBuffer(1, this.ctx.sampleRate * 1.5, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
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
  }

  setEnabled(flag) {
    this.enabled = flag;
    if (flag) {
      this.init();
      if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
    } else if (this.engineGain && this.ctx) {
      this.engineGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.08);
      if (this.driftGain) this.driftGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05);
    }
  }

  update(speedNorm, nitro, drifting) {
    if (!this.enabled || !this.ctx || !this.oscA) return;
    const now = this.ctx.currentTime;
    const gearPos = (speedNorm * 4.4) % 1;
    const baseFreq = 52 + speedNorm * 95 + gearPos * 42 + (nitro ? 28 : 0);
    this.oscA.frequency.setTargetAtTime(baseFreq, now, 0.05);
    this.oscB.frequency.setTargetAtTime(baseFreq * 1.99, now, 0.05);
    this.filter.frequency.setTargetAtTime(210 + speedNorm * 900 + (nitro ? 550 : 0), now, 0.06);
    this.engineGain.gain.setTargetAtTime(0.14 + speedNorm * 0.24 + (nitro ? 0.1 : 0), now, 0.06);
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
      o.connect(g);
      g.connect(this.master);
      o.start(now);
      o.stop(now + 0.36);
    });
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
    o.connect(g);
    g.connect(this.master);
    o.start(now);
    o.stop(now + 0.18);
  }

  squish() {
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    // Playful GTA squish thump + arcade cash chime
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
}
