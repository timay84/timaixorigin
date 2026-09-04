import { motion, AnimatePresence } from 'framer-motion';
import { useMemo } from 'react';

interface SubtitlesProps {
  text: string;
  isStreaming: boolean;
}

/**
 * Renders streaming alien subtitles with emotion tags highlighted.
 */
export function Subtitles({ text, isStreaming }: SubtitlesProps) {
  // Parse text to highlight [laugh] and [cry] tags
  const segments = useMemo(() => {
    const parts: { text: string; tag?: string }[] = [];
    const regex = /(\[laugh\]|\[cry\])/gi;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push({ text: text.slice(lastIndex, match.index) });
      }
      parts.push({ text: match[0], tag: match[0].toLowerCase() });
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
      parts.push({ text: text.slice(lastIndex) });
    }

    return parts;
  }, [text]);

  return (
    <div className="pointer-events-none fixed bottom-6 left-1/2 z-20 w-full max-w-2xl -translate-x-1/2 px-4 sm:bottom-28">
      <AnimatePresence mode="wait">
        <motion.div
          key={text.slice(0, 20)}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className="rounded-2xl border border-white/10 bg-slate-900/70 px-6 py-4 text-center backdrop-blur-md"
        >
          {segments.length === 0 && !isStreaming && (
            <span className="text-sm text-slate-500 italic">
              Waiting for the alien to speak...
            </span>
          )}

          {segments.map((seg, i) =>
            seg.tag ? (
              <span
                key={i}
                className={`mx-1 inline-block rounded-md px-2 py-0.5 text-sm font-bold ${
                  seg.tag === '[laugh]'
                    ? 'bg-amber-500/20 text-amber-300 ring-1 ring-amber-400/40'
                    : 'bg-rose-500/20 text-rose-300 ring-1 ring-rose-400/40'
                }`}
              >
                {seg.text}
              </span>
            ) : (
              <span key={i} className="text-base text-slate-200">
                {seg.text}
              </span>
            )
          )}

          {isStreaming && (
            <motion.span
              className="ml-1 inline-block h-4 w-0.5 bg-teal-400"
              animate={{ opacity: [1, 0, 1] }}
              transition={{ duration: 0.8, repeat: Infinity }}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
