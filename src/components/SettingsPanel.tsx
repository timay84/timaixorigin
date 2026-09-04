import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { Settings as SettingsIcon, X, Key, Eye, EyeOff } from 'lucide-react';
import type { Settings } from '@/types';

interface SettingsPanelProps {
  settings: Settings;
  onSave: (settings: Settings) => void;
}

export function SettingsPanel({ settings, onSave }: SettingsPanelProps) {
  const [open, setOpen] = useState(false);
  const [llmKey, setLlmKey] = useState(settings.llmApiKey);
  const [ttsKey, setTtsKey] = useState(settings.ttsApiKey);
  const [showLlm, setShowLlm] = useState(false);
  const [showTts, setShowTts] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    onSave({ llmApiKey: llmKey, ttsApiKey: ttsKey });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="fixed right-6 top-6 z-40 flex items-center gap-2 rounded-full border border-white/10 bg-slate-900/70 px-4 py-2.5 text-sm font-medium text-slate-300 backdrop-blur-md transition hover:bg-slate-800/70 hover:text-white"
      >
        <SettingsIcon className="h-4 w-4" />
        Settings
      </button>

      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            />

            {/* Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="fixed right-0 top-0 z-50 h-full w-full max-w-sm border-l border-white/10 bg-slate-900/95 p-6 backdrop-blur-xl"
            >
              <div className="mb-6 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
                  <Key className="h-5 w-5 text-teal-400" />
                  API Configuration
                </h2>
                <button
                  onClick={() => setOpen(false)}
                  className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white/5 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <p className="mb-6 text-sm text-slate-400">
                These keys are stored locally and will be used when you swap the mock
                services for real API calls. They are not transmitted anywhere in the
                current prototype.
              </p>

              {/* LLM API Key */}
              <div className="mb-5">
                <label className="mb-1.5 block text-sm font-medium text-slate-300">
                  LLM API Key
                </label>
                <div className="relative">
                  <input
                    type={showLlm ? 'text' : 'password'}
                    value={llmKey}
                    onChange={(e) => setLlmKey(e.target.value)}
                    placeholder="Enter LLM API key..."
                    className="w-full rounded-lg border border-white/10 bg-slate-800/50 px-3 py-2.5 pr-10 text-sm text-white placeholder-slate-500 outline-none transition focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/30"
                  />
                  <button
                    onClick={() => setShowLlm((s) => !s)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showLlm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* TTS API Key */}
              <div className="mb-6">
                <label className="mb-1.5 block text-sm font-medium text-slate-300">
                  TTS API Key
                </label>
                <div className="relative">
                  <input
                    type={showTts ? 'text' : 'password'}
                    value={ttsKey}
                    onChange={(e) => setTtsKey(e.target.value)}
                    placeholder="Enter TTS API key..."
                    className="w-full rounded-lg border border-white/10 bg-slate-800/50 px-3 py-2.5 pr-10 text-sm text-white placeholder-slate-500 outline-none transition focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/30"
                  />
                  <button
                    onClick={() => setShowTts((s) => !s)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showTts ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                onClick={handleSave}
                className="w-full rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-500"
              >
                {saved ? 'Saved!' : 'Save Configuration'}
              </button>

              <div className="mt-6 rounded-lg border border-white/5 bg-slate-800/30 p-4">
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Integration Notes
                </h3>
                <ul className="space-y-1.5 text-xs text-slate-400">
                  <li>
                    <span className="text-teal-400">LLM:</span> Replace mock stream in
                    llmService.ts with your streaming endpoint.
                  </li>
                  <li>
                    <span className="text-teal-400">TTS:</span> Replace mock oscillator in
                    ttsService.ts with Fish Audio HTTP call.
                  </li>
                </ul>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
