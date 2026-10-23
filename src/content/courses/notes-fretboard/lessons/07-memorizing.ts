import type { Lesson } from "@/lib/courses";
import { NECK, board, callout, drill, step, text } from "@/content/helpers";

export const memorizingTheFretboard: Lesson = {
  id: "memorizing-the-fretboard",
  title: "Learning the Neck by Heart",
  summary: "A practice system for finding notes from memory instead of counting.",
  kind: "lesson",
  estimatedMinutes: 12,
  objectives: [
    "Combine bass-string notes, octave shapes and unisons to find any note",
    "Find natural notes on every string from memory",
    "Find sharp and flat notes quickly",
  ],
  prerequisites: ["octaves"],
  completion: { type: "all-exercises-solved" },
  steps: [
    step("system", "A system, not a chart", [
      text(`
        Staring at a chart of every note doesn't stick. Instead, connect what you already know:

        - **Bass strings first.** You know the naturals on low E and A.
        - **Octave shapes** copy those notes to the D, G and B strings.
        - **The high E string** is the same as the low E string, two octaves up.
        - **Fret 12** starts the whole pattern again.

        Then practise *recall*: name and find notes without the labels. Short, frequent sessions beat long ones.
      `),
      board(
        { range: { start: 0, end: 12 }, notes: ["C", "D", "E", "F", "G", "A", "B"], labels: "note", layout: NECK },
        "All natural notes up to fret 12. Look for the octave shapes connecting the strings, then hide the chart and use the drills below.",
      ),
      callout(
        "guitar",
        "Pick one note a day. Play it on every string from 6 to 1 and back, saying its name. Then do the same with a new note tomorrow.",
        "A five-minute routine",
      ),
    ]),
    step("drills", "Recall drills", [
      text(`
        These drills draw new questions every time, so you can't memorise answers, only the fretboard itself. Aim to pass each one, then come back to them over the next few days.
      `),
      drill(
        "locate-naturals-anywhere",
        "Find natural notes on any string.",
        { type: "note-location", strings: [1, 2, 3, 4, 5, 6] },
        { rounds: 10, passScore: 0.8, hint: "Find the note on a bass string first, then use an octave shape or the fifth-fret rule." },
      ),
      drill(
        "name-naturals-anywhere",
        "Name natural notes anywhere on the neck.",
        { type: "note-naming", strings: [1, 2, 3, 4, 5, 6], range: { start: 0, end: 12 }, naturalsOnly: true },
        { rounds: 10, passScore: 0.8 },
      ),
      drill(
        "locate-accidentals",
        "Find sharps and flats on the three lowest strings.",
        { type: "note-location", strings: [6, 5, 4], notes: ["F#", "Bb", "C#", "Eb", "G#", "Ab", "Db"] },
        { rounds: 8, hint: "Find the natural note next door, then move one fret: up for ♯, down for ♭." },
      ),
    ]),
  ],
};
