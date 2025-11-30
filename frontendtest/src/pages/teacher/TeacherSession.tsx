import { useMemo, useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useSessionDetail, useSessionQrPoll, useCloseSession } from "@/hooks/teacher";
import { CalendarClock, Clock3, Link2, Users, ArrowLeft, Maximize } from "lucide-react";
import QRCodeDisplay from "@/components/shared/QRCodeDisplay";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

export default function TeacherSession() {
  const { sessionId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const qrTokenFromCreate = (location.state as { qrToken?: string } | null)?.qrToken;
  const { data: detail, isLoading: detailLoading } = useSessionDetail(sessionId);
  const isActive = detail?.isActive ?? true;
  const { data: qrPoll, isLoading: qrLoading } = useSessionQrPoll(sessionId, isActive);
  const closeSession = useCloseSession();

  // If the session is closed but user is on the live page, redirect to the closed detail page.
  useEffect(() => {
    if (!detailLoading && sessionId && !isActive) {
      navigate(`/teacher/session/${sessionId}/closed`, { replace: true });
    }
  }, [detailLoading, isActive, navigate, sessionId]);

  const qrValue = qrPoll?.code ?? qrTokenFromCreate ?? "";
  const countdown = qrPoll?.expiresInSeconds ?? null;
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

  const handleCopyCode = () => {
    if (!qrValue) return;
    navigator.clipboard.writeText(qrValue);
    toast.success("QR code copied.");
  };

  if (!sessionId) {
    return (
      <div className="p-6">
        <p className="text-sm text-muted-foreground">Session id missing in URL.</p>
      </div>
    );
  }

  const header = (
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Attendance</p>
        <h1 className="text-3xl font-bold">{isActive ? "Live Session" : "Session Details"}</h1>
        <p className="text-sm text-muted-foreground">Session ID: {sessionId}</p>
      </div>
      <div className="flex gap-2">
        <Button
          variant="outline"
          className="border-border text-foreground hover:bg-primary/10 hover:text-primary"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        {isActive && (
          <Button
            variant="outline"
            className="border-destructive text-destructive hover:bg-destructive/10"
            disabled={closeSession.isPending}
            onClick={() => sessionId && closeSession.mutate(sessionId)}
          >
            {closeSession.isPending ? "Ending…" : "End session"}
          </Button>
        )}
      </div>
    </div>
  );

  if (!isActive) {
    return (
      <div className="mx-auto max-w-5xl space-y-6 p-4 md:p-6">
        {header}
        <Card className="p-5 space-y-4 border-dashed">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Session ended</h2>
              <p className="text-sm text-muted-foreground">QR is disabled. Review attendees below.</p>
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
        <Card className="p-5">
          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <h2 className="text-lg font-semibold">Checked-in students</h2>
              <p className="text-sm text-muted-foreground">Attendee list for this session.</p>
            </div>
            <Badge variant="secondary" className="bg-primary/10 text-primary">
              {attendees.length}
            </Badge>
          </div>
          {detailLoading ? (
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

  return (
    <div className="mx-auto max-w-6xl space-y-8 p-4 md:p-6">
      {header}

      <div className="grid gap-4 lg:grid-cols-[2fr,1fr]">
        <Card className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Rotating QR</h2>
              <p className="text-sm text-muted-foreground">
                Refreshes automatically. Project this or open full screen for students to check in.
              </p>
            </div>
            <Badge variant="secondary" className="bg-primary/10 text-primary">
              {countdown !== null ? `Next in ${countdown}s` : "Polling…"}
            </Badge>
          </div>
          <div className="flex flex-col items-center gap-3 rounded-2xl border bg-background/80 p-4">
            {qrLoading ? (
              <Skeleton className="h-64 w-64" />
            ) : qrValue ? (
              <div className="flex flex-col items-center gap-3">
                <QRCodeDisplay code={qrValue} size={240} />
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="border-border text-foreground hover:bg-primary/10 hover:text-primary"
                    >
                      <Maximize className="mr-2 h-4 w-4" />
                      Full screen
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[520px]">
                    <DialogHeader>
                      <DialogTitle>Scan to check in</DialogTitle>
                    </DialogHeader>
                    <div className="flex justify-center py-4">
                      <QRCodeDisplay code={qrValue} size={360} />
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Waiting for QR code…</p>
            )}
            <div className="flex flex-wrap justify-center gap-2">
              <Button
                variant="outline"
                className="border-border text-foreground hover:bg-primary/10 hover:text-primary"
                onClick={handleCopyCode}
                disabled={!qrValue}
              >
                <Link2 className="mr-2 h-4 w-4" />
                Copy code
              </Button>
            </div>
          </div>
        </Card>

        <Card className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Session status</h2>
            <Badge className="bg-primary text-primary-foreground">Active</Badge>
          </div>
          <div className="grid gap-3">
            <div className="rounded-xl border bg-muted/40 p-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Attendees</p>
              <p className="text-2xl font-semibold text-foreground flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" /> {attendees.length}
              </p>
            </div>
            <div className="rounded-xl border bg-muted/40 p-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Expires</p>
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
      </div>

      <Card className="p-5">
        <div className="flex items-center justify-between border-b pb-3">
          <div>
            <h2 className="text-lg font-semibold">Checked-in students</h2>
            <p className="text-sm text-muted-foreground">Live attendee list for this session.</p>
          </div>
          <Badge variant="secondary" className="bg-primary/10 text-primary">
            {attendees.length}
          </Badge>
        </div>
        {detailLoading ? (
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
          <p className="py-4 text-sm text-muted-foreground">No check-ins yet.</p>
        )}
      </Card>
    </div>
  );
}
