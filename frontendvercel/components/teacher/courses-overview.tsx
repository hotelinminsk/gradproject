"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Calendar, Clock, Users, BookOpen } from "lucide-react"
import { useRouter } from "next/navigation"

// Mock data - will be replaced with actual API calls
const mockCourses = [
  {
    id: "1",
    name: "Computer Networks",
    code: "CSE301",
    weekday: "Monday",
    hours: "9:00-12:00",
    studentCount: 45,
  },
  {
    id: "2",
    name: "Database Systems",
    code: "CSE302",
    weekday: "Thursday",
    hours: "14:30-17:30",
    studentCount: 38,
  },
]

export function CoursesOverview() {
  const router = useRouter()
  const [courses] = useState(mockCourses)

  const handleNewCourse = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    console.log("[v0] New Course button clicked - navigating to /teacher/dashboard/courses/new")
    router.push("/teacher/dashboard/courses/new")
  }

  const handleCourseClick = (courseId: string) => {
    console.log("[v0] Course card clicked - navigating to course:", courseId)
    router.push(`/teacher/dashboard/courses/${courseId}`)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-balance">My Courses</h1>
          <p className="text-muted-foreground mt-2">Manage your courses and track attendance</p>
        </div>
        <Button onClick={handleNewCourse} className="gap-2">
          <Plus className="h-4 w-4" />
          New Course
        </Button>
      </div>

      {courses.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No courses yet</h3>
            <p className="text-sm text-muted-foreground mb-4 text-center text-balance">
              Get started by creating your first course
            </p>
            <Button onClick={handleNewCourse} className="gap-2">
              <Plus className="h-4 w-4" />
              Create Course
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <Card
              key={course.id}
              className="cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => handleCourseClick(course.id)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-xl">{course.name}</CardTitle>
                    <Badge variant="secondary">{course.code}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>{course.weekday}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>{course.hours}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>{course.studentCount} students</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
