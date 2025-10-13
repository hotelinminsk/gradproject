"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, TrendingUp, Calendar, Award } from "lucide-react"
import { Badge } from "@/components/ui/badge"

const mockStats = {
  totalCourses: 2,
  averageAttendance: 88.5,
  totalSessions: 24,
  attendedSessions: 21,
}

export function StudentReports() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
        <p className="text-sm text-muted-foreground mt-1">View your attendance statistics and performance</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Total Courses
            </CardDescription>
            <CardTitle className="text-3xl">{mockStats.totalCourses}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Avg. Attendance
            </CardDescription>
            <CardTitle className="text-3xl">{mockStats.averageAttendance}%</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Total Sessions
            </CardDescription>
            <CardTitle className="text-3xl">{mockStats.totalSessions}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <Award className="h-4 w-4" />
              Attended
            </CardDescription>
            <CardTitle className="text-3xl">{mockStats.attendedSessions}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Attendance Status</CardTitle>
          <CardDescription>Your current attendance standing</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 bg-primary/10 rounded-lg">
            <div>
              <p className="font-semibold">Excellent Attendance</p>
              <p className="text-sm text-muted-foreground">Keep up the great work!</p>
            </div>
            <Badge className="text-base px-4 py-2">{mockStats.averageAttendance}%</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
