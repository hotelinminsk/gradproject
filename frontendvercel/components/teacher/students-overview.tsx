"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Users, GraduationCap } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Mock data - will be replaced with actual API calls
const mockCourses = [
  { id: "1", code: "CSE301", name: "Computer Networks" },
  { id: "2", code: "CSE302", name: "Database Systems" },
  { id: "3", code: "CSE303", name: "Software Engineering" },
]

const mockStudents = [
  {
    id: "1",
    name: "Ahmet Yılmaz",
    gtuId: "190101001",
    courses: ["CSE301", "CSE302"],
    attendanceRate: 92,
  },
  {
    id: "2",
    name: "Ayşe Demir",
    gtuId: "190101002",
    courses: ["CSE301"],
    attendanceRate: 88,
  },
  {
    id: "3",
    name: "Mehmet Kaya",
    gtuId: "190101003",
    courses: ["CSE302"],
    attendanceRate: 95,
  },
  {
    id: "4",
    name: "Zeynep Şahin",
    gtuId: "190101004",
    courses: ["CSE301", "CSE302"],
    attendanceRate: 78,
  },
  {
    id: "5",
    name: "Can Öztürk",
    gtuId: "190101005",
    courses: ["CSE303"],
    attendanceRate: 85,
  },
]

export function StudentsOverview() {
  const [students] = useState(mockStudents)
  const [courses] = useState(mockCourses)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCourse, setSelectedCourse] = useState<string>("all")

  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) || student.gtuId.includes(searchQuery)
    const matchesCourse = selectedCourse === "all" || student.courses.includes(selectedCourse)
    return matchesSearch && matchesCourse
  })

  const getAttendanceBadgeVariant = (rate: number) => {
    if (rate >= 90) return "default"
    if (rate >= 75) return "secondary"
    return "destructive"
  }

  const getStudentCountForCourse = (courseCode: string) => {
    return students.filter((student) => student.courses.includes(courseCode)).length
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-balance">My Students</h1>
          <p className="text-muted-foreground mt-2">View and manage students enrolled in your courses</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-card rounded-lg border-2">
          <GraduationCap className="h-5 w-5 text-primary" />
          <div className="text-right">
            <div className="text-2xl font-bold">{students.length}</div>
            <div className="text-xs text-muted-foreground">Total Students</div>
          </div>
        </div>
      </div>

      <Card className="border-2 shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl">Student Roster</CardTitle>
          <CardDescription>Filter students by course and search by name or ID</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Tabs value={selectedCourse} onValueChange={setSelectedCourse} className="w-full">
            <TabsList className="w-full justify-start h-auto flex-wrap gap-2 bg-muted/50 p-2">
              <TabsTrigger
                value="all"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Users className="w-4 h-4 mr-2" />
                All Courses
                <Badge variant="secondary" className="ml-2">
                  {students.length}
                </Badge>
              </TabsTrigger>
              {courses.map((course) => (
                <TabsTrigger
                  key={course.id}
                  value={course.code}
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  {course.code}
                  <Badge variant="secondary" className="ml-2">
                    {getStudentCountForCourse(course.code)}
                  </Badge>
                </TabsTrigger>
              ))}
            </TabsList>

            <div className="mt-6 space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or GTU ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-12 border-2"
                />
              </div>

              <TabsContent value={selectedCourse} className="mt-0">
                <div className="border-2 rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="font-semibold">GTU ID</TableHead>
                        <TableHead className="font-semibold">Name</TableHead>
                        <TableHead className="font-semibold">Courses</TableHead>
                        <TableHead className="text-right font-semibold">Attendance Rate</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredStudents.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-muted-foreground py-12">
                            <GraduationCap className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <div className="font-medium">No students found</div>
                            <div className="text-sm">Try adjusting your search or filter</div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredStudents.map((student) => (
                          <TableRow key={student.id} className="hover:bg-muted/30">
                            <TableCell className="font-mono text-sm font-medium">{student.gtuId}</TableCell>
                            <TableCell className="font-medium">{student.name}</TableCell>
                            <TableCell>
                              <div className="flex gap-1 flex-wrap">
                                {student.courses.map((course) => (
                                  <Badge key={course} variant="outline" className="text-xs border-2">
                                    {course}
                                  </Badge>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <Badge
                                variant={getAttendanceBadgeVariant(student.attendanceRate)}
                                className="font-semibold"
                              >
                                {student.attendanceRate}%
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
