import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useParams, useNavigate } from "react-router-dom";
import { BookOpen, Users, Link2, Upload, Play, Plus, CheckCircle2, Clock3 } from "lucide-react";
import { useTeacherCourse, useUploadRosterBulk, useActiveSession } from "@/hooks/teacher";
import { toast } from "sonner";
import { useState, useCallback, useEffect } from "react";
import * as XLSX from "xlsx";
import type { RosterStudentRow } from "@/types/course";
import { useTeacherSession } from "@/providers";
import { queryOptions, useQueryClient } from "@tanstack/react-query";

const API_BASE_FALLBACK = "https://localhost:7270";

const formatDate = (value?: string) => {
  if (!value) return "—";
  // Ensure the date string is parsed as UTC for correct timezone conversion
  const raw = value.endsWith("Z") ? value : `${value}Z`;
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(date);
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

const INVITE_HOST =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE) ||
  (typeof window !== "undefined" ? window.location.origin : API_BASE_FALLBACK);

export default function TeacherCourseDetails() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { data: course, isLoading, isError } = useTeacherCourse(courseId);
  const uploadRosterBulk = useUploadRosterBulk(courseId);
  const manualAddMutation = useUploadRosterBulk(courseId);
  const { data: activeSession } = useActiveSession(courseId);
  const queryClient = useQueryClient();
  const {hub} = useTeacherSession();

  useEffect(() => {
    if(!hub) return;
    const onCreated = (p) => {
      if(p.courseId === courseId){
        queryClient.invalidateQueries({queryKey: ["teacher-course", courseId]});  //buna sonrasında student da eklenecek
      }
      queryClient.invalidateQueries({queryKey: ["teacher-courses"]});
    };
    const onClosed = onCreated;
    hub.on("SessionCreated", onCreated);
    hub.on("SessionClosed", onClosed);
    return () => {
      hub.off("SessionCreated", onCreated);
      hub.off("SessionClosed", onClosed);

    };

  },[hub, courseId, queryClient]);

  const verifiedStudents = course?.courseStudents ?? [];
  const rosterEntries = course?.roster ?? [];
  const sessions = course?.sessions ?? [];
  const enrolledStudentIds = new Set(
    verifiedStudents
      .map((student) => student.gtustudentid?.trim().toLowerCase())
      .filter((id): id is string => Boolean(id)),
  );
  const stats = [
    {
      label: "Verified Students",
      value: verifiedStudents.length,
      subtext: "Completed enrollment",
    },
    {
      label: "Roster entries",
      value: rosterEntries.length,
      subtext: "Imported records",
    },
    {
      label: "Recent sessions",
      value: sessions.length,
      subtext: "Past 10 records",
    },
  ];

  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [manualDialogOpen, setManualDialogOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [manualForm, setManualForm] = useState({ fullName: "", email: "", gtuStudentId: "" });
  const [rosterFile, setRosterFile] = useState<File | null>(null);
  const [parsedRoster, setParsedRoster] = useState<RosterStudentRow[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const activeSessionInfo = activeSession?.isActive
    ? `Active session #${activeSession.sessionId?.slice(0, 8)} · expires ${formatDate(activeSession.expiresAt)}`
    : "No active session";

  const handleStartSession = () => {
    if (!courseId) return;
    if (activeSession && activeSession.isActive && activeSession.sessionId) {
      navigate(`/teacher/session/${activeSession.sessionId}`);
    } else {
      navigate(`/teacher/courses/${courseId}/sessions/new`);
    }
  };

  // Backend now returns a full invite URL in CourseInvitationToken; trust it as-is.
  const inviteLink = course?.inviteToken ?? "";

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
        if (resolvedGtuIdIndex !== -1 && headerRow.length > resolvedGtuIdIndex + 1) {
          resolvedFullNameIndex = resolvedGtuIdIndex + 1;
        } else if (headerRow.length >= 2) {
          resolvedFullNameIndex = 1;
        }
      }
      if (resolvedGtuIdIndex === -1) {
        if (resolvedFullNameIndex !== -1 && resolvedFullNameIndex > 0) {
          resolvedGtuIdIndex = resolvedFullNameIndex - 1;
        } else if (headerRow.length >= 1) {
          resolvedGtuIdIndex = 0;
        }
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
    uploadRosterBulk.mutate({ students: parsedRoster, replaceExisting: true }, {
      onSuccess: () => {
        setParsedRoster([]);
        setRosterFile(null);
        setUploadDialogOpen(false);
        toast.success("Roster updated.");
      },
      onError: (error) => toast.error(error.message),
    });
  };

  const handleCopyInviteLink = () => {
    if (!inviteLink) return;
    navigator.clipboard.writeText(inviteLink);
    toast.success("Invite link copied.");
  };

  if (!courseId) {
    return <p className="text-center text-sm text-muted-foreground">Course identifier missing.</p>;
  }

  return (
    <div className="space-y-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <Card className="rounded-3xl border border-border/50 bg-gradient-to-br from-background via-muted/70 to-background p-6 shadow-md">
          {isLoading ? (
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-3">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-6 w-64" />
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-5 w-24" />
                </div>
              </div>
              <Skeleton className="h-32 w-64" />
            </div>
          ) : isError || !course ? (
            <div className="text-center text-sm text-muted-foreground">Unable to load course details.</div>
          ) : (
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <BookOpen className="h-4 w-4 text-primary" />
                  <span>Course overview</span>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-foreground">{course.courseName}</h1>
                  <p className="text-sm text-muted-foreground">{course.courseCode}</p>
                </div>
                <Badge
                  variant="secondary"
                  className={`w-fit ${activeSession?.isActive ? "bg-success/15 text-success" : ""}`}
                >
                  {activeSessionInfo}
                </Badge>
                <div className="grid gap-3 sm:grid-cols-3">
                  {stats.map((stat) => (
                    <Card key={stat.label} className="rounded-2xl border bg-background/80 p-3 shadow-sm">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">{stat.label}</p>
                      <p className="text-2xl font-semibold text-foreground">{stat.value}</p>
                      <p className="text-xs text-muted-foreground">{stat.subtext}</p>
                    </Card>
                  ))}
                </div>
              </div>
              <div className="flex w-full max-w-sm flex-col gap-3 rounded-2xl border border-border/60 bg-background/80 p-4 shadow-sm">
                <Button
                  className={`w-full justify-center text-primary-foreground shadow-lg ${
                    activeSession && activeSession.isActive
                      ? "bg-emerald-500 hover:bg-emerald-600"
                      : "bg-primary hover:bg-primary/90"
                  }`}
                  onClick={handleStartSession}
                  disabled={isLoading}
                >
                  <Play className="mr-2 h-4 w-4" />
                  {activeSession && activeSession.isActive ? "View active session" : "Start attendance session"}
                </Button>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    className="justify-center border-border text-foreground hover:bg-primary/10 hover:text-primary"
                    onClick={() => {
                      if (!course?.inviteToken) {
                        toast.info("Generate an invite token to share enrollment link.");
                        return;
                      }
                      setInviteDialogOpen(true);
                    }}
                  >
                    <Link2 className="mr-1 h-4 w-4" />
                    Invite link
                  </Button>
                  <Button
                    variant="outline"
                    className="justify-center border-dashed border-border text-foreground hover:bg-primary/5 hover:text-primary"
                    onClick={() => setUploadDialogOpen(true)}
                  >
                    <Upload className="mr-1 h-4 w-4" />
                    Upload roster
                  </Button>
                </div>
                <Button
                  className="justify-center bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow hover:shadow-lg"
                  onClick={() => setManualDialogOpen(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add students
                </Button>
              </div>
            </div>
          )}
        </Card>

        <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
          <DialogContent className="sm:max-w-[480px]">
            <DialogHeader>
              <DialogTitle>Share invite link</DialogTitle>
              <DialogDescription>Send this private link to students so they can join the course instantly.</DialogDescription>
            </DialogHeader>
            {inviteLink ? (
              <div className="space-y-4">
                <div className="rounded-2xl border bg-muted/40 p-4">
                  <Label htmlFor="invite-link" className="text-xs uppercase tracking-wide text-muted-foreground">
                    Enrollment link
                  </Label>
                  <Input id="invite-link" value={inviteLink} readOnly className="mt-2" />
                </div>
                <DialogFooter className="gap-2 sm:justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    className="text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                    onClick={() => setInviteDialogOpen(false)}
                  >
                    Close
                  </Button>
                  <Button
                    type="button"
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                    onClick={handleCopyInviteLink}
                  >
                    Copy link
                  </Button>
                </DialogFooter>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No invite token has been generated for this course yet. Create one from the course settings page.
              </p>
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
              <DialogTitle>Upload roster</DialogTitle>
              <DialogDescription>Drop the OBS export or use our template to import multiple students.</DialogDescription>
            </DialogHeader>
            <form className="space-y-4" onSubmit={handleRosterSubmit}>
              <div className="space-y-3">
                <label
                  htmlFor="detail-roster-file"
                  className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-border/70 bg-muted/30 px-4 py-6 text-center text-sm text-muted-foreground transition hover:border-primary hover:bg-primary/5"
                >
                  <Upload className="mb-2 h-5 w-5 text-primary" />
                  <span className="font-semibold text-foreground">Drop roster file or click to browse</span>
                  <Input
                    id="detail-roster-file"
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    className="hidden"
                    onChange={(event) => handleRosterFile(event.target.files?.[0] ?? null)}
                  />
                  <span className="text-xs text-muted-foreground">Supported formats: CSV, XLSX, XLS</span>
                </label>
                {rosterFile && (
                  <p className="text-xs text-muted-foreground">
                    {isParsing ? "Parsing" : "Selected"}: {rosterFile.name}
                  </p>
                )}
                {parseError && <p className="text-xs text-destructive">{parseError}</p>}
              </div>
              {parsedRoster.length > 0 && (
                <div className="rounded-2xl border bg-background/70 p-4 text-sm">
                  <p className="font-medium text-foreground">Preview</p>
                  <p className="text-xs text-muted-foreground">
                    Showing {Math.min(parsedRoster.length, 5)} of {parsedRoster.length} rows
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
                <Button
                  type="button"
                  variant="ghost"
                  className="text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                  onClick={() => setUploadDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
                  disabled={!parsedRoster.length || uploadRosterBulk.isPending}
                >
                  {uploadRosterBulk.isPending ? "Uploading..." : "Upload roster"}
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
              <DialogTitle>Add student manually</DialogTitle>
              <DialogDescription>Quickly add individual students if they missed the bulk roster.</DialogDescription>
            </DialogHeader>
            <form className="space-y-3 pt-2" onSubmit={handleManualSubmit}>
              <div className="space-y-1">
                <Label htmlFor="manual-fullname">Full name</Label>
                <Input
                  id="manual-fullname"
                  placeholder="Student Name"
                  value={manualForm.fullName}
                  onChange={(event) => setManualForm((prev) => ({ ...prev, fullName: event.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="manual-email">Email (optional)</Label>
                <Input
                  id="manual-email"
                  type="email"
                  placeholder="student@gtu.edu.tr"
                  value={manualForm.email}
                  onChange={(event) => setManualForm((prev) => ({ ...prev, email: event.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="manual-gtu">GTU Student ID</Label>
                <Input
                  id="manual-gtu"
                  placeholder="123456"
                  value={manualForm.gtuStudentId}
                  onChange={(event) => setManualForm((prev) => ({ ...prev, gtuStudentId: event.target.value }))}
                />
              </div>
              <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  className="text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                  onClick={() => setManualDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
                  disabled={manualAddMutation.isPending}
                >
                  {manualAddMutation.isPending ? "Adding..." : "Add student"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <div className="grid gap-4 md:grid-cols-2">
          <Card className="flex flex-col gap-4 p-5">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h2 className="text-lg font-semibold">Verified students</h2>
                <p className="text-sm text-muted-foreground">Students who completed enrollment.</p>
              </div>
              <Badge variant="secondary" className="rounded-full bg-primary/10 text-primary">
                {verifiedStudents.length}
              </Badge>
            </div>
            <div className="space-y-3">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, idx) => <Skeleton key={`student-skel-${idx}`} className="h-4 w-full" />)
              ) : verifiedStudents.length ? (
                verifiedStudents.slice(0, 6).map((student) => (
                  <div key={student.courseStudentId} className="flex items-center justify-between rounded-xl border px-3 py-2 text-sm">
                    <div>
                      <p className="font-medium text-foreground">{student.fullname}</p>
                      <p className="text-muted-foreground">{student.email || student.gtustudentid}</p>
                    </div>
                    <Badge variant="outline" className="border-success/30 text-xs text-success">
                      Verified
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No verified enrollments yet.</p>
              )}
              {verifiedStudents.length > 6 && (
                <p className="text-xs text-muted-foreground">
                  Showing 6 of {verifiedStudents.length}. View roster page for the full list.
                </p>
              )}
            </div>
          </Card>

          <Card className="flex flex-col gap-4 p-5">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h2 className="text-lg font-semibold">Recent sessions</h2>
                <p className="text-sm text-muted-foreground">Latest attendance activity.</p>
              </div>
              <Badge variant="secondary" className="rounded-full bg-primary/10 text-primary">
                {sessions.length}
              </Badge>
            </div>
            <div className="space-y-3">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, idx) => <Skeleton key={`session-skel-${idx}`} className="h-4 w-full" />)
              ) : sessions.length ? (
                sessions.map((session) => (
                  <div key={session.sessionId} className="rounded-xl border px-3 py-2 text-sm">
                    <p className="font-semibold text-foreground">Session #{session.sessionId.slice(0, 8)}</p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Created {formatDate(session.createdAt)}</span>
                      <span className={session.isActive ? "text-success" : "text-muted-foreground"}>
                        {session.isActive ? "Active" : "Closed"}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">Expires {formatDate(session.expiresAt)}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No sessions recorded yet.</p>
              )}
            </div>
          </Card>
        </div>

        <Card className="p-5">
          <div className="flex items-center gap-3 border-b pb-3">
            <Users className="h-5 w-5 text-primary" />
            <div>
              <h2 className="text-lg font-semibold">Roster preview</h2>
              <p className="text-sm text-muted-foreground">Imported entries & pending verifications.</p>
            </div>
          </div>
          {isLoading ? (
            <div className="mt-4 space-y-2">
              {Array.from({ length: 5 }).map((_, idx) => (
                <Skeleton key={`roster-skel-${idx}`} className="h-4 w-full" />
              ))}
            </div>
          ) : rosterEntries.length ? (
            <>
              <div className="mt-4 overflow-hidden rounded-xl border">
                <table className="w-full text-left text-sm">
                  <thead className="bg-muted/60 text-muted-foreground">
                    <tr>
                      <th className="px-4 py-2 font-medium">Full name</th>
                      <th className="px-4 py-2 font-medium">GTU ID</th>
                      <th className="px-4 py-2 font-medium">Imported</th>
                      <th className="px-4 py-2 font-medium text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rosterEntries.slice(0, 8).map((entry) => {
                      const isEnrolled = enrolledStudentIds.has(entry.gtuStudentId?.trim().toLowerCase());
                      return (
                        <tr key={entry.rosterId} className="border-t">
                          <td className="px-4 py-2">{entry.fullName}</td>
                          <td className="px-4 py-2 text-muted-foreground">{entry.gtuStudentId}</td>
                          <td className="px-4 py-2 text-muted-foreground">{formatDate(entry.importedAt)}</td>
                          <td className="px-4 py-2 text-center">
                            {isEnrolled ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-3 py-1 text-xs text-success">
                                <CheckCircle2 className="h-3 w-3" />
                                Enrolled
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                                <Clock3 className="h-3 w-3" />
                                Pending
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {rosterEntries.length > 8 && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Showing 8 of {rosterEntries.length}. Use roster tools for the full list.
                </p>
              )}
            </>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">No roster entries imported yet.</p>
          )}
        </Card>
      </div>
    </div>
  );
}
