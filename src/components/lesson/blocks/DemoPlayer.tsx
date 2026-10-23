"use client";

/**
 * Step-through fretboard animation. Each frame is a board spec; markers animate in as frames
 * change. Plays automatically on request, and pauses at the end; students can also step manually.
 */
import { useEffect, useMemo, useState } from "react";
import type { DemoBlock } from "@/lib/courses";
import { resolveFretboard } from "@/lib/fretboard";
import { ResponsiveFretboard } from "@/components/fretboard/ResponsiveFretboard";
import { ArrowLeft, ArrowRight, PauseIcon, PlayIcon } from "@/components/ui/Icons";
import { inline } from "../RichText";

const FRAME_MS = 2600;

export function DemoPlayer({ block }: { block: DemoBlock }) {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const models = useMemo(
    () => block.frames.map((f) => resolveFretboard({ ...block.board, ...f.board })),
    [block.board, block.frames],
  );
  const last = block.frames.length - 1;
  // The window is chosen to fit every frame, so it doesn't jump between frames.
  const focus = useMemo(() => models.flatMap((m) => m.markers.map((x) => x.position)), [models]);

  useEffect(() => {
    if (!playing) return;
    if (index >= last) {
      setPlaying(false);
      return;
    }
    const t = window.setTimeout(() => setIndex((i) => i + 1), FRAME_MS);
    return () => window.clearTimeout(t);
  }, [playing, index, last]);

  const frame = block.frames[index]!;
  const model = models[index]!;

  const togglePlay = () => {
    if (playing) return setPlaying(false);
    if (index >= last) setIndex(0);
    setPlaying(true);
  };

  return (
    <section className="rounded-2xl border border-border bg-surface p-3 sm:p-5" aria-label={`Demonstration: ${block.title}`}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold">{block.title}</h3>
        <span className="shrink-0 text-xs text-muted tabular-nums">
          {index + 1} / {block.frames.length}
        </span>
      </div>
      <ResponsiveFretboard model={model} layout={block.board.layout} focus={focus} label={`${block.title}, step ${index + 1}: ${frame.caption}`} />
      <p className="fade-in mt-3 min-h-[3em] text-center text-[0.95rem]" key={index} aria-live="polite">
        {inline(frame.caption)}
      </p>
      <div className="mt-2 flex items-center justify-center gap-2">
        <button
          type="button"
          onClick={() => {
            setPlaying(false);
            setIndex((i) => Math.max(0, i - 1));
          }}
          disabled={index === 0}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-border disabled:opacity-35"
          aria-label="Previous step"
        >
          <ArrowLeft />
        </button>
        <button
          type="button"
          onClick={togglePlay}
          className="flex h-11 items-center gap-2 rounded-full bg-ink px-5 text-sm font-semibold text-ink-contrast"
        >
          {playing ? <PauseIcon /> : <PlayIcon />}
          {playing ? "Pause" : index >= last ? "Replay" : "Play"}
        </button>
        <button
          type="button"
          onClick={() => {
            setPlaying(false);
            setIndex((i) => Math.min(last, i + 1));
          }}
          disabled={index === last}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-border disabled:opacity-35"
          aria-label="Next step"
        >
          <ArrowRight />
        </button>
      </div>
      <div className="mt-3 flex justify-center gap-1.5" aria-hidden>
        {block.frames.map((_, i) => (
          <span key={i} className={`h-1.5 rounded-full transition-all ${i === index ? "w-6 bg-accent" : "w-1.5 bg-border"}`} />
        ))}
      </div>
    </section>
  );
}
