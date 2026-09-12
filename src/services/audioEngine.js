/**
 * Web Audio API Synthesizer Engine
 */
class AudioEngineService {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }

  init() {
    if (!this.ctx && typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext)) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
  }

  setMuted(muted) {
    this.muted = muted;
    if (!muted) {
      this.playBeep(880, 0.05, 'sine', 0.1);
    }
  }

  playBeep(freq = 440, duration = 0.1, type = 'sine', gainVal = 0.15) {
    if (this.muted) return;
    try {
      this.init();
      if (!this.ctx) return;
      if (this.ctx.state === 'suspended') this.ctx.resume();

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch {
      // Audio gracefully ignored if unavailable
    }
  }

  playTripAlarm() {
    if (this.muted) return;
    this.playBeep(987, 0.18, 'sawtooth', 0.25);
    setTimeout(() => this.playBeep(659, 0.25, 'sawtooth', 0.3), 120);
  }
}

export const audioEngine = new AudioEngineService();
