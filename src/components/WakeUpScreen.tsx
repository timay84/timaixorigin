import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

interface WakeUpScreenProps {
  onWake: () => void;
}

export function WakeUpScreen({ onWake }: WakeUpScreenProps) {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.1 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950"
    >
      {/* Starfield background */}
      <div className="absolute inset-0 overflow-hidden">
        {Array.from({ length: 50 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: `${1 + Math.random() * 2}px`,
              height: `${1 + Math.random() * 2}px`,
            }}
            animate={{ opacity: [0.2, 0.8, 0.2] }}
            transition={{
              duration: 2 + Math.random() * 3,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      {/* Glow ring */}
      <motion.div
        className="absolute h-64 w-64 rounded-full bg-teal-500/20 blur-3xl"
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />

      <div className="relative z-10 flex flex-col items-center gap-8 px-6 text-center">
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Sparkles className="h-16 w-16 text-teal-400" />
        </motion.div>

        <div>
          <h1 className="mb-3 text-3xl font-bold text-white sm:text-4xl">
            Wake Up the Alien
          </h1>
          <p className="max-w-md text-slate-400">
            Click below to initialize the audio system and begin your interstellar
            conversation. The alien is waiting in stasis...
          </p>
        </div>

        <motion.button
          onClick={onWake}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="group relative overflow-hidden rounded-full bg-gradient-to-r from-teal-500 to-cyan-500 px-10 py-4 text-lg font-semibold text-white shadow-[0_0_30px_rgba(45,212,191,0.4)] transition"
        >
          <span className="relative z-10">Click to Wake Up Alien</span>
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-teal-400 opacity-0 transition-opacity group-hover:opacity-100"
          />
        </motion.button>

        <p className="text-xs text-slate-600">
          Audio will be enabled after interaction (browser requirement)
        </p>
      </div>
    </motion.div>
  );
}
