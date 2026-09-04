/**
 * Mock LLM Streaming Service
 *
 * Simulates an LLM that streams text chunks. In a real integration,
 * replace `streamText` with an EventSource / fetch-streaming call to
 * your LLM endpoint and yield the same { text, done } shape.
 */

import type { LLMChunk } from '@/types';

// Alien gibberish sentences with embedded emotion tags
const ALIEN_PHRASES = [
  'Zark blin kloo, gox [laugh] piko! Blixxa nomu frex, zantu voolu mira. Kloon zarka dexo!',
  'Vexil nuro blinka, skarnu dolo plex. [cry] Wibbo zantu klox, mirex volu naza.',
  'Plinxo garu netha, volu zarka blix. Kloo nomu dexo, [laugh] piko vantu frex!',
  'Skarnu mira blinka, zoolu nexa plex. Dolo voolu klox, zarka nomu vinto. [laugh] Blixxa!',
  'Naza frex volu, blinka garu kloo. [cry] Vexil dolo plex, mirex zantu wibbo.',
  'Zoolu klox netha, piko volu skarnu. Blixxa zarka mira, nomu frex blinka! [laugh] Vinto!',
];

export interface StreamCallbacks {
  onChunk: (chunk: LLMChunk) => void;
  signal?: AbortSignal;
}

/**
 * Stream alien gibberish text word-by-word.
 * Calls onChunk for each word, with done=true on the final chunk.
 */
export async function streamText(callbacks: StreamCallbacks): Promise<void> {
  const phrase = ALIEN_PHRASES[Math.floor(Math.random() * ALIEN_PHRASES.length)];

  // Split into words and stream with delays
  const words = phrase.split(' ');

  for (let i = 0; i < words.length; i++) {
    if (callbacks.signal?.aborted) return;

    const word = words[i];
    const isLast = i === words.length - 1;

    callbacks.onChunk({ text: word + ' ', done: isLast });

    // Random delay between 80-200ms to simulate streaming
    await delay(80 + Math.random() * 120);
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Text chunker: buffers streaming text and emits a chunk whenever
 * a punctuation mark is encountered.
 */
export class TextChunker {
  private buffer = '';
  private onChunk: (chunk: string) => void;

  constructor(onChunk: (chunk: string) => void) {
    this.onChunk = onChunk;
  }

  add(text: string): void {
    this.buffer += text;

    // Check for punctuation
    const match = this.buffer.match(/^(.*?[,.!?])/);
    if (match) {
      const chunk = match[1];
      this.buffer = this.buffer.slice(chunk.length);
      this.onChunk(chunk);
    }
  }

  flush(): void {
    if (this.buffer.trim()) {
      this.onChunk(this.buffer);
      this.buffer = '';
    }
  }

  reset(): void {
    this.buffer = '';
  }
}
