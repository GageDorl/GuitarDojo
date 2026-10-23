"use client";

/**
 * Ungraded guided practice: tap any position and see its interval from the root. Uses the theory
 * engine for octave-aware naming and root-relative spelling.
 */
import { useMemo, useState } from "react";
import type { IntervalExplorerBlock } from "@/lib/courses";
import { type FretMarker, type MarkerRole, resolveFretboard } from "@/lib/fretboard";
import {
  type FretPosition,
  formulaLabel,
  intervalFromSemitones,
  intervalName,
  midiAt,
  noteName,
  pitchName,
  samePosition,
  simpleNumber,
  spelledPitchAt,
  transpose,
} from "@/lib/theory";
import { ResponsiveFretboard } from "@/components/fretboard/ResponsiveFretboard";
import { inline } from "../RichText";

function roleForNumber(n: number): MarkerRole {
  const simple = simpleNumber(n);
  if (simple === 1) return "root";
  if (simple === 3) return "third";
  if (simple === 5) return "fifth";
  return "tone";
}

export function IntervalExplorer({ block }: { block: IntervalExplorerBlock }) {
  const model = useMemo(
    () => resolveFretboard({ range: block.range, positions: [{ ...block.root, role: "root" }], labels: "note", layout: { mobile: "neck", desktop: "neck" } }),
    [block.range, block.root],
  );
  const [picked, setPicked] = useState<FretPosition | null>(null);
  const rootPitch = spelledPitchAt(model.tuning, block.root);

  const info = useMemo(() => {
    if (!picked) return null;
    const diff = midiAt(model.tuning, picked) - midiAt(model.tuning, block.root);
    const interval = intervalFromSemitones(Math.abs(diff), { tritone: "A4" });
    const note = transpose(rootPitch, intervalFromSemitones(((diff % 12) + 12) % 12, { tritone: "A4" }));
    const pitch = { ...spelledPitchAt(model.tuning, picked, [note]) };
    return { diff, interval, note, pitch };
  }, [picked, model.tuning, block.root, rootPitch]);

  const overlay: FretMarker[] = picked && info && !samePosition(picked, block.root)
    ? [{ position: picked, role: roleForNumber(info.interval.number), label: formulaLabel(intervalFromSemitones(((info.diff % 12) + 12) % 12)) }]
    : [];

  let message = `Tap any note to measure its distance from **${noteName(rootPitch)}**.`;
  if (info && picked) {
    const { diff, interval, pitch } = info;
    if (diff === 0) message = `That's the root itself: **${pitchName(pitch)}**.`;
    else {
      const name = intervalName(interval);
      message = `**${pitchName(pitch)}** is ${/^[aeiou]/.test(name) ? "an" : "a"} **${name}** ${diff > 0 ? "above" : "below"} ${pitchName(rootPitch)}: ${Math.abs(diff)} semitone${Math.abs(diff) === 1 ? "" : "s"}.`;
    }
  }

  return (
    <section className="rounded-2xl border border-third/30 bg-surface p-3 sm:p-5" aria-label="Interval explorer">
      <p className="mb-3 text-sm font-semibold">{block.caption ?? "Interval explorer"}</p>
      <ResponsiveFretboard
        model={model}
        layout={{ mobile: "neck", desktop: "neck" }}
        overlay={overlay}
        interactive
        onPress={setPicked}
        focus={[block.root]}
        label="Interval explorer fretboard"
      />
      <p className="mt-3 min-h-[3em] rounded-xl bg-surface-2 px-4 py-3 text-center text-[0.95rem]" aria-live="polite">
        {inline(message)}
      </p>
    </section>
  );
}
