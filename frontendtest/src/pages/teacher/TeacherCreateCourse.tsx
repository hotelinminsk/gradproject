import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2, UploadCloud, CheckCircle2, FileText } from "lucide-react";
import { toast } from "sonner";
import { useCreateCourse, useUploadRosterBulk } from "@/hooks/teacher";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import * as XLSX from "xlsx";
import type { RosterStudentRow } from "@/types/course";
import { cn } from "@/lib/utils";

const rosterTemplateUrl = "/roster-template.csv";

const TeacherCreateCourse = () => {
  const navigate = useNavigate();
  const [createdCourseId, setCreatedCourseId] = useState<string | null>(null);
  const [createdCourseCode, setCreatedCourseCode] = useState<string>("");
  const [justSubmitted, setJustSubmitted] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [rosterFile, setRosterFile] = useState<File | null>(null);
  const [parsedStudents, setParsedStudents] = useState<RosterStudentRow[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const createCourse = useCreateCourse();
  const uploadRoster = useUploadRosterBulk(createdCourseId ?? undefined);

  const [courseForm, setCourseForm] = useState({
    courseName: "",
    courseCode: "",
    description: "",
    maxStudents: "",
    scheduleNotes: "",
    firstSessionAt: "",
  });

  const [schedules, setSchedules] = useState<any[]>([]);

  const handleCourseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createCourse.mutate(
      {
        courseName: courseForm.courseName,
        courseCode: courseForm.courseCode,
        description: courseForm.description,
        schedules: schedules,
        firstSessionAt: courseForm.firstSessionAt ? new Date(courseForm.firstSessionAt).toISOString() : undefined,
      },
      {
        onSuccess: (data) => {
          setCreatedCourseId(data.courseId);
          setCreatedCourseCode(courseForm.courseCode);
          setJustSubmitted(true);
          toast.success("Course created. Continue with roster import.");
          setTimeout(() => setJustSubmitted(false), 1400);
          setDialogOpen(true);
        },
        onError: (err) => toast.error(err.message),
      }
    );
  };

  const handleRosterUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!createdCourseId || parsedStudents.length === 0) return;
    uploadRoster.mutate(parsedStudents, {
      onSuccess: () => {
        toast.success("Roster uploaded");
        navigate(`/teacher/courses/${createdCourseId}`);
      },
      onError: (err) => toast.error(err.message),
    });
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

  const parseRosterFile = async (file: File): Promise<RosterStudentRow[]> => {
    const ext = file.name.toLowerCase();
    if (ext.endsWith(".csv")) {
      const text = await file.text();
      const rows = text.split(/\r?\n/).filter(Boolean);
      const [, ...dataRows] = rows; // skip header
      return dataRows
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
      resolvedGtuIdIndex = 1; // column B
      resolvedFullNameIndex = 2; // column C
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
  };

  const handleFile = useCallback(
    async (file: File | null) => {
      if (!file) return;
      try {
        setParseError(null);
        setRosterFile(file);
        const parsed = await parseRosterFile(file);
        if (!parsed.length) {
          setParseError("Could not find any rows with FullName and GtuStudentId.");
        }
        setParsedStudents(parsed);
      } catch (err) {
        console.error(err);
        setParseError("Failed to read the file. Please use CSV or Excel.");
        setParsedStudents([]);
      }
    },
    []
  );

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    handleFile(file ?? null);
  };

  return (
    <div className="space-y-10" >
      <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-background border-none shadow-none p-6">
        <div className="grid gap-6 lg:grid-cols-[2fr_1fr] items-center">
          <div className="space-y-3">
            <h1 className="text-3xl font-bold">Create a New Course</h1>
            <p className="text-sm text-muted-foreground">
              Set up the essentials, preview the first session, and be ready to invite students immediately.
            </p>
            <div className="flex flex-wrap gap-3 text-xs uppercase tracking-wide text-muted-foreground">
              <span className="rounded-full bg-background px-3 py-1">Step 1 · Details</span>
              <span className="rounded-full bg-background px-3 py-1">Step 2 · Roster</span>
              <span className="rounded-full bg-background px-3 py-1">Step 3 · Manage</span>
            </div>
          </div>
          <Card className="p-5 shadow-sm bg-background">
            <div className="flex items-start gap-3">
              <FileText className="h-6 w-6 text-primary" />
              <div className="space-y-1 text-sm">
                <p className="font-semibold text-foreground">What happens next?</p>
                <ul className="space-y-1 text-muted-foreground list-disc list-inside">
                  <li>Upload roster or share invite token</li>
                  <li>Schedule sessions & generate QR codes</li>
                  <li>Track attendance & reports</li>
                </ul>
              </div>
            </div>
          </Card>
        </div>
      </Card>

      <Card className="p-6 space-y-6">
        <form className="space-y-6" onSubmit={handleCourseSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="courseName">Course Name</Label>
              <Input
                id="courseName"
                placeholder="Advanced Web Technologies"
                value={courseForm.courseName}
                onChange={(e) => setCourseForm({ ...courseForm, courseName: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="courseCode">Course Code</Label>
              <Input
                id="courseCode"
                placeholder="CSE401"
                value={courseForm.courseCode}
                onChange={(e) => setCourseForm({ ...courseForm, courseCode: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="maxStudents">Max Students (optional)</Label>
              <Input
                id="maxStudents"
                type="number"
                placeholder="60"
                value={courseForm.maxStudents}
                onChange={(e) => setCourseForm({ ...courseForm, maxStudents: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="scheduleNotes">Schedule Notes</Label>
              <Input
                id="scheduleNotes"
                placeholder="Mon/Wed 10:00 AM • Room A-203"
                value={courseForm.scheduleNotes}
                onChange={(e) => setCourseForm({ ...courseForm, scheduleNotes: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="firstSessionAt">First Session Date & Time</Label>
            <Input
              id="firstSessionAt"
              type="datetime-local"
              value={courseForm.firstSessionAt}
              onChange={(e) => setCourseForm({ ...courseForm, firstSessionAt: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              Opsiyonel: öğrenciler dersin ne zaman başlayacağını görür.
            </p>
          </div>

          <div className="space-y-3">
            <Label>Haftalık Program</Label>
            <div className="rounded-lg border p-4 space-y-4">
              <div className="flex flex-wrap gap-2 items-end">
                <div className="grid gap-1.5">
                  <Label className="text-xs">Gün</Label>
                  <select
                    className="flex h-9 w-32 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    id="schedule-day"
                  >
                    <option value="1">Pazartesi</option>
                    <option value="2">Salı</option>
                    <option value="3">Çarşamba</option>
                    <option value="4">Perşembe</option>
                    <option value="5">Cuma</option>
                    <option value="6">Cumartesi</option>
                    <option value="0">Pazar</option>
                  </select>
                </div>
                <div className="grid gap-1.5">
                  <Label className="text-xs">Başlangıç</Label>
                  <Input type="time" id="schedule-start" className="h-9" defaultValue="09:00" />
                </div>
                <div className="grid gap-1.5">
                  <Label className="text-xs">Bitiş</Label>
                  <Input type="time" id="schedule-end" className="h-9" defaultValue="10:00" />
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  className="h-9"
                  onClick={() => {
                    const dayEl = document.getElementById("schedule-day") as HTMLSelectElement;
                    const startEl = document.getElementById("schedule-start") as HTMLInputElement;
                    const endEl = document.getElementById("schedule-end") as HTMLInputElement;

                    if (!dayEl || !startEl || !endEl) return;

                    const newSchedule = {
                      dayOfWeek: parseInt(dayEl.value),
                      startTime: startEl.value + ":00",
                      endTime: endEl.value + ":00"
                    };
                    setSchedules(prev => [...prev, newSchedule]);
                  }}
                >
                  Ekle
                </Button>
              </div>

              {schedules.length > 0 ? (
                <div className="grid gap-2">
                  {schedules.map((s, idx) => (
                    <div key={idx} className="flex items-center justify-between rounded-md border bg-muted/40 px-3 py-2 text-sm">
                      <span>
                        {["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"][s.dayOfWeek]} • {s.startTime.slice(0, 5)} - {s.endTime.slice(0, 5)}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => setSchedules(prev => prev.filter((_, i) => i !== idx))}
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">Henüz program eklenmedi.</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              rows={4}
              placeholder="Briefly describe the course objectives."
              value={courseForm.description}
              onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => navigate(-1)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createCourse.isPending || justSubmitted}
              className={`bg-primary text-white hover:bg-primary/90 ${justSubmitted ? "bg-emerald-600 hover:bg-emerald-600" : ""
                }`}
            >
              {createCourse.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {justSubmitted ? (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Created
                </>
              ) : (
                "Create Course"
              )}
            </Button>
          </div>
        </form>
      </Card>

      <Card className="p-6 space-y-5 relative">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Step 2 · Enrollment</p>
            <h2 className="text-xl font-semibold">Upload roster & preview students</h2>
            <p className="text-sm text-muted-foreground">
              Works with the standard OBS export (<code>Öğrenci No</code> + <code>Adı Soyadı</code>) or our template.
            </p>
          </div>
          <Button variant="outline" className="px-4" asChild>
            <a href={rosterTemplateUrl} download>
              Download template
            </a>
          </Button>
        </div>

        <form className="space-y-5" onSubmit={handleRosterUpload}>
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1.2fr),minmax(0,0.8fr)]">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (!createdCourseId) return;
                setIsDragging(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsDragging(false);
              }}
              onDrop={handleDrop}
              className={cn(
                "relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed bg-muted/30 p-6 text-center transition",
                isDragging ? "border-primary bg-primary/10" : "border-border/60",
                !createdCourseId && "opacity-50 pointer-events-none",
              )}
            >
              <div className="space-y-3">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <UploadCloud className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-semibold">Drop roster here</p>
                  <p className="text-sm text-muted-foreground">
                    Supports CSV, XLS, XLSX. We only send parsed student data to the server.
                  </p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
                  <label className="inline-flex cursor-pointer items-center justify-center rounded-full bg-background px-4 py-2 text-sm font-medium shadow-sm transition hover:bg-muted">
                    <input
                      type="file"
                      accept=".csv,.xlsx,.xls"
                      className="hidden"
                      disabled={!createdCourseId}
                      onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
                    />
                    Browse files
                  </label>
                  {rosterFile && (
                    <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                      {rosterFile.name}
                    </span>
                  )}
                </div>
                {parseError && <p className="text-xs text-destructive">{parseError}</p>}
              </div>
            </div>

            <div className="rounded-2xl border bg-card/80 p-5 shadow-inner">
              <p className="text-sm font-semibold">Upload checklist</p>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li>• Column order: <strong>Öğrenci No</strong>, <strong>Adı Soyadı</strong></li>
                <li>• Remove header rows you don’t want included.</li>
                <li>• We’ll show a preview before any data is saved.</li>
              </ul>
              <div className="mt-4 rounded-xl border border-dashed border-border/60 bg-background p-4 text-xs text-muted-foreground">
                <p className="font-medium text-foreground">Status</p>
                <div className="mt-2 grid gap-2">
                  <div className="flex items-center justify-between">
                    <span>File</span>
                    <span className="font-semibold">{rosterFile ? rosterFile.name : "Not selected"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Parsed rows</span>
                    <span className="font-semibold">{parsedStudents.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Course linked</span>
                    <span className="font-semibold">{createdCourseId ? "Ready" : "Pending"}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {parsedStudents.length > 0 && (
            <div className="rounded-2xl border bg-background/60 shadow-sm">
              <div className="flex items-center justify-between border-b px-4 py-3">
                <div>
                  <p className="text-sm font-semibold">Preview</p>
                  <p className="text-xs text-muted-foreground">First {Math.min(parsedStudents.length, 6)} students</p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    setRosterFile(null);
                    setParsedStudents([]);
                    setParseError(null);
                  }}
                >
                  Clear list
                </Button>
              </div>
              <div className="overflow-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-muted/70 text-muted-foreground">
                    <tr>
                      <th className="px-4 py-2 font-medium">Full Name</th>
                      <th className="px-4 py-2 font-medium">Gtu ID</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedStudents.slice(0, 6).map((student, idx) => (
                      <tr key={`${student.fullName}-${idx}`} className="border-t">
                        <td className="px-4 py-2">{student.fullName}</td>
                        <td className="px-4 py-2">{student.gtuStudentId}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {parsedStudents.length > 6 && (
                <p className="px-4 py-2 text-xs text-muted-foreground">
                  Showing first 6 of {parsedStudents.length} students.
                </p>
              )}
            </div>
          )}

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <p className="text-xs text-muted-foreground">
              You can always edit roster entries from the course management screen after upload.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                className="border-dashed border-border/60 bg-background/80"
                disabled={!rosterFile}
                onClick={() => {
                  setRosterFile(null);
                  setParsedStudents([]);
                  setParseError(null);
                }}
              >
                Re-upload file
              </Button>
              <Button
                type="submit"
                className="bg-primary text-primary-foreground hover:bg-primary/90"
                disabled={!createdCourseId || !parsedStudents.length || uploadRoster.isPending}
              >
                {uploadRoster.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Upload roster
              </Button>
            </div>
          </div>
        </form>

        {!createdCourseId && (
          <div className="absolute inset-0 rounded-xl bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center text-center px-6">
            <p className="text-sm font-medium text-muted-foreground">Create the course to unlock roster import.</p>
          </div>
        )}
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Course Created</DialogTitle>
            <DialogDescription>
              {createdCourseCode} is live. You can invite students or manage roster from the course page.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 text-sm">
            <p>
              <span className="font-semibold">Course Code:</span> {createdCourseCode}
            </p>
            <p>
              <span className="font-semibold">Course ID:</span> {createdCourseId}
            </p>
          </div>
          <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Create Another
            </Button>
            <Button onClick={() => navigate(`/teacher/courses/${createdCourseId}`)}>
              Go to Course
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div >
  );
};

export default TeacherCreateCourse;
