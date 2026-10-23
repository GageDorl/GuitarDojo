import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LessonPlayer } from "@/components/lesson/LessonPlayer";
import { allLessonParams, getCourse, getLesson } from "@/content";

interface Params {
  courseId: string;
  lessonId: string;
}

export function generateStaticParams(): Params[] {
  return allLessonParams();
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { courseId, lessonId } = await params;
  const lesson = getLesson(courseId, lessonId);
  return lesson ? { title: lesson.title, description: lesson.summary } : {};
}

export default async function LessonPage({ params }: { params: Promise<Params> }) {
  const { courseId, lessonId } = await params;
  if (!getCourse(courseId) || !getLesson(courseId, lessonId)) notFound();
  return <LessonPlayer courseId={courseId} lessonId={lessonId} />;
}
