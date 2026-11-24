"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/configs/db";
import {
  generateCourseChapters,
  generateCourseLayout,
} from "@/configs/ai-models";
import { getYoutubeVideos } from "@/configs/service";
import { CourseChapters, CourseList } from "@/schema/schema";
import { ChapterContentType, CourseType, UserInputType } from "@/types/types";

async function requireUserEmail() {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("You must be signed in to access courses.");
  }

  const user = await currentUser();
  const email = user?.primaryEmailAddress?.emailAddress;
  if (!email) {
    throw new Error("Your account must have a primary email address.");
  }

  return { email, user };
}

function requireCourseId(courseId: string) {
  if (!courseId.trim()) {
    throw new Error("A course ID is required.");
  }
}

async function getOptionalYoutubeVideoId(
  courseName: string,
  chapterName: string,
  includeVideo: boolean,
  previouslyUsedVideoIds: Set<string>
) {
  if (!includeVideo) {
    return "";
  }

  if (!process.env.YOUTUBE_API_KEY) {
    console.warn(
      "Skipping the chapter video because YOUTUBE_API_KEY is not configured."
    );
    return "";
  }

  try {
    const videos = await getYoutubeVideos(`${courseName}:${chapterName}`);
    const videoId = videos.find(
      (video: { id?: { videoId?: string } }) =>
        video.id?.videoId && !previouslyUsedVideoIds.has(video.id.videoId)
    )?.id?.videoId;
    if (!videoId) {
      console.warn(
        `No YouTube video was found for chapter "${chapterName}"; continuing without one.`
      );
    }
    return videoId ?? "";
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(
      `Could not fetch the optional video for chapter "${chapterName}"; continuing without one: ${message}`
    );
    return "";
  }
}

export async function getMyCourses(): Promise<CourseType[]> {
  const { email } = await requireUserEmail();
  const courses = await db
    .select()
    .from(CourseList)
    .where(eq(CourseList.createdBy, email));

  return courses as CourseType[];
}

export async function getExploreCourses(pageIndex: number): Promise<CourseType[]> {
  if (!Number.isSafeInteger(pageIndex) || pageIndex < 0) {
    throw new Error("Page index must be a non-negative integer.");
  }

  const courses = await db
    .select()
    .from(CourseList)
    .limit(8)
    .offset(pageIndex * 8);

  return courses as CourseType[];
}

export async function getCourseById(courseId: string): Promise<CourseType | null> {
  requireCourseId(courseId);
  const courses = await db
    .select()
    .from(CourseList)
    .where(eq(CourseList.courseId, courseId))
    .limit(1);

  return (courses[0] as CourseType) ?? null;
}

export async function getOwnedCourse(courseId: string): Promise<CourseType | null> {
  requireCourseId(courseId);
  const { email } = await requireUserEmail();
  const courses = await db
    .select()
    .from(CourseList)
    .where(
      and(
        eq(CourseList.courseId, courseId),
        eq(CourseList.createdBy, email)
      )
    )
    .limit(1);

  return (courses[0] as CourseType) ?? null;
}

export async function getCourseChapter(
  courseId: string,
  chapterId: number
): Promise<ChapterContentType | null> {
  requireCourseId(courseId);
  if (!Number.isSafeInteger(chapterId) || chapterId < 0) {
    throw new Error("Chapter ID must be a non-negative integer.");
  }

  const chapters = await db
    .select()
    .from(CourseChapters)
    .where(
      and(
        eq(CourseChapters.chapterId, chapterId),
        eq(CourseChapters.courseId, courseId)
      )
    )
    .limit(1);

  return (chapters[0] as ChapterContentType) ?? null;
}

export async function saveCourse(
  courseId: string,
  userInput: UserInputType,
  courseOutput: CourseType["courseOutput"]
) {
  requireCourseId(courseId);
  const { email, user } = await requireUserEmail();
  const { topic, category, difficulty } = userInput;
  if (!topic?.trim() || !category?.trim() || !difficulty?.trim()) {
    throw new Error("Course topic, category, and difficulty are required.");
  }

  await db.insert(CourseList).values({
    courseId,
    courseName: topic,
    category,
    level: difficulty,
    courseOutput,
    isVideo: userInput.video ?? "Yes",
    createdBy: email,
    username: user.fullName,
    userprofileimage: user.imageUrl,
  });
}

export async function generateCourseLayoutAction(
  prompt: string
): Promise<CourseType["courseOutput"]> {
  await requireUserEmail();
  if (!prompt.trim()) {
    throw new Error("A course prompt is required.");
  }

  return JSON.parse(
    await generateCourseLayout(prompt)
  ) as CourseType["courseOutput"];
}

