// Web Audio API Procedural Synthesizer for Firearms & Bureau Atmosphere

class SoundManager {
  private ctx: AudioContext | null = null;
  public sfxMuted: boolean = false;
  public musicMuted: boolean = false;
  public sfxVolume: number = 0.8;
  public musicVolume: number = 0.45;

  // Music generative nodes
  private musicGain: GainNode | null = null;
  private musicInterval: number | null = null;
  public isMusicPlaying: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('kb_audio_settings');
        if (saved) {
          const parsed = JSON.parse(saved);
          this.sfxMuted = parsed.sfxMuted ?? false;
          this.musicMuted = parsed.musicMuted ?? false;
          this.sfxVolume = parsed.sfxVolume ?? 0.8;
          this.musicVolume = parsed.musicVolume ?? 0.45;
        }
      } catch {
        // fallback
      }
    }
  }

  private saveSettings(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(
        'kb_audio_settings',
        JSON.stringify({
          sfxMuted: this.sfxMuted,
          musicMuted: this.musicMuted,
          sfxVolume: this.sfxVolume,
          musicVolume: this.musicVolume,
        })
      );
    } catch {
      // ignore
    }
  }

  public getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  // --- Volume & Mute Controls ---
  setSfxVolume(vol: number): void {
    this.sfxVolume = Math.max(0, Math.min(1, vol));
    this.saveSettings();
  }

  setMusicVolume(vol: number): void {
    this.musicVolume = Math.max(0, Math.min(1, vol));
    if (this.musicGain && this.ctx) {
      this.musicGain.gain.setValueAtTime(
        this.musicMuted ? 0 : this.musicVolume * 0.35,
        this.ctx.currentTime
      );
    }
    this.saveSettings();
  }

  toggleSfxMute(): boolean {
    this.sfxMuted = !this.sfxMuted;
    this.saveSettings();
    return this.sfxMuted;
  }

  toggleMusicMute(): boolean {
    this.musicMuted = !this.musicMuted;
    if (this.musicGain && this.ctx) {
      this.musicGain.gain.setValueAtTime(
        this.musicMuted ? 0 : this.musicVolume * 0.35,
        this.ctx.currentTime
      );
    }
    if (!this.musicMuted && !this.isMusicPlaying) {
      this.startMusic();
    } else if (this.musicMuted && this.isMusicPlaying) {
      this.stopMusic();
    }
    this.saveSettings();
    return this.musicMuted;
  }

  // --- Background Generative Bureau Ambient Music ---
  // Industrial, retro-technological ambiance with analog pads and subtle typewriter cadence
  startMusic(): void {
    if (this.isMusicPlaying) return;
    if (this.musicMuted) return;

    const ctx = this.getContext();
    if (!ctx) return;

    this.isMusicPlaying = true;
    this.musicGain = ctx.createGain();
    this.musicGain.gain.setValueAtTime(this.musicVolume * 0.35, ctx.currentTime);
    this.musicGain.connect(ctx.destination);

    // Harmonic minor progressions: Dm, Bb, Gm, A7 - authentic tense bureau atmosphere
    const chords = [
      [146.83, 220.0, 261.63, 349.23], // Dm (D3, A3, C4, F4)
      [116.54, 174.61, 233.08, 293.66], // Bb (Bb2, F3, Bb3, D4)
      [98.0, 146.83, 220.0, 293.66],    // Gm (G2, D3, A3, D4)
      [110.0, 164.81, 220.0, 277.18],   // A7 (A2, E3, A3, C#4)
    ];

    let chordIndex = 0;

    const playChordStep = () => {
      if (!this.isMusicPlaying || !this.ctx || !this.musicGain || this.musicMuted) return;
      const now = this.ctx.currentTime;
      const currentChord = chords[chordIndex];
      chordIndex = (chordIndex + 1) % chords.length;

      // 1. Warm Synth Pad Chords
      currentChord.forEach((freq, idx) => {
        try {
          const osc = this.ctx!.createOscillator();
          const subOsc = this.ctx!.createOscillator();
          const filter = this.ctx!.createBiquadFilter();
          const gain = this.ctx!.createGain();

          osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
          osc.frequency.setValueAtTime(freq, now);

          // Subtle detune for rich vintage synth warmth
          subOsc.type = 'sawtooth';
          subOsc.frequency.setValueAtTime(freq * 0.5, now);
          subOsc.detune.setValueAtTime((idx - 1.5) * 4, now);

          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(320 + idx * 60, now);
          filter.frequency.linearRampToValueAtTime(520, now + 3);
          filter.frequency.linearRampToValueAtTime(300, now + 6.5);

          const duration = 6.8;
          gain.gain.setValueAtTime(0.0001, now);
          gain.gain.linearRampToValueAtTime(0.045, now + 1.8);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

          osc.connect(filter);
          subOsc.connect(filter);
          filter.connect(gain);
          gain.connect(this.musicGain!);

          osc.start(now);
          subOsc.start(now);
          osc.stop(now + duration);
          subOsc.stop(now + duration);
        } catch {
          // fallback
        }
      });

      // 2. Subtle Clockwork / Machinery Rhythmic Pulse
      for (let i = 0; i < 4; i++) {
        try {
          const tickTime = now + i * 1.5;
          const tickOsc = this.ctx.createOscillator();
          const tickGain = this.ctx.createGain();
          tickOsc.type = 'triangle';
          tickOsc.frequency.setValueAtTime(800 + i * 120, tickTime);
          tickGain.gain.setValueAtTime(0.008, tickTime);
          tickGain.gain.exponentialRampToValueAtTime(0.0001, tickTime + 0.05);

          tickOsc.connect(tickGain);
          tickGain.connect(this.musicGain);
          tickOsc.start(tickTime);
          tickOsc.stop(tickTime + 0.05);
        } catch {
          // ignore
        }
      }
    };

    playChordStep();
    this.musicInterval = window.setInterval(playChordStep, 6000);
  }

  stopMusic(): void {
    if (this.musicInterval) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
    this.isMusicPlaying = false;
  }

  // --- Sound Effects (SFX) ---
  playMechanicalClick(): void {
    if (this.sfxMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(160, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(45, ctx.currentTime + 0.035);
      gain.gain.setValueAtTime(0.12 * this.sfxVolume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.035);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.035);
    } catch {
      // fallback
    }
  }

  playBoltCycle(): void {
    if (this.sfxMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      // First metallic stroke
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(340, now);
      osc1.frequency.exponentialRampToValueAtTime(90, now + 0.06);
      gain1.gain.setValueAtTime(0.09 * this.sfxVolume, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.06);

      // Heavy bolt slam home
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'square';
      osc2.frequency.setValueAtTime(480, now + 0.09);
      osc2.frequency.exponentialRampToValueAtTime(110, now + 0.16);
      gain2.gain.setValueAtTime(0.12 * this.sfxVolume, now + 0.09);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.09);
      osc2.stop(now + 0.16);
    } catch {
      // fallback
    }
  }

  // Paper blueprint rustle sound for resetting or opening new drawing
  playPaperRustle(): void {
    if (this.sfxMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const bufferSize = Math.floor(ctx.sampleRate * 0.14);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.sin((i / bufferSize) * Math.PI);
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(2400, now);
      filter.frequency.exponentialRampToValueAtTime(1200, now + 0.14);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.1 * this.sfxVolume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      noise.start(now);
      noise.stop(now + 0.14);
    } catch {
      // ignore
    }
  }

  playSuccess(): void {
    if (this.sfxMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const notes = [440, 554.37, 659.25]; // A4, C#5, E5
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.07);
        gain.gain.setValueAtTime(0.08 * this.sfxVolume, now + idx * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.22);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.07);
        osc.stop(now + idx * 0.07 + 0.22);
      });
    } catch {
      // ignore
    }
  }

  playCheatCodeSound(activated: boolean = true): void {
    if (this.sfxMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      if (activated) {
        // High-tech ascending terminal chimes
        const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'square';
          osc.frequency.setValueAtTime(freq, now + idx * 0.06);
          gain.gain.setValueAtTime(0.07 * this.sfxVolume, now + idx * 0.06);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.12);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.06);
          osc.stop(now + idx * 0.06 + 0.12);
        });
      } else {
        // Descending powered down tones
        const notes = [783.99, 659.25, 523.25, 392.0];
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(freq, now + idx * 0.06);
          gain.gain.setValueAtTime(0.07 * this.sfxVolume, now + idx * 0.06);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.12);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.06);
          osc.stop(now + idx * 0.06 + 0.12);
        });
      }
    } catch {
      // ignore
    }
  }

  playGunshot(suppressed: boolean = false): void {
    if (this.sfxMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const bufferSize = Math.floor(ctx.sampleRate * (suppressed ? 0.09 : 0.22));
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = suppressed ? 'lowpass' : 'bandpass';
      filter.frequency.setValueAtTime(suppressed ? 800 : 1800, now);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime((suppressed ? 0.09 : 0.35) * this.sfxVolume, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + (suppressed ? 0.08 : 0.22));

      whiteNoise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      whiteNoise.start(now);

      // Low frequency punch (sub-bass boom for unsuppressed)
      if (!suppressed) {
        const boomOsc = ctx.createOscillator();
        const boomGain = ctx.createGain();
        boomOsc.type = 'sine';
        boomOsc.frequency.setValueAtTime(140, now);
        boomOsc.frequency.exponentialRampToValueAtTime(30, now + 0.15);
        boomGain.gain.setValueAtTime(0.4 * this.sfxVolume, now);
        boomGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
        boomOsc.connect(boomGain);
        boomGain.connect(ctx.destination);
        boomOsc.start(now);
        boomOsc.stop(now + 0.18);
      }
    } catch {
      // fallback
    }
  }

  playSuccessChime(): void {
    if (this.sfxMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'triangle';
      osc2.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now); // D5
      osc1.frequency.setValueAtTime(880.0, now + 0.12); // A5
      osc2.frequency.setValueAtTime(880.0, now);
      osc2.frequency.setValueAtTime(1174.66, now + 0.12); // D6

      gain.gain.setValueAtTime(0.14 * this.sfxVolume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.45);
      osc2.stop(now + 0.45);
    } catch {
      // fallback
    }
  }

  playErrorSound(): void {
    if (this.sfxMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.setValueAtTime(110, now + 0.08);
      gain.gain.setValueAtTime(0.18 * this.sfxVolume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.22);
    } catch {
      // ignore
    }
  }

  // Convenient aliases
  playClick(): void {
    this.playMechanicalClick();
  }

  playCraft(): void {
    this.playSuccessChime();
  }

  playPaper(): void {
    this.playPaperRustle();
  }
}

export const sounds = new SoundManager();
