"use client";

import { getMyCourses } from "@/app/actions/courses";
import { CourseType } from "@/types/types";
import { useUser } from "@clerk/nextjs";
import { useContext, useEffect, useState } from "react";
import CourseCard from "./CourseCard";
import { UserCourseListContext } from "@/app/_context/UserCourseList.context";
import SkeletonLoading from "./SkeletonLoading";

const UserCourseList = () => {
  const { user } = useUser();
  const [courses, setCourses] = useState<CourseType[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const { setUserCourseList } = useContext(UserCourseListContext);

  useEffect(() => {
    user && getUserCourses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const getUserCourses = async () => {
    try {
      const res = await getMyCourses();

      setCourses(res);
      setUserCourseList(res);
      setLoadError(null);
    } catch (error) {
      console.error("Failed to load user courses:", error);
      setLoadError("Unable to load your courses. Please refresh and try again.");
    }
  };

  if (loadError) return <p role="alert" className="mt-10 text-center">{loadError}</p>;
  if (courses?.length === 0) return <div className="flex justify-center items-center mt-44">No courses found</div>;
  return (
    <div className="mt-10">
      <h2 className="font-medium text-lg">My AI Courses</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {courses ? (
          courses.map((course, index) => (
            <CourseCard
              key={index}
              course={course}
              onRefresh={() => getUserCourses()}
            />
          ))
        ) : (
          <SkeletonLoading items={5} />
        )}
      </div>
    </div>
  );
};

export default UserCourseList;
