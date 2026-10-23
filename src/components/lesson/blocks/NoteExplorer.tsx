"use client";

/**
 * Ungraded exploration: tap a position to see its name, every other place the exact same pitch
 * lives (unisons) and the same note in other octaves.
 */
import { useMemo, useState } from "react";
import type { NoteExplorerBlock } from "@/lib/courses";
import { type FretMarker, resolveFretboard } from "@/lib/fretboard";
import {
  type FretPosition,
  findMidi,
  findPitchClass,
  midiAt,
  noteName,
  pitchName,
  samePosition,
  spellPitchClass,
  spelledPitchAt,
} from "@/lib/theory";
import { ResponsiveFretboard } from "@/components/fretboard/ResponsiveFretboard";
import { inline } from "../RichText";

export function NoteExplorer({ block }: { block: NoteExplorerBlock }) {
  const model = useMemo(
    () => resolveFretboard({ range: block.range, labels: "note", strings: block.strings, layout: { mobile: "neck", desktop: "neck" } }),
    [block.range, block.strings],
  );
  const [picked, setPicked] = useState<FretPosition | null>(null);
  const showOctaves = block.showOctaves ?? true;

  const info = useMemo(() => {
    if (!picked) return null;
    const tuning = model.tuning;
    const m = midiAt(tuning, picked);
    const pitch = spelledPitchAt(tuning, picked);
    const flat = spelledPitchAt(tuning, picked, [spellPitchClass(m % 12, "flat")]);
    const unisons = findMidi(tuning, m, block.range).filter((p) => !samePosition(p, picked));
    const octaves = showOctaves
      ? findPitchClass(tuning, m % 12, block.range).filter((p) => midiAt(tuning, p) !== m)
      : [];
    return { pitch, flat, unisons, octaves };
  }, [picked, model.tuning, block.range, showOctaves]);

  const overlay: FretMarker[] = [];
  if (picked && info) {
    overlay.push({ position: picked, role: "root", label: noteName(info.pitch) });
    for (const p of info.unisons) overlay.push({ position: p, role: "tone", label: noteName(info.pitch) });
    for (const p of info.octaves) overlay.push({ position: p, role: "fifth", label: pitchName(spelledPitchAt(model.tuning, p, [info.pitch])) });
  }

  let message = "Tap any fret to name the note and see where else it lives.";
  if (info) {
    const alt = info.pitch.accidental !== 0 ? ` (also called ${pitchName(info.flat)})` : "";
    const parts = [`This is **${pitchName(info.pitch)}**${alt}.`];
    parts.push(
      info.unisons.length
        ? `The exact same pitch is also at ${info.unisons.length} other place${info.unisons.length === 1 ? "" : "s"} (blue).`
        : "That exact pitch isn't anywhere else in view.",
    );
    if (showOctaves && info.octaves.length) parts.push(`Violet notes are ${noteName(info.pitch)} in other octaves.`);
    message = parts.join(" ");
  }

  return (
    <section className="rounded-2xl border border-tone/30 bg-surface p-3 sm:p-5" aria-label="Note explorer">
      <p className="mb-3 text-sm font-semibold">{block.caption ?? "Note explorer"}</p>
      <ResponsiveFretboard
        model={model}
        layout={{ mobile: "neck", desktop: "neck" }}
        overlay={overlay}
        interactive
        onPress={setPicked}
        label="Note explorer fretboard"
      />
      <p className="mt-3 min-h-[3em] rounded-xl bg-surface-2 px-4 py-3 text-center text-[0.95rem]" aria-live="polite" data-testid="note-explorer-info">
        {inline(message)}
      </p>
    </section>
  );
}
