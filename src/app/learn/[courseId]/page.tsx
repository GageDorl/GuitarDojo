import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CourseOverview } from "@/components/course/CourseOverview";
import { COURSES, getCourseOutline } from "@/content";

export function generateStaticParams() {
  return COURSES.map((c) => ({ courseId: c.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ courseId: string }> }): Promise<Metadata> {
  const course = getCourseOutline((await params).courseId);
  return course ? { title: course.title, description: course.description } : {};
}

export default async function CoursePage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params;
  const course = getCourseOutline(courseId);
  if (!course) notFound();
  const prerequisites = course.prerequisites.flatMap((id) => getCourseOutline(id) ?? []);
  return <CourseOverview course={course} prerequisites={prerequisites} />;
}
