import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Download, Calendar, TrendingUp, Users } from "lucide-react";

const TeacherReports = () => {
  const [selectedCourse, setSelectedCourse] = useState("1");
  const [reportType, setReportType] = useState("overview");

  const courses = [
    { id: "1", name: "Advanced Web Technologies - CSE401" },
    { id: "2", name: "Mobile App Development - CSE305" },
  ];

  const attendanceData = [
    { id: 1, name: "John Doe", gtuId: "123456", attended: 10, total: 12, rate: 83 },
    { id: 2, name: "Jane Smith", gtuId: "123457", attended: 12, total: 12, rate: 100 },
    { id: 3, name: "Bob Johnson", gtuId: "123458", attended: 8, total: 12, rate: 67 },
    { id: 4, name: "Alice Williams", gtuId: "123459", attended: 11, total: 12, rate: 92 },
    { id: 5, name: "Charlie Brown", gtuId: "123460", attended: 9, total: 12, rate: 75 },
  ];

  const getAttendanceBadge = (rate: number) => {
    if (rate >= 90) return <Badge className="bg-success">Excellent</Badge>;
    if (rate >= 75) return <Badge variant="secondary">Good</Badge>;
    if (rate >= 60) return <Badge className="bg-warning">Fair</Badge>;
    return <Badge variant="destructive">Poor</Badge>;
  };

  const handleExport = () => {
    console.log("Exporting report...");
    // Export to CSV/Excel
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Reports & Analytics</h1>
              <p className="text-muted-foreground">View and export attendance reports</p>
            </div>
            <Button onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
          </div>

          {/* Filters */}
          <Card className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Course</label>
                <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a course" />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map((course) => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Report Type</label>
                <Select value={reportType} onValueChange={setReportType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select report type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="overview">Overview</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="session">By Session</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Students</p>
                  <p className="text-3xl font-bold">45</p>
                </div>
                <Users className="w-8 h-8 text-primary" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Sessions</p>
                  <p className="text-3xl font-bold">12</p>
                </div>
                <Calendar className="w-8 h-8 text-secondary" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Avg Attendance</p>
                  <p className="text-3xl font-bold">83%</p>
                </div>
                <TrendingUp className="w-8 h-8 text-success" />
              </div>
            </Card>
          </div>

          {/* Attendance Table */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Student Attendance</h2>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student Name</TableHead>
                  <TableHead>GTU ID</TableHead>
                  <TableHead className="text-center">Sessions Attended</TableHead>
                  <TableHead className="text-center">Attendance Rate</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendanceData.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium">{student.name}</TableCell>
                    <TableCell>{student.gtuId}</TableCell>
                    <TableCell className="text-center">
                      {student.attended}/{student.total}
                    </TableCell>
                    <TableCell className="text-center font-semibold">
                      {student.rate}%
                    </TableCell>
                    <TableCell className="text-center">
                      {getAttendanceBadge(student.rate)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
    </div>
  );
};

export default TeacherReports;
