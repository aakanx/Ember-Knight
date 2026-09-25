/**
 * Offline Audio Renderer & WAV Exporter for Ember Knight Soundtracks
 * Renders procedural Web Audio compositions into standard CD-quality 16-bit 44.1kHz Stereo WAV files
 */

// Boss Theme musical score definitions matching Chapter 3
const ch3Sec1 = [
  293.66, 0, 293.66, 349.23, 440, 0, 392, 349.23,
  329.63, 349.23, 392, 0, 329.63, 0, 277.18, 0,
  293.66, 293.66, 349.23, 440, 587.33, 0, 523.25, 466.16,
  440, 466.16, 440, 392, 349.23, 329.63, 293.66, 0,
];

const ch3Sec2 = [
  587.33, 622.25, 587.33, 440, 466.16, 523.25, 466.16, 392,
  440, 466.16, 440, 349.23, 392, 440, 392, 329.63,
  349.23, 392, 440, 587.33, 554.37, 587.33, 659.25, 698.46,
  659.25, 587.33, 554.37, 466.16, 440, 392, 349.23, 329.63,
];

const ch3Sec3 = [
  293.66, 440, 587.33, 0, 698.46, 0, 659.25, 587.33,
  523.25, 0, 392, 523.25, 659.25, 0, 587.33, 523.25,
  466.16, 0, 349.23, 466.16, 587.33, 0, 523.25, 466.16,
  440, 0, 277.18, 329.63, 440, 554.37, 659.25, 0,
];

const ch3Sec4 = [
  698.46, 659.25, 587.33, 0, 783.99, 698.46, 659.25, 0,
  880, 0, 783.99, 698.46, 659.25, 698.46, 783.99, 659.25,
  587.33, 0, 440, 0, 349.23, 0, 293.66, 0,
  277.18, 329.63, 440, 554.37, 587.33, 659.25, 587.33, 0,
];

const ch3Melody = [...ch3Sec1, ...ch3Sec2, ...ch3Sec3, ...ch3Sec4];

const ch3Bass = [
  73.42, 73.42, 73.42, 87.31, 98.0, 98.0, 110.0, 110.0,
  73.42, 73.42, 58.27, 58.27, 49.0, 49.0, 55.0, 55.0,
  73.42, 77.78, 73.42, 73.42, 98.0, 98.0, 110.0, 110.0,
  58.27, 58.27, 65.41, 65.41, 73.42, 73.42, 55.0, 55.0,
  73.42, 73.42, 87.31, 87.31, 65.41, 65.41, 82.41, 82.41,
  58.27, 58.27, 73.42, 73.42, 55.0, 55.0, 69.30, 69.30,
  58.27, 58.27, 49.0, 49.0, 55.0, 55.0, 69.30, 69.30,
  73.42, 73.42, 87.31, 87.31, 55.0, 55.0, 73.42, 0,
];

const ch3Harmony = [
  0, 440, 0, 523.25, 0, 587.33, 0, 440,
  0, 392, 0, 440, 0, 349.23, 0, 277.18,
  0, 440, 0, 587.33, 0, 659.25, 0, 523.25,
  0, 466.16, 0, 440, 0, 392, 0, 293.66,
  0, 622.25, 0, 587.33, 0, 523.25, 0, 466.16,
  0, 440, 0, 392, 0, 349.23, 0, 329.63,
  0, 440, 0, 587.33, 0, 659.25, 0, 698.46,
  0, 659.25, 0, 587.33, 0, 554.37, 0, 440,
  0, 587.33, 0, 698.46, 0, 659.25, 0, 587.33,
  0, 523.25, 0, 659.25, 0, 587.33, 0, 523.25,
  0, 466.16, 0, 587.33, 0, 523.25, 0, 466.16,
  0, 440, 0, 554.37, 0, 659.25, 0, 440,
  0, 698.46, 0, 783.99, 0, 880, 0, 783.99,
  0, 698.46, 0, 659.25, 0, 587.33, 0, 523.25,
  0, 440, 0, 349.23, 0, 293.66, 0, 277.18,
  0, 329.63, 0, 440, 0, 554.37, 0, 293.66,
];

