"use client";

/**
 * Chooses a presentation per breakpoint and, when the neck doesn't fit, shows a sliding window
 * of frets with arrow buttons and swipe navigation. Mobile users never get a squashed neck or a
 * page that scrolls sideways.
 */
import { type PointerEvent, useEffect, useMemo, useRef, useState } from "react";
import type { FretMarker, FretboardModel, FretboardSpec, Presentation } from "@/lib/fretboard";
import type { FretPosition, FretRange } from "@/lib/theory";
import { useElementWidth } from "@/hooks/useElementWidth";
import { useIsDesktop, useMediaQuery } from "@/hooks/useMediaQuery";
import { Fretboard } from "./Fretboard";

export interface ResponsiveFretboardProps {
  readonly model: FretboardModel;
  readonly layout?: FretboardSpec["layout"];
  readonly overlay?: readonly FretMarker[];
  readonly interactive?: boolean;
  readonly isSelectable?: (pos: FretPosition) => boolean;
  readonly onPress?: (pos: FretPosition) => void;
  readonly muteEmptyStrings?: boolean;
  /** Positions the initial window should include (defaults to the model's markers). */
  readonly focus?: readonly FretPosition[];
  readonly label: string;
}

/** Minimum on-screen width of one fret slot, in CSS pixels, before we start windowing.
 * Touch needs bigger targets than a mouse. */
const MIN_SLOT_PX = { neck: 54, fine: 46 } as const;
/** Short necks shouldn't stretch across wide screens; cap the width per visible fret. */
const MAX_SLOT_PX = 96;
const MAX_CHORD_FRETS = 5;

export function ResponsiveFretboard({
  model,
  layout,
  overlay,
  interactive,
  isSelectable,
  onPress,
  muteEmptyStrings,
  focus,
  label,
}: ResponsiveFretboardProps) {
  const desktop = useIsDesktop();
  const coarsePointer = useMediaQuery("(pointer: coarse)");
  const presentation: Presentation = (desktop ? layout?.desktop : layout?.mobile) ?? "neck";
  const containerRef = useRef<HTMLDivElement>(null);
  const width = useElementWidth(containerRef);

  const totalFrets = model.range.end - Math.max(1, model.range.start) + 1;
  const windowSize = useMemo(() => {
    if (presentation === "chord") return Math.min(totalFrets, MAX_CHORD_FRETS);
    if (width === null) return totalFrets;
    const fits = Math.floor((width - 40) / (coarsePointer ? MIN_SLOT_PX.neck : MIN_SLOT_PX.fine));
    return Math.max(3, Math.min(totalFrets, fits));
  }, [presentation, width, totalFrets, coarsePointer]);

  const windowed = windowSize < totalFrets;
  const minStart = model.range.start;
  // A window always shows `windowSize` fretted slots; when it starts at 0 the open zone is extra.
  const maxStart = Math.max(minStart, model.range.end - windowSize + 1);

  const focusPositions = focus ?? model.markers.map((m) => m.position);
  const initialStart = useMemo(() => {
    if (!windowed) return minStart;
    const frets = focusPositions.map((p) => p.fret).filter((f) => f > 0);
    const regionStart = model.region?.start;
    const target = regionStart ?? (frets.length ? Math.min(...frets) : minStart);
    // Include the open zone when the target is near the nut.
    const start = target <= windowSize ? minStart : target - 1;
    return clamp(start, minStart, maxStart);
    // Only recompute when the window geometry changes, not on every selection.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [windowed, windowSize, minStart, maxStart, model]);

  const [start, setStart] = useState(initialStart);
  useEffect(() => setStart(initialStart), [initialStart]);

  const view: FretRange = windowed
    ? { start, end: Math.min(model.range.end, Math.max(1, start) + windowSize - 1) }
    : model.range;

  const page = (dir: 1 | -1) => {
    const step = Math.max(1, windowSize - 1);
    setStart((s) => {
      const base = Math.max(1, s);
      const next = dir > 0 ? base + step : base - step;
      return next <= minStart + 1 && minStart === 0 ? 0 : clamp(next, minStart, maxStart);
    });
  };

  const swipe = useRef<{ x: number; y: number } | null>(null);
  const onPointerDown = (e: PointerEvent) => {
    swipe.current = { x: e.clientX, y: e.clientY };
  };
  const onPointerUp = (e: PointerEvent) => {
    if (!swipe.current || !windowed || presentation !== "neck") return;
    const dx = e.clientX - swipe.current.x;
    const dy = e.clientY - swipe.current.y;
    swipe.current = null;
    if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.5) page(dx < 0 ? 1 : -1);
  };

  const hiddenMarkers = windowed
    ? (overlay ?? []).filter((m) => m.position.fret !== 0 && (m.position.fret < Math.max(1, view.start) || m.position.fret > view.end)).length +
      (overlay ?? []).filter((m) => m.position.fret === 0 && view.start > 0).length
    : 0;

  return (
    <div className="w-full">
      <div
        ref={containerRef}
        className={presentation === "chord" ? "mx-auto w-full max-w-85" : "mx-auto w-full"}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        style={{
          touchAction: windowed && presentation === "neck" ? "pan-y" : undefined,
          maxWidth: presentation === "neck" ? (view.end - Math.max(1, view.start) + 2) * MAX_SLOT_PX : undefined,
        }}
      >
        <Fretboard
          model={model}
          presentation={presentation}
          view={view}
          overlay={overlay}
          interactive={interactive}
          isSelectable={isSelectable}
          onPress={onPress}
          muteEmptyStrings={muteEmptyStrings}
          label={label}
        />
      </div>
      {windowed && (
        <div className="mt-2 flex items-center justify-between gap-2 text-sm text-muted">
          <button
            type="button"
            onClick={() => page(-1)}
            disabled={start <= minStart}
            className="flex h-11 min-w-11 items-center justify-center rounded-full border border-border bg-surface px-3 font-medium text-text disabled:opacity-35"
            aria-label="Show lower frets"
          >
            <span aria-hidden>‹</span>
          </button>
          <span aria-live="polite" className="text-center">
            Frets {view.start}–{view.end}
            {hiddenMarkers > 0 && <span className="block text-xs">{hiddenMarkers} selected off-screen</span>}
          </span>
          <button
            type="button"
            onClick={() => page(1)}
            disabled={start >= maxStart}
            className="flex h-11 min-w-11 items-center justify-center rounded-full border border-border bg-surface px-3 font-medium text-text disabled:opacity-35"
            aria-label="Show higher frets"
          >
            <span aria-hidden>›</span>
          </button>
        </div>
      )}
      {!interactive && model.markers.length > 0 && (
        <ul className="sr-only">
          {model.markers.map((m) => (
            <li key={`${m.position.string}:${m.position.fret}`}>
              {m.description}
              {m.role && m.role !== "neutral" && m.role !== "tone" ? ` (${m.role})` : ""}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}
