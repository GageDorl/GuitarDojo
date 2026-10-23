import { describe, expect, it } from "vitest";
import { STANDARD_TUNING, parseVoicing, voicingPositions, type FretPosition } from "@/lib/theory";
import { validate, validateChoice } from "./validators";
import type { MultipleChoiceExercise, ValidationRule } from "./types";

const ctx = (selection: FretPosition[], range = { start: 0, end: 12 }) => ({
  tuning: STANDARD_TUNING,
  selection,
  range,
});
const shape = (s: string) => voicingPositions(parseVoicing(s));
const codes = (rule: ValidationRule, selection: FretPosition[]) => validate(rule, ctx(selection)).issues.map((i) => i.code);

describe("chord validation", () => {
  const eMajor: ValidationRule = { type: "chord", chord: { root: "E", quality: "major" } };
  const aMajor: ValidationRule = { type: "chord", chord: { root: "A", quality: "major" } };

  it("accepts any valid voicing", () => {
    for (const s of ["022100", "x79997", "xx2454", "0221xx", "xx6454"]) {
      const result = validate(eMajor, ctx(shape(s)));
      expect(result.correct, s).toBe(true);
    }
  });

  it("explains a minor third played instead of a major third", () => {
    const result = validate(aMajor, ctx(shape("x02210"))); // A minor
    expect(result.correct).toBe(false);
    expect(result.message).toBe("Those notes form A minor, not A major.");
    const third = result.issues.find((i) => i.code === "wrong-third");
    expect(third?.message).toBe("C is a minor third above A. A major needs a major third: C♯.");
    expect(result.marks.find((m) => m.position.string === 2)?.state).toBe("incorrect");
  });

  it("explains a major third played instead of a minor third", () => {
    const result = validate({ type: "chord", chord: { root: "E", quality: "minor" } }, ctx(shape("022100")));
    expect(result.issues.find((i) => i.code === "wrong-third")?.message).toBe(
      "G♯ is a major third above E. E minor needs a minor third: G.",
    );
  });

  it("reports missing chord tones", () => {
    const result = validate(eMajor, ctx(shape("022xxx"))); // E B E
    expect(result.correct).toBe(false);
    expect(result.issues.map((i) => i.message)).toContain("Your chord is missing the third (G♯).");
  });

  it("flags non-chord tones and a misplaced fifth", () => {
    expect(codes(eMajor, shape("012100"))).toContain("wrong-fifth"); // A♯ on the A string
    expect(codes(eMajor, shape("022200"))).toContain("wrong-note"); // A on the G string
  });

  it("enforces inversions with an explanation", () => {
    const rule: ValidationRule = { type: "chord", chord: { root: "C", quality: "major" }, inversion: "root-position" };
    expect(validate(rule, ctx(shape("x32010"))).correct).toBe(true);
    const result = validate(rule, ctx(shape("032010"))); // E in the bass
    expect(result.correct).toBe(false);
    expect(result.message).toBe("Right chord, wrong inversion.");
    expect(result.issues[0]?.message).toContain("first inversion");
    expect(result.issues[0]?.message).toContain("put the root (C) in the bass");
    const first: ValidationRule = { ...rule, inversion: "first-inversion" };
    expect(validate(first, ctx(shape("032010"))).correct).toBe(true);
  });

  it("enforces string restrictions", () => {
    const rule: ValidationRule = {
      type: "chord",
      chord: { root: "A", quality: "minor" },
      strings: [1, 2, 3],
    };
    expect(validate(rule, ctx(shape("xxx555"))).correct).toBe(true); // C E A
    expect(codes(rule, shape("x02210"))).toContain("wrong-string");
  });

  it("rejects two notes on one string", () => {
    const sel = [...shape("022100"), { string: 1, fret: 4 }];
    expect(codes(eMajor, sel)).toContain("same-string");
  });

  it("asks for a selection when empty", () => {
    expect(validate(eMajor, ctx([])).issues[0]?.code).toBe("empty");
  });
});

describe("pitch class validation", () => {
  const everyG: ValidationRule = {
    type: "pitch-classes",
    notes: ["G"],
    region: { range: { start: 0, end: 5 } },
    match: "all",
  };
  const allGs = [
    { string: 6, fret: 3 },
    { string: 4, fret: 5 },
    { string: 3, fret: 0 },
    { string: 1, fret: 3 },
  ];

  it("accepts every occurrence in the region", () => {
    expect(validate(everyG, ctx(allGs)).correct).toBe(true);
  });

  it("reports missed occurrences with a count", () => {
    const result = validate(everyG, ctx(allGs.slice(0, 3)));
    expect(result.correct).toBe(false);
    expect(result.issues[0]?.message).toBe("You've found 3 of 4 G notes in frets 0–5. 1 more to find.");
    expect(result.marks.filter((m) => m.state === "missed")).toEqual([{ position: { string: 1, fret: 3 }, state: "missed" }]);
  });

  it("explains a wrong note with the fret distance to the target", () => {
    const result = validate(everyG, ctx([...allGs, { string: 6, fret: 2 }]));
    expect(result.issues[0]?.message).toBe("That's F♯ (string 6, fret 2), not G. G is 1 fret higher on this string.");
  });
});

