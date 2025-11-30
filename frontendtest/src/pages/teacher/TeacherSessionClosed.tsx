import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarClock, Clock3, Users, ArrowLeft } from "lucide-react";
import { useSessionDetail } from "@/hooks/teacher";
import { formatDistanceToNow } from "date-fns";

export default function TeacherSessionClosed() {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  const { data: detail, isLoading } = useSessionDetail(sessionId);
  const attendees = detail?.attendees ?? [];

  const expiresDate = useMemo(() => {
    if (!detail?.expiresAt) return null;
    const raw = detail.expiresAt;
    return new Date(raw.endsWith("Z") ? raw : `${raw}Z`);
  }, [detail?.expiresAt]);

  const createdDate = useMemo(() => {
    if (!detail?.createdAt) return null;
    const raw = detail.createdAt;
    return new Date(raw.endsWith("Z") ? raw : `${raw}Z`);
  }, [detail?.createdAt]);

  const expiresLabel = expiresDate ? formatDistanceToNow(expiresDate, { addSuffix: true }) : "—";

  if (!sessionId) {
    return (
      <div className="p-6">
        <p className="text-sm text-muted-foreground">Session id missing in URL.</p>
      </div>
    );
  }

  return (
    <div className="relative mx-auto max-w-6xl space-y-6 p-4 md:p-6">
      <div className="pointer-events-none absolute inset-x-0 top-10 h-56 bg-gradient-to-r from-primary/5 via-accent/10 to-transparent blur-3xl" />
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Attendance</p>
          <h1 className="text-3xl font-bold">Session Summary</h1>
          <p className="text-sm text-muted-foreground">Session ID: {sessionId}</p>
        </div>
        <Button
          variant="outline"
          className="border-border text-foreground hover:bg-primary/10 hover:text-primary"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </div>

      <Card className="relative overflow-hidden border-primary/10 shadow-lg shadow-primary/5 p-5 space-y-4">
        <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-primary/10 blur-2xl" />
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Session ended</h2>
            <p className="text-sm text-muted-foreground">QR is disabled. Review the details below.</p>
          </div>
          <Badge className="bg-destructive/10 text-destructive">Closed</Badge>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border bg-muted/40 p-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Attendees</p>
            <p className="text-2xl font-semibold text-foreground flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" /> {attendees.length}
            </p>
          </div>
          <div className="rounded-xl border bg-muted/40 p-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Expired</p>
            <p className="text-sm font-medium text-foreground flex items-center gap-2">
              <Clock3 className="h-4 w-4 text-primary" /> {expiresLabel}
            </p>
          </div>
          <div className="rounded-xl border bg-muted/40 p-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Created</p>
            <p className="text-sm font-medium text-foreground flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-primary" />
              {createdDate ? createdDate.toLocaleString() : "—"}
            </p>
          </div>
        </div>
      </Card>

      <Card className="p-5 border-border/80 shadow-sm">
        <div className="flex items-center justify-between border-b pb-3">
          <div>
            <h2 className="text-lg font-semibold">Checked-in students</h2>
            <p className="text-sm text-muted-foreground">Attendee list for this session.</p>
          </div>
          <Badge variant="secondary" className="bg-primary/10 text-primary">
            {attendees.length}
          </Badge>
        </div>
        {isLoading ? (
          <div className="space-y-2 py-4">
            {Array.from({ length: 5 }).map((_, idx) => (
              <Skeleton key={`attendee-skel-${idx}`} className="h-4 w-full" />
            ))}
          </div>
        ) : attendees.length ? (
          <div className="mt-4 overflow-hidden rounded-xl border">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/60 text-muted-foreground">
                <tr>
                  <th className="px-4 py-2 font-medium">Name</th>
                  <th className="px-4 py-2 font-medium">GTU ID</th>
                  <th className="px-4 py-2 font-medium">Checked in</th>
                  <th className="px-4 py-2 font-medium text-right">Distance</th>
                </tr>
              </thead>
              <tbody>
                {attendees.map((attendee) => (
                  <tr key={`${attendee.gtuStudentId}-${attendee.checkedInAtUtc}`} className="border-t">
                    <td className="px-4 py-2">{attendee.fullName}</td>
                    <td className="px-4 py-2 text-muted-foreground">{attendee.gtuStudentId}</td>
                    <td className="px-4 py-2 text-muted-foreground">
                      {new Date(attendee.checkedInAtUtc).toLocaleString()}
                    </td>
                    <td className="px-4 py-2 text-right text-muted-foreground">
                      {attendee.distanceMeters ? `${Math.round(attendee.distanceMeters)} m` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="py-4 text-sm text-muted-foreground">No check-ins recorded.</p>
        )}
      </Card>
    </div>
  );
}
