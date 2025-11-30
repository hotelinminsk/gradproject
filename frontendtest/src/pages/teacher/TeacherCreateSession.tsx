import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useTeacherCourse, useCreateSession } from "@/hooks/teacher";
import { CalendarClock, MapPin, Radar, ShieldCheck, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

const defaultDistance = 50;
const defaultDurationMinutes = 15;

export default function TeacherCreateSession() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { data: course, isLoading, isError } = useTeacherCourse(courseId);
  const createSession = useCreateSession();

  const [form, setForm] = useState({
    latitude: "",
    longitude: "",
    maxDistance: defaultDistance.toString(),
    expiresAt: "",
  });

  const isReady = useMemo(() => {
    return Boolean(form.latitude && form.longitude && form.maxDistance && form.expiresAt);
  }, [form]);

  useEffect(() => {
    if (!form.expiresAt) {
      const defaultDate = new Date(Date.now() + defaultDurationMinutes * 60 * 1000);
      const localIso = new Date(defaultDate.getTime() - defaultDate.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
      setForm((prev) => ({ ...prev, expiresAt: localIso }));
    }
  }, [form.expiresAt]);

  const handleGeolocate = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported in this browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((prev) => ({
          ...prev,
          latitude: pos.coords.latitude.toFixed(6),
          longitude: pos.coords.longitude.toFixed(6),
        }));
        toast.success("Location captured.");
      },
      () => toast.error("Unable to retrieve location."),
      { enableHighAccuracy: true, timeout: 8000 },
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseId) return;
    if (!isReady) {
      toast.error("Fill all required fields.");
      return;
    }
    const expiresAtUtc = new Date(form.expiresAt);
    const payload = {
      courseId,
      teacherLatitude: Number(form.latitude),
      teacherLongitude: Number(form.longitude),
      maxDistanceMeters: Number(form.maxDistance),
      expiresAtUtc: expiresAtUtc.toISOString(),
    };
    createSession.mutate(payload, {
      onSuccess: (res) => {
        toast.success("Attendance session created.");
        navigate(`/teacher/session/${res.sessionId}`, { state: { qrToken: res.qrToken } });
      },
    });
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Attendance</p>
          <h1 className="text-3xl font-bold">Create Session</h1>
        </div>
        <Button
          variant="outline"
          onClick={() => navigate(-1)}
          className="border-border text-foreground hover:bg-primary/5 hover:text-primary"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </div>

      <Card className="p-6 space-y-4">
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-48" />
          </div>
        ) : isError || !course ? (
          <p className="text-sm text-destructive">Course could not be loaded.</p>
        ) : (
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="text-sm text-muted-foreground">Course</p>
              <p className="text-xl font-semibold">{course.courseName}</p>
              <p className="text-sm text-muted-foreground">{course.courseCode}</p>
            </div>
              <div className="flex gap-2">
                <Badge variant="secondary" className="flex items-center gap-1 bg-primary/10 text-primary">
                  <CalendarClock className="h-3 w-3" />
                  Last session: {course.sessions?.[0]?.createdAt ? new Date(course.sessions[0].createdAt).toLocaleString() : "—"}
                </Badge>
                <Badge variant="secondary" className="flex items-center gap-1 bg-primary/10 text-primary">
                  <ShieldCheck className="h-3 w-3" />
                  Geofence {form.maxDistance || defaultDistance}m
                </Badge>
              </div>
            </div>
        )}
      </Card>

      <Card className="p-6 space-y-5">
        <form className="grid gap-5 md:grid-cols-2" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="latitude">Teacher latitude</Label>
            <div className="flex gap-2">
              <Input
                id="latitude"
                value={form.latitude}
                onChange={(e) => setForm((prev) => ({ ...prev, latitude: e.target.value }))}
                placeholder="e.g., 40.741"
                required
              />
              <Button
                type="button"
                variant="outline"
                className="border-border text-foreground hover:bg-primary/10 hover:text-primary"
                onClick={handleGeolocate}
              >
                <MapPin className="h-4 w-4 mr-1" />
                Use GPS
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="longitude">Teacher longitude</Label>
            <Input
              id="longitude"
              value={form.longitude}
              onChange={(e) => setForm((prev) => ({ ...prev, longitude: e.target.value }))}
              placeholder="e.g., 29.004"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="maxDistance">Max distance (meters)</Label>
            <Input
              id="maxDistance"
              type="number"
              min={1}
              value={form.maxDistance}
              onChange={(e) => setForm((prev) => ({ ...prev, maxDistance: e.target.value }))}
              placeholder="50"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="expiresAt">Expires at</Label>
            <Input
              id="expiresAt"
              type="datetime-local"
              value={form.expiresAt}
              onChange={(e) => setForm((prev) => ({ ...prev, expiresAt: e.target.value }))}
              required
            />
            <p className="text-xs text-muted-foreground">Default is {defaultDurationMinutes} minutes from now.</p>
          </div>
          <div className="md:col-span-2 flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              className="text-muted-foreground hover:bg-muted/80 hover:text-foreground"
              onClick={() => navigate(-1)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
              disabled={createSession.isPending || !isReady}
            >
              {createSession.isPending ? (
                <>
                  <Radar className="mr-2 h-4 w-4 animate-spin" />
                  Creating…
                </>
              ) : (
                "Create session"
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
