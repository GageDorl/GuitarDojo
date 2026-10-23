import type { Metadata } from "next";
import { CourseCard } from "@/components/course/CourseCard";
import { COURSES } from "@/content";

export const metadata: Metadata = { title: "Learn" };

export default function LearnPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:py-12">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Courses</h1>
      <p className="mt-2 text-lg text-muted">Structured, hands-on lessons. More courses are on the way.</p>
      <div className="mt-8 grid gap-4">
        {COURSES.map((course) => (
          <CourseCard key={course.id} courseId={course.id} />
        ))}
      </div>
    </div>
  );
}
