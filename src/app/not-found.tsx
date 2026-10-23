import { ButtonLink } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <p className="text-sm font-semibold text-accent">404</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight">That page is out of tune</h1>
      <p className="mt-3 text-muted">We couldn&apos;t find what you were looking for.</p>
      <ButtonLink href="/learn" className="mt-8">
        Go to courses
      </ButtonLink>
    </div>
  );
}
