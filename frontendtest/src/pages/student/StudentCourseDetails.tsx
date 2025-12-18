import React, { useMemo, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ArrowLeft, GraduationCap, Clock3, CheckCircle2, XCircle, CalendarClock, Trash2, AlertTriangle } from "lucide-react";
import { useStudentCourses, useDropCourse } from "@/hooks/student";
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
  const dropCourse = useDropCourse();
  const [isDropDialogOpen, setIsDropDialogOpen] = useState(false);

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

  const handleDropCourse = () => {
    if (!courseId) return;
    dropCourse.mutate(courseId, {
      onSuccess: () => {
        navigate("/student/courses");
      }
    });
  };

  const historyStatusColor = attended ? "bg-emerald-100/50 text-emerald-700 ring-1 ring-emerald-200" : "bg-rose-100/50 text-rose-700 ring-1 ring-rose-200";
  const historyIconColor = attended ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600";

  return (
    <div className="relative min-h-screen bg-slate-50 pb-safe-nav text-slate-900 overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-br from-blue-50 via-indigo-50/50 to-slate-50 pointer-events-none" />
      <div className="absolute top-[-10%] right-[-10%] w-[400px] h-[400px] bg-blue-100/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-[10%] left-[-10%] w-[300px] h-[300px] bg-purple-100/40 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="relative px-6 pt-8 pb-2 z-10">
        <div className="flex items-center justify-between">
          <button
            className="flex items-center gap-2 p-2 -ml-2 rounded-full hover:bg-white/60 transition-colors"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
            <span className="text-sm font-medium text-slate-600">Geri</span>
          </button>

          <div className="bg-white/40 backdrop-blur-md px-3 py-1 rounded-full border border-white/20">
            <span className="text-xs font-bold text-slate-600 tracking-wide uppercase">{course?.courseCode}</span>
          </div>
        </div>
      </div>

      <main className="flex flex-col flex-1 gap-5 px-5 pt-2 max-w-lg mx-auto">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-48 w-full rounded-3xl" />
            <Skeleton className="h-40 w-full rounded-2xl" />
          </div>
        ) : !course ? (
          <div className="flex flex-col items-center justify-center py-20 text-center opacity-60">
            {/* ... existing empty state ... */}
          </div>
        ) : (
          <>
            {/* Hero Section - Redesigned */}
            <div className="relative rounded-3xl overflow-hidden shadow-xl shadow-indigo-500/20 group">
              {/* Card Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-indigo-700" />
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full mix-blend-overlay blur-3xl -mr-16 -mt-32" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/20 rounded-full mix-blend-overlay blur-3xl -ml-16 -mb-32" />

              <div className="relative p-6 text-white">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <h1 className="text-2xl font-bold leading-tight mb-2 shadow-sm">{course.courseName}</h1>
                    <div className="flex items-center gap-2 text-blue-100 text-sm font-medium mb-4">
                      <GraduationCap className="w-4 h-4 text-blue-200" />
                      <span>{course.teacherName || "Öğretim görevlisi"}</span>
                    </div>
                  </div>
                  {/* Course Icon Placeholder or generated initials */}
                  <div className="shrink-0 w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 flex items-center justify-center">
                    <span className="text-lg font-bold">{course.courseCode.slice(0, 3)}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  {course.schedules && course.schedules.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {course.schedules.map((sch, i) => (
                        <div key={i} className="flex items-center gap-1.5 text-xs font-semibold bg-black/20 backdrop-blur-md px-2.5 py-1.5 rounded-lg border border-white/10">
                          <Clock3 className="w-3.5 h-3.5 text-blue-200" />
                          <span>
                            {["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"][sch.dayOfWeek]} {sch.startTime.slice(0, 5)} - {sch.endTime.slice(0, 5)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-2 text-xs text-blue-200 bg-white/5 px-3 py-1.5 rounded-lg">
                      <CalendarClock className="w-3.5 h-3.5" />
                      <span>Program girilmemiş</span>
                    </div>
                  )}

                  {course.firstSessionAt && (
                    <div className="flex items-center gap-2 text-xs text-blue-100/80 mt-2 px-1">
                      <span className="w-1 h-1 rounded-full bg-blue-300" />
                      İlk ders: {new Date(course.firstSessionAt).toLocaleDateString('tr-TR')}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {course.description && (
              <Card className="p-4 bg-white/60 backdrop-blur-sm border-slate-100/60 shadow-sm">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Ders Hakkında</h3>
                <p className="text-sm text-slate-700 leading-relaxed font-medium">
                  {course.description}
                </p>
              </Card>
            )}

            {/* Active Session Status */}
            <section className={`rounded-3xl p-6 relative overflow-hidden transition-all ${hasActive ? "bg-white shadow-xl shadow-emerald-500/10 border border-emerald-100" : "bg-white border border-slate-100 shadow-sm"}`}>
              {hasActive && latest ? (
                <div className="relative space-y-5">
                  {/* Badge */}
                  <div className="absolute top-0 right-0">
                    <span className="flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-emerald-700">
                    <div className="p-2.5 bg-emerald-50 rounded-xl">
                      <Clock3 className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg leading-none">Yoklama Aktif</h3>
                      <p className="text-xs text-emerald-600/80 font-medium mt-1">Lütfen süresi dolmadan katılın</p>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-xl p-4 space-y-2 text-sm border border-slate-100">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Bitiş zamanı</span>
                      <span className="font-semibold text-slate-900">{formatDateTr(latest.sessionExpiredAt).split(" ")[1]}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Kalan süre</span>
                      <span className="font-bold text-emerald-600">{formatRelative(latest.sessionExpiredAt)}</span>
                    </div>
                  </div>

                  {attended ? (
                    <div className="flex items-center justify-center gap-2 py-3 w-full rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100 font-semibold">
                      <CheckCircle2 className="w-5 h-5" />
                      Katılımınız alındı
                    </div>
                  ) : (
                    <Button className="w-full h-12 rounded-xl text-base font-bold bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-500/20" onClick={handleAttend}>
                      Yoklamaya Katıl
                    </Button>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center text-center py-2 space-y-2">
                  <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-1">
                    <Clock3 className="w-5 h-5 text-slate-400" />
                  </div>
                  <h3 className="font-semibold text-slate-900">Aktif yoklama yok</h3>
                  <p className="text-xs text-slate-500 max-w-[200px]">
                    Öğretmeniniz yeni bir oturum başlattığında burada görünecek.
                  </p>
                </div>
              )}
            </section>

            {/* History Section */}
            <section className="pb-4">
              <div className="flex items-center justify-between px-1 mb-3">
                <h3 className="font-bold text-slate-900">Yoklama Geçmişi</h3>
                <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-1 bg-slate-100 text-slate-500 rounded-lg">
                  {attendedSessions}/{totalSessions} DERS
                </span>
              </div>

              {latest && !hasActive ? (
                <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-4 flex items-center gap-4 hover:bg-slate-50/50 transition-colors">
                  <div className={`flex items-center justify-center rounded-xl shrink-0 h-12 w-12 ${historyIconColor} shadow-sm`}>
                    {attended ? <CheckCircle2 className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 truncate">Son Oturum</p>
                    <p className="text-xs text-slate-500 mt-0.5 font-medium">{formatDateTr(latest.sessionCreatedAt)}</p>
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${historyStatusColor}`}>
                    {attended ? "Katıldı" : "Katılmadı"}
                  </span>
                </div>
              ) : (
                <div className="text-center py-8 rounded-2xl bg-slate-50 border border-slate-100 border-dashed">
                  <p className="text-sm text-slate-500 font-medium">Henüz kayıtlı geçmiş yok.</p>
                </div>
              )}
            </section>

            {/* Danger Zone */}
            <div className="pt-6 mt-4 border-t border-slate-200">
              <AlertDialog open={isDropDialogOpen} onOpenChange={setIsDropDialogOpen}>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" className="w-full text-rose-600 hover:text-rose-700 hover:bg-rose-50 h-12 rounded-xl text-sm font-medium">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Bu dersi bırak
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="w-[90%] rounded-2xl">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2 text-rose-600">
                      <AlertTriangle className="w-5 h-5" />
                      Dersi Bırak?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      Bu işlem geri alınamaz. <strong>{course.courseName}</strong> dersinden kaydınızı simek üzeresiniz.
                      Tüm yoklama geçmişiniz ve erişiminiz kaybolacaktır.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="rounded-xl h-11">İptal</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDropCourse}
                      className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl h-11 border-none"
                      disabled={dropCourse.isPending}
                    >
                      {dropCourse.isPending ? "Siliniyor..." : "Evet, Dersi Bırak"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <p className="text-center text-[10px] text-slate-400 mt-2 px-10 leading-tight">
                Dersi bıraktıktan sonra tekrar katılmak için yeni bir davet koduna ihtiyacınız olacak.
              </p>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
