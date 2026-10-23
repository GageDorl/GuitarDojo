"use client";

/**
 * SVG fretboard renderer. Stateless with respect to music: it draws a FretboardModel plus
 * optional overlay markers, and reports presses. Exercise logic lives elsewhere.
 */
import { type KeyboardEvent, useId, useMemo, useRef, useState } from "react";
import type { FretMarker, FretboardModel, MarkerRole, MarkerState, Presentation } from "@/lib/fretboard";
import { describePosition } from "@/lib/fretboard";
import { type FretPosition, type FretRange, noteName, openStringPitch, positionKey } from "@/lib/theory";
import { DOUBLE_INLAY_FRETS, INLAY_FRETS, createGeometry, stringWidth } from "./geometry";

export interface FretboardProps {
  readonly model: FretboardModel;
  readonly presentation: Presentation;
  /** Visible fret window; defaults to the model's range. */
  readonly view?: FretRange;
  /** Markers drawn over the model's markers (e.g. the student's selection). Same position wins. */
  readonly overlay?: readonly FretMarker[];
  readonly interactive?: boolean;
  readonly isSelectable?: (pos: FretPosition) => boolean;
  readonly onPress?: (pos: FretPosition) => void;
  /** Draw × on strings with no marker (construction exercises: unplayed strings are muted). */
  readonly muteEmptyStrings?: boolean;
  readonly label: string;
  readonly className?: string;
}

const ROLE_VAR: Record<MarkerRole, string> = {
  root: "var(--role-root)",
  third: "var(--role-third)",
  fifth: "var(--role-fifth)",
  seventh: "var(--role-seventh)",
  tone: "var(--role-tone)",
  neutral: "var(--role-neutral)",
};

function markerColors(role: MarkerRole, state: MarkerState) {
  const roleColor = ROLE_VAR[role];
  switch (state) {
    case "selected":
      return { fill: "var(--ink)", stroke: "var(--ink)", text: "var(--ink-contrast)", dashed: false, opacity: 1 };
    case "correct":
      return { fill: "var(--correct)", stroke: "var(--surface)", text: "#fff", dashed: false, opacity: 1 };
    case "incorrect":
      return { fill: "var(--incorrect)", stroke: "var(--surface)", text: "#fff", dashed: false, opacity: 1 };
    case "missed":
      return { fill: "transparent", stroke: "var(--correct)", text: "var(--correct)", dashed: true, opacity: 1 };
    case "hint":
      return { fill: "transparent", stroke: roleColor, text: roleColor, dashed: true, opacity: 1 };
    case "ghost":
      return { fill: roleColor, stroke: "transparent", text: "#fff", dashed: false, opacity: 0.28 };
    default:
      return { fill: roleColor, stroke: "rgba(0,0,0,0.18)", text: "#fff", dashed: false, opacity: 1 };
  }
}

