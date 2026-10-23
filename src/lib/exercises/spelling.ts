import { type Note, buildChord, buildScale, parseNote, parsePitch } from "@/lib/theory";
import type { ValidationRule } from "./types";

/** Notes whose spelling should be used when labelling positions for a rule. */
export function ruleSpelling(rule: ValidationRule): Note[] | undefined {
  switch (rule.type) {
    case "chord":
      return buildChord(rule.chord.root, rule.chord.quality).tones.map((t) => t.note);
    case "pitch-classes":
      return rule.notes.map(parseNote);
    case "scale":
      return buildScale(rule.scale.root, rule.scale.type).degrees.map((d) => d.note);
    case "pitches":
      return rule.pitches.map(parsePitch);
    case "exact-positions":
      return rule.context?.chord ? buildChord(rule.context.chord.root, rule.context.chord.quality).tones.map((t) => t.note) : undefined;
    case "interval":
      return undefined;
  }
}
