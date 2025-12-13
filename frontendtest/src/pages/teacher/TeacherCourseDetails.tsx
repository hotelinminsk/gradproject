import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import * as XLSX from "xlsx";
import { BookOpen, Link2, Play, Plus, Upload, CheckCircle2, Clock3, Users } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
      if (payload?.courseId && payload.courseId !== courseId) return;
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
      [
        {
          fullName: manualForm.fullName.trim(),
          gtuStudentId: manualForm.gtuStudentId.trim(),
        },
      ],
      {
        onSuccess: () => {
          setManualForm({ fullName: "", email: "", gtuStudentId: "" });
          setManualDialogOpen(false);
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
      { students: parsedRoster, replaceExisting: true },
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
    <div className="min-h-screen bg-gray-100 text-slate-900">
      <div className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-6">
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={() => navigate(-1)}>
            ← Geri
          </Button>
          {course && (
            <span className="text-xs font-medium text-muted-foreground">
              {hasActive ? "Aktif yoklama var" : "Aktif yoklama yok"}
            </span>
          )}
        </div>

        <Card className="border border-slate-200 bg-white p-5 shadow-sm">
          {isLoading ? (
            <Skeleton className="h-24 w-full" />
          ) : isError || !course ? (
            <p className="text-sm text-muted-foreground">Unable to load course details.</p>
          ) : (
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-3">
                  <BookOpen className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-xs uppercase text-muted-foreground">Ders</p>
                    <h1 className="text-2xl font-bold">{course.courseName}</h1>
                    <p className="text-sm text-muted-foreground">{course.courseCode}</p>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  {stats.map((stat) => (
                    <Card key={stat.label} className="rounded-lg border bg-white p-3 shadow-xs">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">{stat.label}</p>
                      <p className="text-xl font-semibold text-slate-900">{stat.value}</p>
                    </Card>
                  ))}
                </div>
              </div>

              <div className="flex w-full max-w-sm flex-col gap-2 rounded-lg border border-slate-200 bg-white p-4 shadow-xs">
                <Button className="w-full" onClick={handleStartSession} disabled={isLoading}>
                  <Play className="mr-2 h-4 w-4" />
                  {hasActive ? "Aktif oturumu görüntüle" : "Yoklama başlat"}
                </Button>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" onClick={() => setInviteDialogOpen(true)} disabled={!course?.inviteToken}>
                    <Link2 className="mr-1 h-4 w-4" />
                    Davet linki
                  </Button>
                  <Button variant="outline" onClick={() => setUploadDialogOpen(true)}>
                    <Upload className="mr-1 h-4 w-4" />
                    Roster yükle
                  </Button>
                </div>
                <Button variant="secondary" onClick={() => setManualDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Öğrenci ekle
                </Button>
              </div>
            </div>
          )}
        </Card>

        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="col-span-2 border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Clock3 className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold">Aktif yoklama</h2>
              </div>
              <Badge className={hasActive ? "bg-green-100 text-green-700 hover:bg-green-100" : ""} variant="secondary">
                {hasActive ? "Açık" : "Kapalı"}
              </Badge>
            </div>
            {hasActive && activeSession ? (
              <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-muted-foreground">
                  Başlangıç: <span className="font-medium text-slate-900">{formatDate(activeSession.expiresAt)}</span>
                </p>
                <p className="text-sm text-muted-foreground">
                  Bitiş: <span className="font-medium text-slate-900">{formatDate(activeSession.expiresAt)}</span>
                </p>
                <p className="text-sm text-primary font-medium">{formatRelative(activeSession.expiresAt)}</p>
                <Button onClick={handleStartSession} className="w-full">
                  Aktif oturumu aç
                </Button>
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-muted-foreground">
                Şu an açık yoklama yok. Yeni bir oturum başlatın.
              </div>
            )}
          </Card>

          <Card className="border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold">Doğrulanmış öğrenciler</h2>
              </div>
              <Badge variant="outline">{verifiedStudents.length}</Badge>
            </div>
            <div className="space-y-2 max-h-72 overflow-auto pr-1">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, idx) => <Skeleton key={idx} className="h-10 w-full" />)
              ) : verifiedStudents.length ? (
                verifiedStudents.map((student) => (
                  <div key={student.courseStudentId} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                    <p className="font-medium text-slate-900">{student.fullname}</p>
                    <p className="text-xs text-muted-foreground">{student.email || student.gtustudentid}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">Henüz doğrulanmış öğrenci yok.</p>
              )}
            </div>
          </Card>
        </div>

        <Card className="border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Clock3 className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Yoklama geçmişi</h2>
            </div>
            <Badge variant="outline">{sessions.length}</Badge>
          </div>
          {isLoading ? (
            <Skeleton className="h-24 w-full" />
          ) : sessions.length ? (
            <div className="space-y-2">
              {sessions.map((session) => (
                <div key={session.sessionId} className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                  <div>
                    <p className="text-sm font-semibold">Session #{session.sessionId.slice(0, 8)}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(session.createdAt)} • {formatRelative(session.expiresAt)}
                    </p>
                  </div>
                  <Badge className={session.isActive ? "bg-green-100 text-green-700 hover:bg-green-100" : ""} variant="secondary">
                    {session.isActive ? "Aktif" : "Kapalı"}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Henüz oturum yok.</p>
          )}
        </Card>

        <Card className="border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Roster</h2>
            </div>
            <Badge variant="outline">{rosterEntries.length}</Badge>
          </div>
          {isLoading ? (
            <Skeleton className="h-24 w-full" />
          ) : rosterEntries.length ? (
            <div className="overflow-hidden rounded-lg border">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2 font-medium">Ad Soyad</th>
                    <th className="px-4 py-2 font-medium">GTÜ ID</th>
                    <th className="px-4 py-2 font-medium">Import</th>
                    <th className="px-4 py-2 font-medium text-center">Durum</th>
                  </tr>
                </thead>
                <tbody>
                  {rosterEntries.map((entry) => {
                    const enrolled = verifiedStudents.some(
                      (s) => s.gtustudentid?.trim().toLowerCase() === entry.gtuStudentId?.trim().toLowerCase(),
                    );
                    return (
                      <tr key={entry.rosterId} className="border-t">
                        <td className="px-4 py-2">{entry.fullName}</td>
                        <td className="px-4 py-2 text-muted-foreground">{entry.gtuStudentId}</td>
                        <td className="px-4 py-2 text-muted-foreground">{formatDate(entry.importedAt)}</td>
                        <td className="px-4 py-2 text-center">
                          {enrolled ? (
                            <Badge variant="secondary" className="gap-1 bg-green-100 text-green-700 hover:bg-green-100">
                              <CheckCircle2 className="h-3 w-3" /> Enrolled
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="gap-1">
                              <Clock3 className="h-3 w-3" /> Pending
                            </Badge>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Henüz roster eklenmedi.</p>
          )}
        </Card>
      </div>

      <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
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
