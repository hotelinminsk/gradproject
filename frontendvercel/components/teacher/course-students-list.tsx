"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Users } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface CourseStudentsListProps {
  courseId: string
}

// Mock data - will be replaced with actual API calls
const mockEnrolledStudents = [
  {
    id: "1",
    name: "Ahmet Yılmaz",
    gtuId: "190101001",
    enrolledDate: "2025-01-15",
    attendanceRate: 92,
    status: "active",
  },
  {
    id: "2",
    name: "Ayşe Demir",
    gtuId: "190101002",
    enrolledDate: "2025-01-15",
    attendanceRate: 88,
    status: "active",
  },
  {
    id: "3",
    name: "Mehmet Kaya",
    gtuId: "190101003",
    enrolledDate: "2025-01-16",
    attendanceRate: 95,
    status: "active",
  },
]

export function CourseStudentsList({ courseId }: CourseStudentsListProps) {
  const [students] = useState(mockEnrolledStudents)
  const [searchQuery, setSearchQuery] = useState("")

  const filteredStudents = students.filter(
    (student) => student.name.toLowerCase().includes(searchQuery.toLowerCase()) || student.gtuId.includes(searchQuery),
  )

  const getAttendanceBadgeVariant = (rate: number) => {
    if (rate >= 90) return "default"
    if (rate >= 75) return "secondary"
    return "destructive"
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Enrolled Students</CardTitle>
            <CardDescription>Students who have successfully joined this course</CardDescription>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>{students.length} enrolled</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or GTU ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>GTU ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Enrolled Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Attendance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No students found
                  </TableCell>
                </TableRow>
              ) : (
                filteredStudents.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell className="font-mono text-sm">{student.gtuId}</TableCell>
                    <TableCell className="font-medium">{student.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{student.enrolledDate}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs capitalize">
                        {student.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant={getAttendanceBadgeVariant(student.attendanceRate)}>
                        {student.attendanceRate}%
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
