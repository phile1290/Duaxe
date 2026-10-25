class SoundSynthesizer {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private bgmTimer: number | null = null;
  private isBgmPlaying: boolean = false;
  private activeNodes: AudioNode[] = [];

  private getContext(): AudioContext | null {
    if (this.isMuted) return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.isMuted) {
      this.stopCelebrationMusic();
    }
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public isCelebrationMusicPlaying(): boolean {
    return this.isBgmPlaying && !this.isMuted;
  }

  // Tiếng động cơ / xuất phát hào hứng
  public playEngineRev(): void {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';

      const now = ctx.currentTime;
      osc.frequency.setValueAtTime(80, now);
      osc.frequency.exponentialRampToValueAtTime(220, now + 0.2);
      osc.frequency.exponentialRampToValueAtTime(110, now + 0.45);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.45);
    } catch (e) {
      // Audio not permitted yet
    }
  }

  // Tiếng trả lời đúng (Chuông ngân vui tươi C - E - G - C5)
  public playCorrect(): void {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const start = ctx.currentTime + idx * 0.08;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(0.2, start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(start);
        osc.stop(start + 0.36);
      });
    } catch (e) {}
  }

  // Tiếng trả lời sai
  public playWrong(): void {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.linearRampToValueAtTime(90, now + 0.3);

      gain.gain.setValueAtTime(0.22, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.35);
    } catch (e) {}
  }

  // Hiệu ứng COMBO TĂNG TỐC
  public playNitro(): void {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.exponentialRampToValueAtTime(1200, now + 0.6);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.8);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.8);

      const bufferSize = ctx.sampleRate * 0.6;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(800, now);
      filter.frequency.exponentialRampToValueAtTime(3000, now + 0.5);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.18, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(ctx.destination);

      noise.start(now);
      noise.stop(now + 0.6);
    } catch (e) {}
  }

  // Kèn chiến thắng (Victory Fanfare) + Khởi động nhạc nền sôi động
  public playVictory(): void {
    this.startCelebrationMusic();
  }

  // Nhạc nền chiến thắng sôi động (Upbeat Celebration Fanfare & Dance Loop)
  public startCelebrationMusic(): void {
    this.stopCelebrationMusic();
    if (this.isMuted) return;

    const ctx = this.getContext();
    if (!ctx) return;

    this.isBgmPlaying = true;

    const playLoopIteration = () => {
      if (!this.isBgmPlaying || this.isMuted) return;
      const audioCtx = this.getContext();
      if (!audioCtx) return;

      try {
        const now = audioCtx.currentTime + 0.03;
        const step = 0.22; // ~136 BPM upbeat tempo (16 steps = 3.52s per bar loop)

        // Giai điệu chính hào hứng, tươi vui (C major -> G major -> A minor -> F major -> G major -> C major)
        const leadNotes: { stepIdx: number; freq: number; dur: number }[] = [
          // Bar 1: C Major fanfare
          { stepIdx: 0, freq: 523.25, dur: 0.18 },  // C5
          { stepIdx: 1, freq: 659.25, dur: 0.18 },  // E5
          { stepIdx: 2, freq: 783.99, dur: 0.18 },  // G5
          { stepIdx: 3, freq: 1046.5, dur: 0.38 },  // C6
          { stepIdx: 5, freq: 783.99, dur: 0.18 },  // G5
          { stepIdx: 6, freq: 1046.5, dur: 0.38 },  // C6
          // Bar 2: F & G uplifting progression
          { stepIdx: 8, freq: 880.0, dur: 0.2 },    // A5
          { stepIdx: 9, freq: 1046.5, dur: 0.2 },   // C6
          { stepIdx: 10, freq: 987.77, dur: 0.2 },  // B5
          { stepIdx: 11, freq: 783.99, dur: 0.2 },  // G5
          { stepIdx: 12, freq: 1174.66, dur: 0.22 },// D6
          { stepIdx: 13, freq: 987.77, dur: 0.2 },  // B5
          { stepIdx: 14, freq: 1046.5, dur: 0.42 }, // C6
        ];

        // Bassline sôi động
        const bassNotes: { stepIdx: number; freq: number; dur: number }[] = [
          { stepIdx: 0, freq: 130.81, dur: 0.35 },  // C3
          { stepIdx: 2, freq: 196.0, dur: 0.35 },   // G3
          { stepIdx: 4, freq: 130.81, dur: 0.35 },  // C3
          { stepIdx: 6, freq: 196.0, dur: 0.35 },   // G3
          { stepIdx: 8, freq: 174.61, dur: 0.35 },  // F3
          { stepIdx: 10, freq: 196.0, dur: 0.35 },  // G3
          { stepIdx: 12, freq: 196.0, dur: 0.35 },  // G3
          { stepIdx: 14, freq: 130.81, dur: 0.4 },  // C3
        ];

        // Hợp âm đệm rộn ràng (Chords)
        const chordHits: { stepIdx: number; freqs: number[]; dur: number }[] = [
          { stepIdx: 0, freqs: [261.63, 329.63, 392.0], dur: 0.35 },
          { stepIdx: 3, freqs: [261.63, 329.63, 392.0], dur: 0.3 },
          { stepIdx: 6, freqs: [261.63, 329.63, 392.0], dur: 0.35 },
          { stepIdx: 8, freqs: [349.23, 440.0, 523.25], dur: 0.35 },
          { stepIdx: 11, freqs: [392.0, 493.88, 587.33], dur: 0.3 },
          { stepIdx: 14, freqs: [261.63, 329.63, 523.25], dur: 0.4 },
        ];

        // Phát Lead Melody
        leadNotes.forEach((n) => {
          const t = now + n.stepIdx * step;
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(n.freq, t);

          gain.gain.setValueAtTime(0.001, t);
          gain.gain.linearRampToValueAtTime(0.18, t + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, t + n.dur);

          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.start(t);
          osc.stop(t + n.dur + 0.02);
          this.activeNodes.push(osc);
        });

        // Phát Bassline
        bassNotes.forEach((b) => {
          const t = now + b.stepIdx * step;
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(b.freq, t);

          gain.gain.setValueAtTime(0.001, t);
          gain.gain.linearRampToValueAtTime(0.1, t + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, t + b.dur);

          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.start(t);
          osc.stop(t + b.dur + 0.02);
          this.activeNodes.push(osc);
        });

        // Phát Chords
        chordHits.forEach((c) => {
          const t = now + c.stepIdx * step;
          c.freqs.forEach((f) => {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(f, t);

            gain.gain.setValueAtTime(0.001, t);
            gain.gain.linearRampToValueAtTime(0.06, t + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, t + c.dur);

            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start(t);
            osc.stop(t + c.dur + 0.02);
            this.activeNodes.push(osc);
          });
        });

        // Nhịp trống vui nhộn (Kick & Hi-hat mỗi nhịp)
        for (let i = 0; i < 16; i += 2) {
          const t = now + i * step;
          const kickOsc = audioCtx.createOscillator();
          const kickGain = audioCtx.createGain();
          kickOsc.type = 'sine';
          kickOsc.frequency.setValueAtTime(130, t);
          kickOsc.frequency.exponentialRampToValueAtTime(42, t + 0.12);
          kickGain.gain.setValueAtTime(0.16, t);
          kickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
          kickOsc.connect(kickGain);
          kickGain.connect(audioCtx.destination);
          kickOsc.start(t);
          kickOsc.stop(t + 0.15);
          this.activeNodes.push(kickOsc);
        }
      } catch (e) {}
    };

    playLoopIteration();
    this.bgmTimer = window.setInterval(playLoopIteration, 3520);
  }

  public stopCelebrationMusic(): void {
    this.isBgmPlaying = false;
    if (this.bgmTimer !== null) {
      clearInterval(this.bgmTimer);
      this.bgmTimer = null;
    }
    this.activeNodes.forEach((node) => {
      try {
        (node as OscillatorNode).stop?.();
        node.disconnect();
      } catch {}
    });
    this.activeNodes = [];
  }
}

export const sound = new SoundSynthesizer();
