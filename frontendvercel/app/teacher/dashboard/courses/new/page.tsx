import { NewCourseForm } from "@/components/teacher/new-course-form"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function NewCoursePage() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/teacher/dashboard/courses">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
      </div>

      <NewCourseForm />
    </div>
  )
}
