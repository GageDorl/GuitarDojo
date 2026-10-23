import type { Course } from "@/lib/courses";
import { whatIsAVoicing } from "./lessons/01-what-is-a-voicing";
import { doubling } from "./lessons/02-doubling";
import { inversionsAndBass } from "./lessons/03-inversions-and-bass";
import { stringGroups } from "./lessons/04-string-groups";
import { openChords } from "./lessons/05-open-chords";
import { barreChords } from "./lessons/06-barre-chords";
import { connectingShapes } from "./lessons/07-connecting-shapes";
import { voicingsCheckpoint } from "./lessons/08-checkpoint";

export const chordVoicings: Course = {
  id: "chord-voicings",
  title: "Chord Voicings and Inversions",
  description:
    "Play any chord many ways: inversions, triads on every string group, open chords, barre chords, and how the shapes connect.",
  level: "intermediate",
  stage: "intermediate",
  prerequisites: ["fretboard-foundations"],
  outcomes: [
    "Identify the bass note and inversion of any voicing",
    "Build major and minor triads on every string group",
    "Use moveable E- and A-shape barre chords in any key",
  ],
  modules: [
    {
      id: "voicings",
      title: "Chord Voicings and Inversions",
      description: "Voicings, doubling, inversions, string groups, open and barre chords, and connecting shapes.",
      lessons: [whatIsAVoicing, doubling, inversionsAndBass, stringGroups, openChords, barreChords, connectingShapes, voicingsCheckpoint],
    },
  ],
};