describe("pitch validation (octave specific)", () => {
  const c4: ValidationRule = { type: "pitches", pitches: ["C4"] };

  it("accepts the pitch on any string", () => {
    expect(validate(c4, ctx([{ string: 2, fret: 1 }])).correct).toBe(true);
    expect(validate(c4, ctx([{ string: 3, fret: 5 }])).correct).toBe(true);
  });

  it("explains the right note name in the wrong octave", () => {
    const result = validate(c4, ctx([{ string: 5, fret: 3 }])); // C3
    expect(result.correct).toBe(false);
    expect(result.message).toBe("Right note, wrong octave.");
    expect(result.issues[0]?.message).toBe(
      "You found the right note name, but this C is C3: an octave lower than the C4 this exercise asks for.",
    );
  });
});

describe("interval validation", () => {
  const fifthAboveA: ValidationRule = { type: "interval", from: { string: 6, fret: 5 }, interval: "P5" };

  it("accepts the interval on any string", () => {
    expect(validate(fifthAboveA, ctx([{ string: 5, fret: 7 }])).correct).toBe(true); // E3
    expect(validate(fifthAboveA, ctx([{ string: 6, fret: 12 }])).correct).toBe(true);
  });

  it("explains a wrong interval in semitones", () => {
    const result = validate(fifthAboveA, ctx([{ string: 5, fret: 5 }])); // D3: perfect fourth
    expect(result.correct).toBe(false);
    expect(result.issues[0]?.message).toBe(
      "D3 is a perfect fourth above A. You need a perfect fifth (7 semitones), so the answer is 2 semitones higher than your choice.",
    );
  });

  it("detects the right note in the wrong octave unless any octave is allowed", () => {
    const highE = { string: 4, fret: 2 }; // E3? D string fret 2 = E3, the correct one
    expect(validate(fifthAboveA, ctx([highE])).correct).toBe(true);
    const e4 = { string: 1, fret: 0 };
    expect(validate(fifthAboveA, ctx([e4])).issues[0]?.code).toBe("wrong-octave");
    expect(validate({ ...fifthAboveA, octave: "any-octave" } as ValidationRule, ctx([e4])).correct).toBe(true);
  });

  it("finds the major third of C", () => {
    const rule: ValidationRule = { type: "interval", from: { string: 5, fret: 3 }, interval: "M3" };
    expect(validate(rule, ctx([{ string: 4, fret: 2 }])).correct).toBe(true); // E3
    const minor = validate(rule, ctx([{ string: 4, fret: 1 }])); // E♭3
    expect(minor.issues[0]?.message).toContain("a minor third above C");
  });
});

describe("scale and exact-position validation", () => {
  it("validates a pentatonic box", () => {
    const rule: ValidationRule = {
      type: "scale",
      scale: { root: "A", type: "minor-pentatonic" },
      region: { range: { start: 5, end: 8 } },
    };
    const box = [6, 5, 4, 3, 2, 1].flatMap((string) =>
      [5, 6, 7, 8]
        .map((fret) => ({ string, fret }))
        .filter(({ string, fret }) => {
          const pcs = new Set([9, 0, 2, 4, 7]);
          const open = [0, 64, 59, 55, 50, 45, 40][string]!;
          return pcs.has((open + fret) % 12);
        }),
    );
    expect(box).toHaveLength(12);
    expect(validate(rule, ctx(box)).correct).toBe(true);
    expect(validate(rule, ctx(box.slice(1))).correct).toBe(false);
  });

  it("explains a wrong pick using chord context", () => {
    const rule: ValidationRule = {
      type: "exact-positions",
      positions: [{ string: 5, fret: 3 }],
      context: { chord: { root: "C", quality: "major" } },
    };
    expect(validate(rule, ctx([{ string: 5, fret: 3 }])).correct).toBe(true);
    const wrong = validate(rule, ctx([{ string: 4, fret: 2 }]));
    expect(wrong.issues[0]?.message).toBe("That's E, the third of C major.");
  });
});

describe("multiple choice", () => {
  const ex: MultipleChoiceExercise = {
    id: "q",
    kind: "multiple-choice",
    prompt: "?",
    answer: "b",
    choices: [
      { id: "a", label: "A", feedback: "Nope, because reasons." },
      { id: "b", label: "B" },
    ],
  };
  it("returns choice-specific feedback", () => {
    expect(validateChoice(ex, "b").correct).toBe(true);
    expect(validateChoice(ex, "a").issues[0]?.message).toBe("Nope, because reasons.");
  });
});
