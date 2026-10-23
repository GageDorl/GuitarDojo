import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { AccessGate } from "@/components/account/AccessGate";
import { LessonPlayer } from "@/components/lesson/LessonPlayer";
import { allLessonParams, getCourseOutline, getLesson } from "@/content";
import { authorizeLesson } from "@/server/access";
import { getSessionUser } from "@/server/auth";

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
  const course = getCourseOutline(courseId);
  const lesson = getLesson(courseId, lessonId);
  if (!course || !lesson) notFound();

  // Server-side authorization BEFORE any lesson content is sent. Public lessons (all of them
  // during the beta) never read the session, so they stay statically rendered.
  const access = await authorizeLesson(courseId, lessonId, async () => getSessionUser(await headers()));
  if (!access.allowed) return <AccessGate course={course} lessonId={lessonId} reason={access.reason} />;

  return <LessonPlayer course={course} lesson={lesson} />;
}
