"use client"

import { useRouter } from "next/navigation"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ArrowLeft,
  Calendar,
  Clock,
  Users,
  LinkIcon,
  Copy,
  Check,
  Download,
  TrendingUp,
  TrendingDown,
  QrCode,
} from "lucide-react"
import Link from "next/link"
import { StudentRosterUpload } from "./student-roster-upload"
import { ManualStudentAdd } from "./manual-student-add"
import { CourseStudentsList } from "./course-students-list"
import { AttendanceHistoryChart } from "./attendance-history-chart"
import { AttendanceSessionDialog } from "./attendance-session-dialog"

// Mock data - will be replaced with actual API calls
const mockCourse = {
  id: "1",
  name: "Computer Networks",
  code: "CSE301",
  weekday: "Monday",
  hours: "9:00-12:00",
  studentCount: 75,
  invitationLink: "https://gtu-attendance.app/join/abc123xyz",
  averageAttendance: 74.7,
  lastSessionAttendance: 56,
  totalSessions: 12,
}

const mockAttendanceHistory = [
  { session: 1, date: "2024-09-09", expected: 75, attended: 72 },
  { session: 2, date: "2024-09-16", expected: 75, attended: 68 },
  { session: 3, date: "2024-09-23", expected: 75, attended: 70 },
  { session: 4, date: "2024-09-30", expected: 75, attended: 65 },
  { session: 5, date: "2024-10-07", expected: 75, attended: 58 },
  { session: 6, date: "2024-10-14", expected: 75, attended: 62 },
  { session: 7, date: "2024-10-21", expected: 75, attended: 67 },
  { session: 8, date: "2024-10-28", expected: 75, attended: 71 },
  { session: 9, date: "2024-11-04", expected: 75, attended: 69 },
  { session: 10, date: "2024-11-11", expected: 75, attended: 64 },
  { session: 11, date: "2024-11-18", expected: 75, attended: 60 },
  { session: 12, date: "2024-11-25", expected: 75, attended: 56 },
]

interface CourseDetailProps {
  courseId: string
}

export function CourseDetail({ courseId }: CourseDetailProps) {
  const router = useRouter()
  const [course] = useState(mockCourse)
  const [copied, setCopied] = useState(false)
  const [showAttendanceSession, setShowAttendanceSession] = useState(false)

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(course.invitationLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleExportData = () => {
    // TODO: Implement actual export functionality
    console.log("[v0] Exporting course data for course:", courseId)
    alert("Export functionality will be implemented soon!")
  }

  const attendanceTrend =
    mockAttendanceHistory.length >= 2
      ? mockAttendanceHistory[mockAttendanceHistory.length - 1].attended -
        mockAttendanceHistory[mockAttendanceHistory.length - 2].attended
      : 0

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/teacher/dashboard/courses">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-balance">{course.name}</h1>
            <Badge variant="secondary" className="text-base px-3 py-1">
              {course.code}
            </Badge>
          </div>
          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>{course.weekday}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{course.hours}</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>{course.studentCount} students</span>
            </div>
          </div>
        </div>
        <Button onClick={() => setShowAttendanceSession(true)} className="gap-2">
          <QrCode className="h-4 w-4" />
          Create Attendance Session
        </Button>
        <Button onClick={handleExportData} variant="outline" className="gap-2 bg-transparent">
          <Download className="h-4 w-4" />
          Export Data
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Sessions</CardDescription>
            <CardTitle className="text-3xl">{course.totalSessions}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Average Attendance</CardDescription>
            <CardTitle className="text-3xl">{course.averageAttendance}%</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Last Session</CardDescription>
            <div className="flex items-center gap-2">
              <CardTitle className="text-3xl">
                {course.lastSessionAttendance}/{course.studentCount}
              </CardTitle>
              {attendanceTrend !== 0 && (
                <Badge variant={attendanceTrend > 0 ? "default" : "destructive"} className="gap-1">
                  {attendanceTrend > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {Math.abs(attendanceTrend)}
                </Badge>
              )}
            </div>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Attendance History</CardTitle>
          <CardDescription>Track attendance trends across all sessions</CardDescription>
        </CardHeader>
        <CardContent>
          <AttendanceHistoryChart data={mockAttendanceHistory} />
        </CardContent>
      </Card>

      {/* Invitation Link Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <LinkIcon className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Course Invitation Link</CardTitle>
          </div>
          <CardDescription>Share this link with students to allow them to join the course</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <div className="flex-1 p-3 bg-muted rounded-lg font-mono text-sm break-all">{course.invitationLink}</div>
            <Button onClick={handleCopyLink} variant="outline" className="gap-2 bg-transparent">
              {copied ? (
                <>
                  <Check className="h-4 w-4" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy
                </>
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Students must be on the course roster to successfully join using this link
          </p>
        </CardContent>
      </Card>

      {/* Student Management Tabs */}
      <Tabs defaultValue="roster" className="space-y-4">
        <TabsList>
          <TabsTrigger value="roster">Student Roster</TabsTrigger>
          <TabsTrigger value="enrolled">Enrolled Students</TabsTrigger>
        </TabsList>

        <TabsContent value="roster" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Upload Student Roster</CardTitle>
              <CardDescription>
                Upload a CSV or XLSX file with student information. The file must contain "NAME" and "GTUid" columns.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <StudentRosterUpload courseId={courseId} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Manually Add Student</CardTitle>
              <CardDescription>Add individual students to the course roster</CardDescription>
            </CardHeader>
            <CardContent>
              <ManualStudentAdd courseId={courseId} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="enrolled">
          <CourseStudentsList courseId={courseId} />
        </TabsContent>
      </Tabs>

      <AttendanceSessionDialog
        open={showAttendanceSession}
        onOpenChange={setShowAttendanceSession}
        courseId={courseId}
        courseName={course.name}
      />
    </div>
  )
}