export function Fretboard({
  model,
  presentation,
  view,
  overlay,
  interactive = false,
  isSelectable,
  onPress,
  muteEmptyStrings = false,
  label,
  className,
}: FretboardProps) {
  const range = view ?? model.range;
  const stringCount = model.tuning.openStrings.length;
  const geo = useMemo(() => createGeometry(presentation, range, stringCount), [presentation, range, stringCount]);
  const titleId = useId();
  const svgRef = useRef<SVGSVGElement>(null);
  const [focusKey, setFocusKey] = useState<string | null>(null);
  const [focusVisible, setFocusVisible] = useState(false);

  const visible = (pos: FretPosition) =>
    (pos.fret === 0 ? geo.showsOpen : pos.fret >= geo.firstFret && pos.fret <= geo.lastFret);

  const markers = useMemo(() => {
    const merged = new Map<string, FretMarker>();
    for (const m of model.markers) merged.set(positionKey(m.position), m);
    for (const m of overlay ?? []) merged.set(positionKey(m.position), { ...merged.get(positionKey(m.position)), ...m });
    return [...merged.values()].filter((m) => visible(m.position));
  }, [model.markers, overlay, geo]);

  const active = (string: number) => !model.activeStrings || model.activeStrings.includes(string);

  // Interactive cells in a stable navigation order.
  const cells = useMemo(() => {
    if (!interactive) return [];
    const list: FretPosition[] = [];
    const frets: number[] = [];
    if (geo.showsOpen) frets.push(0);
    for (let f = geo.firstFret; f <= geo.lastFret; f++) frets.push(f);
    for (const string of geo.strings) {
      if (!active(string)) continue;
      for (const fret of frets) {
        const pos = { string, fret };
        if (!isSelectable || isSelectable(pos)) list.push(pos);
      }
    }
    return list;
  }, [interactive, geo, isSelectable, model.activeStrings]);

  const tabbableKey = focusKey && cells.some((c) => positionKey(c) === focusKey) ? focusKey : cells[0] ? positionKey(cells[0]) : null;

  const focusCell = (pos: FretPosition) => {
    const key = positionKey(pos);
    setFocusKey(key);
    setFocusVisible(true);
    svgRef.current?.querySelector<SVGElement>(`[data-key="${key}"]`)?.focus();
  };

  const onKeyDown = (event: KeyboardEvent<SVGElement>, pos: FretPosition) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onPress?.(pos);
      return;
    }
    const neck = presentation === "neck";
    // Direction deltas: [fret, string]. On the neck string 1 is at the top; on chord diagrams string 6 is left.
    const deltas: Record<string, [number, number]> = neck
      ? { ArrowRight: [1, 0], ArrowLeft: [-1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }
      : { ArrowDown: [1, 0], ArrowUp: [-1, 0], ArrowRight: [0, -1], ArrowLeft: [0, 1] };
    const delta = deltas[event.key];
    if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      const target = event.key === "Home" ? cells[0] : cells[cells.length - 1];
      if (target) focusCell(target);
      return;
    }
    if (!delta) return;
    event.preventDefault();
    // Move to the nearest selectable cell in that direction.
    const [df, ds] = delta;
    const candidates = cells.filter((c) =>
      df !== 0 ? Math.sign(c.fret - pos.fret) === df : Math.sign(c.string - pos.string) === ds,
    );
    const best = candidates.sort((a, b) => {
      const da = Math.abs(a.fret - pos.fret) * (df ? 1 : 3) + Math.abs(a.string - pos.string) * (ds ? 1 : 3);
      const db = Math.abs(b.fret - pos.fret) * (df ? 1 : 3) + Math.abs(b.string - pos.string) * (ds ? 1 : 3);
      return da - db;
    })[0];
    if (best) focusCell(best);
  };

  const markerKeys = new Set(markers.map((m) => positionKey(m.position)));
  const r = geo.markerRadius;
  const hasOpenZone = geo.showsOpen || presentation === "chord";

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${geo.width} ${geo.height}`}
      className={className}
      role={interactive ? "group" : "img"}
      aria-labelledby={titleId}
      style={{ display: "block", width: "100%", height: "auto", touchAction: "manipulation", userSelect: "none" }}
      data-presentation={presentation}
    >
      <title id={titleId}>{label}</title>

      {/* Wood */}
      <rect {...geo.board} rx={presentation === "chord" ? 4 : 3} fill="var(--fb-wood)" />

      {/* Highlighted region */}
      {model.region && geo.span(model.region.start, model.region.end) && (
        <rect
          {...geo.span(model.region.start, model.region.end)!}
          fill="var(--fb-region)"
          fillOpacity={0.16}
          stroke="var(--fb-region)"
          strokeDasharray="6 5"
          strokeWidth={1.5}
          rx={6}
        />
      )}

      {/* Inlays */}
      {Array.from({ length: geo.lastFret - geo.firstFret + 1 }, (_, i) => geo.firstFret + i).map((fret) => {
        const mid = (geo.stringAcross(1) + geo.stringAcross(stringCount)) / 2;
        const along = geo.wireAlong(fret) - (geo.wireAlong(fret) - geo.wireAlong(fret - 1)) / 2;
        if (DOUBLE_INLAY_FRETS.has(fret)) {
          const offset = Math.abs(geo.stringAcross(2) - geo.stringAcross(1)) * 1.5;
          return (
            <g key={`inlay-${fret}`} fill="var(--fb-inlay)" opacity={0.55}>
              <circle {...toCircle(geo.point(along, mid - offset))} r={5} />
              <circle {...toCircle(geo.point(along, mid + offset))} r={5} />
            </g>
          );
        }
        if (!INLAY_FRETS.has(fret)) return null;
        return <circle key={`inlay-${fret}`} {...toCircle(geo.point(along, mid))} r={5.5} fill="var(--fb-inlay)" opacity={0.55} />;
      })}

      {/* Fret wires (nut when the window starts at 0) */}
      {Array.from({ length: geo.lastFret - geo.firstFret + 2 }, (_, i) => geo.firstFret - 1 + i).map((f) => {
        const isNut = f === 0;
        const a = geo.point(geo.wireAlong(f), geo.stringAcross(1));
        const b = geo.point(geo.wireAlong(f), geo.stringAcross(stringCount));
        const pad = 6;
        const [x1, y1, x2, y2] =
          presentation === "neck" ? [a.x, a.y - pad, b.x, b.y + pad] : [b.x - pad, b.y, a.x + pad, a.y];
        return (
          <line
            key={`wire-${f}`}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={isNut ? "var(--fb-nut)" : "var(--fb-fret)"}
            strokeWidth={isNut ? 7 : 2.5}
            strokeLinecap="round"
          />
        );
      })}

      {/* Strings */}
      {geo.strings.map((string) => {
        const start = geo.point(geo.wireAlong(geo.firstFret - 1), geo.stringAcross(string));
        const end = geo.point(geo.wireAlong(geo.lastFret) + 4, geo.stringAcross(string));
        return (
          <line
            key={`string-${string}`}
            x1={start.x}
            y1={start.y}
            x2={end.x}
            y2={end.y}
            stroke="var(--fb-string)"
            strokeWidth={stringWidth(string, presentation)}
            opacity={active(string) ? 0.95 : 0.3}
          />
        );
      })}

      {/* Fret numbers */}
      {presentation === "neck"
        ? Array.from({ length: geo.lastFret - geo.firstFret + 1 }, (_, i) => geo.firstFret + i).map((fret) => {
            const p = geo.fretLabel(fret);
            const strong = INLAY_FRETS.has(fret) || DOUBLE_INLAY_FRETS.has(fret);
            return (
              <text
                key={`fn-${fret}`}
                x={p.x}
                y={p.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={12}
                fontWeight={strong ? 700 : 400}
                fill="var(--fb-label)"
                opacity={strong ? 1 : 0.7}
              >
                {fret}
              </text>
            );
          })
        : geo.firstFret > 1 && (
            <text
              x={geo.fretLabel(geo.firstFret).x}
              y={geo.fretLabel(geo.firstFret).y}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={14}
              fontWeight={700}
              fill="var(--fb-label)"
            >
              {geo.firstFret}fr
            </text>
          )}

      {/* String names */}
      {geo.strings.map((string) => {
        const p = geo.stringLabel(string);
        return (
          <text
            key={`sn-${string}`}
            x={p.x}
            y={p.y}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={presentation === "neck" ? 12 : 13}
            fontWeight={600}
            fill="var(--fb-label)"
            opacity={active(string) ? 1 : 0.4}
          >
            {noteName(openStringPitch(model.tuning, string))}
          </text>
        );
      })}

      {/* Open / muted indicators */}
      {hasOpenZone &&
        geo.strings.map((string) => {
          if (markerKeys.has(positionKey({ string, fret: 0 }))) return null;
          const hasAny = markers.some((m) => m.position.string === string);
          const indicator = model.stringIndicators?.[string] ?? (muteEmptyStrings && !hasAny ? "muted" : undefined);
          if (!indicator) return null;
          const c = geo.noteCenter({ string, fret: 0 });
          if (indicator === "open") {
            return <circle key={`ind-${string}`} cx={c.x} cy={c.y} r={8} fill="none" stroke="var(--fb-label)" strokeWidth={2} />;
          }
          return (
            <g key={`ind-${string}`} stroke="var(--fb-label)" strokeWidth={2.2} strokeLinecap="round" opacity={0.8}>
              <line x1={c.x - 6} y1={c.y - 6} x2={c.x + 6} y2={c.y + 6} />
              <line x1={c.x - 6} y1={c.y + 6} x2={c.x + 6} y2={c.y - 6} />
            </g>
          );
        })}

      {/* Hit targets */}
      {cells.map((pos) => {
        const key = positionKey(pos);
        const cell = geo.cell(pos);
        const c = geo.noteCenter(pos);
        const selectedMarker = overlay?.find((m) => positionKey(m.position) === key);
        return (
          <g key={`cell-${key}`}>
            <rect
              className="fb-cell"
              data-key={key}
              data-testid={`fret-${pos.string}-${pos.fret}`}
              {...cell}
              fill="transparent"
              role="button"
              tabIndex={key === tabbableKey ? 0 : -1}
              aria-pressed={Boolean(selectedMarker)}
              aria-label={describePosition(model.tuning, pos)}
              onPointerDown={() => setFocusVisible(false)}
              onClick={() => {
                setFocusKey(key);
                onPress?.(pos);
              }}
              onKeyDown={(e) => onKeyDown(e, pos)}
              onFocus={(e) => {
                setFocusKey(key);
                setFocusVisible(e.currentTarget.matches(":focus-visible"));
              }}
              onBlur={() => setFocusVisible(false)}
            />
            <circle className="fb-hover" cx={c.x} cy={c.y} r={r} fill="var(--fb-string)" fillOpacity={0.22} stroke="var(--fb-string)" strokeOpacity={0.6} />
          </g>
        );
      })}

      {/* Markers */}
      {markers.map((m) => {
        const key = positionKey(m.position);
        const role = m.role ?? "neutral";
        const state = m.state ?? "default";
        const colors = markerColors(role, state);
        const c = geo.noteCenter(m.position);
        const isRoot = role === "root" && state !== "selected";
        const common = {
          fill: colors.fill,
          stroke: colors.stroke,
          strokeWidth: colors.dashed ? 2.5 : 2,
          strokeDasharray: colors.dashed ? "4 3" : undefined,
          opacity: colors.opacity,
        };
        return (
          <g
            key={`m-${key}-${state}`}
            className="fb-marker"
            data-state={state}
            data-role={role}
            data-testid={`marker-${m.position.string}-${m.position.fret}`}
            pointerEvents="none"
            aria-hidden="true"
          >
            {isRoot ? (
              <rect x={c.x - r} y={c.y - r} width={r * 2} height={r * 2} rx={r * 0.38} {...common} />
            ) : (
              <circle cx={c.x} cy={c.y} r={r} {...common} />
            )}
            {m.label && (
              <text
                x={c.x}
                y={c.y}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={m.label.length > 2 ? r * 0.72 : r * 0.92}
                fontWeight={700}
                fill={colors.text}
                opacity={state === "ghost" ? 0.9 : 1}
              >
                {m.label}
              </text>
            )}
            {state === "incorrect" && !m.label && (
              <g stroke="#fff" strokeWidth={2.4} strokeLinecap="round">
                <line x1={c.x - r * 0.35} y1={c.y - r * 0.35} x2={c.x + r * 0.35} y2={c.y + r * 0.35} />
                <line x1={c.x - r * 0.35} y1={c.y + r * 0.35} x2={c.x + r * 0.35} y2={c.y - r * 0.35} />
              </g>
            )}
            {state === "correct" && !m.label && (
              <path
                d={`M ${c.x - r * 0.4} ${c.y} L ${c.x - r * 0.1} ${c.y + r * 0.32} L ${c.x + r * 0.42} ${c.y - r * 0.3}`}
                fill="none"
                stroke="#fff"
                strokeWidth={2.6}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
          </g>
        );
      })}

      {/* Keyboard focus ring */}
      {interactive && focusVisible && focusKey && cells.some((c) => positionKey(c) === focusKey) && (() => {
        const [s, f] = focusKey.split(":").map(Number);
        const c = geo.noteCenter({ string: s!, fret: f! });
        return <circle cx={c.x} cy={c.y} r={r + 5} fill="none" stroke="var(--fb-focus)" strokeWidth={3} pointerEvents="none" />;
      })()}
    </svg>
  );
}

function toCircle(p: { x: number; y: number }) {
  return { cx: p.x, cy: p.y };
}

/** Plain-text summary of a board for screen readers. */
export function describeMarkers(model: FretboardModel, markers: readonly FretMarker[]): string[] {
  return markers.map((m) => m.description ?? describePosition(model.tuning, m.position));
}
