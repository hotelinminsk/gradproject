import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Users, Link2, Upload, Play, Plus } from "lucide-react";

export default function TeacherCourseDetails() {
  const { courseId } = useParams();
  const navigate = useNavigate();

  // Mock data; replace with API later
  const course = {
    id: courseId,
    name: "Advanced Web Technologies",
    code: "CSE401",
    students: 45,
    sessions: 12,
    activeSession: false,
  };

  const startSession = () => navigate(`/teacher/session?courseId=${course.id}`);
  const openRoster = () => navigate(`/teacher/courses/${course.id}/roster`);
  const copyInvite = () => {
    const link = `https://attendance.gtu.edu.tr/enroll/${course.id}/ABC123`;
    navigator.clipboard.writeText(link);
    // optional toast if available globally
  };

  return (
    <div className="space-y-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="rounded-2xl p-5 bg-muted border">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                <h1 className="text-2xl font-extrabold leading-tight">{course.name}</h1>
              </div>
              <p className="text-sm text-muted-foreground">{course.code}</p>
              <div className="flex gap-2 mt-2">
                <Badge variant="secondary" className="bg-background border">{course.students} students</Badge>
                <Badge variant="secondary" className="bg-background border">{course.sessions} sessions</Badge>
              </div>
            </div>
            <div className="flex flex-col gap-2 w-full max-w-xs">
              <Button className="w-full rounded-full" onClick={startSession}>
                <Play className="w-4 h-4 mr-2" /> Start Session
              </Button>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" onClick={copyInvite} className="w-full">
                  <Link2 className="w-4 h-4 mr-1" /> Invite
                </Button>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full">
                      <Upload className="w-4 h-4 mr-1" /> Upload Roster
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Upload Roster</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3 pt-2">
                      <Label htmlFor="roster-file">CSV or Excel file</Label>
                      <Input id="roster-file" type="file" accept=".csv,.xlsx" />
                      <Button className="w-full">Upload</Button>
                      <p className="text-xs text-muted-foreground">Columns: FullName, Email, GtuStudentId</p>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="w-full" variant="secondary">
                    <Plus className="w-4 h-4 mr-2" /> Add Students Manually
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Manual Addition</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3 pt-2">
                    <div className="grid grid-cols-1 gap-3">
                      <div>
                        <Label htmlFor="fullName">Full Name</Label>
                        <Input id="fullName" placeholder="Student Name" />
                      </div>
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" placeholder="student@gtu.edu.tr" />
                      </div>
                      <div>
                        <Label htmlFor="gtu">GTU Student ID</Label>
                        <Input id="gtu" placeholder="123456" />
                      </div>
                    </div>
                    <Button className="w-full">Add Student</Button>
                    <p className="text-xs text-muted-foreground">You can add multiple students one by one.</p>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <Card className="p-4">
            <h2 className="font-semibold mb-2">Upcoming Sessions</h2>
            <p className="text-sm text-muted-foreground">No upcoming sessions scheduled.</p>
          </Card>
          <Card className="p-4">
            <h2 className="font-semibold mb-2">Recent Attendance</h2>
            <p className="text-sm text-muted-foreground">Reports will appear here after sessions.</p>
          </Card>
        </div>
      </div>
    </div>
  );
}

