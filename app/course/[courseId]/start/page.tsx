"use client";

import { getCourseById, getCourseChapter } from "@/app/actions/courses";
import { Button } from "@/components/ui/button";
import { ChapterContentType, ChapterType, CourseType } from "@/types/types";
import Image from "next/image";
import { useParams } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
import { LuBookOpen, LuPlay, LuTimer } from "react-icons/lu";
import ChapterContent from "./_components/ChapterContent";
import ChapterListCard from "./_components/ChapterListCard";
import UserToolTip from "./_components/UserToolTip";
import ScrollProgress from "@/components/ui/scroll-progress";

const CourseStart = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const [course, setCourse] = useState<CourseType | null>(null);
  const [courseError, setCourseError] = useState<string | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<ChapterType | null>(
    null
  );
  const [selectedChapterIndex, setSelectedChapterIndex] = useState<
    number | null
  >(null);
  const [chapterContent, setChapterContent] =
    useState<ChapterContentType | null>(null);
  const [chapterLoading, setChapterLoading] = useState(false);
  const [chapterError, setChapterError] = useState<string | null>(null);
  const chapterRequestId = useRef(0);

  useEffect(() => {
    let active = true;

    const loadCourse = async () => {
      try {
        const result = await getCourseById(courseId);
        if (active) {
          setCourse(result);
          setCourseError(result ? null : "This course could not be found.");
        }
      } catch (error) {
        console.error("Failed to load course:", error);
        if (active) {
          setCourseError("Unable to load this course. Please refresh to try again.");
        }
      }
    };

    void loadCourse();
    return () => {
      active = false;
    };
  }, [courseId]);

  if (!course) {
    return (
      <main className="grid min-h-screen place-items-center bg-background px-6">
        <p role={courseError ? "alert" : undefined} className="text-muted-foreground">
          {courseError || "Loading your course..."}
        </p>
      </main>
    );
  }

  const courseTitle =
    course.courseOutput.topic || course.courseName || "Untitled course";
  const chapters = course.courseOutput.chapters || [];
  const lessonCount = chapters.length;
  const courseDuration = course.courseOutput.duration || "Self-paced";

  const selectChapter = async (chapter: ChapterType, chapterIndex: number) => {
    const requestId = ++chapterRequestId.current;
    setSelectedChapter(chapter);
    setSelectedChapterIndex(chapterIndex);
    setChapterContent(null);
    setChapterError(null);
    setChapterLoading(true);
    window.scrollTo({ top: 0, behavior: "smooth" });

    try {
      const content = await getCourseChapter(course.courseId, chapterIndex);
      if (requestId === chapterRequestId.current) {
        setChapterContent(content);
      }
    } catch (error) {
      console.error("Failed to load chapter content:", error);
      if (requestId === chapterRequestId.current) {
        setChapterError("Could not load this lesson. Please try again.");
      }
    } finally {
      if (requestId === chapterRequestId.current) {
        setChapterLoading(false);
      }
    }
  };

  const renderChapterCard = (chapter: ChapterType, index: number) => (
    <ChapterListCard
      key={index}
      chapter={chapter}
      index={index}
      selected={selectedChapterIndex === index}
      onSelect={() => void selectChapter(chapter, index)}
    />
  );

  const startFirstChapter = () => {
    if (chapters[0]) {
      void selectChapter(chapters[0], 0);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 flex-col border-r bg-background md:flex">
        <div className="border-b p-6">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
              <LuBookOpen aria-hidden="true" size={20} />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Learning space
              </p>
              <h1 className="mt-1 truncate font-semibold">{courseTitle}</h1>
            </div>
          </div>
          <div className="mt-6 flex items-center justify-between text-sm">
            <span className="font-medium">Course outline</span>
            <span className="text-muted-foreground">
              {lessonCount} {lessonCount === 1 ? "lesson" : "lessons"}
            </span>
          </div>
        </div>

        <nav
          aria-label="Course chapters"
          className="flex-1 space-y-1 overflow-y-auto p-3"
        >
          {chapters.map((chapter, index) => renderChapterCard(chapter, index))}
        </nav>

        <div className="border-t p-5">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{selectedChapterIndex === null ? "Ready when you are" : "Current lesson"}</span>
            <span>
              {selectedChapterIndex === null
                ? `0 / ${lessonCount}`
                : `${selectedChapterIndex + 1} / ${lessonCount}`}
            </span>
          </div>
          <div
            role="progressbar"
            aria-label="Current lesson"
            aria-valuemin={0}
            aria-valuemax={lessonCount}
            aria-valuenow={
              selectedChapterIndex === null ? 0 : selectedChapterIndex + 1
            }
            className="mt-3 h-2 overflow-hidden rounded-full bg-secondary"
          >
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{
                width: `${
                  lessonCount > 0 && selectedChapterIndex !== null
                    ? ((selectedChapterIndex + 1) / lessonCount) * 100
                    : 0
                }%`,
              }}
            />
          </div>
        </div>
      </aside>

      <header className="sticky top-0 z-20 border-b bg-background/95 px-4 py-3 backdrop-blur md:hidden">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Learning space
        </p>
        <p className="truncate font-semibold">{courseTitle}</p>
        <nav
          aria-label="Course chapters"
          className="-mx-1 mt-3 flex gap-2 overflow-x-auto px-1 pb-1"
        >
          {chapters.map((chapter, index) => (
            <button
              key={index}
              type="button"
              aria-current={
                selectedChapterIndex === index ? "step" : undefined
              }
              onClick={() => void selectChapter(chapter, index)}
              className={`flex shrink-0 items-center gap-2 rounded-full border px-3 py-2 text-sm transition-colors ${
                selectedChapterIndex === index
                  ? "border-primary bg-secondary text-primary"
                  : "border-border bg-background text-muted-foreground"
              }`}
            >
              <span className="font-semibold">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="max-w-40 truncate">{chapter.chapter_name}</span>
            </button>
          ))}
        </nav>
      </header>

      <main className="min-h-screen md:ml-72">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 md:px-8 md:py-10">
          <div className="mb-7 hidden items-center justify-between md:flex">
            <p className="text-sm text-muted-foreground">
              Your courses <span className="px-2 text-border">/</span>
              <span className="font-medium text-foreground">{courseTitle}</span>
            </p>
            <span className="rounded-full border bg-card px-3 py-1 text-xs text-muted-foreground">
              {lessonCount} {lessonCount === 1 ? "lesson" : "lessons"}
            </span>
          </div>

          {selectedChapter && selectedChapterIndex !== null ? (
            <div>
              {chapterLoading ? (
                <div className="mx-auto max-w-4xl animate-pulse space-y-6">
                  <div className="h-5 w-32 rounded-full bg-secondary" />
                  <div className="h-10 w-3/4 rounded-lg bg-muted" />
                  <div className="h-5 w-full rounded-lg bg-muted" />
                  <div className="h-48 rounded-2xl border bg-card" />
                </div>
              ) : chapterError ? (
                <div
                  role="alert"
                  className="mx-auto max-w-4xl rounded-2xl border border-destructive/20 bg-card p-6 text-destructive"
                >
                  {chapterError}
                </div>
              ) : (
                <ChapterContent
                  key={selectedChapterIndex}
                  chapter={selectedChapter}
                  content={chapterContent}
                  chapterNumber={selectedChapterIndex + 1}
                  totalChapters={lessonCount}
                />
              )}

              <div className="mx-auto mt-8 flex max-w-4xl items-center justify-between border-t pt-5">
                <Button
                  variant="outline"
                  disabled={chapterLoading || selectedChapterIndex === 0}
                  onClick={() =>
                    void selectChapter(
                      chapters[selectedChapterIndex - 1],
                      selectedChapterIndex - 1
                    )
                  }
                >
                  Previous lesson
                </Button>
                <span className="text-sm text-muted-foreground">
                  {selectedChapterIndex + 1} of {lessonCount}
                </span>
                <Button
                  disabled={
                    chapterLoading || selectedChapterIndex >= lessonCount - 1
                  }
                  onClick={() =>
                    void selectChapter(
                      chapters[selectedChapterIndex + 1],
                      selectedChapterIndex + 1
                    )
                  }
                >
                  Next lesson
                </Button>
              </div>
              <ScrollProgress />
            </div>
          ) : (
            <div className="space-y-12">
              <section className="grid overflow-hidden rounded-3xl border bg-secondary/40 shadow-sm lg:grid-cols-[1.05fr_0.95fr]">
                <div className="flex flex-col items-start justify-center p-6 sm:p-9 lg:p-12">
                  <span className="inline-flex items-center gap-2 rounded-full border bg-background/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-primary">
                    <LuBookOpen aria-hidden="true" />
                    Your learning space
                  </span>
                  <h1 className="mt-6 text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
                    Build your knowledge in{" "}
                    <span className="text-primary">{courseTitle}</span>
                  </h1>
                  <p className="mt-4 max-w-xl leading-7 text-muted-foreground">
                    {course.courseOutput.description ||
                      "Follow a focused learning path, explore each lesson, and build your understanding one step at a time."}
                  </p>

                  <div className="mt-6 flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-2 rounded-full border bg-background/80 px-3 py-2 text-sm">
                      <LuBookOpen
                        aria-hidden="true"
                        className="text-primary"
                      />
                      {lessonCount} lessons
                    </span>
                    <span className="inline-flex items-center gap-2 rounded-full border bg-background/80 px-3 py-2 text-sm">
                      <LuTimer aria-hidden="true" className="text-primary" />
                      {courseDuration}
                    </span>
                    <span className="rounded-full border bg-background/80 px-3 py-2 text-sm">
                      {course.level}
                    </span>
                  </div>

                  <Button
                    size="lg"
                    className="mt-8 gap-2 rounded-xl px-6"
                    disabled={lessonCount === 0}
                    onClick={startFirstChapter}
                  >
                    <LuPlay aria-hidden="true" />
                    Start first lesson
                  </Button>
                  <div className="mt-6">
                    <UserToolTip
                      username={course.username || "AI Course Generator"}
                      userProfileImage={
                        course.userprofileimage || "/userProfile.png"
                      }
                    />
                  </div>
                </div>

                <div className="relative min-h-64 bg-muted lg:min-h-full">
                  <Image
                    src={course.courseBanner || "/thumbnail.png"}
                    alt={`${courseTitle} course cover`}
                    fill
                    sizes="(max-width: 1024px) 100vw, 45vw"
                    priority
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-primary/15 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-6 text-primary-foreground sm:p-8">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-foreground/80">
                      Course overview
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
                      {courseTitle}
                    </h2>
                  </div>
                </div>
              </section>

              <section aria-labelledby="course-outline-heading">
                <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                      Your learning path
                    </p>
                    <h2
                      id="course-outline-heading"
                      className="mt-1 text-2xl font-semibold tracking-tight"
                    >
                      Course outline
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Choose a lesson to begin or continue learning.
                    </p>
                  </div>
                  <span className="rounded-full bg-secondary px-3 py-1.5 text-sm font-medium text-primary">
                    {lessonCount} {lessonCount === 1 ? "lesson" : "lessons"}
                  </span>
                </div>

                {lessonCount > 0 ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {chapters.map((chapter, index) =>
                      renderChapterCard(chapter, index)
                    )}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed bg-card p-8 text-center">
                    <p className="font-medium">No lessons are available yet.</p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Return to the course setup to add lessons.
                    </p>
                  </div>
                )}
              </section>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default CourseStart;
