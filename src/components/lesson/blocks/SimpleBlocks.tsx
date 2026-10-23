"use client";

import { useMemo } from "react";
import type { CalloutBlock, CompareBlock, FretboardBlock, TriadStackBlock } from "@/lib/courses";
import { resolveFretboard } from "@/lib/fretboard";
import { buildChord, chordName, intervalName, noteName, pitchClass, semitonesUp } from "@/lib/theory";
import { ResponsiveFretboard } from "@/components/fretboard/ResponsiveFretboard";
import { GuitarIcon, InfoIcon, LightbulbIcon } from "@/components/ui/Icons";
import { RichText } from "../RichText";

export function Figure({ children, caption }: { children: React.ReactNode; caption?: string }) {
  return (
    <figure className="rounded-2xl border border-border bg-surface p-3 sm:p-5">
      {children}
      {caption && <figcaption className="mt-3 text-center text-sm text-muted">{caption}</figcaption>}
    </figure>
  );
}

const CALLOUT_STYLES = {
  tip: { icon: <LightbulbIcon />, className: "border-accent/30 bg-accent-soft", label: "Tip" },
  note: { icon: <InfoIcon />, className: "border-border bg-surface-2", label: "Note" },
  guitar: { icon: <GuitarIcon />, className: "border-third/30 bg-third/10", label: "With your guitar" },
} as const;

export function CalloutView({ block }: { block: CalloutBlock }) {
  const style = CALLOUT_STYLES[block.tone];
  return (
    <aside className={`flex gap-3 rounded-2xl border p-4 ${style.className}`}>
      <span className="mt-0.5 shrink-0 text-accent">{style.icon}</span>
      <div className="min-w-0">
        <p className="mb-1 text-sm font-semibold">{block.title ?? style.label}</p>
        <RichText body={block.body} className="text-[0.95rem]" />
      </div>
    </aside>
  );
}

export function FretboardView({ block }: { block: FretboardBlock }) {
  const model = useMemo(() => resolveFretboard(block.board), [block.board]);
  return (
    <Figure caption={block.caption}>
      <ResponsiveFretboard model={model} layout={block.board.layout} label={block.caption ?? "Fretboard diagram"} />
    </Figure>
  );
}

export function CompareView({ block }: { block: CompareBlock }) {
  const models = useMemo(() => block.items.map((i) => resolveFretboard(i.board)), [block.items]);
  return (
    <Figure caption={block.caption}>
      <div className={`grid gap-4 ${block.items.length === 3 ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-2"}`}>
        {block.items.map((item, i) => (
          <div key={item.title} className="min-w-0 text-center">
            <p className="mb-2 font-semibold">{item.title}</p>
            <ResponsiveFretboard model={models[i]!} layout={item.board.layout} label={item.title} />
            {item.note && <p className="mt-1 text-sm text-muted">{item.note}</p>}
          </div>
        ))}
      </div>
    </Figure>
  );
}

const ROLE_BG = { root: "bg-root", third: "bg-third", fifth: "bg-fifth", seventh: "bg-root" } as const;

export function TriadStackView({ block }: { block: TriadStackBlock }) {
  const chord = buildChord(block.chord.root, block.chord.quality);
  const [root, third, fifth] = chord.tones;
  if (!root || !third || !fifth) return null;
  const lower = semitonesUp(pitchClass(root.note), pitchClass(third.note));
  const upper = semitonesUp(pitchClass(third.note), pitchClass(fifth.note));
  const stack = [
    { tone: fifth, gap: `${upper === 4 ? "major" : "minor"} third · ${upper} semitones` },
    { tone: third, gap: `${lower === 4 ? "major" : "minor"} third · ${lower} semitones` },
    { tone: root, gap: null },
  ];
  return (
    <Figure caption={block.caption}>
      <div className="mx-auto flex max-w-sm items-stretch gap-3" aria-label={`${chordName(chord)} triad: ${chord.tones.map((t) => noteName(t.note)).join(", ")}`} role="img">
        <div className="flex flex-1 flex-col">
          {stack.map(({ tone, gap }) => (
            <div key={tone.role}>
              <div className="flex items-center gap-3 rounded-xl border border-border bg-surface-2 p-2.5">
                <span
                  className={`flex h-11 w-11 shrink-0 items-center justify-center text-lg font-bold text-white ${ROLE_BG[tone.role]} ${
                    tone.role === "root" ? "rounded-lg" : "rounded-full"
                  }`}
                >
                  {noteName(tone.note)}
                </span>
                <span className="text-sm">
                  <span className="block font-semibold capitalize">{tone.role}</span>
                  <span className="text-muted">{tone.role === "root" ? "names the chord" : intervalName(tone.interval) + " above root"}</span>
                </span>
              </div>
              {gap && (
                <p className="py-1.5 pl-5 text-xs font-medium text-muted">
                  <span aria-hidden>↕ </span>
                  {gap}
                </p>
              )}
            </div>
          ))}
        </div>
        <div className="flex w-8 flex-col items-center py-6" aria-hidden>
          <div className="w-px flex-1 bg-fifth/60" />
          <span className="my-1 rotate-180 text-xs font-medium whitespace-nowrap text-muted [writing-mode:vertical-rl]">
            {intervalName(fifth.interval)} · {lower + upper} semitones
          </span>
          <div className="w-px flex-1 bg-fifth/60" />
        </div>
      </div>
    </Figure>
  );
}
