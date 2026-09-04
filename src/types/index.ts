export type Emotion = 'idle' | 'speaking' | 'happy_laugh' | 'surprised_hit';

export interface AudioChunk {
  id: string;
  buffer: ArrayBuffer;
  text: string;
  emotion?: Emotion;
}

export interface LLMChunk {
  text: string;
  done: boolean;
}

export interface Settings {
  llmApiKey: string;
  ttsApiKey: string;
}

export const EMOTION_TAGS: Record<string, Emotion> = {
  '[laugh]': 'happy_laugh',
  '[cry]': 'surprised_hit',
};

export const PUNCTUATION = /[,.!?]/;
