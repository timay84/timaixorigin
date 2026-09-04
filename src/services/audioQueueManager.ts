/**
 * AudioQueueManager
 *
 * Manages sequential playback of audio buffers using the Web Audio API.
 * Attaches an AnalyserNode to the currently playing source so callers can
 * read RMS amplitude on every animation frame and drive lip-sync.
 *
 * Designed to accept generic ArrayBuffer audio data (e.g. from a TTS API)
 * so the playback layer is fully decoupled from the synthesis layer.
 */

export type AmplitudeCallback = (rms: number) => void;
export type QueueEventCallback = () => void;

interface QueueItem {
  buffer: AudioBuffer;
  text: string;
  emotion?: string;
}

export class AudioQueueManager {
  private context: AudioContext;
  private analyser: AnalyserNode;
  private gainNode: GainNode;
  private queue: QueueItem[] = [];
  private currentSource: AudioBufferSourceNode | null = null;
  private isPlaying = false;
  private animationFrameId: number | null = null;
  private dataArray: Uint8Array;

  onAmplitude: AmplitudeCallback | null = null;
  onQueueStart: QueueEventCallback | null = null;
  onQueueComplete: QueueEventCallback | null = null;
  onItemStart: ((text: string) => void) | null = null;

  constructor(context: AudioContext) {
    this.context = context;
    this.analyser = context.createAnalyser();
    this.analyser.fftSize = 256;
    this.analyser.smoothingTimeConstant = 0.6;
    this.gainNode = context.createGain();
    this.gainNode.gain.value = 1.0;

    this.gainNode.connect(this.analyser);
    this.analyser.connect(context.destination);

    this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
  }

  get analyserNode(): AnalyserNode {
    return this.analyser;
  }

  /**
   * Decode an ArrayBuffer into an AudioBuffer and enqueue it.
   */
  async enqueue(buffer: ArrayBuffer, text: string, emotion?: string): Promise<void> {
    const audioBuffer = await this.context.decodeAudioData(buffer.slice(0));
    this.queue.push({ buffer: audioBuffer, text, emotion });
    if (!this.isPlaying) {
      this.playNext();
    }
  }

  private playNext(): void {
    if (this.queue.length === 0) {
      this.isPlaying = false;
      this.stopAmplitudeTracking();
      if (this.onQueueComplete) this.onQueueComplete();
      return;
    }

    if (!this.isPlaying && this.onQueueStart) {
      this.onQueueStart();
    }

    this.isPlaying = true;
    this.startAmplitudeTracking();

    const item = this.queue.shift()!;
    if (this.onItemStart) this.onItemStart(item.text);

    const source = this.context.createBufferSource();
    source.buffer = item.buffer;
    source.connect(this.gainNode);
    this.currentSource = source;

    source.onended = () => {
      this.currentSource = null;
      this.playNext();
    };

    source.start();
  }

  private startAmplitudeTracking(): void {
    const track = () => {
      this.analyser.getByteTimeDomainData(this.dataArray);
      let sum = 0;
      for (let i = 0; i < this.dataArray.length; i++) {
        const v = (this.dataArray[i] - 128) / 128;
        sum += v * v;
      }
      const rms = Math.sqrt(sum / this.dataArray.length);
      if (this.onAmplitude) this.onAmplitude(rms);
      this.animationFrameId = requestAnimationFrame(track);
    };
    track();
  }

  private stopAmplitudeTracking(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    if (this.onAmplitude) this.onAmplitude(0);
  }

  /**
   * Immediately stop all playback, clear the queue, and reset amplitude.
   */
  interrupt(): void {
    if (this.currentSource) {
      try {
        this.currentSource.onended = null;
        this.currentSource.stop();
      } catch {
        // already stopped
      }
      this.currentSource.disconnect();
      this.currentSource = null;
    }
    this.queue = [];
    this.isPlaying = false;
    this.stopAmplitudeTracking();
  }

  get queueLength(): number {
    return this.queue.length;
  }

  get currentlyPlaying(): boolean {
    return this.isPlaying;
  }
}
