import { StudentCourseDetail } from "@/components/student/student-course-detail"

export default function StudentCourseDetailPage({ params }: { params: { id: string } }) {
  return <StudentCourseDetail courseId={params.id} />
}
