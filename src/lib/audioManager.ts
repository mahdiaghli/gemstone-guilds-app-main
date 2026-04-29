// صدا و موسیقی مدیریت - Audio Manager

type AudioType = 'takeTokens' | 'buyCard' | 'reserveCard' | 'nobleVisit' | 'endGame' | 'notification';

class AudioManager {
  private audioContext: AudioContext | null = null;
  private bgMusicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private bgOscillators: OscillatorNode[] = [];
  private bgInterval: number | null = null;
  public backgroundMusicEnabled: boolean;
  public soundEffectsEnabled: boolean;

  constructor() {
    this.backgroundMusicEnabled = localStorage.getItem('splendor-bg-music') !== 'false';
    this.soundEffectsEnabled = localStorage.getItem('splendor-sfx') !== 'false';
  }

  private getAudioContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return this.audioContext;
  }

  private ensureGains() {
    const ctx = this.getAudioContext();
    if (!this.bgMusicGain) {
      this.bgMusicGain = ctx.createGain();
      this.bgMusicGain.gain.value = 0.08;
      this.bgMusicGain.connect(ctx.destination);
    }
    if (!this.sfxGain) {
      this.sfxGain = ctx.createGain();
      this.sfxGain.gain.value = 0.9;
      this.sfxGain.connect(ctx.destination);
    }
  }

  // ایجاد صدای ساده - Simple tone generation
  playTone(frequency: number, duration: number, type: 'sine' | 'triangle' = 'sine') {
    if (!this.soundEffectsEnabled) return;

    try {
      const ctx = this.getAudioContext();
      this.ensureGains();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(this.sfxGain!);

      osc.frequency.value = frequency;
      osc.type = type;

      gain.gain.setValueAtTime(0.001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      // خاموش در صورت خطا
    }
  }

  private playNoise(duration: number, gainValue: number) {
    if (!this.soundEffectsEnabled) return;
    try {
      const ctx = this.getAudioContext();
      this.ensureGains();

      const bufferSize = Math.floor(ctx.sampleRate * duration);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * 0.6;

      const src = ctx.createBufferSource();
      src.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 1200;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(gainValue, ctx.currentTime + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

      src.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain!);
      src.start();
      src.stop(ctx.currentTime + duration);
    } catch {}
  }

  // صدای توکن برداشت - Take token sound
  playTokenSound() {
    if (!this.soundEffectsEnabled) return;
    this.playNoise(0.06, 0.03);
    this.playTone(740, 0.08, 'triangle');
    setTimeout(() => this.playTone(988, 0.08, 'triangle'), 40);
  }

  // صدای خرید کارت - Buy card sound
  playBuySound() {
    if (!this.soundEffectsEnabled) return;
    this.playNoise(0.05, 0.02);
    this.playTone(659, 0.12, 'triangle'); // E5
    setTimeout(() => this.playTone(784, 0.12, 'triangle'), 60); // G5
    setTimeout(() => this.playTone(1047, 0.18, 'sine'), 120); // C6
  }

  // صدای رزرو - Reserve card sound
  playReserveSound() {
    if (!this.soundEffectsEnabled) return;
    this.playNoise(0.07, 0.02);
    this.playTone(440, 0.1, 'triangle'); // A4
    setTimeout(() => this.playTone(392, 0.12, 'triangle'), 60); // G4
  }

  // صدای شاهزاده - Noble visit sound
  playNobleSound() {
    if (!this.soundEffectsEnabled) return;
    this.playTone(880, 0.2); // A5
    setTimeout(() => this.playTone(1047, 0.2), 100); // C6
    setTimeout(() => this.playTone(1318, 0.3), 200); // E6
  }

  // صدای انتهای بازی - Game end sound
  playVictorySound() {
    if (!this.soundEffectsEnabled) return;
    const tones = [
      { freq: 523, delay: 0 },
      { freq: 659, delay: 100 },
      { freq: 784, delay: 200 },
      { freq: 1047, delay: 300 },
    ];
    tones.forEach(tone => {
      setTimeout(() => this.playTone(tone.freq, 0.3), tone.delay);
    });
  }

  // صدای خطا - Error sound
  playErrorSound() {
    if (!this.soundEffectsEnabled) return;
    this.playTone(262, 0.2); // C4
    setTimeout(() => this.playTone(196, 0.2), 100); // G3
  }

  public playSound(type: AudioType) {
    switch (type) {
      case 'takeTokens':
        this.playTokenSound();
        break;
      case 'buyCard':
        this.playBuySound();
        break;
      case 'reserveCard':
        this.playReserveSound();
        break;
      case 'nobleVisit':
        this.playNobleSound();
        break;
      case 'endGame':
        this.playVictorySound();
        break;
      case 'notification':
        this.playTokenSound();
        break;
    }
  }

  public startBackgroundMusic() {
    if (!this.backgroundMusicEnabled) return;
    try {
      const ctx = this.getAudioContext();
      this.ensureGains();

      // AudioContext might be suspended until user interaction.
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }

      if (this.bgInterval || this.bgOscillators.length > 0) return;

      const chordProgression = [
        [220, 277.18, 329.63], // A minor-ish
        [196, 246.94, 293.66], // G major-ish
        [174.61, 220, 261.63], // F major-ish
        [196, 246.94, 293.66], // back to G
      ];

      let step = 0;
      const playChord = () => {
        // Stop previous oscillators
        this.bgOscillators.forEach((o) => {
          try { o.stop(); } catch {}
        });
        this.bgOscillators = [];

        const freqs = chordProgression[step % chordProgression.length];
        step += 1;

        freqs.forEach((f, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = i === 0 ? 'sine' : 'triangle';
          osc.frequency.value = f;
          gain.gain.setValueAtTime(0.0001, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.10, ctx.currentTime + 0.06);
          gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 3.8);
          osc.connect(gain);
          gain.connect(this.bgMusicGain!);
          osc.start();
          osc.stop(ctx.currentTime + 4.0);
          this.bgOscillators.push(osc);
        });
      };

      playChord();
      this.bgInterval = window.setInterval(playChord, 4000);
    } catch {}
  }

  public stopBackgroundMusic() {
    if (this.bgInterval) {
      clearInterval(this.bgInterval);
      this.bgInterval = null;
    }
    this.bgOscillators.forEach((o) => {
      try { o.stop(); } catch {}
    });
    this.bgOscillators = [];
  }

  public setBackgroundMusicEnabled(enabled: boolean) {
    this.backgroundMusicEnabled = enabled;
    localStorage.setItem('splendor-bg-music', enabled ? 'true' : 'false');
    if (enabled) this.startBackgroundMusic();
    else this.stopBackgroundMusic();
  }

  public setSoundEffectsEnabled(enabled: boolean) {
    this.soundEffectsEnabled = enabled;
    localStorage.setItem('splendor-sfx', enabled ? 'true' : 'false');
  }
}

export const audioManager = new AudioManager();
