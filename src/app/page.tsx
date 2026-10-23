import { ContinueLearning } from "@/components/home/ContinueLearning";
import { HeroBoard } from "@/components/home/HeroBoard";
import { ButtonLink } from "@/components/ui/Button";
import { SITE } from "@/config/site";

const FEATURES = [
  {
    title: "Learn by doing",
    body: "Every idea comes with a fretboard you can touch. Build chords, find notes and hear the theory in your hands.",
  },
  {
    title: "Feedback that teaches",
    body: "Wrong answers get a musical explanation: “you played a minor third, a major chord needs a major third.”",
  },
  {
    title: "Made for your phone",
    body: "Big touch targets, chord diagrams sized for one hand, and no sideways scrolling. Practise with your guitar on your lap.",
  },
];

export default function HomePage() {
  return (
    <div className="mx-auto max-w-6xl px-4">
      <section className="grid items-center gap-10 py-10 sm:py-16 lg:grid-cols-[1fr_1.45fr]">
        <div>
          <p className="text-sm font-semibold tracking-wide text-accent uppercase">Interactive guitar lessons</p>
          <h1 className="mt-3 text-4xl leading-[1.08] font-bold tracking-tight text-balance sm:text-5xl">
            {SITE.tagline}
          </h1>
          <p className="mt-4 max-w-xl text-lg text-muted">
            Understand what you play. Start with how major and minor chords are built, and see every note on the neck as you
            learn it.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <ContinueLearning />
            <ButtonLink href="/learn" variant="secondary" size="lg">
              Browse courses
            </ButtonLink>
          </div>
        </div>
        <HeroBoard />
      </section>

      <section className="grid gap-4 pb-16 sm:grid-cols-3" aria-label="Why Guitar Dojo">
        {FEATURES.map((f) => (
          <div key={f.title} className="rounded-2xl border border-border bg-surface p-5">
            <h2 className="font-semibold">{f.title}</h2>
            <p className="mt-1.5 text-[0.95rem] text-muted">{f.body}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
