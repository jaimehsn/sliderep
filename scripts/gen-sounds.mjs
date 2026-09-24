// Generates the WAV sound cues used during judging (see docs/ROADMAP.md, Track B — B4).
// Pure Node (fs + Buffer), no dependencies: plain synthesized sine-wave tones,
// so there is no third-party audio content or licensing to track.
//
// Usage: node scripts/gen-sounds.mjs

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, '..', 'assets', 'sounds');
const SAMPLE_RATE = 44100;
const AMPLITUDE = 0.5; // 0..1 of full scale, keeps tones comfortable on phone speakers

/** A single sine-wave burst with linear fade-in/out to avoid clicks, as Int16 samples. */
function tone(freqHz, durationMs, { fadeInMs = 5, fadeOutMs = 15 } = {}) {
  const n = Math.round((durationMs / 1000) * SAMPLE_RATE);
  const fadeInN = Math.round((fadeInMs / 1000) * SAMPLE_RATE);
  const fadeOutN = Math.round((fadeOutMs / 1000) * SAMPLE_RATE);
  const samples = new Int16Array(n);
  for (let i = 0; i < n; i++) {
    let gain = 1;
    if (i < fadeInN) gain = i / fadeInN;
    else if (i > n - fadeOutN) gain = (n - i) / fadeOutN;
    const value = Math.sin((2 * Math.PI * freqHz * i) / SAMPLE_RATE) * AMPLITUDE * gain;
    samples[i] = Math.max(-1, Math.min(1, value)) * 0x7fff;
  }
  return samples;
}

/** N milliseconds of silence, as Int16 samples. */
function silence(durationMs) {
  return new Int16Array(Math.round((durationMs / 1000) * SAMPLE_RATE));
}

function concat(...chunks) {
  const total = chunks.reduce((sum, c) => sum + c.length, 0);
  const out = new Int16Array(total);
  let offset = 0;
  for (const c of chunks) {
    out.set(c, offset);
    offset += c.length;
  }
  return out;
}

/** Writes 16-bit PCM mono samples as a standard WAV file. */
function writeWav(path, samples) {
  const dataSize = samples.length * 2;
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write('RIFF', 0, 'ascii');
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8, 'ascii');

  buffer.write('fmt ', 12, 'ascii');
  buffer.writeUInt32LE(16, 16); // fmt chunk size
  buffer.writeUInt16LE(1, 20); // PCM
  buffer.writeUInt16LE(1, 22); // mono
  buffer.writeUInt32LE(SAMPLE_RATE, 24);
  buffer.writeUInt32LE(SAMPLE_RATE * 2, 28); // byte rate = sampleRate * channels * bytesPerSample
  buffer.writeUInt16LE(2, 32); // block align = channels * bytesPerSample
  buffer.writeUInt16LE(16, 34); // bits per sample

  buffer.write('data', 36, 'ascii');
  buffer.writeUInt32LE(dataSize, 40);
  for (let i = 0; i < samples.length; i++) {
    buffer.writeInt16LE(samples[i], 44 + i * 2);
  }

  writeFileSync(path, buffer);
  console.log(`wrote ${path} (${(dataSize / 2 / SAMPLE_RATE).toFixed(3)}s)`);
}

mkdirSync(OUT_DIR, { recursive: true });

// tick — one per countdown number (10..1): sharp and short.
writeWav(join(OUT_DIR, 'tick.wav'), tone(1000, 70, { fadeInMs: 5, fadeOutMs: 15 }));

// go — countdown reaches 0: lower and longer, clearly distinct from tick.
writeWav(join(OUT_DIR, 'go.wav'), tone(520, 260, { fadeInMs: 5, fadeOutMs: 25 }));

// minute — EMOM minute change (not the last one): mid pitch, mid length.
writeWav(join(OUT_DIR, 'minute.wav'), tone(780, 140, { fadeInMs: 5, fadeOutMs: 20 }));

// end — end of time (AMRAP at 0; EMOM's last minute): double beep, stands out from a single tick.
writeWav(
  join(OUT_DIR, 'end.wav'),
  concat(
    tone(660, 150, { fadeInMs: 5, fadeOutMs: 15 }),
    silence(90),
    tone(660, 150, { fadeInMs: 5, fadeOutMs: 15 }),
  ),
);
