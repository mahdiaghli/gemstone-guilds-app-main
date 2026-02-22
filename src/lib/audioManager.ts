// صدا و موسیقی مدیریت - Audio Manager

type AudioType = 'takeTokens' | 'buyCard' | 'reserveCard' | 'nobleVisit' | 'endGame' | 'notification';

class AudioManager {
  private audioContext: AudioContext | null = null;
  private bgMusicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
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

  // ایجاد صدای ساده - Simple tone generation
  playTone(frequency: number, duration: number, type: 'sine' | 'triangle' = 'sine') {
    if (!this.soundEffectsEnabled) return;

    try {
      const ctx = this.getAudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      if (this.sfxGain) gain.connect(this.sfxGain);

      osc.frequency.value = frequency;
      osc.type = type;

      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      // خاموش در صورت خطا
    }
  }

  // صدای توکن برداشت - Take token sound
  playTokenSound() {
    if (!this.soundEffectsEnabled) return;
    // صدای خوش‌آمدگویی کوتاه
    this.playTone(523, 0.1); // C5
    setTimeout(() => this.playTone(659, 0.1), 50); // E5
  }

  // صدای خرید کارت - Buy card sound
  playBuySound() {
    if (!this.soundEffectsEnabled) return;
    this.playTone(659, 0.15); // E5
    setTimeout(() => this.playTone(784, 0.15), 75); // G5
    setTimeout(() => this.playTone(1047, 0.2), 150); // C6
  }

  // صدای رزرو - Reserve card sound
  playReserveSound() {
    if (!this.soundEffectsEnabled) return;
    this.playTone(440, 0.1); // A4
    setTimeout(() => this.playTone(440, 0.1), 50); // A4
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

  public setBackgroundMusicEnabled(enabled: boolean) {
    this.backgroundMusicEnabled = enabled;
    localStorage.setItem('splendor-bg-music', enabled ? 'true' : 'false');
  }

  public setSoundEffectsEnabled(enabled: boolean) {
    this.soundEffectsEnabled = enabled;
    localStorage.setItem('splendor-sfx', enabled ? 'true' : 'false');
  }
}

export const audioManager = new AudioManager();
