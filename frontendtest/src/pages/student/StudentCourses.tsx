import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { BookOpen, Plus, Calendar, ChevronRight, Sparkles, User2, Search, Filter, ScanLine } from "lucide-react";
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
  const [searchQuery, setSearchQuery] = useState("");
  const [isJoinOpen, setIsJoinOpen] = useState(false);
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
    enroll.mutate(inviteToken.trim(), {
      onSuccess: () => {
        setIsJoinOpen(false);
        setInviteToken("");
      }
    });
  };

  const filteredCourses = useMemo(() => {
    if (!searchQuery) return courses;
    const lower = searchQuery.toLowerCase();
    return courses.filter(
      (c) =>
        c.courseName.toLowerCase().includes(lower) ||
        c.courseCode.toLowerCase().includes(lower) ||
        (c.teacherName && c.teacherName.toLowerCase().includes(lower))
    );
  }, [courses, searchQuery]);

  return (
    <div className="min-h-screen bg-slate-50 pb-safe-nav text-slate-900 relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-br from-blue-50 via-indigo-50/50 to-slate-50 pointer-events-none" />
      <div className="absolute top-[-10%] right-[-10%] w-[400px] h-[400px] bg-blue-100/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-[10%] left-[-10%] w-[300px] h-[300px] bg-purple-100/40 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="relative px-6 pt-12 pb-6 z-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Derslerim</h1>
            <p className="text-sm text-slate-500 font-medium mt-1">Bu dönem kayıtlı olduğun dersler</p>
          </div>
          <Drawer open={isJoinOpen} onOpenChange={setIsJoinOpen}>
            <DrawerTrigger asChild>
              <Button className="rounded-full h-12 w-12 p-0 shadow-lg shadow-indigo-500/20 bg-indigo-600 hover:bg-indigo-700 text-white">
                <Plus className="w-6 h-6" />
              </Button>
            </DrawerTrigger>
            <DrawerContent>
              <div className="mx-auto w-full max-w-sm">
                <DrawerHeader>
                  <DrawerTitle>Yeni Derse Katıl</DrawerTitle>
                  <DrawerDescription>
                    Öğretmeninin paylaştığı davet kodunu gir.
                  </DrawerDescription>
                </DrawerHeader>
                <div className="p-4 space-y-4">
                  <div className="space-y-2">
                    <Input
                      placeholder="Davet Kodu (Örn: CSE101-2024)"
                      value={inviteToken}
                      onChange={(e) => setInviteToken(e.target.value)}
                      className="text-center text-lg h-12 tracking-wide font-mono uppercase placeholder:normal-case placeholder:font-sans placeholder:tracking-normal"
                    />
                  </div>
                  <Button onClick={handleEnrollByInvite} className="w-full h-12 text-base font-semibold" disabled={enroll.isPending}>
                    {enroll.isPending ? "Katılınılıyor..." : "Derse Katıl"}
                  </Button>
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-slate-200" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">veya</span>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full h-12 gap-2" onClick={() => toast.info("QR kamera açılacak...")}>
                    <ScanLine className="w-4 h-4" />
                    QR Kodu Tara
                  </Button>
                </div>
                <DrawerFooter className="pt-0">
                  <DrawerClose asChild>
                    <Button variant="ghost">İptal</Button>
                  </DrawerClose>
                </DrawerFooter>
              </div>
            </DrawerContent>
          </Drawer>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            className="pl-9 h-11 bg-white/60 backdrop-blur-lg border-white/50 rounded-xl focus:bg-white transition-all shadow-sm"
            placeholder="Ders ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <main className="px-5 py-6 space-y-4">
        {!isLoading && filteredCourses.length === 0 && (
          <div className="flex flex-col items-center justify-center p-10 text-center space-y-4 mt-10 opacity-60">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
              <Search className="w-8 h-8 text-slate-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-700">Sonuç bulunamadı</h3>
              <p className="text-sm text-slate-500">
                {searchQuery ? "Aramanızla eşleşen ders yok." : "Henüz bir derse kayıtlı değilsiniz."}
              </p>
            </div>
          </div>
        )}

        {filteredCourses.map((course) => {
          const active = course.latestSession?.sessionIsActive;
          const attended = course.latestSession?.isAttended;

          return (
            <article
              key={course.courseId}
              onClick={() => navigate(`/student/courses/${course.courseId}`)}
              className="group relative bg-white rounded-2xl p-5 shadow-sm border border-slate-100 transition-all hover:shadow-md active:scale-[0.98] overflow-hidden"
            >
              {active && (
                <div className="absolute top-0 right-0 p-3">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                  </span>
                </div>
              )}

              <div className="flex justify-between items-start mb-3 pr-6">
                <div>
                  <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold tracking-wide uppercase bg-slate-100 text-slate-600 mb-1.5 border border-slate-200/60">
                    {course.courseCode}
                  </span>
                  <h3 className="font-bold text-lg text-slate-900 leading-tight group-hover:text-blue-600 transition-colors">
                    {course.courseName}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 font-medium flex items-center gap-1.5">
                    <User2 className="w-3.5 h-3.5" />
                    {course.teacherName || "Bilinmiyor"}
                  </p>
                </div>
              </div>

              {/* Status Section */}
              <div className={`mt-4 rounded-xl p-3.5 border ${active ? "bg-emerald-50/50 border-emerald-100/50" : "bg-slate-50/50 border-slate-100"}`}>
                {active ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-emerald-700">
                      <Sparkles className="w-4 h-4 fill-emerald-100" />
                      <span className="text-xs font-bold">YOKLAMA AKTİF</span>
                    </div>
                    <Button size="sm" className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm font-semibold px-3">
                      Katıl
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-500">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <span className="text-xs font-medium">Son yoklama</span>
                    </div>
                    <span className="text-[11px] text-slate-400 font-medium">
                      {formatExpiryRelative(course.latestSession?.sessionCreatedAt) === "—" ? "Henüz yok" : formatDateTr(course.latestSession?.sessionCreatedAt).split(" ")[0]}
                    </span>
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </main>
    </div>
  );
};

export default StudentCourses;
