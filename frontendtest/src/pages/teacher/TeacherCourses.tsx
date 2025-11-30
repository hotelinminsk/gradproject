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
    <div className="mx-auto max-w-6xl space-y-8 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Teacher Panel</p>
          <h1 className="text-3xl font-bold">Courses</h1>
          <p className="text-sm text-muted-foreground">Manage rosters, sessions, and enrollment at a glance.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            disabled={!selectionCount || bulkDelete.isPending || isLoading}
            className="border-destructive/40 text-destructive hover:bg-destructive/10 disabled:opacity-50"
            onClick={() => setConfirmOpen(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
            {selectionCount ? <span className="ml-1 rounded-full bg-destructive/10 px-2 text-xs">{selectionCount}</span> : null}
          </Button>
          <Button onClick={() => navigate("/teacher/create-course")}>
            <Plus className="mr-2 h-4 w-4" />
            New Course
          </Button>
        </div>
      </div>

      <Card className="p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex flex-1 items-center rounded-full border bg-card px-4 py-2">
            <Search className="mr-2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by course name or code"
              className="border-0 bg-transparent px-0 focus-visible:ring-0"
            />
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Checkbox
              checked={filteredCourses.length > 0 && selectionCount === filteredCourses.length}
              onCheckedChange={toggleAll}
              id="select-all"
              disabled={isLoading || filteredCourses.length === 0}
            />
            <label htmlFor="select-all" className="cursor-pointer">
              Select all
            </label>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {!isLoading &&
          filteredCourses.map((course) => {
            const isSelected = selected.has(course.courseId);
            const lastSessionCreated = parseUtc(course.lastSession?.createdAt);
            const lastSessionExpires = parseUtc(course.lastSession?.expiresAtUtc || (course as any).lastSession?.expiresAt);
            const lastSessionLabel = course.lastSession
              ? `${course.lastSession.isActive ? "Aktif" : "Kapandı"} - Son yoklama ${formatFriendlyDateTr(
                  lastSessionExpires || lastSessionCreated,
                )}`
              : "No sessions yet";
            const createdLabel = formatDateTime(course.createdAt);
            const statusLabel = course.isActive ? "Active" : "Paused";
            const host =
              (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE) ||
              (typeof window !== "undefined" ? window.location.origin : "");
            const derivedInviteLink =
              course.inviteLink ||
              (course.invitationToken && host ? `${String(host).replace(/\/$/, "")}/enroll/${course.invitationToken}` : undefined);
            const activeSessionId = activeSessionByCourse.get(course.courseId);
            return (
              <Card
                key={course.courseId}
                className={`group relative overflow-hidden border transition hover:border-primary/60 hover:shadow-xl hover:scale-[1.01] ${
                  isSelected ? "border-primary/70 shadow-lg" : ""
                }`}
              >
                <div className="absolute left-4 top-4 z-10 rounded-full bg-background/95 p-2 shadow-sm">
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => toggleCourse(course.courseId)}
                    aria-label="Select course"
                  />
                </div>
                <div className="flex flex-col gap-4 p-6 pl-12">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <BookOpen className="h-4 w-4 text-primary" />
                      <span>{course.courseCode}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-semibold text-foreground">{course.courseName}</h3>
                      {activeSessionId && (
                        <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">Aktif yoklama</Badge>
                      )}
                    </div>
                  </div>
                </div>

                  <div className="rounded-2xl border bg-muted/40 p-4 text-sm text-muted-foreground">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-foreground">Last activity</span>
                      <CalendarClock className="h-4 w-4 text-primary" />
                    </div>
                    <p className="mt-1 text-foreground">{lastSessionLabel}</p>
                    <Separator className="my-3" />
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-xs uppercase tracking-wide">Enrollment</p>
                        <p className="text-lg font-semibold text-foreground">{course.enrollmentCount ?? 0}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wide">Created</p>
                        <p className="text-sm text-foreground">{createdLabel}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wide">Status</p>
                        <p className="text-sm text-foreground">{statusLabel}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      className="flex-1 border-dashed hover:bg-primary/5 hover:border-primary/40"
                      onClick={() => navigate(`/teacher/courses/${course.courseId}`)}
                    >
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Manage Course
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 justify-center border-border/60 text-foreground hover:bg-primary/10 hover:text-primary"
                      onClick={() => handleShowInvite(derivedInviteLink, course.courseCode)}
                    >
                      <Link2 className="mr-2 h-4 w-4" />
                      Copy Invite Link
                    </Button>
                    <Button
                      className={`flex-1 basis-full justify-center text-primary-foreground ${
                        activeSessionId
                          ? "bg-emerald-500 hover:bg-emerald-600"
                          : "bg-primary/80 hover:bg-primary/70"
                      }`}
                      onClick={() => handleStartSession(course.courseId)}
                    >
                      <CalendarClock className="mr-2 h-4 w-4" />
                      {activeSessionId ? "View Active Session" : "Create Attendance Session"}
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        {isLoading &&
          Array.from({ length: 4 }).map((_, idx) => (
            <Card key={`skeleton-${idx}`} className="p-6">
              <div className="flex flex-col gap-4">
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-24 w-full" />
                <div className="flex gap-2">
                  <Skeleton className="h-10 flex-1" />
                  <Skeleton className="h-10 flex-1" />
                  <Skeleton className="h-10 flex-1" />
                </div>
              </div>
            </Card>
          ))}
        {!isLoading && filteredCourses.length === 0 && (
          <Card className="col-span-full flex flex-col items-center justify-center gap-3 p-12 text-center">
            <p className="text-lg font-semibold text-foreground">No courses found</p>
            <p className="text-sm text-muted-foreground">Try adjusting your search or create a new course.</p>
            <Button onClick={() => navigate("/teacher/create-course")} variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              Create course
            </Button>
          </Card>
        )}
      </div>

      <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Share invite link</DialogTitle>
            <DialogDescription>Send this link to students so they can join {inviteCourseLabel}.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input value={inviteLinkValue} readOnly />
            <DialogFooter className="gap-2 sm:justify-end">
              <Button variant="ghost" onClick={() => setInviteDialogOpen(false)}>
                Close
              </Button>
              <Button onClick={copyInviteLink}>Copy link</Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className="space-y-5">
          <AlertDialogHeader className="space-y-2">
            <AlertDialogTitle className="text-2xl">Delete selected courses?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-muted-foreground">
              Attendance sessions, rosters, and student records related to these courses will be removed for good.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Card className="border bg-muted/30 p-4 text-sm">
            <div className="flex items-center justify-between text-muted-foreground">
              <span>Courses selected</span>
              <span className="text-foreground font-semibold">{selectionCount}</span>
            </div>
            <Separator className="my-3" />
            {selectedCourses.slice(0, 2).map((course) => (
              <div key={course.courseId} className="flex items-center justify-between text-foreground">
                <span className="font-medium">{course.courseName}</span>
                <span className="text-xs text-muted-foreground">{course.courseCode}</span>
              </div>
            ))}
            {selectionCount > 2 && (
              <p className="mt-2 text-xs text-muted-foreground">+{selectionCount - 2} more courses selected</p>
            )}
          </Card>
          <div className="rounded-xl border border-destructive/40 bg-destructive/5 px-4 py-3 text-xs text-destructive">
            This action can’t be undone. You’ll need to recreate courses and sessions if you remove them now.
          </div>
          <AlertDialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <AlertDialogCancel className="w-full sm:w-auto">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              disabled={!selectionCount || bulkDelete.isPending}
              className="w-full bg-destructive text-destructive-foreground hover:bg-destructive/90 sm:w-auto disabled:opacity-70"
            >
              {bulkDelete.isPending ? "Deleting..." : `Delete ${selectionCount ? `(${selectionCount})` : ""}`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TeacherCourses;
