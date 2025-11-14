import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2, UploadCloud } from "lucide-react";

const TeacherCreateCourse = () => {
  const navigate = useNavigate();
  const [courseForm, setCourseForm] = useState({
    courseName: "",
    courseCode: "",
    description: "",
    maxStudents: "",
    scheduleNotes: "",
  });
  const [rosterFile, setRosterFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingRoster, setIsUploadingRoster] = useState(false);

  const handleCourseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: call create course mutation
    setIsSubmitting(true);
    // simulate
    setTimeout(() => {
      setIsSubmitting(false);
    }, 800);
  };

  const handleRosterUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rosterFile) return;
    setIsUploadingRoster(true);
    // TODO: call roster upload mutation
    setTimeout(() => {
      setIsUploadingRoster(false);
    }, 800);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Create Course</h1>
          <p className="text-muted-foreground">Set up course details and import your roster.</p>
        </div>
        <Button variant="outline" onClick={() => navigate(-1)}>
          Cancel
        </Button>
      </div>

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
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Course
            </Button>
          </div>
        </form>
      </Card>

      <Card className="p-6 space-y-4">
        <div>
          <h2 className="text-xl font-semibold">Upload Roster</h2>
          <p className="text-sm text-muted-foreground">
            Upload a CSV or XLSX with columns <code>FullName</code> and <code>GtuStudentId</code>.
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleRosterUpload}>
          <div className="flex flex-col gap-2 md:flex-row md:items-center">
            <Input
              type="file"
              accept=".csv,.xlsx"
              onChange={(e) => setRosterFile(e.target.files?.[0] ?? null)}
            />
            <Button
              type="submit"
              className="flex items-center gap-2"
              disabled={!rosterFile || isUploadingRoster}
            >
              {isUploadingRoster ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <UploadCloud className="h-4 w-4" />
              )}
              Upload Roster
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Need a template? <span className="text-primary cursor-pointer">Download sample CSV</span>
          </p>
        </form>
      </Card>
    </div>
  );
};

export default TeacherCreateCourse;
