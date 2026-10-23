import type { Course } from "@/lib/courses";
import { stringsAndTuning } from "./lessons/01-strings-and-tuning";
import { musicalAlphabet } from "./lessons/02-musical-alphabet";
import { sharpsAndFlats } from "./lessons/03-sharps-and-flats";
import { notesAlongAString } from "./lessons/04-notes-along-a-string";
import { sameNoteDifferentStrings } from "./lessons/05-same-note-different-strings";
import { octaves } from "./lessons/06-octaves";
import { memorizingTheFretboard } from "./lessons/07-memorizing";
import { notesCheckpoint } from "./lessons/08-checkpoint";

export const notesAndTheFretboard: Course = {
  id: "notes-and-fretboard",
  title: "Notes and the Fretboard",
  description:
    "Learn the names of the notes and where they live on the neck, from the open strings to finding any note from memory.",
  level: "beginner",
  stage: "foundation",
  prerequisites: [],
  outcomes: [
    "Name every open string and every note between the letters",
    "Find any note on any string, first with help, then from memory",
    "Move notes between strings with unisons and octave shapes",
  ],
  modules: [
    {
      id: "notes-fretboard",
      title: "Notes and the Fretboard",
      description: "Strings, steps, sharps and flats, octaves, and a system for learning the neck by heart.",
      lessons: [
        stringsAndTuning,
        musicalAlphabet,
        sharpsAndFlats,
        notesAlongAString,
        sameNoteDifferentStrings,
        octaves,
        memorizingTheFretboard,
        notesCheckpoint,
      ],
    },
  ],
};
