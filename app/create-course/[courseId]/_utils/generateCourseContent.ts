import { generateAndSaveCourseChapter } from "@/app/actions/courses";
import { CourseType } from "@/types/types";

export const generateCourseContent = async (
  course: CourseType,
  setLoading: (loading: boolean) => void
) => {
  setLoading(true);

  try {
    const chapters = course?.courseOutput.chapters;
    if (!chapters) {
      throw new Error("Course chapters are missing.");
    }

    for (const [index, chapter] of chapters.entries()) {
      await generateAndSaveCourseChapter(
        course.courseId,
        index,
        course.courseName,
        chapter.chapter_name,
        chapter.description
      );
    }
  } finally {
    setLoading(false);
  }
};
