import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import * as XLSX from "xlsx";
import { BookOpen, Link2, Play, Plus, Upload, CheckCircle2, Clock3, Users, Calendar } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

import { useTeacherCourse, useUploadRosterBulk } from "@/hooks/teacher";
import { useTeacherSession } from "@/providers/index";

import type { RosterStudentRow } from "@/types/course";

const formatDate = (value?: string) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium", timeStyle: "short" }).format(date);
};

const formatRelative = (value?: string) => {
  if (!value) return "";
  const diffMs = new Date(value).getTime() - Date.now();
  const mins = Math.round(diffMs / 60000);
  if (mins >= 60) return `${Math.floor(mins / 60)} sa sonra bitiyor`;
  if (mins > 0) return `${mins} dk içinde bitiyor`;
  if (mins > -60) return `${Math.abs(mins)} dk önce kapandı`;
  return "";
};

const normalizeKey = (key: string) =>
  key
    .toString()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\s._-]/g, "")
    .toLowerCase();

const getValueByHeader = (row: Record<string, unknown>, candidates: string[]) => {
  const normalizedCandidates = candidates.map(normalizeKey);
  for (const key of Object.keys(row)) {
    if (normalizedCandidates.includes(normalizeKey(key))) {
      return row[key];
    }
  }
  return null;
};

