"use client";

import ChapterList from "@/app/create-course/[courseId]/_components/ChapterList";
import CourseBasicInfo from "@/app/create-course/[courseId]/_components/CourseBasicInfo";
import CourseDetail from "@/app/create-course/[courseId]/_components/CourseDetail";
import Header from "@/app/dashboard/_components/Header";
import { getCourseById } from "@/app/actions/courses";
import { CourseType } from "@/types/types";
import { useParams } from "next/navigation";
import React, { useEffect, useState } from "react";

const Course = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const [course, setCourse] = useState<CourseType | null>(null);
  const getCourse = async () => {
    const result = await getCourseById(courseId);
    setCourse(result);
    // console.log(result);
  };

  useEffect(() => {
    getCourse();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  return (
    <div>
      <Header />
      <div className="px-10 p-10 md:px-20 lg:px-44">
        <CourseBasicInfo
          courseInfo={course}
          onRefresh={() => console.log("REfreshing")}
          edit={false}
        />

        <CourseDetail courseDetail={course} />

        <ChapterList
          course={course}
          onRefresh={() => console.log("refreshing")}
          edit={false}
        />
      </div>
    </div>
  );
};

export default Course;
