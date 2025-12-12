import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BookOpen, Plus, Calendar, ChevronRight, Sparkles, User2 } from "lucide-react";
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
    <div className="min-h-screen bg-[#f3f4f6] text-slate-900 pb-24">
      <header className="px-5 pt-8 pb-4">
        <h1 className="text-2xl font-bold">Derslerim</h1>
        <p className="text-sm text-slate-500 mt-1">Kayıtlı derslerini yönet</p>
      </header>

      <main className="px-4 space-y-5">
        <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <div className="flex items-center mb-4">
            <Plus className="w-5 h-5 text-slate-700 mr-2" />
            <h2 className="text-lg font-semibold text-slate-800">Yeni derse katıl</h2>
          </div>
          <div className="flex gap-3">
            <Input
              placeholder="Davet kodunu yapıştır ya da QR tara"
              value={inviteToken}
              onChange={(e) => setInviteToken(e.target.value)}
              className="h-11 text-sm"
            />
            <Button
              onClick={handleEnrollByInvite}
              className="h-11 px-3 bg-primary text-white hover:bg-primary/90 shadow-sm"
              aria-label="Derese katıl"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </section>

        <section className="space-y-4">
          {!isLoading && courses.length === 0 && (
            <Card className="p-6 text-center text-slate-500 border border-slate-200 rounded-xl shadow-sm">
              Henüz kayıtlı ders yok.
            </Card>
          )}

          {courses.map((course) => {
            const active = course.latestSession?.sessionIsActive;
            const attended = course.latestSession?.isAttended;
            return (
              <article
                key={course.courseId}
                className={`bg-white rounded-xl shadow-sm border border-slate-200 p-5 transition-colors cursor-pointer ${
                  active ? "ring-2 ring-emerald-400/60 bg-emerald-50/60" : "hover:bg-slate-50"
                }`}
                onClick={() => navigate(`/student/courses/${course.courseId}`)}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2 text-primary">
                    <BookOpen className="w-5 h-5" />
                    <h3 className="font-bold text-lg text-slate-900">{course.courseName}</h3>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400" />
                </div>
                <div className="mb-4">
                  <p className="text-sm text-slate-500">{course.courseCode}</p>
                  {course.teacherName && (
                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                      <User2 className="w-4 h-4 text-slate-400" />
                      Öğretim görevlisi: {course.teacherName}
                    </p>
                  )}
                </div>

                <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                  <div className="flex items-center gap-2 mb-2 text-primary">
                    <Sparkles className="w-4 h-4" />
                    <span className="text-xs font-semibold uppercase tracking-wide">
                      {active ? "Aktif yoklama" : "Son yoklama"}
                    </span>
                  </div>
                  <div className="flex justify-between items-end">
                    <div className="text-xs space-y-1 text-slate-600">
                      {course.latestSession ? (
                        <>
                          <p>Oluşturma: {formatDateTr(course.latestSession.sessionCreatedAt)}</p>
                          <p>Bitiş: {formatDateTr(course.latestSession.sessionExpiredAt)}</p>
                          <p className="text-slate-500 mt-1">{formatExpiryRelative(course.latestSession.sessionExpiredAt)}</p>
                        </>
                      ) : (
                        <div className="flex items-center gap-1 text-slate-500">
                          <Calendar className="w-4 h-4" />
                          <span>Henüz yoklama oluşturulmadı</span>
                        </div>
                      )}
                    </div>
                    <div className="text-right space-y-1">
                      {course.latestSession && (
                        <span
                          className={`text-xs font-medium px-2.5 py-1 rounded-md ${
                            active ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-700"
                          }`}
                        >
                          {active ? "Aktif" : "Kapandı"}
                        </span>
                      )}
                      {attended && (
                        <p className="text-[11px] text-emerald-700">Katılım sağlandı</p>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      </main>
    </div>
  );
};

export default StudentCourses;
