"use client";

/**
 * One octave of the chromatic scale as a strip of 13 cells (start note to its octave).
 * Highlighted notes take their role colour; optional arcs show semitone distances.
 */
import type { ChromaticBlock } from "@/lib/courses";
import { mod, noteName, parseNote, pitchClass, spellPitchClass } from "@/lib/theory";
import { Figure } from "./SimpleBlocks";

const CELL = 40;
const GAP = 4;
const ROLE_COLOR = {
  root: "var(--role-root)",
  third: "var(--role-third)",
  fifth: "var(--role-fifth)",
  tone: "var(--role-tone)",
} as const;

export function ChromaticStrip({ block }: { block: ChromaticBlock }) {
  const start = parseNote(block.start ?? "C");
  const startPc = pitchClass(start);
  const cells = Array.from({ length: 13 }, (_, i) => mod(startPc + i, 12));
  const highlights = (block.highlight ?? []).map((h) => ({ ...h, n: parseNote(h.note) }));
  const indexOf = (pc: number) => mod(pc - startPc, 12);

  const arcs =
    block.showDistances && highlights.length > 1
      ? highlights.slice(1).map((h, i) => {
          const a = indexOf(pitchClass(highlights[i]!.n));
          const b = indexOf(pitchClass(h.n));
          return { a, b: b <= a ? b + 12 : b };
        })
      : [];

  const arcSpace = arcs.length ? 46 : 8;
  const width = 13 * CELL + 12 * GAP;
  const height = arcSpace + CELL * 1.6 + 22;
  const cx = (i: number) => i * (CELL + GAP) + CELL / 2;

  const label = highlights.length
    ? `Chromatic scale from ${noteName(start)}. Highlighted: ${highlights.map((h) => noteName(h.n)).join(", ")}.`
    : `The twelve chromatic notes from ${noteName(start)} to ${noteName(start)} an octave higher.`;

  return (
    <Figure caption={block.caption}>
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={label} className="block h-auto w-full">
        {arcs.map(({ a, b }, i) => {
          const x1 = cx(a);
          const x2 = cx(b);
          const mid = (x1 + x2) / 2;
          const top = 8;
          return (
            <g key={i}>
              <path
                d={`M ${x1} ${arcSpace - 2} Q ${mid} ${top - 6} ${x2} ${arcSpace - 2}`}
                fill="none"
                stroke="var(--muted)"
                strokeWidth={1.6}
                strokeDasharray="3 3"
              />
              <rect x={mid - 13} y={top + 2} width={26} height={18} rx={9} fill="var(--surface)" stroke="var(--border)" />
              <text x={mid} y={top + 11} textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={700} fill="var(--text)">
                {b - a}
              </text>
            </g>
          );
        })}
        {cells.map((pc, i) => {
          const natural = spellPitchClass(pc).accidental === 0;
          // The octave cell (index 12) is only highlighted when an arc wraps up to it.
          const hl =
            i === 12
              ? arcs.some((x) => x.b === 12)
                ? highlights.find((h) => indexOf(pitchClass(h.n)) === 0)
                : undefined
              : highlights.find((h) => indexOf(pitchClass(h.n)) === i);
          const fill = hl ? ROLE_COLOR[hl.role ?? "tone"] : natural ? "var(--surface-2)" : "var(--border)";
          const x = i * (CELL + GAP);
          const y = arcSpace;
          const name = hl ? noteName(hl.n) : natural ? noteName(spellPitchClass(pc)) : null;
          return (
            <g key={i} opacity={i === 12 && !hl ? 0.55 : 1}>
              <rect x={x} y={y} width={CELL} height={CELL * 1.6} rx={hl?.role === "root" ? 6 : 10} fill={fill} stroke={natural || hl ? "var(--border)" : "none"} />
              {name && (
                <text
                  x={x + CELL / 2}
                  y={y + CELL * 0.8}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={name.length > 1 ? 17 : 21}
                  fontWeight={700}
                  fill={hl ? "#fff" : "var(--text)"}
                >
                  {name}
                </text>
              )}
              {hl && hl.label && hl.label !== name && (
                <text x={x + CELL / 2} y={y + CELL * 1.6 + 14} textAnchor="middle" fontSize={11} fontWeight={700} fill="var(--muted)">
                  {hl.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </Figure>
  );
}
