import React, { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, GraduationCap, Clock3, MapPin, Calendar } from "lucide-react";
import StudentBottomNav from "@/components/student/StudentBottomNav";
import { useStudentCourses } from "@/hooks/student";
import { StudentCourseSummary } from "@/types/course";
import { Skeleton } from "@/components/ui/skeleton";

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

  const course = useMemo<StudentCourseSummary | undefined>(
    () => courses.find((c) => c.courseId === courseId),
    [courses, courseId],
  );

  const latest = course?.latestSession;
  const hasActive = Boolean(latest?.sessionIsActive);

  const handleAttend = () => {
    if (!courseId || !hasActive) return;
    navigate(`/student/check-in/${courseId}`);
  };

  return (
    <div className="min-h-screen bg-background pb-safe-nav">
      <div className="px-4 pt-2">
        <div className="flex items-center justify-between">
          <button className="p-2 -ml-2" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="text-center flex-1">
            <h1 className="text-lg font-bold">{course?.courseName || "Ders Detayı"}</h1>
            <p className="text-xs text-muted-foreground">{course?.courseCode}</p>
          </div>
          <div className="w-7" />
        </div>
      </div>

      <div className="px-4 space-y-4">
        {isLoading ? (
          <Card className="p-4 space-y-3">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-10 w-full" />
          </Card>
        ) : !course ? (
          <Card className="p-4 text-center text-muted-foreground">Ders bulunamadı.</Card>
        ) : (
          <>
            <Card className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-primary" />
                    {course.teacherName || "Öğretim görevlisi"}
                  </p>
                  <h2 className="text-xl font-semibold text-foreground">{course.courseName}</h2>
                  <p className="text-sm text-muted-foreground">{course.courseCode}</p>
                </div>
                {hasActive && <Badge className="bg-emerald-100 text-emerald-700">Aktif yoklama</Badge>}
              </div>

              <div className="rounded-2xl border bg-muted/40 p-3 text-sm">
                {latest ? (
                  <>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-foreground">
                        <Clock3 className="w-4 h-4 text-primary" />
                        <span>{latest.sessionIsActive ? "Aktif yoklama" : "Son yoklama"}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{formatRelative(latest.sessionExpiredAt)}</span>
                    </div>
                    <p className="text-muted-foreground mt-2">
                      Başlangıç: {formatDateTr(latest.sessionCreatedAt)}
                      <br />
                      Bitiş: {formatDateTr(latest.sessionExpiredAt)}
                      {latest.isAttended && (
                        <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] text-emerald-700">
                          Katıldın
                        </span>
                      )}
                    </p>
                  </>
                ) : (
                  <p className="text-muted-foreground">Henüz yoklama oluşturulmamış.</p>
                )}
              </div>

              <Button
                className="w-full h-12 text-base"
                disabled={!hasActive}
                onClick={handleAttend}
              >
                {hasActive ? "Yoklamaya katıl" : "Aktif yoklama yok"}
              </Button>
            </Card>

            {/* Basit geçmiş (özet) */}
            <Card className="p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                Son yoklama özeti
              </h3>
              {latest ? (
                <div className="flex items-center justify-between text-sm">
                  <div className="text-muted-foreground">
                    <p>Oluşturma: {formatDateTr(latest.sessionCreatedAt)}</p>
                    <p>Bitiş: {formatDateTr(latest.sessionExpiredAt)}</p>
                  </div>
                  <Badge variant="outline" className={latest.sessionIsActive ? "border-emerald-200 text-emerald-700" : ""}>
                    {latest.sessionIsActive ? "Aktif" : "Kapandı"}
                  </Badge>
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">Kayıt yok.</p>
              )}
            </Card>
          </>
        )}
      </div>

      <StudentBottomNav />
    </div>
  );
}

