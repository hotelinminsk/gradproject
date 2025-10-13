import { redirect } from "next/navigation"

export default function TeacherDashboardPage() {
  // Redirect to courses by default
  redirect("/teacher/dashboard/courses")
}
