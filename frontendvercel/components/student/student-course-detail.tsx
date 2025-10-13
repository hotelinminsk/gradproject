"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, Calendar, Clock, User, TrendingUp, CheckCircle2, XCircle } from "lucide-react"
import { useRouter } from "next/navigation"

// Mock data
const mockCourseData = {
  "1": {
    id: "1",
    name: "Computer Networks",
    code: "CSE301",
    weekday: "Monday",
    hours: "9:00-12:00",
    instructor: "Dr. Smith",
    attendanceRate: 85,
    totalSessions: 12,
    attendedSessions: 10,
    nextSession: "2024-12-02",
    sessions: [
      { id: "1", date: "2024-11-25", status: "present", topic: "TCP/IP Protocol" },
      { id: "2", date: "2024-11-18", status: "present", topic: "Network Layers" },
      { id: "3", date: "2024-11-11", status: "absent", topic: "Routing Algorithms" },
      { id: "4", date: "2024-11-04", status: "present", topic: "Network Security" },
      { id: "5", date: "2024-10-28", status: "present", topic: "DNS and DHCP" },
    ],
  },
  "2": {
    id: "2",
    name: "Database Systems",
    code: "CSE302",
    weekday: "Thursday",
    hours: "14:30-17:30",
    instructor: "Dr. Johnson",
    attendanceRate: 92,
    totalSessions: 12,
    attendedSessions: 11,
    nextSession: "2024-12-05",
    sessions: [
      { id: "1", date: "2024-11-28", status: "present", topic: "SQL Joins" },
      { id: "2", date: "2024-11-21", status: "present", topic: "Normalization" },
      { id: "3", date: "2024-11-14", status: "present", topic: "Transactions" },
      { id: "4", date: "2024-11-07", status: "absent", topic: "Indexing" },
      { id: "5", date: "2024-10-31", status: "present", topic: "Query Optimization" },
    ],
  },
}

interface StudentCourseDetailProps {
  courseId: string
}

export function StudentCourseDetail({ courseId }: StudentCourseDetailProps) {
  const router = useRouter()
  const [course] = useState(mockCourseData[courseId as keyof typeof mockCourseData])

  if (!course) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Course not found</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b">
        <div className="flex items-center gap-3 p-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-bold truncate">{course.name}</h1>
            <p className="text-sm text-muted-foreground">{course.code}</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Course Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Course Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Instructor:</span>
              <span className="font-medium">{course.instructor}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Schedule:</span>
              <span className="font-medium">{course.weekday}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Time:</span>
              <span className="font-medium">{course.hours}</span>
            </div>
            <div className="pt-2 border-t">
              <div className="text-sm text-muted-foreground mb-1">Next Session</div>
              <div className="font-medium">
                {new Date(course.nextSession).toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Attendance Stats Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Attendance Statistics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium">Attendance Rate</span>
              </div>
              <span className="text-2xl font-bold">{course.attendanceRate}%</span>
            </div>
            <Progress value={course.attendanceRate} className="h-2" />
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {course.attendedSessions} of {course.totalSessions} sessions attended
              </span>
              <Badge variant={course.attendanceRate >= 75 ? "default" : "destructive"}>
                {course.attendanceRate >= 75 ? "On Track" : "At Risk"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Attendance History */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Attendance History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {course.sessions.map((session) => (
                <div key={session.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="shrink-0 mt-0.5">
                    {session.status === "present" ? (
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    ) : (
                      <XCircle className="h-5 w-5 text-destructive" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-medium text-sm">{session.topic}</span>
                      <Badge variant={session.status === "present" ? "default" : "destructive"} className="shrink-0">
                        {session.status === "present" ? "Present" : "Absent"}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(session.date).toLocaleDateString("en-US", {
                        weekday: "short",
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
