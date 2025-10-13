import { CourseDetail } from "@/components/teacher/course-detail"

export default function CourseDetailPage({ params }: { params: { id: string } }) {
  return <CourseDetail courseId={params.id} />
}
