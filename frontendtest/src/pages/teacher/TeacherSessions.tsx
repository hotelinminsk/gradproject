import { useMemo, useState } from "react";
import { useTeacherSessions } from "@/hooks/teacher";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarClock, Clock3, Users, Search, ScanLine } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import { useNavigate } from "react-router-dom";

const TeacherSessions = () => {
  const navigate = useNavigate();
  const { data: sessions = [], isLoading } = useTeacherSessions();
  const [courseFilter, setCourseFilter] = useState("");

  const parseUtc = (value?: string) => {
    if (!value) return null;
    const raw = value.endsWith("Z") ? value : `${value}Z`;
    const date = new Date(raw);
    return Number.isNaN(date.getTime()) ? null : date;
  };

  const filtered = useMemo(() => {
    if (!courseFilter.trim()) return sessions;
    const term = courseFilter.toLowerCase();
    return sessions.filter((s) => {
      const code = (s.courseCode ?? "").toLowerCase();
      const name = (s.courseName ?? "").toLowerCase();
      return code.includes(term) || name.includes(term);
    });
  }, [sessions, courseFilter]);

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-900 pb-20 font-sans">
      {/* Sticky Header */}
      <div className="bg-white/90 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50 transition-all duration-200 h-[88px] flex items-center">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-normal tracking-tight text-slate-900">Oturumlar</h1>
            <p className="text-xs text-muted-foreground hidden sm:block">Geçmiş ve aktif yoklama oturumları</p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* Search Bar */}
        <Card className="p-1 px-2 shadow-sm rounded-full border border-slate-200 bg-white max-w-2xl mx-auto flex items-center">
          <div className="pl-3 text-slate-400">
            <Search className="h-4 w-4" />
          </div>
          <Input
            value={courseFilter}
            onChange={(e) => setCourseFilter(e.target.value)}
            placeholder="Ders adı veya kodu ile ara..."
            className="border-0 bg-transparent shadow-none focus-visible:ring-0 flex-1 h-10"
          />
        </Card>

        {/* Sessions Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {isLoading &&
            Array.from({ length: 4 }).map((_, idx) => (
              <Card key={`session-skel-${idx}`} className="p-4 space-y-3 h-[250px] flex flex-col">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-6 w-2/3" />
                <div className="flex-1" />
                <Skeleton className="h-10 w-full" />
              </Card>
            ))}

          {!isLoading &&
            filtered.map((session) => {
              const expiresDate = parseUtc(session.expiresAt);
              const createdDate = parseUtc(session.createdAt);
              const expiresLabel = expiresDate
                ? formatDistanceToNow(expiresDate, { addSuffix: true, locale: tr })
                : "—";

              return (
                <Card
                  key={session.sessionId}
                  className={`group relative overflow-hidden border transition-all duration-200 hover:shadow-lg rounded-xl bg-white flex flex-col ${session.isActive ? "border-emerald-200 ring-1 ring-emerald-500/20" : "border-slate-200 hover:border-blue-200"
                    }`}
                >
                  {/* Header */}
                  <div className={`h-1.5 w-full ${session.isActive ? "bg-emerald-500" : "bg-slate-200"}`} />

                  <div className="p-5 flex-1 flex flex-col space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                          {session.courseCode || "Genel"}
                        </p>
                        <h3 className="text-lg font-medium text-slate-900 line-clamp-2 leading-tight">
                          {session.courseName ?? "İsimsiz Ders"}
                        </h3>
                      </div>
                      {session.isActive ? (
                        <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm border-0 flex items-center gap-1 shrink-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> Canlı
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-slate-100 text-slate-500">
                          Kapalı
                        </Badge>
                      )}
                    </div>

                    <div className="space-y-2 text-sm text-slate-500">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-[#1a73e8]" />
                        <span className="text-slate-700 font-medium">{session.attendeeCount ?? 0}</span>
                        <span>katılımcı</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <CalendarClock className="h-3.5 w-3.5" />
                        <span>
                          {createdDate ? createdDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : "—"}
                        </span>
                      </div>
                      {session.isActive && (
                        <div className="flex items-center gap-2 text-xs text-emerald-600 font-medium">
                          <Clock3 className="h-3.5 w-3.5" />
                          <span>Sona erme: {expiresLabel}</span>
                        </div>
                      )}
                    </div>

                    <div className="pt-2 mt-auto">
                      <Button
                        className={`w-full shadow-sm border-0 text-white ${session.isActive ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-[#1a73e8] hover:bg-[#1557b0]'}`}
                        onClick={() => navigate(`/teacher/session/${session.sessionId}`)}
                      >
                        <ScanLine className="mr-2 h-4 w-4" />
                        {session.isActive ? "Oturuma Git" : "Detaylar"}
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
        </div>

        {!isLoading && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <Clock3 className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-lg font-medium text-slate-900">Oturum bulunamadı</h3>
            <p className="text-sm text-slate-500 max-w-sm mt-1 mb-6">
              Aradığınız kriterlere uygun bir oturum yok. Dersler sayfasından yeni bir oturum başlatabilirsiniz.
            </p>
            <Button variant="outline" onClick={() => navigate("/teacher/courses")} className="border-slate-200">
              Derslere Git
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherSessions;
