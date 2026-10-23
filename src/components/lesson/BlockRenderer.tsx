"use client";

import type { LessonBlock } from "@/lib/courses";
import type { ExerciseRecord } from "@/lib/progress";
import { ExerciseView } from "@/components/exercises/ExerciseView";
import { ChromaticStrip } from "./blocks/ChromaticStrip";
import { DemoPlayer } from "./blocks/DemoPlayer";
import { IntervalExplorer } from "./blocks/IntervalExplorer";
import { NoteExplorer } from "./blocks/NoteExplorer";
import { CalloutView, CompareView, FretboardView, TriadStackView } from "./blocks/SimpleBlocks";
import { RichText } from "./RichText";

export interface BlockContext {
  readonly records: Readonly<Record<string, ExerciseRecord>>;
  readonly onAttempt: (exerciseId: string, correct: boolean) => void;
}

/** Maps each content block type to its component. Register new block types here. */
export function BlockRenderer({ block, ctx }: { block: LessonBlock; ctx: BlockContext }) {
  switch (block.type) {
    case "text":
      return <RichText body={block.body} className="text-[1.05rem]" />;
    case "callout":
      return <CalloutView block={block} />;
    case "fretboard":
      return <FretboardView block={block} />;
    case "demo":
      return <DemoPlayer block={block} />;
    case "chromatic":
      return <ChromaticStrip block={block} />;
    case "triad-stack":
      return <TriadStackView block={block} />;
    case "compare":
      return <CompareView block={block} />;
    case "interval-explorer":
      return <IntervalExplorer block={block} />;
    case "note-explorer":
      return <NoteExplorer block={block} />;
    case "exercise":
      return (
        <ExerciseView
          exercise={block.exercise}
          record={ctx.records[block.exercise.id]}
          onAttempt={(correct) => ctx.onAttempt(block.exercise.id, correct)}
        />
      );
  }
}
