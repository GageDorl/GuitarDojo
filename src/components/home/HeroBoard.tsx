"use client";

import { useMemo, useState } from "react";
import { type FretboardSpec, resolveFretboard } from "@/lib/fretboard";
import { ResponsiveFretboard } from "@/components/fretboard/ResponsiveFretboard";

const OPTIONS: { label: string; spec: FretboardSpec }[] = [
  { label: "C major", spec: { chord: { root: "C", quality: "major" }, range: { start: 0, end: 12 }, labels: "interval" } },
  { label: "A minor", spec: { chord: { root: "A", quality: "minor" }, range: { start: 0, end: 12 }, labels: "interval" } },
  { label: "A minor pentatonic", spec: { scale: { root: "A", type: "minor-pentatonic" }, range: { start: 0, end: 12 }, labels: "note" } },
];

/** A live taste of the fretboard on the landing page. */
export function HeroBoard() {
  const [i, setI] = useState(0);
  const option = OPTIONS[i]!;
  const model = useMemo(() => resolveFretboard(option.spec), [option]);
  return (
    <div className="rounded-3xl border border-border bg-surface p-3 shadow-sm sm:p-5">
      <div className="mb-3 flex flex-wrap gap-2" role="radiogroup" aria-label="Show on the fretboard">
        {OPTIONS.map((o, j) => (
          <button
            key={o.label}
            type="button"
            role="radio"
            aria-checked={i === j}
            onClick={() => setI(j)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
              i === j ? "bg-ink text-ink-contrast" : "bg-surface-2 text-muted hover:text-text"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
      <ResponsiveFretboard key={option.label} model={model} layout={{ mobile: "neck", desktop: "neck" }} label={`${option.label} across the fretboard`} />
    </div>
  );
}
