"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, TrendingUp, BookOpen } from "lucide-react"
import { useRouter } from "next/navigation"

const mockCourses = [
  {
    id: "1",
    name: "Computer Networks",
    code: "CSE301",
    weekday: "Monday",
    hours: "9:00-12:00",
    instructor: "Dr. Smith",
    attendanceRate: 85,
    nextSession: "2024-12-02",
  },
  {
    id: "2",
    name: "Database Systems",
    code: "CSE302",
    weekday: "Thursday",
    hours: "14:30-17:30",
    instructor: "Dr. Johnson",
    attendanceRate: 92,
    nextSession: "2024-12-05",
  },
]

export function StudentCourses() {
  const router = useRouter()
  const [courses] = useState(mockCourses)

  const handleCourseClick = (courseId: string) => {
    router.push(`/student/dashboard/courses/${courseId}`)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Courses</h1>
        <p className="text-sm text-muted-foreground mt-1">Track your attendance and course schedule</p>
      </div>

      {courses.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No courses yet</h3>
            <p className="text-sm text-muted-foreground text-center">
              Join a course using an invitation link from your instructor
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {courses.map((course) => (
            <Card
              key={course.id}
              className="cursor-pointer active:scale-[0.98] transition-transform"
              onClick={() => handleCourseClick(course.id)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{course.name}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{course.code}</Badge>
                      <span className="text-sm text-muted-foreground">{course.instructor}</span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{course.weekday}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{course.hours}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Attendance Rate</span>
                  </div>
                  <span className="text-lg font-bold">{course.attendanceRate}%</span>
                </div>

                <div className="text-xs text-muted-foreground">
                  Next session: {new Date(course.nextSession).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