/**
 * Render the Boss Track to an uncompressed 16-bit 44.1kHz Stereo WAV Blob
 */
export async function renderBossTrackToWav(numLoops: number = 2): Promise<Blob> {
  const sampleRate = 44100;
  const tempoMs = 115;
  const stepDuration = tempoMs / 1000;
  const totalSteps = 128 * numLoops;
  const musicDuration = totalSteps * stepDuration;
  const fadeOutDuration = 1.6;
  const totalDuration = musicDuration + fadeOutDuration;

  const totalFrames = Math.ceil(totalDuration * sampleRate);
  const offlineCtx = new OfflineAudioContext(2, totalFrames, sampleRate);

  // Master Gain & Compressor for pristine arcade punch
  const masterGain = offlineCtx.createGain();
  masterGain.gain.setValueAtTime(0.85, 0);
  // Smooth fade-out at the end of the final loop
  masterGain.gain.setValueAtTime(0.85, musicDuration);
  masterGain.gain.linearRampToValueAtTime(0.0001, totalDuration);

  const compressor = offlineCtx.createDynamicsCompressor();
  compressor.threshold.setValueAtTime(-12, 0);
  compressor.knee.setValueAtTime(8, 0);
  compressor.ratio.setValueAtTime(3.5, 0);
  compressor.attack.setValueAtTime(0.005, 0);
  compressor.release.setValueAtTime(0.1, 0);

  masterGain.connect(compressor);
  compressor.connect(offlineCtx.destination);

  // Pre-generate white noise buffer for snare and hi-hats
  const noiseBufferSize = sampleRate * 0.1;
  const noiseBuffer = offlineCtx.createBuffer(1, noiseBufferSize, sampleRate);
  const noiseData = noiseBuffer.getChannelData(0);
  for (let i = 0; i < noiseBufferSize; i++) {
    noiseData[i] = Math.random() * 2 - 1;
  }

  for (let step = 0; step < totalSteps; step++) {
    const time = step * stepDuration;
    const note = ch3Melody[step % ch3Melody.length];
    const bassNote = ch3Bass[Math.floor(step / 2) % ch3Bass.length];

    // 1. Lead Sawtooth Melody
    if (note > 0) {
      const osc = offlineCtx.createOscillator();
      const g = offlineCtx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(note, time);
      g.gain.setValueAtTime(0.14, time);
      g.gain.exponentialRampToValueAtTime(0.005, time + stepDuration * 0.95);
      osc.connect(g);
      g.connect(masterGain);
      osc.start(time);
      osc.stop(time + stepDuration);
    }

    // 2. Sub-Bass Sawtooth Pulse (every 2 steps)
    if (step % 2 === 0 && bassNote > 0) {
      const bassOsc = offlineCtx.createOscillator();
      const bassG = offlineCtx.createGain();
      bassOsc.type = 'sawtooth';
      bassOsc.frequency.setValueAtTime(bassNote, time);
      bassG.gain.setValueAtTime(0.25, time);
      bassG.gain.exponentialRampToValueAtTime(0.015, time + stepDuration * 2 * 0.9);
      bassOsc.connect(bassG);
      bassG.connect(masterGain);
      bassOsc.start(time);
      bassOsc.stop(time + stepDuration * 2);
    }

    const stepIn16 = step % 16;
    const totalStepIn128 = step % 128;

    // 3. Kick Drum (Punch on beats 0, 6, 8, 14)
    const isKick = stepIn16 === 0 || stepIn16 === 6 || stepIn16 === 8 || stepIn16 === 14;
    if (isKick) {
      const kickOsc = offlineCtx.createOscillator();
      const kickG = offlineCtx.createGain();
      kickOsc.type = 'sine';
      kickOsc.frequency.setValueAtTime(140, time);
      kickOsc.frequency.exponentialRampToValueAtTime(38, time + 0.075);
      kickG.gain.setValueAtTime(0.26, time);
      kickG.gain.exponentialRampToValueAtTime(0.008, time + 0.08);
      kickOsc.connect(kickG);
      kickG.connect(masterGain);
      kickOsc.start(time);
      kickOsc.stop(time + 0.085);
    }

    // 4. Snare Drum / Noise Clap (Backbeat on beats 4 and 12, plus fill on step 124-127)
    const isSnare = stepIn16 === 4 || stepIn16 === 12 || totalStepIn128 >= 124;
    if (isSnare) {
      const noise = offlineCtx.createBufferSource();
      noise.buffer = noiseBuffer;
      const filter = offlineCtx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(1000, time);
      const snareG = offlineCtx.createGain();
      snareG.gain.setValueAtTime(0.13, time);
      snareG.gain.exponentialRampToValueAtTime(0.008, time + 0.06);
      noise.connect(filter);
      filter.connect(snareG);
      snareG.connect(masterGain);
      noise.start(time);
      noise.stop(time + 0.065);
    }

    // 5. Crisp Hi-Hat Ticks
    const isHat = stepIn16 % 2 === 0 && !isSnare;
    if (isHat) {
      const noise = offlineCtx.createBufferSource();
      noise.buffer = noiseBuffer;
      const filter = offlineCtx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(4500, time);
      const hatG = offlineCtx.createGain();
      hatG.gain.setValueAtTime(0.05, time);
      hatG.gain.exponentialRampToValueAtTime(0.005, time + 0.025);
      noise.connect(filter);
      filter.connect(hatG);
      hatG.connect(masterGain);
      noise.start(time);
      noise.stop(time + 0.03);
    }

    // 6. Harmonic Counter-Arpeggio Layer
    const harmNote = ch3Harmony[step % ch3Harmony.length];
    if (harmNote > 0) {
      const harmOsc = offlineCtx.createOscillator();
      const harmG = offlineCtx.createGain();
      harmOsc.type = 'triangle';
      harmOsc.frequency.setValueAtTime(harmNote, time);
      harmG.gain.setValueAtTime(0.08, time);
      harmG.gain.exponentialRampToValueAtTime(0.008, time + stepDuration * 0.85);
      harmOsc.connect(harmG);
      harmG.connect(masterGain);
      harmOsc.start(time);
      harmOsc.stop(time + stepDuration);
    }
  }

  // Render faster-than-realtime audio buffer
  const renderedBuffer = await offlineCtx.startRendering();

  // Convert to RIFF WAVE binary ArrayBuffer
  const wavArrayBuffer = audioBufferToWav(renderedBuffer);
  return new Blob([wavArrayBuffer], { type: 'audio/wav' });
}

/**
 * Encodes an AudioBuffer into standard 16-bit Stereo PCM WAV
 */
function audioBufferToWav(buffer: AudioBuffer): ArrayBuffer {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;
  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;
  const numSamples = buffer.length;
  const dataSize = numSamples * blockAlign;
  const bufferLength = 44 + dataSize;
  const arrayBuffer = new ArrayBuffer(bufferLength);
  const view = new DataView(arrayBuffer);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  // RIFF header
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, 'WAVE');

  // fmt subchunk
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);

  // data subchunk
  writeString(36, 'data');
  view.setUint32(40, dataSize, true);

  // Interleave and quantize 16-bit samples
  const channelData: Float32Array[] = [];
  for (let ch = 0; ch < numChannels; ch++) {
    channelData.push(buffer.getChannelData(ch));
  }

  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      const sample = Math.max(-1, Math.min(1, channelData[ch][i]));
      const int16 = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
      view.setInt16(offset, int16, true);
      offset += 2;
    }
  }

  return arrayBuffer;
}

/**
 * Triggers a browser file download for a given Blob
 */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 6000);
}
