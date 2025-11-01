import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { BookOpen, Plus, Users, Link2, Upload } from "lucide-react";
import { toast } from "sonner";

const TeacherCourses = () => {
  const [uploadOpenId, setUploadOpenId] = useState<number | null>(null);
  const navigate = useNavigate();
  const [newCourse, setNewCourse] = useState({ name: "", code: "" });
  const [dialogOpen, setDialogOpen] = useState(false);

  const courses = [
    { id: 1, name: "Advanced Web Technologies", code: "CSE401", students: 45, sessions: 12 },
    { id: 2, name: "Mobile App Development", code: "CSE305", students: 38, sessions: 8 },
    { id: 3, name: "Database Systems", code: "CSE302", students: 42, sessions: 10 },
    { id: 4, name: "Software Engineering", code: "CSE303", students: 50, sessions: 14 },
  ];

  const handleCreateCourse = () => {
    console.log("Creating course:", newCourse);
    // POST /api/course
    toast.success("Course created successfully!");
    setDialogOpen(false);
    setNewCourse({ name: "", code: "" });
  };

  const handleGetInviteLink = (courseId: number) => {
    // GET /api/course/{courseId}/invite-link
    const inviteLink = `https://attendance.gtu.edu.tr/enroll/${courseId}/ABC123`;
    navigator.clipboard.writeText(inviteLink);
    toast.success("Invite link copied to clipboard!");
  };

  return (
    <div className="space-y-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Course Management</h1>
              <p className="text-muted-foreground">Create and manage your courses</p>
            </div>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  New Course
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Course</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="courseName">Course Name</Label>
                    <Input
                      id="courseName"
                      placeholder="e.g., Advanced Web Technologies"
                      value={newCourse.name}
                      onChange={(e) => setNewCourse({ ...newCourse, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="courseCode">Course Code</Label>
                    <Input
                      id="courseCode"
                      placeholder="e.g., CSE401"
                      value={newCourse.code}
                      onChange={(e) => setNewCourse({ ...newCourse, code: e.target.value })}
                    />
                  </div>
                  <Button onClick={handleCreateCourse} className="w-full">
                    Create Course
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Courses Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {courses.map((course) => (
              <Card key={course.id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <BookOpen className="w-5 h-5 text-primary" />
                      <h3 className="text-xl font-semibold">{course.name}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{course.code}</p>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span>{course.students} students</span>
                      </div>
                      <div>
                        <span>{course.sessions} sessions</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => navigate(`/teacher/courses/${course.id}`)}
                  >
                    Manage Course
                  </Button>
                  <Button
                    className="w-full"
                    onClick={() => navigate(`/teacher/session?courseId=${course.id}`)}
                  >
                    Start Session
                  </Button>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleGetInviteLink(course.id)}
                    >
                      <Link2 className="w-3 h-3 mr-1" />
                      Invite Link
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => setUploadOpenId(course.id)}
                    >
                      <Upload className="w-3 h-3 mr-1" />Upload Roster</Button>
                  </div>
                  <Dialog open={uploadOpenId === course.id} onOpenChange={(o)=> !o && setUploadOpenId(null)}>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Upload Roster</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-3 pt-2">
                        <Label htmlFor="roster-file">CSV or Excel file</Label>
                        <Input id="roster-file" type="file" accept=".csv,.xlsx" />
                        <Button className="w-full" onClick={() => { toast.success('Roster uploaded (mock)'); setUploadOpenId(null); }}>Upload</Button>
                        <p className="text-xs text-muted-foreground">Columns: FullName, Email, GtuStudentId</p>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </Card>
            ))}
          </div>
        </div>
    </div>
  );
};

export default TeacherCourses;
