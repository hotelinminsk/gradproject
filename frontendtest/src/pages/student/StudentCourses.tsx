import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { BookOpen, QrCode, Plus, Calendar, Users, ChevronRight } from "lucide-react";
import StudentBottomNav from "@/components/student/StudentBottomNav";
import StudentPageHeader from "@/components/student/StudentPageHeader";
import { useStudentCourses, useEnrollByInvite } from "@/hooks/student";
import { toast } from "sonner";

const StudentCourses = () => {
  const navigate = useNavigate();
  const [inviteToken, setInviteToken] = useState("");
  const { data: courses = [], isLoading } = useStudentCourses();
  const enroll = useEnrollByInvite();

  const handleEnrollByInvite = () => {
    if (!inviteToken.trim()) {
      toast.error("Davet kodu gerekli.");
      return;
    }
    enroll.mutate(inviteToken.trim());
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
          {!isLoading && courses.length === 0 && (
            <Card className="p-6 text-center text-muted-foreground">Henüz kayıtlı kurs yok.</Card>
          )}
          {courses.map((course) => (
            <Card
              key={course.courseId}
              className="p-4 cursor-pointer hover:shadow-md transition-shadow rounded-2xl border"
              onClick={() => navigate(`/student/courses/${course.courseId}`)}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <BookOpen className="w-4 h-4 text-primary" />
                    <h3 className="font-semibold">{course.courseName}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">{course.courseCode}</p>
                </div>
                <div className="flex items-center gap-2">
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </div>
              </div>

              {/* Placeholder metadata; real stats can be wired later */}
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  <span>Kayıtlı öğrenci</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>Ders kodu: {course.courseCode}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Bottom nav comes from StudentLayout */}
    </div>
  );
};

export default StudentCourses;
