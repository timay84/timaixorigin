/**
 * Mock TTS Service
 *
 * Generates synthetic "alien babble" audio buffers using oscillators.
 * The audio length is proportional to the input text length.
 *
 * To swap with a real TTS API (e.g. Fish Audio), replace the body of
 * `synthesize` with a fetch call to the real endpoint and return the
 * response ArrayBuffer. The rest of the pipeline (AudioQueueManager,
 * lip-sync, subtitles) will work unchanged.
 */

import type { Emotion } from '@/types';

export interface TTSResult {
  buffer: ArrayBuffer;
  emotion?: Emotion;
}

const SAMPLE_RATE = 44100;

// Alien-sounding frequencies (pentatonic-ish for a playful feel)
const ALIEN_FREQS = [180, 220, 270, 330, 392, 440, 523, 587];

function pickFreq(): number {
  return ALIEN_FREQS[Math.floor(Math.random() * ALIEN_FREQS.length)];
}

/**
 * Synthesize a short alien voice clip from text.
 * Returns an ArrayBuffer of WAV-encoded audio.
 *
 * @param text  The text to "speak"
 * @param apiKey  Reserved for real TTS integration (unused in mock)
 */
export async function synthesize(
  text: string,
  apiKey?: string,
  signal?: AbortSignal,
): Promise<TTSResult> {
  // The mock does not use the key, but keep the parameter for the real API swap.
  void apiKey;
  if (signal?.aborted) {
    throw new DOMException('TTS request was aborted', 'AbortError');
  }

  // Detect emotion tags
  const laughMatch = text.match(/\[laugh\]/i);
  const cryMatch = text.match(/\[cry\]/i);
  const emotion: Emotion | undefined = laughMatch
    ? 'happy_laugh'
    : cryMatch
      ? 'surprised_hit'
      : undefined;

  // Strip tags from text for length calculation
  const cleanText = text.replace(/\[laugh\]|\[cry\]/gi, '').trim();

  // Duration proportional to text: ~80ms per character, min 300ms, max 3000ms
  const durationSec = Math.min(Math.max(cleanText.length * 0.08, 0.3), 3.0);

  if (emotion === 'happy_laugh') {
    return { buffer: generateArpeggio(durationSec, true), emotion };
  }
  if (emotion === 'surprised_hit') {
    return { buffer: generateArpeggio(durationSec, false), emotion };
  }

  return { buffer: generateBabble(cleanText, durationSec), emotion };
}

/**
 * Generate alien babble: a sequence of short tonal segments with vibrato
 * and amplitude envelope, encoded as a WAV ArrayBuffer.
 */
function generateBabble(text: string, durationSec: number): ArrayBuffer {
  const totalSamples = Math.floor(SAMPLE_RATE * durationSec);
  const channels = 1;
  const buffer = new Float32Array(totalSamples);

  // Break into syllables: each ~60-120ms
  const syllableLen = Math.floor(SAMPLE_RATE * (0.06 + Math.random() * 0.06));
  let pos = 0;
  let freq = pickFreq();

  while (pos < totalSamples) {
    const end = Math.min(pos + syllableLen, totalSamples);
    const len = end - pos;

    // Occasionally shift pitch
    if (Math.random() < 0.4) freq = pickFreq();

    for (let i = 0; i < len; i++) {
      const t = (pos + i) / SAMPLE_RATE;
      const progress = i / len;

      // Amplitude envelope (attack-decay)
      const env = Math.sin(Math.PI * progress) * 0.35;

      // Vibrato
      const vibrato = 1 + Math.sin(2 * Math.PI * 6 * t) * 0.03;

      // Fundamental + slight harmonic for richness
      const sample =
        Math.sin(2 * Math.PI * freq * vibrato * t) * 0.7 +
        Math.sin(2 * Math.PI * freq * 2 * t) * 0.15;

      buffer[pos + i] = sample * env;
    }
    pos = end;

    // Small gap between syllables
    const gap = Math.floor(SAMPLE_RATE * 0.02);
    pos += gap;
  }

  return encodeWav(buffer, SAMPLE_RATE, channels);
}

/**
 * Generate a fast arpeggio for emotion sounds (laugh/cry).
 */
function generateArpeggio(durationSec: number, ascending: boolean): ArrayBuffer {
  const totalSamples = Math.floor(SAMPLE_RATE * durationSec);
  const channels = 1;
  const buffer = new Float32Array(totalSamples);

  const notes = ascending
    ? [330, 392, 523, 659, 523, 392]
    : [523, 392, 330, 262, 330, 392];

  const noteLen = Math.floor(totalSamples / notes.length);

  notes.forEach((freq, ni) => {
    const start = ni * noteLen;
    const end = Math.min(start + noteLen, totalSamples);
    for (let i = start; i < end; i++) {
      const t = i / SAMPLE_RATE;
      const progress = (i - start) / noteLen;
      const env = Math.sin(Math.PI * progress) * 0.3;
      const sample = Math.sin(2 * Math.PI * freq * t) * env;
      buffer[i] = sample;
    }
  });

  return encodeWav(buffer, SAMPLE_RATE, channels);
}

/**
 * Generate a short "squeak" sound for the touch interruption.
 */
export function generateSqueak(): ArrayBuffer {
  const durationSec = 0.25;
  const totalSamples = Math.floor(SAMPLE_RATE * durationSec);
  const buffer = new Float32Array(totalSamples);

  for (let i = 0; i < totalSamples; i++) {
    const t = i / SAMPLE_RATE;
    const progress = i / totalSamples;
    const freq = 800 + progress * 600; // rising pitch
    const env = Math.sin(Math.PI * progress) * 0.4;
    buffer[i] = Math.sin(2 * Math.PI * freq * t) * env;
  }

  return encodeWav(buffer, SAMPLE_RATE, 1);
}

/**
 * Encode Float32 PCM samples into a WAV ArrayBuffer.
 */
function encodeWav(samples: Float32Array, sampleRate: number, channels: number): ArrayBuffer {
  const byteRate = sampleRate * channels * 2;
  const blockAlign = channels * 2;
  const dataSize = samples.length * 2;
  const bufferSize = 44 + dataSize;

  const buffer = new ArrayBuffer(bufferSize);
  const view = new DataView(buffer);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, channels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, dataSize, true);

  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    offset += 2;
  }

  return buffer;
}
