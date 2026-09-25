/**
 * Procedural Web Audio API sound generator & arcade background synth
 * Runs entirely in-browser with zero external audio assets required.
 */

class SoundSystem {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private isMuted: boolean = false;
  private musicEnabled: boolean = true;
  private musicInterval: number | null = null;
  private musicStep: number = 0;

  constructor() {
    // Lazy initialized on first user gesture
  }

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.9;

      // Dynamics compressor for punchy, distortion-free arcade mix
      const compressor = this.ctx.createDynamicsCompressor();
      compressor.threshold.setValueAtTime(-14, this.ctx.currentTime);
      compressor.knee.setValueAtTime(10, this.ctx.currentTime);
      compressor.ratio.setValueAtTime(4, this.ctx.currentTime);
      compressor.attack.setValueAtTime(0.005, this.ctx.currentTime);
      compressor.release.setValueAtTime(0.1, this.ctx.currentTime);

      this.masterGain.connect(compressor);
      compressor.connect(this.ctx.destination);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = 0.65;
      this.sfxGain.connect(this.masterGain);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = 0.58; // Significantly louder music mix
      this.musicGain.connect(this.masterGain);
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(muted ? 0 : 0.9, this.ctx.currentTime);
    }
  }

  public toggleMusic(): boolean {
    this.musicEnabled = !this.musicEnabled;
    if (!this.musicEnabled) {
      this.stopMusic();
    } else {
      this.startMusic(this.activeTrack);
    }
    return this.musicEnabled;
  }

  public isMusicPlaying(): boolean {
    return this.musicEnabled;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  // --- Sound Effects ---

  public playJump() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    const now = this.ctx.currentTime;
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(450, now + 0.12);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.12);
  }

  public playDoubleJump() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    const now = this.ctx.currentTime;
    osc.frequency.setValueAtTime(350, now);
    osc.frequency.exponentialRampToValueAtTime(700, now + 0.14);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.14);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.14);
  }

  public playFireball() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;

    // Pitch sweep whoosh
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(180, now + 0.18);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);

    // Noise crackle
    const bufferSize = this.ctx.sampleRate * 0.15;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1200, now);
    filter.frequency.exponentialRampToValueAtTime(400, now + 0.15);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.15, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.18);
    noise.start(now);
    noise.stop(now + 0.15);
  }

  public playMegaFireball() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(90, now + 0.35);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.35);
  }

  public playExplosion() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;
    const bufferSize = this.ctx.sampleRate * 0.25;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.4));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(500, now);
    filter.frequency.exponentialRampToValueAtTime(60, now + 0.25);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.45, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start(now);
    noise.stop(now + 0.25);
  }

  public playCoin() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';

    osc.frequency.setValueAtTime(987.77, now); // B5
    osc.frequency.setValueAtTime(1318.51, now + 0.08); // E6

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.22);
  }

  public playGem() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      const now = this.ctx.currentTime + idx * 0.05;
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.005, now + 0.15);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.15);
    });
  }

  public playHurt() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(90, now + 0.18);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.18);
  }

  public playEnemyPoof() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(70, now + 0.15);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.15);
  }

  public playFizzle() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.linearRampToValueAtTime(70, now + 0.12);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.12);
  }

  public playSpring() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.exponentialRampToValueAtTime(650, now + 0.2);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.22);
  }

  public playCheckpoint() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const chord = [440, 554.37, 659.25, 880];
    chord.forEach((freq, i) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      const now = this.ctx.currentTime + i * 0.06;
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.005, now + 0.35);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.35);
    });
  }

  public playLevelClear() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const fanfare = [
      { f: 523.25, d: 0.12 },
      { f: 659.25, d: 0.12 },
      { f: 783.99, d: 0.12 },
      { f: 1046.5, d: 0.35 },
    ];
    let offset = 0;
    fanfare.forEach((n) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      const now = this.ctx.currentTime + offset;
      osc.frequency.setValueAtTime(n.f, now);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + n.d);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + n.d);
      offset += n.d * 0.85;
    });
  }

  // --- Multi-Track Background Arcade Synth Tracks ---

  private activeTrack: 'TITLE' | 1 | 2 | 3 = 'TITLE';
  private crossfadeTimer: number | null = null;
  private readonly TARGET_MUSIC_VOLUME = 0.58;

  public startMusic(track: 'TITLE' | number = 'TITLE') {
    this.switchChapterMusic(track);
  }

  public switchChapterMusic(track: 'TITLE' | number) {
    if (!this.musicEnabled) return;
    this.initContext();
    if (!this.ctx || !this.musicGain) return;

    const normalizedTrack: 'TITLE' | 1 | 2 | 3 =
      track === 'TITLE' ? 'TITLE' : track === 2 ? 2 : track === 3 ? 3 : 1;

    // If already playing this track, don't restart
    if (this.musicInterval && this.activeTrack === normalizedTrack) {
      return;
    }

    if (this.crossfadeTimer) {
      clearTimeout(this.crossfadeTimer);
      this.crossfadeTimer = null;
    }

    const now = this.ctx.currentTime;
    const fadeOutDuration = 0.35; // 350ms fade-out of current song
    const fadeInDuration = 0.45;  // 450ms fade-in of upcoming song

    if (this.musicInterval) {
      // Current song quiets down smoothly
      this.musicGain.gain.setValueAtTime(this.musicGain.gain.value, now);
      this.musicGain.gain.linearRampToValueAtTime(0.001, now + fadeOutDuration);

      // Once quieting finishes, start new song from quiet and ramp up
      this.crossfadeTimer = window.setTimeout(() => {
        this.stopMusicInternal();
        this.activeTrack = normalizedTrack;
        this.startMusicInternal(normalizedTrack);

        if (this.ctx && this.musicGain) {
          const startNow = this.ctx.currentTime;
          this.musicGain.gain.setValueAtTime(0.001, startNow);
          this.musicGain.gain.linearRampToValueAtTime(this.TARGET_MUSIC_VOLUME, startNow + fadeInDuration);
        }
        this.crossfadeTimer = null;
      }, fadeOutDuration * 1000);
    } else {
      // Starting from cold silence: start track and smoothly ramp volume up from quiet
      this.stopMusicInternal();
      this.activeTrack = normalizedTrack;
      this.musicGain.gain.setValueAtTime(0.001, now);
      this.startMusicInternal(normalizedTrack);
      this.musicGain.gain.linearRampToValueAtTime(this.TARGET_MUSIC_VOLUME, now + fadeInDuration);
    }
  }

  private startMusicInternal(normalizedTrack: 'TITLE' | 1 | 2 | 3) {
    if (!this.ctx || !this.musicGain) return;
    this.musicStep = 0;

    // --- TRACK DEFINITIONS ---

    // 1. TITLE SCREEN: Regal, atmospheric, mystical knight theme (190ms / ~79 BPM)
    const titleMelody = [
      440, 0, 523.25, 587.33, 659.25, 0, 783.99, 659.25,
      587.33, 0, 523.25, 440, 392, 0, 440, 0,
      440, 523.25, 659.25, 880, 783.99, 659.25, 587.33, 523.25,
      659.25, 0, 587.33, 0, 440, 0, 0, 0,
    ];
    const titleBass = [
      110, 110, 110, 110, 130.81, 130.81, 130.81, 130.81,
      98, 98, 98, 98, 110, 110, 110, 110,
    ];

    // 2. CHAPTER 1 (Forest): Bouncy, adventurous, ancient canopy feel (155ms / ~97 BPM)
    const ch1Melody = [
      523.25, 0, 587.33, 659.25, 783.99, 659.25, 587.33, 0,
      523.25, 659.25, 587.33, 523.25, 440, 0, 392, 440,
      523.25, 0, 659.25, 783.99, 880, 0, 783.99, 659.25,
      587.33, 659.25, 523.25, 440, 523.25, 0, 0, 0,
    ];
    const ch1Bass = [
      130.81, 130.81, 130.81, 130.81, 164.81, 164.81, 164.81, 164.81,
      146.83, 146.83, 146.83, 146.83, 130.81, 130.81, 130.81, 130.81,
    ];

    // 3. CHAPTER 2 (Molten Caverns): Fast-paced, driving, subterranean lava rock (125ms / ~120 BPM)
    const ch2Melody = [
      293.66, 293.66, 349.23, 0, 392, 440, 392, 349.23,
      293.66, 0, 261.63, 293.66, 349.23, 392, 440, 0,
      523.25, 440, 392, 349.23, 392, 440, 523.25, 587.33,
      440, 392, 349.23, 293.66, 261.63, 0, 293.66, 0,
    ];
    const ch2Bass = [
      73.42, 73.42, 87.31, 87.31, 98, 98, 87.31, 73.42,
      73.42, 73.42, 82.41, 82.41, 73.42, 73.42, 65.41, 73.42,
    ];

    // 4. CHAPTER 3 (Obsidian Citadel / Boss): Epic 128-step multi-movement boss symphony (115ms / ~130 BPM)
    // Section 1: Gothic Citadel Infiltration (Steps 0-31) - Building suspense & tension
    const ch3Sec1 = [
      293.66, 0, 293.66, 349.23, 440, 0, 392, 349.23,
      329.63, 349.23, 392, 0, 329.63, 0, 277.18, 0,
      293.66, 293.66, 349.23, 440, 587.33, 0, 523.25, 466.16,
      440, 466.16, 440, 392, 349.23, 329.63, 293.66, 0,
    ];

    // Section 2: Wyrm's Wrath (Steps 32-63) - Rapid Phrygian runs, chromatic urgency
    const ch3Sec2 = [
      587.33, 622.25, 587.33, 440, 466.16, 523.25, 466.16, 392,
      440, 466.16, 440, 349.23, 392, 440, 392, 329.63,
      349.23, 392, 440, 587.33, 554.37, 587.33, 659.25, 698.46,
      659.25, 587.33, 554.37, 466.16, 440, 392, 349.23, 329.63,
    ];

    // Section 3: Dragon Counter-Assault (Steps 64-95) - Heroic leaps & soaring hooks
    const ch3Sec3 = [
      293.66, 440, 587.33, 0, 698.46, 0, 659.25, 587.33,
      523.25, 0, 392, 523.25, 659.25, 0, 587.33, 523.25,
      466.16, 0, 349.23, 466.16, 587.33, 0, 523.25, 466.16,
      440, 0, 277.18, 329.63, 440, 554.37, 659.25, 0,
    ];

    // Section 4: Climactic Battle Cadence (Steps 96-127) - Grand orchestral turnaround
    const ch3Sec4 = [
      698.46, 659.25, 587.33, 0, 783.99, 698.46, 659.25, 0,
      880, 0, 783.99, 698.46, 659.25, 698.46, 783.99, 659.25,
      587.33, 0, 440, 0, 349.23, 0, 293.66, 0,
      277.18, 329.63, 440, 554.37, 587.33, 659.25, 587.33, 0,
    ];

    const ch3Melody = [...ch3Sec1, ...ch3Sec2, ...ch3Sec3, ...ch3Sec4];

    // Chapter 3 multi-movement bassline (64 notes, 2 steps per note = 128 steps)
    const ch3Bass = [
      // Sec 1
      73.42, 73.42, 73.42, 87.31, 98.0, 98.0, 110.0, 110.0,
      73.42, 73.42, 58.27, 58.27, 49.0, 49.0, 55.0, 55.0,
      // Sec 2
      73.42, 77.78, 73.42, 73.42, 98.0, 98.0, 110.0, 110.0,
      58.27, 58.27, 65.41, 65.41, 73.42, 73.42, 55.0, 55.0,
      // Sec 3
      73.42, 73.42, 87.31, 87.31, 65.41, 65.41, 82.41, 82.41,
      58.27, 58.27, 73.42, 73.42, 55.0, 55.0, 69.30, 69.30,
      // Sec 4
      58.27, 58.27, 49.0, 49.0, 55.0, 55.0, 69.30, 69.30,
      73.42, 73.42, 87.31, 87.31, 55.0, 55.0, 73.42, 0,
    ];

    // Chapter 3 harmonic arpeggio layer (plays complementary counterpoints)
    const ch3Harmony = [
      // Sec 1
      0, 440, 0, 523.25, 0, 587.33, 0, 440,
      0, 392, 0, 440, 0, 349.23, 0, 277.18,
      0, 440, 0, 587.33, 0, 659.25, 0, 523.25,
      0, 466.16, 0, 440, 0, 392, 0, 293.66,
      // Sec 2
      0, 622.25, 0, 587.33, 0, 523.25, 0, 466.16,
      0, 440, 0, 392, 0, 349.23, 0, 329.63,
      0, 440, 0, 587.33, 0, 659.25, 0, 698.46,
      0, 659.25, 0, 587.33, 0, 554.37, 0, 440,
      // Sec 3
      0, 587.33, 0, 698.46, 0, 659.25, 0, 587.33,
      0, 523.25, 0, 659.25, 0, 587.33, 0, 523.25,
      0, 466.16, 0, 587.33, 0, 523.25, 0, 466.16,
      0, 440, 0, 554.37, 0, 659.25, 0, 440,
      // Sec 4
      0, 698.46, 0, 783.99, 0, 880, 0, 783.99,
      0, 698.46, 0, 659.25, 0, 587.33, 0, 523.25,
      0, 440, 0, 349.23, 0, 293.66, 0, 277.18,
      0, 329.63, 0, 440, 0, 554.37, 0, 293.66,
    ];

    let melody = titleMelody;
    let bass = titleBass;
    let tempoMs = 190;
    let leadType: OscillatorType = 'triangle';

    if (normalizedTrack === 1) {
      melody = ch1Melody;
      bass = ch1Bass;
      tempoMs = 155;
      leadType = 'square';
    } else if (normalizedTrack === 2) {
      melody = ch2Melody;
      bass = ch2Bass;
      tempoMs = 125;
      leadType = 'sawtooth';
    } else if (normalizedTrack === 3) {
      melody = ch3Melody;
      bass = ch3Bass;
      tempoMs = 115; // Dynamic, agile boss tempo
      leadType = 'sawtooth';
    }

    this.musicInterval = window.setInterval(() => {
      if (this.isMuted || !this.musicEnabled || !this.ctx || !this.musicGain) return;

      const now = this.ctx.currentTime;
      const note = melody[this.musicStep % melody.length];
      const bassNote = bass[Math.floor(this.musicStep / 2) % bass.length];

      // Play lead note
      if (note > 0) {
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = leadType;
        osc.frequency.setValueAtTime(note, now);
        const volume = leadType === 'sawtooth' ? 0.12 : leadType === 'square' ? 0.14 : 0.16;
        g.gain.setValueAtTime(volume, now);
        g.gain.exponentialRampToValueAtTime(0.01, now + tempoMs * 0.001 * 0.95);
        osc.connect(g);
        g.connect(this.musicGain);
        osc.start(now);
        osc.stop(now + tempoMs * 0.001);
      }

      // Play bass pulse
      if (this.musicStep % 2 === 0 && bassNote > 0) {
        const bassOsc = this.ctx.createOscillator();
        const bassG = this.ctx.createGain();
        bassOsc.type = normalizedTrack === 3 ? 'sawtooth' : normalizedTrack === 2 ? 'sawtooth' : 'triangle';
        bassOsc.frequency.setValueAtTime(bassNote, now);
        bassG.gain.setValueAtTime(normalizedTrack === 3 ? 0.24 : normalizedTrack === 2 ? 0.22 : 0.26, now);
        bassG.gain.exponentialRampToValueAtTime(0.015, now + (tempoMs * 2) * 0.001 * 0.9);
        bassOsc.connect(bassG);
        bassG.connect(this.musicGain);
        bassOsc.start(now);
        bassOsc.stop(now + (tempoMs * 2) * 0.001);
      }

      // Chapter 3 Exclusive Layers: Dynamic Arcade Drums & Counter-Harmony
      if (normalizedTrack === 3) {
        const stepIn16 = this.musicStep % 16;
        const totalStep = this.musicStep % 128;

        // 1. Chiptune Kick Pulse (Solid punch on beats 0, 6, 8, 14)
        const isKick = stepIn16 === 0 || stepIn16 === 6 || stepIn16 === 8 || stepIn16 === 14;
        if (isKick) {
          const kickOsc = this.ctx.createOscillator();
          const kickG = this.ctx.createGain();
          kickOsc.type = 'sine';
          kickOsc.frequency.setValueAtTime(140, now);
          kickOsc.frequency.exponentialRampToValueAtTime(38, now + 0.075);
          kickG.gain.setValueAtTime(0.24, now);
          kickG.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
          kickOsc.connect(kickG);
          kickG.connect(this.musicGain);
          kickOsc.start(now);
          kickOsc.stop(now + 0.085);
        }

        // 2. Chiptune Snare / Noise Clap (Backbeat on beats 4 and 12, plus fill on step 124-127)
        const isSnare = stepIn16 === 4 || stepIn16 === 12 || (totalStep >= 124);
        if (isSnare) {
          const bufferSize = Math.floor(this.ctx.sampleRate * 0.06);
          const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
          const data = buffer.getChannelData(0);
          for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
          }
          const noise = this.ctx.createBufferSource();
          noise.buffer = buffer;
          const filter = this.ctx.createBiquadFilter();
          filter.type = 'highpass';
          filter.frequency.setValueAtTime(1000, now);
          const snareG = this.ctx.createGain();
          snareG.gain.setValueAtTime(0.12, now);
          snareG.gain.exponentialRampToValueAtTime(0.01, now + 0.06);
          noise.connect(filter);
          filter.connect(snareG);
          snareG.connect(this.musicGain);
          noise.start(now);
          noise.stop(now + 0.065);
        }

        // 3. Crisp Hi-Hat Ticks
        const isHat = stepIn16 % 2 === 0 && !isSnare;
        if (isHat) {
          const bufferSize = Math.floor(this.ctx.sampleRate * 0.025);
          const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
          const data = buffer.getChannelData(0);
          for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
          }
          const noise = this.ctx.createBufferSource();
          noise.buffer = buffer;
          const filter = this.ctx.createBiquadFilter();
          filter.type = 'highpass';
          filter.frequency.setValueAtTime(4500, now);
          const hatG = this.ctx.createGain();
          hatG.gain.setValueAtTime(0.05, now);
          hatG.gain.exponentialRampToValueAtTime(0.005, now + 0.025);
          noise.connect(filter);
          filter.connect(hatG);
          hatG.connect(this.musicGain);
          noise.start(now);
          noise.stop(now + 0.03);
        }

        // 4. Harmonic Counter-Arpeggio Layer
        const harmNote = ch3Harmony[this.musicStep % ch3Harmony.length];
        if (harmNote > 0) {
          const harmOsc = this.ctx.createOscillator();
          const harmG = this.ctx.createGain();
          harmOsc.type = 'triangle';
          harmOsc.frequency.setValueAtTime(harmNote, now);
          harmG.gain.setValueAtTime(0.075, now);
          harmG.gain.exponentialRampToValueAtTime(0.008, now + tempoMs * 0.001 * 0.85);
          harmOsc.connect(harmG);
          harmG.connect(this.musicGain);
          harmOsc.start(now);
          harmOsc.stop(now + tempoMs * 0.001);
        }
      }

      this.musicStep++;
    }, tempoMs);
  }

  private stopMusicInternal() {
    if (this.musicInterval) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
  }

  public stopMusic() {
    if (this.crossfadeTimer) {
      clearTimeout(this.crossfadeTimer);
      this.crossfadeTimer = null;
    }
    this.stopMusicInternal();
  }
}

export const soundManager = new SoundSystem();
