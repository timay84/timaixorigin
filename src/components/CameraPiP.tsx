import { useEffect, useRef, useState } from 'react';
import { Video, VideoOff, AlertCircle } from 'lucide-react';

export function CameraPiP() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [status, setStatus] = useState<'loading' | 'active' | 'denied'>('loading');
  const [muted, setMuted] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 320, height: 240 },
          audio: false,
        });
        if (!mounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setStatus('active');
      } catch {
        if (mounted) setStatus('denied');
      }
    }

    startCamera();

    return () => {
      mounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  return (
    <div className="fixed bottom-6 right-6 z-30">
      <div className="relative h-36 w-48 overflow-hidden rounded-2xl border border-white/10 bg-slate-900/80 shadow-2xl backdrop-blur-md sm:h-40 sm:w-56">
        {status === 'active' && (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted={muted}
            className="h-full w-full -scale-x-100 object-cover"
          />
        )}

        {status === 'loading' && (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-slate-400">
            <Video className="h-6 w-6 animate-pulse" />
            <span className="text-xs">Connecting camera...</span>
          </div>
        )}

        {status === 'denied' && (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-slate-500">
            <AlertCircle className="h-6 w-6 text-amber-400" />
            <span className="px-3 text-center text-xs">
              Camera access denied.
              <br />
              Using fallback view.
            </span>
            <VideoOff className="h-5 w-5 text-slate-600" />
          </div>
        )}

        {/* Label */}
        <div className="absolute left-2 top-2 flex items-center gap-1.5 rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-medium text-white/80 backdrop-blur-sm">
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              status === 'active' ? 'bg-red-500 animate-pulse' : 'bg-slate-500'
            }`}
          />
          {status === 'active' ? 'LIVE' : status.toUpperCase()}
        </div>

        {/* Mute toggle */}
        {status === 'active' && (
          <button
            onClick={() => setMuted((m) => !m)}
            className="absolute bottom-2 right-2 rounded-lg bg-black/50 p-1.5 text-white/70 backdrop-blur-sm transition hover:bg-black/70 hover:text-white"
            aria-label={muted ? 'Unmute camera' : 'Mute camera'}
          >
            {muted ? <VideoOff className="h-3.5 w-3.5" /> : <Video className="h-3.5 w-3.5" />}
          </button>
        )}
      </div>
    </div>
  );
}
