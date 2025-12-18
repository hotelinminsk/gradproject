import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTeacherCourse, useCreateSession } from "@/hooks/teacher";
import { CalendarClock, ShieldCheck, ArrowLeft, QrCode } from "lucide-react";
import { toast } from "sonner";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
// Leaflet marker fix
import L from "leaflet";
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

const defaultDistance = 50;
const defaultDurationMinutes = 15;
const GTU_CENTER = [40.806, 29.355] as [number, number]; // Gebze Technical University

function LocationMarker({ position, setPosition }: { position: [number, number] | null, setPosition: (pos: [number, number]) => void }) {
  const map = useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });

  return position ? <Marker position={position} /> : null;
}

export default function TeacherCreateSession() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { data: course, isLoading, isError } = useTeacherCourse(courseId);
  const createSession = useCreateSession();

  const [form, setForm] = useState({
    latitude: 0,
    longitude: 0,
    expiresAt: "",
    qrValidity: "5" // Default 5 seconds
  });

  const [mapPosition, setMapPosition] = useState<[number, number] | null>(null);

  const isReady = useMemo(() => {
    return Boolean(mapPosition && form.expiresAt);
  }, [mapPosition, form.expiresAt]);

  useEffect(() => {
    if (!form.expiresAt) {
      const defaultDate = new Date(Date.now() + defaultDurationMinutes * 60 * 1000);
      const localIso = new Date(defaultDate.getTime() - defaultDate.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
      setForm((prev) => ({ ...prev, expiresAt: localIso }));
    }
  }, [form.expiresAt]);

  useEffect(() => {
    if (mapPosition) {
      setForm(prev => ({ ...prev, latitude: mapPosition[0], longitude: mapPosition[1] }));
    }
  }, [mapPosition]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseId) return;
    if (!isReady) {
      toast.error("Please select a location on the map.");
      return;
    }
    const expiresAtUtc = new Date(form.expiresAt);
    const payload = {
      courseId,
      teacherLatitude: form.latitude,
      teacherLongitude: form.longitude,
      maxDistanceMeters: defaultDistance, // Fixed
      expiresAtUtc: expiresAtUtc.toISOString(),
      qrCodeValiditySeconds: Number(form.qrValidity)
    };
    createSession.mutate(payload, {
      onSuccess: (res) => {
        toast.success("Attendance session created.");
        navigate(`/teacher/session/${res.sessionId}`, { state: { qrToken: res.qrToken } });
      },
    });
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-12">
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

      <Card className="p-6 space-y-4 shadow-sm border-slate-200">
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
              <Badge variant="secondary" className="flex items-center gap-1 bg-emerald-50 text-emerald-700">
                <ShieldCheck className="h-3 w-3" />
                Geofence Active ({defaultDistance}m)
              </Badge>
            </div>
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map Section */}
        <Card className="lg:col-span-2 overflow-hidden shadow-sm border-slate-200 h-[500px] relative z-0">
          <div className="absolute top-4 left-4 z-[999] bg-white/90 backdrop-blur px-3 py-1.5 rounded-md shadow-md text-xs font-semibold text-slate-700 pointer-events-none">
            📍 Click on the map to set session location
          </div>
          <MapContainer center={GTU_CENTER} zoom={15} scrollWheelZoom={true} className="h-full w-full">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <LocationMarker position={mapPosition} setPosition={setMapPosition} />
          </MapContainer>
        </Card>

        {/* Configuration Section */}
        <Card className="p-6 h-fit shadow-sm border-slate-200">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="expiresAt">Session Duration</Label>
                <Input
                  id="expiresAt"
                  type="datetime-local"
                  value={form.expiresAt}
                  onChange={(e) => setForm((prev) => ({ ...prev, expiresAt: e.target.value }))}
                  required
                />
                <p className="text-xs text-muted-foreground">Session will automatically close at this time.</p>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <QrCode className="w-4 h-4 text-indigo-600" />
                  QR Refresh Interval
                </Label>
                <Select
                  value={form.qrValidity}
                  onValueChange={(val) => setForm((prev) => ({ ...prev, qrValidity: val }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select interval" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3 Seconds (High Security)</SelectItem>
                    <SelectItem value="5">5 Seconds (Balanced)</SelectItem>
                    <SelectItem value="10">10 Seconds (Standard)</SelectItem>
                    <SelectItem value="15">15 Seconds (Relaxed)</SelectItem>
                    <SelectItem value="30">30 Seconds (Slow)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Prevents QR sharing screenshots.</p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex flex-col gap-3">
              <Button
                type="submit"
                size="lg"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-lg shadow-indigo-500/20"
                disabled={createSession.isPending || !isReady}
              >
                {createSession.isPending ? "Creating..." : "Start Session"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => navigate(-1)}
                className="w-full"
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
