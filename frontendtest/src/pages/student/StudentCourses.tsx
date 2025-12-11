import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BookOpen, Plus, Calendar, Users, ChevronRight, Sparkles } from "lucide-react";
import StudentBottomNav from "@/components/student/StudentBottomNav";
import StudentPageHeader from "@/components/student/StudentPageHeader";
import { useStudentCourses, useEnrollByInvite } from "@/hooks/student";
import { toast } from "sonner";
import { useStudentSession } from "@/providers";
import { useQueryClient } from "@tanstack/react-query";

const parseUtc = (value?: string) => {
  if (!value) return new Date(NaN);
  const raw = value.endsWith("Z") ? value : `${value}Z`;
  return new Date(raw);
};

const formatDateTr = (value?: string) => {
  if (!value) return "—";
  const date = parseUtc(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
};

const formatExpiryRelative = (value?: string) => {
  if (!value) return "—";
  const targetDate = parseUtc(value);
  const target = targetDate.getTime();
  if (Number.isNaN(target)) return "—";
  const now = Date.now();
  const diffMs = target - now;
  const diffMin = Math.round(diffMs / 60000);
  if (diffMin <= -1) return "Süre doldu";
  if (diffMin === 0) return "Az önce doluyor";
  if (diffMin < 60) return `${diffMin} dk içinde bitiyor`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr} saat içinde bitiyor`;
  const diffDay = Math.round(diffHr / 24);
  return `${diffDay} gün içinde bitiyor`;
};

const StudentCourses = () => {
  const navigate = useNavigate();
  const [inviteToken, setInviteToken] = useState("");
  const { data: courses = [], isLoading } = useStudentCourses();
  const enroll = useEnrollByInvite();
  const { hub } = useStudentSession();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!hub) return;
    const onSessionChange = () => {
      queryClient.invalidateQueries({ queryKey: ["student-courses"] });
    };
    hub.on("SessionCreated", onSessionChange);
    hub.on("SessionClosed", onSessionChange);
    return () => {
      hub.off("SessionCreated", onSessionChange);
      hub.off("SessionClosed", onSessionChange);
    };
  }, [hub, queryClient]);

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
              className={`p-4 cursor-pointer transition-shadow rounded-2xl border ${
                course.latestSession?.sessionIsActive
                  ? "border-emerald-400/70 shadow-[0_10px_35px_rgba(16,185,129,0.35)] bg-emerald-50/50"
                  : "hover:shadow-md"
              }`}
              onClick={() => navigate(`/student/courses/${course.courseId}`)}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <BookOpen className="w-4 h-4 text-primary" />
                    <h3 className="font-semibold">{course.courseName}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">{course.courseCode}</p>
                  {course.teacherName && (
                    <p className="text-xs text-muted-foreground mt-1">Öğretim görevlisi: {course.teacherName}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </div>
              </div>

              {course.latestSession ? (
                <div className="mt-3 flex items-center justify-between rounded-lg bg-muted/60 px-3 py-2 text-xs">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1 text-foreground">
                      <Sparkles className="w-3 h-3 text-primary" />
                      <span>{course.latestSession.sessionIsActive ? "Aktif yoklama" : "Son yoklama"}</span>
                    </div>
                    <p className="text-muted-foreground">
                      Oluşturma: {formatDateTr(course.latestSession.sessionCreatedAt)}
                      <br />
                      Bitiş: {formatDateTr(course.latestSession.sessionExpiredAt)}
                      <br />
                      {formatExpiryRelative(course.latestSession.sessionExpiredAt)}
                    </p>
                  </div>
                  <div className="text-right">
                    {course.latestSession.sessionIsActive ? (
                      <span className="text-xs px-2 py-1 rounded-full bg-emerald-600 text-white shadow-sm">
                        Aktif
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-1 rounded-full bg-muted text-foreground">Kapandı</span>
                    )}
                    {course.latestSession.isAttended && (
                      <p className="text-[11px] text-emerald-700 mt-1">Katılım sağlandı</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="w-3 h-3" />
                  <span>Henüz yoklama oluşturulmadı</span>
                </div>
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
