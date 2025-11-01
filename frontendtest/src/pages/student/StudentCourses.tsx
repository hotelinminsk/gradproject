import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { BookOpen, QrCode, Plus, Calendar, Users, ChevronRight } from "lucide-react";
import StudentBottomNav from "@/components/student/StudentBottomNav";
import StudentPageHeader from "@/components/student/StudentPageHeader";

const StudentCourses = () => {
  const navigate = useNavigate();
  const [inviteToken, setInviteToken] = useState("");

  // Mock course data
  const courses = [
    {
      id: 1,
      name: "Advanced Web Technologies",
      code: "CSE401",
      teacher: "Dr. Smith",
      sessions: 12,
      attended: 9,
      hasActiveSession: true,
    },
    {
      id: 2,
      name: "Mobile Application Development",
      code: "CSE305",
      teacher: "Prof. Johnson",
      sessions: 8,
      attended: 3,
      hasActiveSession: false,
    },
    {
      id: 3,
      name: "Database Systems",
      code: "CSE302",
      teacher: "Dr. Williams",
      sessions: 10,
      attended: 9,
      hasActiveSession: false,
    },
  ];

  const handleEnrollByInvite = () => {
    console.log("Enrolling with token:", inviteToken);
    // POST /api/course/enroll-by-invite
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="px-4 pt-2">
        <StudentPageHeader title="My Courses" subtitle="Manage your enrolled courses" />
      </div>

      {/* Enroll Section */}
      <div className="px-4 space-y-4">
        <Card className="p-4">
          <h2 className="font-semibold mb-3 flex items-center">
            <Plus className="w-4 h-4 mr-2" />
            Enroll in New Course
          </h2>
          <div className="flex gap-2">
            <Input
              placeholder="Paste invite token or scan QR"
              value={inviteToken}
              onChange={(e) => setInviteToken(e.target.value)}
            />
            <Button onClick={handleEnrollByInvite}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </Card>

        {/* Course List */}
        <div className="space-y-3">
          {courses.map((course) => (
            <Card
              key={course.id}
              className="p-4 cursor-pointer hover:shadow-md transition-shadow rounded-2xl border"
              onClick={() => navigate(`/student/courses/${course.id}`)}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <BookOpen className="w-4 h-4 text-primary" />
                    <h3 className="font-semibold">{course.name}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">{course.code}</p>
                </div>
                <div className="flex items-center gap-2">
                  {course.hasActiveSession && (
                    <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 border-0">Active</Badge>
                  )}
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </div>
              </div>

              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  <span>{course.teacher}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>{course.attended}/{course.sessions} attended</span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-3">
                <div className="h-2 w-full rounded-full bg-muted"></div>
                <div
                  className="h-2 -mt-2 rounded-full bg-emerald-500"
                  style={{ width: `${Math.round((course.attended / course.sessions) * 100)}%` }}
                />
                <div className="flex justify-end text-xs text-muted-foreground mt-1">
                  {Math.round((course.attended / course.sessions) * 100)}%
                </div>
              </div>

              {course.hasActiveSession && (
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/student/check-in/${course.id}`);
                  }}
                  variant="default"
                  className="w-full mt-3"
                  size="sm"
                >
                  <QrCode className="w-4 h-4 mr-2" />
                  Check In Now
                </Button>
              )}
            </Card>
          ))}
        </div>
      </div>

      {/* Bottom nav comes from StudentLayout */}
    </div>
  );
};

export default StudentCourses;
