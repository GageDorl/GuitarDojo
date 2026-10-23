import type { Lesson } from "@/lib/courses";
import { NECK, board, buildUp, callout, choice, exercise, step, text } from "@/content/helpers";

export const sameNoteDifferentStrings: Lesson = {
  id: "same-note-different-strings",
  title: "One Note, Many Places",
  summary: "The same pitch lives on several strings. Learn the fifth-fret rule and its one exception.",
  kind: "lesson",
  estimatedMinutes: 9,
  objectives: [
    "Explain why one pitch can be played in several places",
    "Use the fifth-fret rule to move a note to the next string",
    "Remember that the G-to-B pair uses the fourth fret",
  ],
  prerequisites: ["notes-along-a-string"],
  completion: { type: "all-exercises-solved" },
  steps: [
    step("fifth-fret", "The fifth-fret rule", [
      text(`
        Each string is tuned to a note you can already play on the string below it. In standard tuning, **fret 5 of a string sounds exactly like the next open string up**, with one exception:

        - On the **G string**, it's **fret 4** that matches the open B string.

        Notes that are the same pitch, in the same octave, are called **unisons**. This is also how guitarists tune by ear.
      `),
      board(
        {
          range: { start: 0, end: 5 },
          labels: "pitch",
          positions: [
            { string: 6, fret: 5, role: "tone" },
            { string: 5, fret: 0, role: "tone" },
            { string: 5, fret: 5, role: "third" },
            { string: 4, fret: 0, role: "third" },
            { string: 4, fret: 5, role: "fifth" },
            { string: 3, fret: 0, role: "fifth" },
            { string: 3, fret: 4, role: "root" },
            { string: 2, fret: 0, role: "root" },
            { string: 2, fret: 5, role: "tone" },
            { string: 1, fret: 0, role: "tone" },
          ],
          layout: NECK,
        },
        "Matching colours are the same pitch. Fret 5 everywhere, except fret 4 on the G string (squares).",
      ),
      callout(
        "guitar",
        "Play fret 5 on the low E string, then the open A string. They should sound identical. If they don't, one of the strings is out of tune.",
        "Hear it",
      ),
    ]),
    step("three-places", "One pitch, three places", [
      {
        type: "demo",
        title: "Where does D3 live?",
        board: { range: { start: 0, end: 12 }, labels: "pitch", layout: NECK },
        frames: buildUp([
          { at: { string: 4, fret: 0, role: "root" }, caption: "D3 is the open D string." },
          { at: { string: 5, fret: 5, role: "root" }, caption: "The same pitch is fret 5 on the A string." },
          { at: { string: 6, fret: 10, role: "root" }, caption: "And fret 10 on the low E string: five frets further up, one string lower." },
        ]),
      },
      { type: "note-explorer", range: { start: 0, end: 12 }, showOctaves: false, caption: "Explore: tap any note to see every other place that exact pitch is played." },
    ]),
    step("practice", "Practice", [
      exercise({
        id: "unison-a2",
        kind: "fretboard",
        task: "locate",
        prompt: "This is **A2** (low E string, fret 5). Play the same pitch on another string.",
        hint: "Fret 5 matches the next open string up.",
        board: {
          range: { start: 0, end: 7 },
          labels: "none",
          strings: [5, 4, 3, 2, 1],
          positions: [{ string: 6, fret: 5, role: "root", label: "A" }],
          layout: NECK,
        },
        selection: "single",
        rule: { type: "pitches", pitches: ["A2"] },
        solution: [{ string: 5, fret: 0 }],
      }),
      exercise({
        id: "g3-on-d",
        kind: "fretboard",
        task: "locate",
        prompt: "Find the pitch of the open G string (**G3**) on the D string.",
        board: { range: { start: 0, end: 7 }, labels: "none", strings: [4], layout: NECK },
        selection: "single",
        rule: { type: "pitches", pitches: ["G3"] },
        solution: [{ string: 4, fret: 5 }],
      }),
      exercise({
        id: "b3-on-g",
        kind: "fretboard",
        task: "locate",
        prompt: "The B string breaks the pattern. Find the open B string's pitch (**B3**) on the G string.",
        hint: "This is the exception: not fret 5.",
        explanation: "G string, fret 4. The G and B strings are only four frets (a major third) apart.",
        board: { range: { start: 0, end: 7 }, labels: "none", strings: [3], layout: NECK },
        selection: "single",
        rule: { type: "pitches", pitches: ["B3"] },
        solution: [{ string: 3, fret: 4 }],
      }),
      exercise({
        id: "every-e3",
        kind: "fretboard",
        task: "locate",
        prompt: "Find every place the pitch **E3** can be played, from the nut to fret 12.",
        hint: "E3 is the D string's fret 2. Move it down a string at a time: five frets further up each time.",
        explanation: "E3 is D string fret 2, A string fret 7 and low E string fret 12: three spellings of one sound.",
        board: { range: { start: 0, end: 12 }, labels: "none", layout: NECK },
        selection: "multi",
        rule: {
          type: "exact-positions",
          positions: [
            { string: 4, fret: 2 },
            { string: 5, fret: 7 },
            { string: 6, fret: 12 },
          ],
        },
        solution: [
          { string: 4, fret: 2 },
          { string: 5, fret: 7 },
          { string: 6, fret: 12 },
        ],
      }),
      choice(
        "fret-5-of-d",
        "Fret 5 of the D string has the same pitch as which open string?",
        [
          ["g", "G"],
          ["a", "A", "The open A string matches fret 5 of the low E string."],
          ["b", "B", "The open B string matches fret 4 of the G string."],
        ],
        "g",
      ),
    ]),
  ],
};