export async function deleteMyCourse(id: number) {
  if (!Number.isSafeInteger(id) || id < 1) {
    throw new Error("A valid course ID is required.");
  }
  const { email } = await requireUserEmail();
  const deleted = await db
    .delete(CourseList)
    .where(and(eq(CourseList.id, id), eq(CourseList.createdBy, email)))
    .returning({ id: CourseList.id });

  if (deleted.length === 0) {
    throw new Error("Course not found or you do not have permission to delete it.");
  }
}

export async function updateCourseBanner(courseId: string, courseBanner: string) {
  requireCourseId(courseId);
  const { email } = await requireUserEmail();
  const updated = await db
    .update(CourseList)
    .set({ courseBanner })
    .where(
      and(
        eq(CourseList.courseId, courseId),
        eq(CourseList.createdBy, email)
      )
    )
    .returning({ id: CourseList.id });

  if (updated.length === 0) {
    throw new Error("Course not found or you do not have permission to update it.");
  }
}

export async function generateAndSaveCourseChapter(
  courseId: string,
  chapterId: number,
  courseName: string,
  chapterName: string,
  chapterDescription: string
) {
  requireCourseId(courseId);
  if (!Number.isSafeInteger(chapterId) || chapterId < 0) {
    throw new Error("Chapter ID must be a non-negative integer.");
  }
  if (!courseName.trim() || !chapterName.trim()) {
    throw new Error("Course and chapter names are required.");
  }
  const { email } = await requireUserEmail();
  const course = await db
    .select({
      id: CourseList.id,
      isVideo: CourseList.isVideo,
      level: CourseList.level,
    })
    .from(CourseList)
    .where(
      and(
        eq(CourseList.courseId, courseId),
        eq(CourseList.createdBy, email)
      )
    )
    .limit(1);

  if (course.length === 0) {
    throw new Error("Course not found or you do not have permission to update it.");
  }

  const previousChapters = await db
    .select({ videoId: CourseChapters.videoId })
    .from(CourseChapters)
    .where(eq(CourseChapters.courseId, courseId));
  const previouslyUsedVideoIds = new Set(
    previousChapters.map((chapter) => chapter.videoId).filter(Boolean)
  );
  const videoId = await getOptionalYoutubeVideoId(
    courseName,
    chapterName,
    course[0].isVideo === "Yes",
    previouslyUsedVideoIds
  );

  const prompt = `Create a clear, detailed lesson for this course chapter.
Course: ${courseName}
Learner level: ${course[0].level}
Chapter: ${chapterName}
Chapter description: ${chapterDescription}

Teach the ideas progressively, define important terms, explain why they matter, and include practical examples and common mistakes where relevant. Keep the lesson focused on this chapter and avoid filler or repeating the chapter title.

Return only a valid JSON array with 5 to 8 objects. Each object must have:
- "title": a short, descriptive section title
- "explanation": a thorough but readable explanation; Markdown inside this string is allowed
- "code_examples": an array of objects with a "code" array of strings wrapped in <precode>...</precode>, or [] when code is not relevant

For programming topics, include correct, runnable examples that build on the explanation. Do not wrap the JSON in Markdown fences.`;
  const content = JSON.parse(
    await generateCourseChapters(prompt)
  ) as ChapterContentType["content"];

  const existingChapter = await db
    .select({ id: CourseChapters.id })
    .from(CourseChapters)
    .where(
      and(
        eq(CourseChapters.courseId, courseId),
        eq(CourseChapters.chapterId, chapterId)
      )
    )
    .limit(1);

  if (existingChapter.length > 0) {
    await db
      .update(CourseChapters)
      .set({ content, videoId })
      .where(eq(CourseChapters.id, existingChapter[0].id));
  } else {
    await db.insert(CourseChapters).values({
      chapterId,
      courseId,
      content,
      videoId,
    });
  }
}

export async function publishCourse(courseId: string) {
  requireCourseId(courseId);
  const { email } = await requireUserEmail();
  const updated = await db
    .update(CourseList)
    .set({ isPublished: true })
    .where(
      and(
        eq(CourseList.courseId, courseId),
        eq(CourseList.createdBy, email)
      )
    )
    .returning({ id: CourseList.id });

  if (updated.length === 0) {
    throw new Error("Course not found or you do not have permission to publish it.");
  }
}

export async function updateCourseOutput(
  courseId: string,
  courseOutput: CourseType["courseOutput"]
) {
  requireCourseId(courseId);
  const { email } = await requireUserEmail();
  const updated = await db
    .update(CourseList)
    .set({ courseOutput })
    .where(
      and(
        eq(CourseList.courseId, courseId),
        eq(CourseList.createdBy, email)
      )
    )
    .returning({ id: CourseList.id });

  if (updated.length === 0) {
    throw new Error("Course not found or you do not have permission to update it.");
  }
}
