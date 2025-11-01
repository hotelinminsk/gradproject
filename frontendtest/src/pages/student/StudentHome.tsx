import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { BookOpen, QrCode, Settings, Compass } from "lucide-react";

const StudentHome = () => {
  const navigate = useNavigate();
  const tiles = [
    { title: "My Courses", desc: "View and manage your courses", icon: BookOpen, to: "/student/courses", bg: "from-primary/15 to-primary/5" },
    { title: "Check In", desc: "Join an active session", icon: QrCode, to: "/student/check-in/1", bg: "from-accent/15 to-accent/5" },
    { title: "Settings", desc: "Account & devices", icon: Settings, to: "/student/settings", bg: "from-secondary/15 to-secondary/5" },
    { title: "Help", desc: "How it works", icon: Compass, to: "/student/settings", bg: "from-muted to-transparent" },
  ];

  return (
    <div className="min-h-[calc(100vh-5rem)] grid place-items-center pb-safe-nav">
      <div className="w-full max-w-md mx-auto space-y-5 px-2">
        {/* Hero */}
        <Card className="p-5 overflow-hidden relative">
          <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-gradient-to-br from-primary/25 to-accent/25" />
          <div className="absolute -left-8 -bottom-12 w-48 h-48 rounded-full bg-gradient-to-br from-secondary/20 to-primary/10" />
          <div className="relative">
            <h1 className="text-xl font-semibold">Welcome</h1>
            <p className="text-sm text-muted-foreground mb-3">GTU Attendance • Student</p>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-md bg-gradient-to-br from-primary/20 to-accent/20 grid place-items-center">
                <QrCode className="w-6 h-6" />
              </div>
              <p className="text-sm text-muted-foreground">
                Use your device to securely check-in to sessions with WebAuthn and location.
              </p>
            </div>
          </div>
        </Card>

        {/* Tiles */}
        <div className="grid grid-cols-2 gap-3">
          {tiles.map((t) => {
            const Icon = t.icon;
            return (
              <Card
                key={t.title}
                className="p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => navigate(t.to)}
              >
                <div className={`w-10 h-10 rounded-md bg-gradient-to-br ${t.bg} flex items-center justify-center mb-2`}>
                  <Icon className="w-5 h-5 text-foreground/80" />
                </div>
                <h3 className="font-semibold leading-tight">{t.title}</h3>
                <p className="text-xs text-muted-foreground mt-1">{t.desc}</p>
              </Card>
            );
          })}
        </div>

        <div className="text-center text-xs text-muted-foreground">
          Location is used during check-in to verify proximity.
        </div>
      </div>
    </div>
  );
};

export default StudentHome;

