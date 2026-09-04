import { motion } from 'framer-motion';
import { useMemo } from 'react';
import type { Emotion } from '@/types';

interface AlienAvatarProps {
  mouthOpen: number; // 0.0 - 1.0
  emotion: Emotion;
  onInteract: () => void;
}

export function AlienAvatar({ mouthOpen, emotion, onInteract }: AlienAvatarProps) {
  // Clamp mouthOpen
  const mouth = Math.max(0, Math.min(1, mouthOpen));

  // Emotion-driven animation variants
  const bodyVariants = useMemo(() => {
    switch (emotion) {
      case 'idle':
        return {
          animate: {
            scale: [1, 1.03, 1],
            y: [0, -6, 0],
            rotate: [0, 1.5, -1.5, 0],
          },
          transition: {
            duration: 4,
            repeat: Infinity,
            ease: 'easeInOut' as const,
          },
        };
      case 'speaking':
        return {
          animate: {
            scale: [1, 1.02, 1],
            y: [0, -3, 0],
          },
          transition: {
            duration: 0.8,
            repeat: Infinity,
            ease: 'easeInOut' as const,
          },
        };
      case 'happy_laugh':
        return {
          animate: {
            scale: [1, 1.08, 0.96, 1.08, 1],
            y: [0, -10, 4, -10, 0],
            rotate: [0, 3, -3, 3, 0],
          },
          transition: {
            duration: 0.6,
            repeat: Infinity,
            ease: 'easeInOut' as const,
          },
        };
      case 'surprised_hit':
        return {
          animate: {
            scale: [1, 0.88, 1.12, 1],
            y: [0, 8, -12, 0],
            rotate: [0, -8, 4, 0],
          },
          transition: {
            duration: 0.5,
            repeat: 1,
            ease: 'easeOut' as const,
          },
        };
    }
  }, [emotion]);

  // Eye state based on emotion
  const eyeShape = useMemo(() => {
    switch (emotion) {
      case 'happy_laugh':
        return '^^';
      case 'surprised_hit':
        return 'oo';
      default:
        return 'normal';
    }
  }, [emotion]);

  // Antenna wiggle
  const antennaVariants = {
    animate: {
      rotate: [0, 8, -8, 0],
    },
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut' as const,
    },
  };

  return (
    <div
      className="relative cursor-pointer select-none"
      onClick={onInteract}
      role="button"
      aria-label="Interact with the alien"
    >
      <motion.svg
        width="320"
        height="360"
        viewBox="0 0 320 360"
        className="drop-shadow-[0_0_40px_rgba(72,209,204,0.3)]"
        {...bodyVariants}
      >
        <defs>
          <radialGradient id="bodyGrad" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#5eead4" />
            <stop offset="50%" stopColor="#2dd4bf" />
            <stop offset="100%" stopColor="#0f766e" />
          </radialGradient>
          <radialGradient id="bellyGrad" cx="50%" cy="60%" r="50%">
            <stop offset="0%" stopColor="#99f6e4" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#5eead4" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="eyeGrad" cx="40%" cy="35%" r="60%">
            <stop offset="0%" stopColor="#fef3c7" />
            <stop offset="60%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#d97706" />
          </radialGradient>
          <radialGradient id="mouthGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#1e293b" />
            <stop offset="70%" stopColor="#0f172a" />
            <stop offset="100%" stopColor="#020617" />
          </radialGradient>
          <radialGradient id="cheekGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fb7185" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#fb7185" stopOpacity="0" />
          </radialGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Antenna */}
        <motion.g
          style={{ transformOrigin: '160px 120px' }}
          animate={antennaVariants.animate}
          transition={antennaVariants.transition}
        >
          <line x1="160" y1="120" x2="160" y2="70" stroke="#0f766e" strokeWidth="4" strokeLinecap="round" />
          <circle cx="160" cy="60" r="10" fill="#5eead4" filter="url(#glow)">
            <animate attributeName="opacity" values="0.7;1;0.7" dur="2s" repeatCount="indefinite" />
          </circle>
        </motion.g>

        {/* Body - blob shape */}
        <path
          d="M 160 100
             C 220 100, 260 140, 262 200
             C 264 260, 220 310, 160 310
             C 100 310, 56 260, 58 200
             C 60 140, 100 100, 160 100 Z"
          fill="url(#bodyGrad)"
          stroke="#14b8a6"
          strokeWidth="2"
        />

        {/* Belly highlight */}
        <ellipse cx="160" cy="230" rx="70" ry="60" fill="url(#bellyGrad)" />

        {/* Cheeks */}
        <circle cx="95" cy="200" r="18" fill="url(#cheekGrad)" />
        <circle cx="225" cy="200" r="18" fill="url(#cheekGrad)" />

        {/* Arms - small stubs */}
        <ellipse cx="55" cy="220" rx="18" ry="30" fill="#0f766e" transform="rotate(-25 55 220)" />
        <ellipse cx="265" cy="220" rx="18" ry="30" fill="#0f766e" transform="rotate(25 265 220)" />

        {/* Eyes */}
        {eyeShape === 'normal' && (
          <>
            <ellipse cx="125" cy="175" rx="22" ry="26" fill="url(#eyeGrad)" filter="url(#glow)" />
            <ellipse cx="195" cy="175" rx="22" ry="26" fill="url(#eyeGrad)" filter="url(#glow)" />
            {/* Pupils */}
            <motion.circle
              cx="125"
              cy="175"
              r="8"
              fill="#1e293b"
              animate={{ cx: [122, 128, 122], cy: [172, 178, 172] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.circle
              cx="195"
              cy="175"
              r="8"
              fill="#1e293b"
              animate={{ cx: [192, 198, 192], cy: [172, 178, 172] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            />
            {/* Eye sparkles */}
            <circle cx="120" cy="168" r="4" fill="#ffffff" opacity="0.8" />
            <circle cx="190" cy="168" r="4" fill="#ffffff" opacity="0.8" />
          </>
        )}

        {eyeShape === '^^' && (
          <>
            <path d="M 105 175 Q 125 150, 145 175" stroke="#1e293b" strokeWidth="5" fill="none" strokeLinecap="round" />
            <path d="M 175 175 Q 195 150, 215 175" stroke="#1e293b" strokeWidth="5" fill="none" strokeLinecap="round" />
          </>
        )}

        {eyeShape === 'oo' && (
          <>
            <circle cx="125" cy="175" r="20" fill="url(#eyeGrad)" filter="url(#glow)" />
            <circle cx="195" cy="175" r="20" fill="url(#eyeGrad)" filter="url(#glow)" />
            <circle cx="125" cy="175" r="10" fill="#1e293b" />
            <circle cx="195" cy="175" r="10" fill="#1e293b" />
          </>
        )}

        {/* Mouth - lip-sync driven */}
        <g style={{ transformOrigin: '160px 240px' }}>
          {/* Outer mouth shape */}
          <motion.ellipse
            cx="160"
            cy="240"
            rx="28"
            ry={4 + mouth * 20}
            fill="url(#mouthGrad)"
            stroke="#0f766e"
            strokeWidth="2"
            animate={{
              ry: [4 + mouth * 18, 4 + mouth * 22, 4 + mouth * 18],
              opacity: mouth > 0.05 ? 1 : 0.85,
            }}
            transition={{ duration: 0.08, ease: 'easeOut' }}
          />
          {/* Tongue hint when mouth wide open */}
          {mouth > 0.4 && (
            <motion.ellipse
              cx="160"
              cy={248 + mouth * 5}
              rx="16"
              ry={mouth * 8}
              fill="#f43f5e"
              opacity="0.6"
              animate={{ ry: [mouth * 6, mouth * 10, mouth * 6] }}
              transition={{ duration: 0.1 }}
            />
          )}
          {/* Teeth hint */}
          {mouth > 0.3 && emotion === 'happy_laugh' && (
            <rect x="138" y={238 - mouth * 18} width="44" height="4" rx="2" fill="#fef3c7" />
          )}
        </g>

        {/* Sparkles around alien when laughing */}
        {emotion === 'happy_laugh' && (
          <>
            <motion.circle
              cx="60"
              cy="120"
              r="3"
              fill="#fbbf24"
              animate={{ opacity: [0, 1, 0], scale: [0, 1.5, 0] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
            <motion.circle
              cx="260"
              cy="130"
              r="3"
              fill="#fbbf24"
              animate={{ opacity: [0, 1, 0], scale: [0, 1.5, 0] }}
              transition={{ duration: 1, repeat: Infinity, delay: 0.3 }}
            />
            <motion.circle
              cx="240"
              cy="80"
              r="2"
              fill="#fbbf24"
              animate={{ opacity: [0, 1, 0], scale: [0, 1.5, 0] }}
              transition={{ duration: 1, repeat: Infinity, delay: 0.6 }}
            />
          </>
        )}

        {/* Shock lines when surprised */}
        {emotion === 'surprised_hit' && (
          <>
            {[0, 1, 2, 3, 4, 5].map((i) => {
              const angle = (i / 6) * Math.PI * 2;
              const x1 = 160 + Math.cos(angle) * 145;
              const y1 = 200 + Math.sin(angle) * 165;
              const x2 = 160 + Math.cos(angle) * 165;
              const y2 = 200 + Math.sin(angle) * 185;
              return (
                <motion.line
                  key={i}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="#fbbf24"
                  strokeWidth="3"
                  strokeLinecap="round"
                  animate={{ opacity: [0, 1, 0], scale: [0.5, 1.2, 0.8] }}
                  transition={{ duration: 0.4 }}
                  style={{ transformOrigin: '160px 200px' }}
                />
              );
            })}
          </>
        )}
      </motion.svg>

      {/* Floating dots around alien when idle */}
      {emotion === 'idle' && (
        <div className="pointer-events-none absolute inset-0">
          {[0, 1, 2, 3, 4].map((i) => (
            <motion.div
              key={i}
              className="absolute h-1.5 w-1.5 rounded-full bg-teal-300/40"
              style={{
                left: `${20 + i * 18}%`,
                top: `${15 + (i % 2) * 60}%`,
              }}
              animate={{
                y: [0, -20, 0],
                opacity: [0.2, 0.6, 0.2],
              }}
              transition={{
                duration: 3 + i,
                repeat: Infinity,
                delay: i * 0.5,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
