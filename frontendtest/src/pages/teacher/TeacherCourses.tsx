import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { useTeacherCourses, useBulkDeleteCourses, useTeacherSessions } from "@/hooks/teacher";
import { apiFetch } from "@/lib/api";
import { BookOpen, CalendarClock, CheckCircle2, Link2, Plus, Search, Trash2 } from "lucide-react";

const formatDateTime = (value?: string) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(date);
};

const parseUtc = (value?: string) => {
  if (!value) return null;
  const raw = value.endsWith("Z") ? value : `${value}Z`;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatFriendlyDateTr = (date: Date | null) => {
  if (!date) return "—";
  return new Intl.DateTimeFormat("tr-TR", {
    weekday: "short",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const TeacherCourses = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteLinkValue, setInviteLinkValue] = useState("");
  const [inviteCourseLabel, setInviteCourseLabel] = useState("");
  const { data: courses = [], isLoading } = useTeacherCourses();
  const { data: allSessions = [] } = useTeacherSessions();
  const bulkDelete = useBulkDeleteCourses();

  const filteredCourses = useMemo(() => {
    if (!search.trim()) return courses;
    const term = search.toLowerCase();
    return courses.filter((course) => {
      const name = (course.courseName ?? "").toLowerCase();
      const code = (course.courseCode ?? "").toLowerCase();
      return name.includes(term) || code.includes(term);
    });
  }, [courses, search]);

  const selectedCourses = useMemo(
    () => courses.filter((course) => selected.has(course.courseId)),
    [courses, selected],
  );

  const toggleCourse = (courseId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(courseId)) {
        next.delete(courseId);
      } else {
        next.add(courseId);
      }
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === filteredCourses.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filteredCourses.map((course) => course.courseId)));
    }
  };

  const selectionCount = selected.size;

  const activeSessionByCourse = useMemo(() => {
    const map = new Map<string, string>();
    allSessions.forEach((s) => {
      if (s.isActive) map.set(s.courseId, s.sessionId);
    });
    return map;
  }, [allSessions]);

  const handleStartSession = async (courseId: string) => {
    const existing = activeSessionByCourse.get(courseId);
    if (existing) {
      navigate(`/teacher/session/${existing}`);
      return;
    }
    try {
      const active = await apiFetch<{ sessionId: string; expiresAt: string }>(
        `/api/Attendance/courses/${courseId}/active-session`,
        { audience: "teacher" },
      );
      if (active?.sessionId) {
        navigate(`/teacher/session/${active.sessionId}`);
        return;
      }
    } catch {
      // no active session, continue to create
    }
    navigate(`/teacher/courses/${courseId}/sessions/new`);
  };

  const handleBulkDelete = () => {
    const ids = Array.from(selected);
    if (!ids.length) return;
    bulkDelete.mutate(ids, {
      onSuccess: () => {
        setSelected(new Set());
        setConfirmOpen(false);
      },
    });
  };

  const handleShowInvite = (inviteLink?: string, courseCode?: string) => {
    if (!inviteLink) {
      toast.info("Invite link will appear once generated for this course.");
      return;
    }
    setInviteLinkValue(inviteLink);
    setInviteCourseLabel(courseCode ?? "course");
    setInviteDialogOpen(true);
  };

  const copyInviteLink = () => {
    if (!inviteLinkValue) return;
    navigator.clipboard.writeText(inviteLinkValue);
    toast.success(`Copied invite link for ${inviteCourseLabel}.`);
  };

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-900 pb-20 font-sans">
      {/* Sticky Header - Aligning with Sidebar Header (approx 88px) */}
      <div className="bg-white/90 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50 transition-all duration-200 h-[88px] flex items-center">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-normal tracking-tight text-slate-900">Derslerim</h1>
            <p className="text-xs text-muted-foreground hidden sm:block">Derslerinizi ve oturumlarınızı yönetin</p>
          </div>

          <div className="flex items-center gap-3">
            {selectionCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                disabled={bulkDelete.isPending || isLoading}
                className="border-red-100 text-red-600 hover:bg-red-50 hover:text-red-700 bg-white"
                onClick={() => setConfirmOpen(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Sil ({selectionCount})
              </Button>
            )}
            <Button onClick={() => navigate("/teacher/create-course")} size="sm" className="bg-[#1a73e8] hover:bg-[#1557b0] text-white shadow-md border-0">
              <Plus className="mr-2 h-4 w-4" />
              Yeni Ders
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* Search & Filter Bar */}
        <Card className="p-1 px-2 shadow-sm rounded-full border border-slate-200 bg-white max-w-2xl mx-auto flex items-center">
          <div className="pl-3 text-slate-400">
            <Search className="h-4 w-4" />
          </div>
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Ders adı veya kodu ile ara..."
            className="border-0 bg-transparent shadow-none focus-visible:ring-0 flex-1 h-10"
          />
          {filteredCourses.length > 0 && (
            <div className="pr-2 flex items-center gap-2 border-l border-slate-100 pl-2">
              <Checkbox
                checked={filteredCourses.length > 0 && selectionCount === filteredCourses.length}
                onCheckedChange={toggleAll}
                id="select-all"
              />
              <label htmlFor="select-all" className="text-xs text-slate-500 cursor-pointer whitespace-nowrap">
                Tümünü Seç
              </label>
            </div>
          )}
        </Card>

        {/* Course Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {!isLoading &&
            filteredCourses.map((course) => {
              const isSelected = selected.has(course.courseId);
              const lastSessionCreated = parseUtc(course.lastSession?.createdAt);
              const activeSessionId = activeSessionByCourse.get(course.courseId);
              // Derived invite token
              const derivedInviteLink = course.inviteToken;

              return (
                <Card
                  key={course.courseId}
                  className={`group relative overflow-hidden border transition-all duration-200 hover:shadow-lg rounded-xl bg-white flex flex-col ${isSelected ? "border-[#1a73e8] ring-1 ring-[#1a73e8]/20" : "border-slate-200 hover:border-blue-200"
                    }`}
                >
                  {/* Card Header / Banner Placeholder */}
                  <div className="h-24 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-slate-100 p-4 relative">
                    <div className="absolute top-3 left-3">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleCourse(course.courseId)}
                        className="bg-white/80 border-slate-300 data-[state=checked]:bg-[#1a73e8] data-[state=checked]:border-[#1a73e8]"
                      />
                    </div>
                    <div className="flex justify-end">
                      {activeSessionId ? (
                        <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm border-0 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> Canlı
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-white/60 text-slate-500 hover:bg-white/80 backdrop-blur-sm">
                          {course.isActive ? "Aktif" : "Pasif"}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-5 flex-1 flex flex-col">
                    <div className="mb-4">
                      <div className="text-xs font-semibold text-[#1a73e8] mb-0.5 flex items-center gap-2">
                        {course.courseCode}
                        {course.firstSessionAt && <span className="text-slate-400 font-normal">• {new Date(course.firstSessionAt).toLocaleDateString('tr-TR')}</span>}
                      </div>
                      <h3
                        className="text-lg font-medium text-slate-900 line-clamp-1 cursor-pointer hover:text-[#1a73e8] transition-colors"
                        onClick={() => navigate(`/teacher/courses/${course.courseId}`)}
                      >
                        {course.courseName}
                      </h3>
                      {course.description && (
                        <p className="text-xs text-slate-500 line-clamp-2 mt-1 min-h-[2.5em]">
                          {course.description}
                        </p>
                      )}
                      {!course.description && <div className="min-h-[2.5em]" />}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-center py-3 border-t border-b border-slate-50 mb-4 bg-slate-50/30 rounded-lg">
                      <div>
                        <span className="block text-lg font-light text-slate-900">{course.enrollmentCount ?? 0}</span>
                        <span className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">Öğrenci</span>
                      </div>
                      <div>
                        <span className="block text-lg font-light text-slate-900">{course.sessionCount ?? 0}</span>
                        <span className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">Oturum</span>
                      </div>
                    </div>

                    <div className="mt-auto flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 text-xs border-slate-200 text-slate-600 hover:text-[#1a73e8] hover:border-blue-200 hover:bg-blue-50"
                        onClick={() => navigate(`/teacher/courses/${course.courseId}`)}
                      >
                        Yönet
                      </Button>
                      <Button
                        size="sm"
                        className={`flex-[1.5] text-xs shadow-sm border-0 text-white ${activeSessionId ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-[#1a73e8] hover:bg-[#1557b0]'}`}
                        onClick={() => handleStartSession(course.courseId)}
                      >
                        {activeSessionId ? "Oturuma Git" : "Yoklama Başlat"}
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
        </div>

        {isLoading && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, idx) => (
              <Card key={idx} className="h-[300px] p-4 flex flex-col gap-4">
                <Skeleton className="h-24 w-full rounded-lg" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <div className="mt-auto flex gap-2">
                  <Skeleton className="h-8 flex-1" />
                  <Skeleton className="h-8 flex-1" />
                </div>
              </Card>
            ))}
          </div>
        )}

        {!isLoading && filteredCourses.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <BookOpen className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-lg font-medium text-slate-900">Ders bulunamadı</h3>
            <p className="text-sm text-slate-500 max-w-sm mt-1 mb-6">Aktif yoklama takibine başlamak için ilk dersinizi oluşturun.</p>
            <Button onClick={() => navigate("/teacher/create-course")} className="bg-[#1a73e8] hover:bg-[#1557b0] text-white">
              <Plus className="mr-2 h-4 w-4" />
              Ders Oluştur
            </Button>
          </div>
        )}
      </div>

      {/* Dialogs unchanged essentially, just wrapped */}
      <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
        {/* ... */}
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Davet kodunu paylaş</DialogTitle>
            <DialogDescription>Öğrencilerin {inviteCourseLabel} dersine katılması için bu kodu paylaşın.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-center">
              <code className="text-2xl font-bold tracking-widest text-slate-800 break-all select-all">
                {inviteLinkValue}
              </code>
            </div>
            <DialogFooter className="gap-2 sm:justify-end">
              <Button variant="ghost" onClick={() => setInviteDialogOpen(false)}>
                Kapat
              </Button>
              <Button onClick={copyInviteLink} className="bg-[#1a73e8] text-white hover:bg-[#1557b0]">
                <Link2 className="w-4 h-4 mr-2" />
                Kopyala
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Alert Dialog (Delete) */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>{selectionCount} dersi silmek istiyor musunuz?</AlertDialogTitle>
            <AlertDialogDescription>
              Bu işlem seçilen dersleri, öğrenci listelerini ve yoklama kayıtlarını kalıcı olarak silecektir.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="max-h-[200px] overflow-auto border rounded-md p-2 text-sm bg-slate-50">
            {selectedCourses.map(c => (
              <div key={c.courseId} className="flex justify-between py-1 px-2 border-b last:border-0 border-slate-100">
                <span className="font-medium text-slate-700">{c.courseName}</span>
                <span className="text-slate-400 text-xs">{c.courseCode}</span>
              </div>
            ))}
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TeacherCourses;
