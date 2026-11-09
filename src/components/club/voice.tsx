import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import { cn } from "@/lib/utils";

const bars = [6, 12, 18, 10, 22, 8, 16, 20, 9, 14, 7, 18, 11, 15, 8, 13];

export function VoiceNote({
  duration = 12,
  preview,
  src,
  tone = "dark",
}: {
  duration?: number;
  preview?: boolean;
  src?: string;
  tone?: "dark" | "light";
}) {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!playing || src) return;
    let frame = 0;
    const started = performance.now();
    const loop = () => {
      const next = Math.min(1, (performance.now() - started) / (duration * 1000));
      setProgress(next);
      if (next < 1) frame = requestAnimationFrame(loop);
      else setPlaying(false);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [playing, src, duration]);

  function toggle() {
    if (src && audioRef.current) {
      if (playing) audioRef.current.pause();
      else void audioRef.current.play();
    }
    if (progress >= 1) setProgress(0);
    setPlaying((value) => !value);
  }

  const ink = tone === "light";

  return (
    <div className={cn("flex items-center gap-3", ink ? "text-ink" : "text-fg")}>
      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? "Pause voice note" : "Play voice note"}
        className={cn(
          "inline-flex size-10 shrink-0 items-center justify-center rounded-full",
          ink ? "bg-ink text-paper" : "bg-paper text-ink",
        )}
      >
        {playing ? <Pause className="size-4" /> : <Play className="size-4" />}
      </button>
      <div className="flex h-8 flex-1 items-center gap-0.5" aria-hidden>
        {bars.map((height, index) => {
          const played = index / bars.length < progress;
          return (
            <span
              key={index}
              className={cn(
                "w-0.5 rounded-full",
                played ? (ink ? "bg-ink" : "bg-paper") : ink ? "bg-ink/30" : "bg-fg/30",
              )}
              style={{ height }}
            />
          );
        })}
      </div>
      <span className={cn("text-xs tabular-nums", ink ? "text-ink/70" : "text-secondary")}>
        0:{String(duration).padStart(2, "0")}
        {preview ? " · Preview" : ""}
      </span>
      {src ? (
        <audio
          ref={audioRef}
          src={src}
          onTimeUpdate={(event) => {
            const audio = event.currentTarget;
            if (audio.duration) setProgress(audio.currentTime / audio.duration);
          }}
          onEnded={() => {
            setPlaying(false);
            setProgress(1);
          }}
        />
      ) : null}
    </div>
  );
}