export default function TeacherCourseDetails() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { hub } = useTeacherSession();

  const { data: course, isLoading, isError } = useTeacherCourse(courseId);
  const uploadRosterBulk = useUploadRosterBulk(courseId);
  const manualAddMutation = useUploadRosterBulk(courseId);
  const activeSession = course?.activeSession;

  const verifiedStudents = course?.courseStudents ?? [];
  const rosterEntries = course?.roster ?? [];
  const sessions = course?.sessions ?? [];

  const stats = useMemo(
    () => [
      { label: "Doğrulanmış", value: verifiedStudents.length },
      { label: "Roster kayıtları", value: rosterEntries.length },
      { label: "Oturumlar", value: sessions.length },
    ],
    [verifiedStudents.length, rosterEntries.length, sessions.length],
  );

  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [manualDialogOpen, setManualDialogOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [manualForm, setManualForm] = useState({ fullName: "", email: "", gtuStudentId: "" });
  const [rosterFile, setRosterFile] = useState<File | null>(null);
  const [parsedRoster, setParsedRoster] = useState<RosterStudentRow[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);

  useEffect(() => {
    if (!hub) return;
    const invalidate = (payload: { courseId?: string }) => {
      // Case-insensitive comparison for GUIDs
      if (
        payload?.courseId &&
        courseId &&
        payload.courseId.toLowerCase() !== courseId.toLowerCase()
      ) {
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["teacher-course", courseId] });
      queryClient.invalidateQueries({ queryKey: ["teacher-courses"] });
    };
    hub.on("SessionCreated", invalidate);
    hub.on("SessionClosed", invalidate);
    hub.on("EnrollmentUpdated", invalidate);
    return () => {
      hub.off("SessionCreated", invalidate);
      hub.off("SessionClosed", invalidate);
      hub.off("EnrollmentUpdated", invalidate);
    };
  }, [hub, courseId, queryClient]);

  const handleStartSession = () => {
    if (!courseId) return;
    if (activeSession && activeSession.isActive && activeSession.sessionId) {
      navigate(`/teacher/session/${activeSession.sessionId}`);
    } else {
      navigate(`/teacher/courses/${courseId}/sessions/new`);
    }
  };

  const handleCopyInviteLink = () => {
    if (!course?.inviteToken) return;
    navigator.clipboard.writeText(course.inviteToken);
    toast.success("Invite link copied.");
  };

  const handleManualSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!manualForm.fullName.trim() || !manualForm.gtuStudentId.trim()) {
      toast.error("Full name and GTU ID are required.");
      return;
    }
    manualAddMutation.mutate(
      {
        students: [
          {
            fullName: manualForm.fullName.trim(),
            gtuStudentId: manualForm.gtuStudentId.trim(),
          },
        ],
        replaceExisting: false
      },
      {
        onSuccess: () => {
          setManualForm({ fullName: "", email: "", gtuStudentId: "" });
          setManualDialogOpen(false);
          toast.success("Student added.");
        },
      },
    );
  };

  const parseRosterFile = useCallback(async (file: File): Promise<RosterStudentRow[]> => {
    const ext = file.name.toLowerCase();
    if (ext.endsWith(".csv")) {
      const text = await file.text();
      const rows = text.split(/\r?\n/).filter(Boolean);
      const [, ...data] = rows;
      return data
        .map((row) => {
          const [fullName, gtuId] = row.split(",");
          return fullName && gtuId
            ? { fullName: fullName.trim(), gtuStudentId: gtuId.trim() }
            : null;
        })
        .filter((row): row is RosterStudentRow => row !== null);
    }

    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];

    const jsonRows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });
    const parsedFromObjects = jsonRows
      .map((row) => {
        const fullName =
          getValueByHeader(row, ["FullName", "Name", "AdiSoyadi", "AdSoyad", "OgrenciAdiSoyadi"]) ??
          row["FullName"] ??
          row["Name"];
        const gtuId =
          getValueByHeader(row, ["GtuStudentId", "StudentId", "OgrenciNo", "ÖgrenciNo", "OgrenciID"]) ??
          row["GtuStudentId"] ??
          row["StudentId"];
        if (!fullName || !gtuId) return null;
        return { fullName: String(fullName).trim(), gtuStudentId: String(gtuId).trim() };
      })
      .filter((row): row is RosterStudentRow => row !== null);
    if (parsedFromObjects.length > 0) return parsedFromObjects;

    const arrayRows: (string | number)[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    if (!arrayRows.length) return [];
    const [headerRow, ...dataRows] = arrayRows;

    const findIndex = (candidates: string[]) => {
      const normalizedCandidates = candidates.map(normalizeKey);
      for (let i = 0; i < headerRow.length; i++) {
        const cell = headerRow[i];
        if (cell === undefined || cell === null) continue;
        if (normalizedCandidates.includes(normalizeKey(String(cell)))) {
          return i;
        }
      }
      return -1;
    };

    const fullNameIndex = findIndex(["FullName", "Name", "AdiSoyadi", "AdSoyad", "OgrenciAdiSoyadi"]);
    const gtuIdIndex = findIndex(["GtuStudentId", "StudentId", "OgrenciNo", "Ogrencino", "OgrenciID"]);
    let resolvedFullNameIndex = fullNameIndex;
    let resolvedGtuIdIndex = gtuIdIndex;

    if (resolvedFullNameIndex === -1 && resolvedGtuIdIndex === -1 && headerRow.length >= 3) {
      resolvedGtuIdIndex = 1;
      resolvedFullNameIndex = 2;
    } else {
      if (resolvedFullNameIndex === -1) {
        resolvedFullNameIndex = resolvedGtuIdIndex !== -1 && headerRow.length > gtuIdIndex ? gtuIdIndex + 1 : 1;
      }
      if (resolvedGtuIdIndex === -1) {
        resolvedGtuIdIndex = resolvedFullNameIndex > 0 ? resolvedFullNameIndex - 1 : 0;
      }
    }
    if (resolvedFullNameIndex === -1 || resolvedGtuIdIndex === -1) return [];

    return dataRows
      .map((row) => {
        const fullName = row[resolvedFullNameIndex];
        const gtuId = row[resolvedGtuIdIndex];
        if (!fullName || !gtuId) return null;
        return { fullName: String(fullName).trim(), gtuStudentId: String(gtuId).trim() };
      })
      .filter((row): row is RosterStudentRow => row !== null);
  }, []);

  const handleRosterFile = async (file: File | null) => {
    if (!file) return;
    setRosterFile(file);
    setIsParsing(true);
    try {
      const parsed = await parseRosterFile(file);
      setParsedRoster(parsed);
      setParseError(parsed.length ? null : "No valid rows detected.");
    } catch (error) {
      console.error(error);
      setParseError("Failed to parse roster file.");
      setParsedRoster([]);
    } finally {
      setIsParsing(false);
    }
  };

  const handleRosterSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!parsedRoster.length) {
      toast.error("Add at least one student before uploading.");
      return;
    }
    uploadRosterBulk.mutate(
      { students: parsedRoster, replaceExisting: false },
      {
        onSuccess: () => {
          setParsedRoster([]);
          setRosterFile(null);
          setUploadDialogOpen(false);
          toast.success("Roster updated.");
        },
        onError: (error) => toast.error(error.message),
      },
    );
  };

  if (!courseId) {
    return <p className="text-center text-sm text-muted-foreground">Course identifier missing.</p>;
  }

  const hasActive = activeSession && activeSession.isActive;

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-900 pb-20 font-sans">
      {/* Sticky Header - Aligned with Sidebar (approx 88px) */}
      <div className="bg-white/90 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50 transition-all duration-200 h-[88px] flex items-center">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full flex items-center justify-between gap-4">
          {/* Left: Back & Context */}
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="-ml-2 text-slate-500 hover:text-slate-900">
              ← Back
            </Button>
            <div className="h-6 w-px bg-slate-200 hidden sm:block" />
            <div className="flex items-center gap-2">
              <span className="font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded text-sm mb-0.5 inline-block">
                {course?.courseCode}
              </span>
              <h1 className="text-lg font-semibold text-slate-900 line-clamp-1 hidden sm:block">
                {course?.courseName || <Skeleton className="w-40 h-6 inline-block" />}
              </h1>
            </div>
            <Badge variant={hasActive ? "default" : "secondary"} className={hasActive ? "bg-green-600 hover:bg-green-700 shadow-sm ml-2" : "bg-slate-100 text-slate-500 border-slate-200 ml-2"}>
              {hasActive ? "Active" : "Inactive"}
            </Badge>
          </div>

          {/* Right: Primary Action (Start Session) */}
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={handleStartSession} disabled={isLoading}
              className="shadow-sm bg-[#1a73e8] hover:bg-[#1557b0] text-white border-0 font-medium"
            >
              <Play className="mr-2 h-3.5 w-3.5 fill-current" />
              {hasActive ? "Join" : "Start Session"}
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {isError ? (
          <div className="rounded-xl border border-dashed border-slate-300 p-12 text-center text-muted-foreground bg-white">
            Failed to load course details.
          </div>
        ) : (
          <div className="space-y-8">
            {/* Course Title & Description Block (Moved from Header) */}
            <div className="max-w-4xl space-y-4">
              <div>
                <h1 className="text-4xl font-light tracking-tight text-slate-900 mb-2">
                  {course?.courseName}
                </h1>
                <div className="flex items-center gap-3 text-sm text-slate-500">
                  <span>{course?.courseCode}</span>
                  {course?.firstSessionAt && (
                    <>
                      <span className="text-slate-300">•</span>
                      <span className="flex items-center gap-1.5 text-slate-600">
                        <Calendar className="w-3.5 h-3.5" />
                        First session: {new Intl.DateTimeFormat("tr-TR", { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }).format(new Date(course.firstSessionAt))}
                      </span>
                    </>
                  )}
                </div>
              </div>
              {course?.description && (
                <p className="text-base text-slate-600 leading-relaxed max-w-2xl bg-white/50 p-4 rounded-xl border border-slate-100/50">
                  {course.description}
                </p>
              )}
            </div>

            <div className="grid gap-8 lg:grid-cols-3 items-start">
              {/* Left Column: Main Content */}
              <div className="space-y-8 lg:col-span-2 min-w-0">

                {/* Stats Overview */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center gap-2 hover:border-blue-200 transition-colors cursor-default group">
                    <span className="text-3xl font-light text-slate-900 group-hover:text-[#1a73e8] transition-colors">{verifiedStudents.length}</span>
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Students</span>
                  </div>
                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center gap-2 hover:border-blue-200 transition-colors cursor-default group">
                    <span className="text-3xl font-light text-slate-900 group-hover:text-[#1a73e8] transition-colors">{sessions.length}</span>
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Sessions</span>
                  </div>
                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center gap-2 sm:col-span-1 col-span-2 hover:border-blue-200 transition-colors cursor-default group">
                    <span className="text-3xl font-light text-slate-900 group-hover:text-[#1a73e8] transition-colors">{rosterEntries.length}</span>
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Roster</span>
                  </div>
                </div>

                {/* Active Session Card */}
                {hasActive && activeSession && (
                  <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-6 shadow-sm ring-1 ring-emerald-500/10">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <h3 className="text-lg font-medium text-emerald-900 flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          Active Session
                        </h3>
                        <p className="text-emerald-700 text-sm pl-4">
                          {activeSession.attendeeCount || 0} students joined
                        </p>
                      </div>
                      <Badge variant="outline" className="bg-white text-emerald-700 border-emerald-200 shadow-sm">
                        {formatRelative(activeSession.expiresAt)}
                      </Badge>
                    </div>
                    <div className="mt-6 flex gap-3 pl-4">
                      <Button onClick={handleStartSession} className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm border-0">
                        Manage
                      </Button>
                      <Button variant="outline" className="bg-white border-emerald-200 text-emerald-800 hover:bg-emerald-50" onClick={() => navigate(`/teacher/session/${activeSession.sessionId}`)}>
                        QR Code
                      </Button>
                    </div>
                  </div>
                )}

                {/* Student Lists (Tabs) */}
                <div className="space-y-4">
                  <Tabs defaultValue="enrolled" className="space-y-4">
                    <div className="flex items-center justify-between px-1">
                      <TabsList className="bg-slate-100 p-1 border border-slate-200 rounded-lg">
                        <TabsTrigger value="enrolled" className="px-4 py-1.5 text-sm font-medium rounded-md data-[state=active]:bg-white data-[state=active]:text-[#1a73e8] data-[state=active]:shadow-sm transition-all">
                          Kayıtlı Öğrenciler ({verifiedStudents.length})
                        </TabsTrigger>
                        <TabsTrigger value="roster" className="px-4 py-1.5 text-sm font-medium rounded-md data-[state=active]:bg-white data-[state=active]:text-[#1a73e8] data-[state=active]:shadow-sm transition-all">
                          Roster Listesi ({rosterEntries.length})
                        </TabsTrigger>
                      </TabsList>

                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setUploadDialogOpen(true)} className="hover:text-[#1a73e8] hover:border-blue-200 bg-white shadow-sm border-slate-200">
                          <Upload className="mr-2 h-3.5 w-3.5" /> Liste Yükle
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setManualDialogOpen(true)} className="hover:text-[#1a73e8] hover:border-blue-200 bg-white shadow-sm border-slate-200">
                          <Plus className="mr-2 h-3.5 w-3.5" /> Öğrenci Ekle
                        </Button>
                      </div>
                    </div>

                    {/* Enrolled Students Tab */}
                    <TabsContent value="enrolled">
                      <Card className="overflow-hidden border border-slate-200 shadow-sm rounded-xl bg-white">
                        {!verifiedStudents.length ? (
                          <div className="p-12 text-center flex flex-col items-center justify-center">
                            <div className="bg-slate-50 p-4 rounded-full mb-3">
                              <Users className="w-8 h-8 text-slate-300" />
                            </div>
                            <p className="text-sm text-slate-500 font-medium">Henüz kayıtlı öğrenci yok.</p>
                            <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                              Öğrencilerin derse katılması için davet kodunu paylaşın veya Roster listesini yükleyin.
                            </p>
                          </div>
                        ) : (
                          <div className="max-h-[500px] overflow-auto custom-scrollbar">
                            <table className="w-full text-left text-sm">
                              <thead className="bg-slate-50 sticky top-0 z-10 text-slate-500 font-medium shadow-sm">
                                <tr>
                                  <th className="px-5 py-3 border-b text-xs uppercase tracking-wide bg-slate-50 font-semibold text-slate-500">Öğrenci</th>
                                  <th className="px-5 py-3 border-b text-xs uppercase tracking-wide bg-slate-50 font-semibold text-slate-500">E-posta</th>
                                  <th className="px-5 py-3 border-b text-xs uppercase tracking-wide text-right bg-slate-50 font-semibold text-slate-500">Öğrenci No</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {verifiedStudents.map((s) => (
                                  <tr key={s.courseStudentId} className="hover:bg-blue-50/30 transition-colors group">
                                    <td className="px-5 py-3 font-medium text-slate-700 group-hover:text-[#1a73e8] transition-colors">{s.fullName}</td>
                                    <td className="px-5 py-3 text-slate-500">{s.email || "—"}</td>
                                    <td className="px-5 py-3 text-slate-500 text-right font-mono text-xs">{s.gtuStudentId}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </Card>
                    </TabsContent>

                    {/* Roster Tab */}
                    <TabsContent value="roster">
                      <Card className="overflow-hidden border border-slate-200 shadow-sm rounded-xl bg-white">
                        {!rosterEntries.length ? (
                          <div className="p-12 text-center flex flex-col items-center justify-center">
                            <div className="bg-slate-50 p-4 rounded-full mb-3">
                              <BookOpen className="w-8 h-8 text-slate-300" />
                            </div>
                            <p className="text-sm text-slate-500 font-medium">Roster listesi boş.</p>
                            <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                              "Liste Yükle" butonunu kullanarak Excel veya CSV dosyasından öğrenci listesini yükleyebilirsiniz.
                            </p>
                          </div>
                        ) : (
                          <div className="max-h-[500px] overflow-auto custom-scrollbar">
                            <table className="w-full text-left text-sm">
                              <thead className="bg-slate-50 sticky top-0 z-10 text-slate-500 font-medium shadow-sm">
                                <tr>
                                  <th className="px-5 py-3 border-b text-xs uppercase tracking-wide bg-slate-50 font-semibold text-slate-500">Öğrenci Adı</th>
                                  <th className="px-5 py-3 border-b text-xs uppercase tracking-wide text-right bg-slate-50 font-semibold text-slate-500">Öğrenci No</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {rosterEntries.map((r, i) => (
                                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-5 py-3 font-medium text-slate-700">{r.fullName}</td>
                                    <td className="px-5 py-3 text-slate-500 text-right font-mono text-xs">{r.gtuStudentId}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </Card>
                    </TabsContent>
                  </Tabs>
                </div>
              </div>

              {/* Right Column: Sidebar */}
              <div className="space-y-6 lg:col-span-1 lg:sticky lg:top-32">

                {/* Invite Card */}
                <Card className="p-5 border border-slate-200 shadow-sm rounded-xl space-y-4 bg-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-blue-500/10 to-transparent rounded-bl-full -mr-4 -mt-4 opacity-50" />
                  <div>
                    <h3 className="font-medium text-slate-900 mb-1">Invite Code</h3>
                    <p className="text-xs text-muted-foreground">Students can join using this code.</p>
                  </div>
                  <div className="bg-slate-50 border border-dashed border-slate-300 rounded-lg p-4 text-center cursor-pointer hover:bg-blue-50 hover:border-blue-200 transition-all group"
                    onClick={handleCopyInviteLink}
                    title="Click to copy"
                  >
                    <code className="text-2xl font-bold tracking-widest text-slate-700 group-hover:text-[#1a73e8] transition-colors block break-all">
                      {course?.inviteToken || "—"}
                    </code>
                  </div>
                  <Button variant="outline" className="w-full text-xs h-9 bg-white hover:border-blue-300 hover:text-[#1a73e8]" onClick={handleCopyInviteLink}>
                    <Link2 className="mr-2 h-3.5 w-3.5" /> Copy Code
                  </Button>
                </Card>

                {/* Schedule Card */}
                <Card className="p-5 border border-slate-200 shadow-sm rounded-xl space-y-4 bg-white">
                  <div className="flex items-center gap-2 text-slate-900 border-b border-slate-100 pb-3">
                    <div className="bg-blue-50 p-1.5 rounded-md">
                      <Calendar className="h-4 w-4 text-[#1a73e8]" />
                    </div>
                    <h3 className="font-medium">Weekly Schedule</h3>
                  </div>

                  {!course?.schedules?.length ? (
                    <div className="bg-slate-50 rounded-lg p-4 text-center">
                      <p className="text-sm text-slate-500 italic">No schedule set.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {course.schedules
                        .sort((a, b) => {
                          const days = [1, 2, 3, 4, 5, 6, 0];
                          const idxA = days.indexOf(a.dayOfWeek);
                          const idxB = days.indexOf(b.dayOfWeek);
                          return (idxA - idxB) || a.startTime.localeCompare(b.startTime);
                        })
                        .map((s, idx) => (
                          <div key={idx} className="flex justify-between items-center text-sm bg-slate-50/50 p-2.5 rounded-lg border border-slate-100 hover:border-blue-100 hover:bg-blue-50/30 transition-colors">
                            <span className="font-medium text-slate-700 flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#1a73e8]/70" />
                              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][s.dayOfWeek]}
                            </span>
                            <span className="text-slate-500 font-mono text-xs bg-white px-1.5 py-0.5 rounded border border-slate-200">
                              {s.startTime.slice(0, 5)} - {s.endTime.slice(0, 5)}
                            </span>
                          </div>
                        ))}
                    </div>
                  )}
                </Card>

                {/* Recent Sessions (Mini) */}
                <div className="space-y-3 pt-2">
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1">Recent Sessions</h3>
                  <div className="space-y-2">
                    {sessions.slice(0, 5).map(s => (
                      <div key={s.sessionId} className="bg-white border border-slate-200 p-3 rounded-lg shadow-sm flex items-center justify-between hover:border-blue-200 transition-colors cursor-pointer group">
                        <div className="text-sm">
                          <span className="text-slate-900 font-medium block group-hover:text-[#1a73e8] transition-colors">
                            {new Intl.DateTimeFormat("tr-TR", { day: 'numeric', month: 'short' }).format(new Date(s.createdAt))}
                          </span>
                          <span className="text-slate-500 text-xs">
                            {new Intl.DateTimeFormat("tr-TR", { hour: '2-digit', minute: '2-digit' }).format(new Date(s.createdAt))}
                          </span>
                        </div>
                        <Badge variant="outline" className={s.isActive ? "text-green-700 bg-green-50 border-green-200" : "text-slate-400 bg-slate-50"}>
                          {s.isActive ? "Active" : "Closed"}
                        </Badge>
                      </div>
                    ))}
                    {sessions.length === 0 && (
                      <p className="text-xs text-slate-400 px-3 py-2 border border-dashed border-slate-200 rounded-lg">No sessions yet.</p>
                    )}
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}
      </div>

      {/* Dialogs remain mostly the same structure, just wrapped properly if needed */}
      <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
        {/* ... (Existing dialog content, simplified) ... */}
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Davet linkini paylaş</DialogTitle>
            <DialogDescription>Öğrencilerle paylaşmak için bu özel daveti kopyalayın.</DialogDescription>
          </DialogHeader>
          {course?.inviteToken ? (
            <div className="space-y-4">
              <div className="rounded-lg border bg-muted/40 p-4">
                <Label htmlFor="invite-link" className="text-xs uppercase tracking-wide text-muted-foreground">
                  Enrollment link
                </Label>
                <Input id="invite-link" value={course.inviteToken} readOnly className="mt-2" />
              </div>
              <DialogFooter className="gap-2 sm:justify-end">
                <Button variant="ghost" onClick={() => setInviteDialogOpen(false)}>
                  Kapat
                </Button>
                <Button onClick={handleCopyInviteLink}>Kopyala</Button>
              </DialogFooter>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Önce bir davet token oluşturmalısınız.</p>
          )}
        </DialogContent>
      </Dialog>

      {/* Upload Dialog */}
      <Dialog
        open={uploadDialogOpen}
        onOpenChange={(open) => {
          setUploadDialogOpen(open);
          if (!open) {
            setRosterFile(null);
            setParsedRoster([]);
            setParseError(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-[540px]">
          <DialogHeader>
            <DialogTitle>Roster yükle</DialogTitle>
            <DialogDescription>OBS çıktısını ya da şablonu yükleyin.</DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleRosterSubmit}>
            <div className="space-y-3">
              <label
                htmlFor="detail-roster-file"
                className="flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-border/70 bg-muted/30 px-4 py-6 text-center text-sm text-muted-foreground transition hover:border-primary hover:bg-primary/5"
              >
                <Upload className="mb-2 h-5 w-5 text-primary" />
                <span className="font-semibold text-foreground">Dosya bırakın ya da göz atın</span>
                <Input
                  id="detail-roster-file"
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  className="hidden"
                  onChange={(event) => handleRosterFile(event.target.files?.[0] ?? null)}
                />
                <span className="text-xs text-muted-foreground">CSV, XLSX, XLS desteklenir</span>
              </label>
              {rosterFile && (
                <p className="text-xs text-muted-foreground">
                  {isParsing ? "Parse ediliyor" : "Seçildi"}: {rosterFile.name}
                </p>
              )}
              {parseError && <p className="text-xs text-destructive">{parseError}</p>}
            </div>
            {parsedRoster.length > 0 && (
              <div className="rounded-lg border bg-background/70 p-4 text-sm">
                <p className="font-medium text-foreground">Önizleme</p>
                <p className="text-xs text-muted-foreground">
                  {parsedRoster.length} satırdan ilk {Math.min(parsedRoster.length, 5)} gösteriliyor
                </p>
                <ul className="mt-3 space-y-1 text-muted-foreground">
                  {parsedRoster.slice(0, 5).map((student, index) => (
                    <li key={`${student.fullName}-${index}`} className="flex justify-between">
                      <span>{student.fullName}</span>
                      <span>{student.gtuStudentId}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-end">
              <Button variant="ghost" onClick={() => setUploadDialogOpen(false)}>
                Vazgeç
              </Button>
              <Button type="submit" disabled={!parsedRoster.length || uploadRosterBulk.isPending}>
                {uploadRosterBulk.isPending ? "Yükleniyor..." : "Yükle"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Manual Add Dialog */}
      <Dialog
        open={manualDialogOpen}
        onOpenChange={(open) => {
          setManualDialogOpen(open);
          if (!open) setManualForm({ fullName: "", email: "", gtuStudentId: "" });
        }}
      >
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Öğrenci ekle</DialogTitle>
            <DialogDescription>Tek tek öğrencileri ekleyin.</DialogDescription>
          </DialogHeader>
          <form className="space-y-3 pt-2" onSubmit={handleManualSubmit}>
            <div className="space-y-1">
              <Label htmlFor="manual-fullname">Ad Soyad</Label>
              <Input
                id="manual-fullname"
                placeholder="Öğrenci adı"
                value={manualForm.fullName}
                onChange={(event) => setManualForm((prev) => ({ ...prev, fullName: event.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="manual-email">E-posta (opsiyonel)</Label>
              <Input
                id="manual-email"
                type="email"
                placeholder="student@gtu.edu.tr"
                value={manualForm.email}
                onChange={(event) => setManualForm((prev) => ({ ...prev, email: event.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="manual-gtu">GTÜ Öğrenci No</Label>
              <Input
                id="manual-gtu"
                placeholder="123456"
                value={manualForm.gtuStudentId}
                onChange={(event) => setManualForm((prev) => ({ ...prev, gtuStudentId: event.target.value }))}
              />
            </div>
            <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-end">
              <Button variant="ghost" onClick={() => setManualDialogOpen(false)}>
                İptal
              </Button>
              <Button type="submit" disabled={manualAddMutation.isPending}>
                {manualAddMutation.isPending ? "Ekleniyor..." : "Ekle"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
