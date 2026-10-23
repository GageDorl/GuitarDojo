import type { Course } from "@/lib/courses";
import { fiveNoteScales } from "./lessons/01-five-note-scales";
import { pentatonicRelatives } from "./lessons/02-pentatonic-relatives";
import { positionOne } from "./lessons/03-position-one";
import { fivePositions } from "./lessons/04-five-positions";
import { connectingPositions } from "./lessons/05-connecting-positions";
import { movingKeys } from "./lessons/06-moving-keys";
import { firstImprovisation } from "./lessons/07-first-improvisation";
import { pentatonicCheckpoint } from "./lessons/08-checkpoint";

export const pentatonicScales: Course = {
  id: "pentatonic-scales",
  title: "Pentatonic Scales and Fretboard Navigation",
  description:
    "Go beyond memorised boxes: know where every root is, connect all five positions, and move them to any key.",
  level: "intermediate",
  stage: "intermediate",
  prerequisites: ["major-minor-scales"],
  outcomes: [
    "Build major and minor pentatonic scales from their parent scales",
    "Find the roots in all five positions, in any key",
    "Connect positions and use them to start improvising",
  ],
  modules: [
    {
      id: "pentatonic",
      title: "Pentatonic Scales and Fretboard Navigation",
      description: "Construction, relative pentatonics, the five positions, connecting shapes, transposition and first phrases.",
      lessons: [
        fiveNoteScales,
        pentatonicRelatives,
        positionOne,
        fivePositions,
        connectingPositions,
        movingKeys,
        firstImprovisation,
        pentatonicCheckpoint,
      ],
    },
  ],
};
