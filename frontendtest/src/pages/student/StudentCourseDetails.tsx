import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, GraduationCap, MapPin, Calendar } from "lucide-react";
import StudentBottomNav from "@/components/student/StudentBottomNav";

const sessions = {
  upcoming: [
    { kind: "Lecture", when: "Mon, Oct 28, 10:00 AM - 11:30 AM", room: "Room 203" },
    { kind: "Lab", when: "Wed, Oct 30, 1:00 PM - 2:30 PM", room: "Lab B" },
  ],
  history: [
    { date: "Oct 21, 2024", kind: "Lecture", status: "Present" as const },
    { date: "Oct 18, 2024", kind: "Lab", status: "Absent" as const },
    { date: "Oct 14, 2024", kind: "Lecture", status: "Late" as const },
  ],
};

export default function StudentCourseDetails() {
  const navigate = useNavigate();
  const { courseId } = useParams();
  const [activeTab, setActiveTab] = React.useState<"upcoming" | "history">("upcoming");

  return (
    <div className="min-h-screen bg-background pb-safe-nav">
      <div className="px-4 pt-2">
        <div className="flex items-center justify-between">
          <button className="p-2 -ml-2" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="text-center flex-1">
            <h1 className="text-lg font-bold">Course Details</h1>
            <p className="text-xs text-muted-foreground">CS-101</p>
          </div>
          <div className="w-7" />
        </div>
      </div>

      <div className="px-4 space-y-4">
        <Card className="p-4">
          <h2 className="font-semibold text-lg">Introduction to Computer Science</h2>
          <div className="mt-2 space-y-1 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4" /> Prof. Ada Lovelace
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" /> Building A, Room 203
            </div>
          </div>
        </Card>

        {/* Tabs */}
        <div className="flex gap-2 bg-muted/40 rounded-xl p-1">
          <button
            className={`flex-1 py-2 rounded-lg text-sm font-medium ${activeTab === "upcoming" ? "bg-background shadow" : "text-muted-foreground"}`}
            onClick={() => setActiveTab("upcoming")}
          >
            Upcoming Sessions
          </button>
          <button
            className={`flex-1 py-2 rounded-lg text-sm font-medium ${activeTab === "history" ? "bg-background shadow" : "text-muted-foreground"}`}
            onClick={() => setActiveTab("history")}
          >
            Attendance History
          </button>
        </div>

        {/* Lists */}
        {activeTab === "upcoming" ? (
          <div className="space-y-3">
            {sessions.upcoming.map((s, i) => (
              <Card key={i} className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{s.kind}</p>
                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                      <Calendar className="w-4 h-4" /> {s.when}
                    </div>
                  </div>
                  <span className="text-sm text-muted-foreground">{s.room}</span>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.history.map((h, i) => (
              <Card key={i} className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{h.date}</p>
                    <p className="text-sm text-muted-foreground">{h.kind}</p>
                  </div>
                  <Badge
                    className={
                      h.status === "Present" ? "bg-emerald-100 text-emerald-700" :
                      h.status === "Absent" ? "bg-red-100 text-red-700" :
                      "bg-amber-100 text-amber-700"
                    }
                  >
                    {h.status}
                  </Badge>
                </div>
              </Card>
            ))}
          </div>
        )}

        <Button className="w-full h-12 text-base" variant="default">
          View Syllabus
        </Button>
      </div>

      <StudentBottomNav />
    </div>
  );
}


