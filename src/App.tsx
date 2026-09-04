import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Mic, Square, Radio } from 'lucide-react';
import { AlienAvatar } from '@/components/AlienAvatar';
import { CameraPiP } from '@/components/CameraPiP';
import { Subtitles } from '@/components/Subtitles';
import { SettingsPanel } from '@/components/SettingsPanel';
import { WakeUpScreen } from '@/components/WakeUpScreen';
import { AudioQueueManager } from '@/services/audioQueueManager';
import { streamText, TextChunker } from '@/services/llmService';
import { synthesize, generateSqueak } from '@/services/ttsService';
import type { Emotion, Settings } from '@/types';

export default function App() {
  const [awake, setAwake] = useState(false);
  const [emotion, setEmotion] = useState<Emotion>('idle');
  const [mouthOpen, setMouthOpen] = useState(0);
  const [subtitleText, setSubtitleText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [settings, setSettings] = useState<Settings>({
    llmApiKey: '',
    ttsApiKey: '',
  });

  const audioCtxRef = useRef<AudioContext | null>(null);
  const queueManagerRef = useRef<AudioQueueManager | null>(null);
  const chunkerRef = useRef<TextChunker | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const conversationIdRef = useRef(0);
  const emotionTimeoutRef = useRef<number | null>(null);
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  // Smooth mouth value interpolation
  const mouthTargetRef = useRef(0);
  const mouthCurrentRef = useRef(0);

  useEffect(() => {
    let raf: number;
    const smooth = () => {
      const diff = mouthTargetRef.current - mouthCurrentRef.current;
      mouthCurrentRef.current += diff * 0.3;
      setMouthOpen(mouthCurrentRef.current);
      raf = requestAnimationFrame(smooth);
    };
    raf = requestAnimationFrame(smooth);
    return () => cancelAnimationFrame(raf);
  }, []);

  const handleAmplitude = useCallback((rms: number) => {
    // Boost RMS for more visible lip movement; clamp to [0, 1]
    const boosted = Math.min(rms * 3.5, 1);
    mouthTargetRef.current = boosted;
  }, []);

  const handleQueueStart = useCallback(() => {
    setIsSpeaking(true);
    setEmotion((prev) => (prev === 'surprised_hit' ? prev : 'speaking'));
  }, []);

  const handleQueueComplete = useCallback(() => {
    setIsSpeaking(false);
    mouthTargetRef.current = 0;
    setEmotion('idle');
  }, []);

  const handleItemStart = useCallback((text: string) => {
    // Show the chunk being spoken in subtitles
    setSubtitleText((prev) => prev + (prev && !prev.endsWith(' ') ? ' ' : '') + text);
  }, []);

  const handleWake = useCallback(() => {
    const ctx = new AudioContext();
    audioCtxRef.current = ctx;

    const manager = new AudioQueueManager(ctx);
    manager.onAmplitude = handleAmplitude;
    manager.onQueueStart = handleQueueStart;
    manager.onQueueComplete = handleQueueComplete;
    manager.onItemStart = handleItemStart;
    queueManagerRef.current = manager;

    setAwake(true);
  }, [handleAmplitude, handleQueueStart, handleQueueComplete, handleItemStart]);

  const handleInterrupt = useCallback(() => {
    // Invalidate every callback and TTS result belonging to the old turn.
    conversationIdRef.current += 1;

    // Clear audio queue
    if (queueManagerRef.current) {
      queueManagerRef.current.interrupt();
    }

    // Abort any ongoing LLM stream
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }

    // Reset chunker
    if (chunkerRef.current) {
      chunkerRef.current.reset();
    }

    // Stop streaming state
    setIsStreaming(false);
    setIsSpeaking(false);
    setSubtitleText('');
    mouthTargetRef.current = 0;

    // Trigger surprised emotion
    setEmotion('surprised_hit');

    // Play squeak sound
    if (audioCtxRef.current && queueManagerRef.current) {
      const squeak = generateSqueak();
      queueManagerRef.current.enqueue(squeak, '*squeak*').catch(() => {});
    }

    // Return to idle after the surprised animation
    if (emotionTimeoutRef.current) {
      clearTimeout(emotionTimeoutRef.current);
    }
    emotionTimeoutRef.current = window.setTimeout(() => {
      setEmotion('idle');
    }, 600);
  }, []);

  const handleChunk = useCallback(
    async (chunk: string, conversationId: number, signal: AbortSignal) => {
      if (conversationId !== conversationIdRef.current || signal.aborted) return;

      const manager = queueManagerRef.current;
      if (!manager) return;

      // Check for emotion tags
      const hasLaugh = /\[laugh\]/i.test(chunk);
      const hasCry = /\[cry\]/i.test(chunk);

      if (hasLaugh || hasCry) {
        const tagEmotion: Emotion = hasLaugh ? 'happy_laugh' : 'surprised_hit';
        setEmotion(tagEmotion);

        // Reset emotion after the sound plays
        if (emotionTimeoutRef.current) {
          clearTimeout(emotionTimeoutRef.current);
        }
        emotionTimeoutRef.current = window.setTimeout(() => {
          if (manager.currentlyPlaying) {
            setEmotion('speaking');
          } else {
            setEmotion('idle');
          }
        }, 2000);
      }

      // Synthesize and enqueue
      try {
        const result = await synthesize(
          chunk,
          settingsRef.current.ttsApiKey || undefined,
          signal,
        );

        if (conversationId !== conversationIdRef.current || signal.aborted) return;
        await manager.enqueue(result.buffer, chunk, result.emotion);
      } catch (err) {
        if (!signal.aborted) console.error('TTS synthesis failed:', err);
      }
    },
    [],
  );

  const handleStartConversation = useCallback(async () => {
    if (isStreaming || isSpeaking) return;

    setSubtitleText('');
    setIsStreaming(true);
    setEmotion('speaking');

    const conversationId = conversationIdRef.current + 1;
    conversationIdRef.current = conversationId;
    const controller = new AbortController();
    abortRef.current = controller;

    // Create a fresh chunker for this conversation
    const chunker = new TextChunker((chunk) => {
      void handleChunk(chunk, conversationId, controller.signal);
    });
    chunkerRef.current = chunker;

    try {
      await streamText({
        onChunk: (llmChunk) => {
          if (controller.signal.aborted || conversationId !== conversationIdRef.current) return;
          chunker.add(llmChunk.text);
          if (llmChunk.done) chunker.flush();
        },
        signal: controller.signal,
      });

      if (!controller.signal.aborted && conversationId === conversationIdRef.current) {
        chunker.flush();
      }
    } catch (err) {
      if (!controller.signal.aborted) console.error('LLM stream failed:', err);
    } finally {
      if (conversationId === conversationIdRef.current) {
        setIsStreaming(false);
        if (abortRef.current === controller) abortRef.current = null;
      }
    }
  }, [isStreaming, isSpeaking, handleChunk]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (emotionTimeoutRef.current) clearTimeout(emotionTimeoutRef.current);
      if (abortRef.current) abortRef.current.abort();
      queueManagerRef.current?.destroy();
      if (audioCtxRef.current) audioCtxRef.current.close();
    };
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950">
      {/* Starfield background */}
      <Starfield />

      {/* Nebula glow */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-teal-500/5 blur-[120px]" />
      <div className="pointer-events-none absolute left-1/4 top-1/4 h-[300px] w-[300px] rounded-full bg-cyan-500/5 blur-[100px]" />
      <div className="pointer-events-none absolute bottom-1/4 right-1/4 h-[250px] w-[250px] rounded-full bg-emerald-500/5 blur-[100px]" />

      <AnimatePresence>
        {!awake && <WakeUpScreen onWake={handleWake} />}
      </AnimatePresence>

      {awake && (
        <>
          {/* Settings */}
          <SettingsPanel settings={settings} onSave={setSettings} />

          {/* Main content */}
          <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4">
            {/* Status badge */}
            <div className="mb-6 flex items-center gap-2 rounded-full border border-white/10 bg-slate-900/50 px-4 py-1.5 text-xs font-medium text-slate-400 backdrop-blur-md">
              <span
                className={`h-2 w-2 rounded-full ${
                  isSpeaking
                    ? 'bg-teal-400 animate-pulse'
                    : isStreaming
                      ? 'bg-amber-400 animate-pulse'
                      : 'bg-slate-600'
                }`}
              />
              {isSpeaking
                ? 'Alien is speaking'
                : isStreaming
                  ? 'Alien is thinking...'
                  : 'Alien is idle'}
            </div>

            {/* Avatar */}
            <AlienAvatar
              mouthOpen={mouthOpen}
              emotion={emotion}
              onInteract={handleInterrupt}
            />

            {/* Controls */}
            <div className="mt-8 flex items-center gap-3">
              <button
                onClick={handleStartConversation}
                disabled={isStreaming || isSpeaking}
                className="flex items-center gap-2 rounded-full bg-gradient-to-r from-teal-500 to-cyan-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-teal-500/20 transition hover:shadow-teal-500/40 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Mic className="h-4 w-4" />
                Start Conversation
              </button>

              <button
                onClick={handleInterrupt}
                className="flex items-center gap-2 rounded-full border border-rose-500/30 bg-rose-500/10 px-6 py-3 text-sm font-semibold text-rose-300 transition hover:bg-rose-500/20"
              >
                <Square className="h-4 w-4" />
                Interrupt
              </button>
            </div>

            {/* Hint */}
            <p className="mt-4 text-xs text-slate-600">
              Click the alien to interrupt and startle it
            </p>
          </div>

          {/* Subtitles */}
          <Subtitles text={subtitleText} isStreaming={isStreaming || isSpeaking} />

          {/* Camera PiP */}
          <CameraPiP />

          {/* Bottom info bar */}
          <div className="fixed bottom-4 left-6 z-20 flex items-center gap-2 text-xs text-slate-600">
            <Radio className="h-3 w-3" />
            <span>Mock Mode Active</span>
          </div>
        </>
      )}
    </div>
  );
}

function Starfield() {
  const stars = useRef(
    Array.from({ length: 80 }).map(() => ({
      left: Math.random() * 100,
      top: Math.random() * 100,
      size: 1 + Math.random() * 2,
      duration: 2 + Math.random() * 4,
      delay: Math.random() * 3,
    })),
  ).current;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {stars.map((star, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-white"
          style={{
            left: `${star.left}%`,
            top: `${star.top}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
          }}
          animate={{ opacity: [0.1, 0.6, 0.1] }}
          transition={{
            duration: star.duration,
            repeat: Infinity,
            delay: star.delay,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}
