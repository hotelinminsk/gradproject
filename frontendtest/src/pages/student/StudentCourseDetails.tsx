import React, { useMemo, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, GraduationCap, Clock3, CheckCircle2, XCircle, CalendarClock } from "lucide-react";
import StudentBottomNav from "@/components/student/StudentBottomNav";
import { useStudentCourses } from "@/hooks/student";
import { StudentCourseSummary } from "@/types/course";
import { Skeleton } from "@/components/ui/skeleton";
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

const formatRelative = (value?: string) => {
  if (!value) return "—";
  const date = parseUtc(value);
  const target = date.getTime();
  if (Number.isNaN(target)) return "—";
  const diffMin = Math.round((target - Date.now()) / 60000);
  if (diffMin <= -1) return "Süre doldu";
  if (diffMin === 0) return "Az önce doluyor";
  if (diffMin < 60) return `${diffMin} dk içinde bitiyor`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr} saat içinde bitiyor`;
  const diffDay = Math.round(diffHr / 24);
  return `${diffDay} gün içinde bitiyor`;
};

export default function StudentCourseDetails() {
  const navigate = useNavigate();
  const { courseId } = useParams();
  const { data: courses = [], isLoading } = useStudentCourses();
  const { hub } = useStudentSession();
  const queryClient = useQueryClient();

  const course = useMemo<StudentCourseSummary | undefined>(
    () => courses.find((c) => c.courseId === courseId),
    [courses, courseId],
  );

  const latest = course?.latestSession;
  const hasActive = Boolean(latest?.sessionIsActive);
  const attended = Boolean(latest?.isAttended);
  const totalSessions = latest ? 1 : 0;
  const attendedSessions = attended ? 1 : 0;

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

  const handleAttend = () => {
    if (!courseId || !hasActive) return;
    navigate(`/student/check-in/${courseId}`);
  };

  const historyStatusColor = attended ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700";
  const historyIconColor = attended ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600";

  return (
    <div className="relative min-h-screen bg-[#f3f4f6] text-slate-900 pb-24">
      <header className="sticky top-0 z-40 flex items-center justify-between bg-white px-4 py-3 border-b border-slate-200">
        <button
          className="flex items-center gap-2 text-sm font-semibold text-slate-800 hover:text-primary transition-colors"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="w-4 h-4" />
          Geri
        </button>
        <h2 className="flex-1 text-center text-base font-bold tracking-tight">{course?.courseCode ?? "Ders"}</h2>
        <div className="w-10" />
      </header>

      <main className="flex flex-col flex-1 gap-3 px-4 pt-3 max-w-3xl mx-auto">
        {isLoading ? (
          <Card className="p-4 space-y-3 rounded-xl shadow-sm border border-slate-200">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-10 w-full" />
          </Card>
        ) : !course ? (
          <Card className="p-4 text-center text-muted-foreground rounded-xl shadow-sm border border-slate-200">
            Ders bulunamadı.
          </Card>
        ) : (
          <>
            <section className="rounded-xl bg-white border border-slate-200 shadow-sm p-5">
              <div className="flex gap-4 items-start">
                <div
                  className="bg-center bg-cover rounded-xl min-h-20 w-20 shrink-0 shadow-inner border border-slate-100"
                  style={{
                    backgroundImage:
                      "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBR3TiQxyX3mFH-wMwYOoQfZXLZ_vg1nRRLIebzcWDSGSRtli09gm4aNvBPUeknMtV3RSvmDe1kN8sXQQWVBzdsx5xEzBJM5-BKu5QSN0_U9yXz34qi_IC3RghgTf5Yqogxrlls5MQDLrw_JrIeMHjJ9VWjtAX8_reXWKi5Ad2mSqxnsU5cMD5sDteBBy-L0YmvV5upUJtNklAaq_DCghlYqm2FHmRQeeRtfqAv3BVas7ummtlNj4X2zGFa2kAUoPtmzj-Zw3A2Wp1E')",
                  }}
                />
                <div className="flex flex-col gap-1.5 flex-1">
                  <h1 className="text-xl font-bold leading-tight">{course.courseName}</h1>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <GraduationCap className="w-4 h-4 text-primary" />
                    <span>{course.teacherName || "Öğretim görevlisi"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <CalendarClock className="w-4 h-4 text-slate-500" />
                    <span>Ders günleri: — (yakında eklenecek)</span>
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-xl bg-white border border-dashed border-slate-300 shadow-sm p-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
              {hasActive && latest ? (
                <div className="relative space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-primary">
                      <Clock3 className="w-4 h-4" />
                      <span className="font-semibold text-sm">Aktif yoklama</span>
                    </div>
                    <span className="rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold px-3 py-1 border border-emerald-200">
                      Devam ediyor
                    </span>
                  </div>
                  <div className="text-sm text-slate-700 space-y-1">
                    <p>
                      Başlangıç: <span className="font-medium">{formatDateTr(latest.sessionCreatedAt)}</span>
                    </p>
                    <p>
                      Bitiş: <span className="font-medium">{formatDateTr(latest.sessionExpiredAt)}</span>
                    </p>
                    <p className="text-primary font-medium">{formatRelative(latest.sessionExpiredAt)}</p>
                  </div>
                  {attended && (
                    <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-[11px] text-emerald-700">
                      <CheckCircle2 className="w-3 h-3" /> Son oturuma katıldın
                    </span>
                  )}
                  <Button className="w-full h-11 text-base" onClick={handleAttend}>
                    Yoklamaya katıl
                  </Button>
                </div>
              ) : (
                <div className="relative flex flex-col items-center gap-3 text-center py-6">
                  <div className="flex size-14 items-center justify-center rounded-full bg-slate-50 text-slate-400 border border-slate-200">
                    <Clock3 className="w-6 h-6" />
                  </div>
                  <p className="text-lg font-semibold">Şu an yoklama yok</p>
                  <p className="text-sm text-slate-600 max-w-xs">
                    Öğretim görevlisi yeni oturum başlattığında burada göreceksin.
                  </p>
                </div>
              )}
            </section>

            <section className="flex flex-col gap-2 pb-4">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-lg font-semibold">Yoklama Geçmişi</h3>
                <span className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                  {attendedSessions}/{totalSessions} katılım
                </span>
              </div>

              {latest ? (
                <div className="rounded-lg bg-white border border-slate-200 shadow-sm p-4 flex items-center gap-4">
                  <div className={`flex items-center justify-center rounded-lg shrink-0 size-10 ${historyIconColor}`}>
                    {attended ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900">Son yoklama</p>
                    <p className="text-xs text-slate-600">{formatDateTr(latest.sessionCreatedAt)}</p>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${historyStatusColor}`}>
                    {attended ? "Katıldın" : "Katılmadın"}
                  </span>
                </div>
              ) : (
                <Card className="p-4 rounded-lg border border-slate-200 text-sm text-slate-600 shadow-sm">
                  Geçmiş oturum bulunamadı.
                </Card>
              )}
            </section>
          </>
        )}
      </main>

      <StudentBottomNav />
    </div>
  );
}
