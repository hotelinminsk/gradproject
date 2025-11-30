import { useMemo, useState } from "react";
import { useTeacherSessions, useActiveSession } from "@/hooks/teacher";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarClock, Clock3, Users, Filter } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";

const TeacherSessions = () => {
  const navigate = useNavigate();
  const { data: sessions = [], isLoading } = useTeacherSessions();
  const [courseFilter, setCourseFilter] = useState("");

  const parseUtc = (value?: string) => {
    if (!value) return null;
    const raw = value.endsWith("Z") ? value : `${value}Z`;
    const date = new Date(raw);
    return Number.isNaN(date.getTime()) ? null : date;
  };

  const courseOptions = useMemo(() => {
    const set = new Set<string>();
    sessions.forEach((s) => {
      if (s.courseCode) {
        set.add(s.courseCode);
      } else if (s.courseName) {
        set.add(s.courseName);
      }
    });
    return Array.from(set);
  }, [sessions]);

  const filtered = useMemo(() => {
    if (!courseFilter.trim()) return sessions;
    const term = courseFilter.toLowerCase();
    return sessions.filter((s) => {
      const code = (s.courseCode ?? "").toLowerCase();
      const name = (s.courseName ?? "").toLowerCase();
      return code.includes(term) || name.includes(term);
    });
  }, [sessions, courseFilter]);

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Attendance</p>
          <h1 className="text-3xl font-bold">Sessions</h1>
          <p className="text-sm text-muted-foreground">Manage and monitor all sessions you've created.</p>
        </div>
      </div>

      <Card className="p-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Filter className="h-4 w-4" />
          <span className="text-sm">Filter by course code or name</span>
        </div>
        <Input
          placeholder="Type course code or name"
          value={courseFilter}
          onChange={(e) => setCourseFilter(e.target.value)}
          className="max-w-xs"
        />
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          {courseOptions.map((name) => (
            <Badge
              key={name}
              variant={courseFilter === name ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setCourseFilter(courseFilter === name ? "" : name)}
            >
              {name}
            </Badge>
          ))}
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {isLoading &&
          Array.from({ length: 4 }).map((_, idx) => (
            <Card key={`session-skel-${idx}`} className="p-5">
              <div className="space-y-3">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-full" />
              </div>
            </Card>
          ))}

        {!isLoading &&
          filtered.map((session) => {
            const expiresDate = parseUtc(session.expiresAt);
            const createdDate = parseUtc(session.createdAt);
            const expiresLabel = expiresDate ? formatDistanceToNow(expiresDate, { addSuffix: true }) : "—";
            const expiresStaticLabel = session.isActive ? "Expires" : "Expired";
            return (
              <Card
                key={session.sessionId}
                className={`p-5 space-y-3 border ${session.isActive ? "border-primary/60 shadow-md" : "border-border"}`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Course</p>
                    <h3 className="text-lg font-semibold text-foreground">
                      {session.courseName ?? "Course"}{" "}
                      {session.courseCode && <span className="text-muted-foreground">• {session.courseCode}</span>}
                    </h3>
                    <p className="text-xs text-muted-foreground">Session ID: {session.sessionId}</p>
                  </div>
                  <Badge className={session.isActive ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}>
                    {session.isActive ? "Active" : "Closed"}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    <span>{session.attendeeCount ?? 0} attendees</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock3 className="h-4 w-4 text-primary" />
                    <span>{session.isActive ? "Expires" : "Expired"} {expiresLabel}</span>
                  </div>
                  <div className="flex items-center gap-2 col-span-2">
                    <CalendarClock className="h-4 w-4 text-primary" />
                    <span>
                      Created {createdDate ? createdDate.toLocaleString() : "—"} · {expiresStaticLabel}{" "}
                      {expiresDate ? expiresDate.toLocaleString() : "—"}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                    onClick={() => navigate(`/teacher/session/${session.sessionId}`)}
                  >
                    View session
                  </Button>
                </div>
              </Card>
            );
          })}

        {!isLoading && filtered.length === 0 && (
          <Card className="col-span-full flex flex-col items-center justify-center gap-2 p-10 text-center">
            <p className="text-lg font-semibold text-foreground">No sessions found</p>
            <p className="text-sm text-muted-foreground">Adjust your filter or create a new session from a course.</p>
          </Card>
        )}
      </div>
    </div>
  );
};

export default TeacherSessions;
