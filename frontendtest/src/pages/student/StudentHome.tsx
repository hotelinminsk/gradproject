import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { BookOpen, QrCode, Settings, Compass } from "lucide-react";
import { useStudentSession } from "@/providers";
import { useStudentCourses } from "@/hooks/student";

const StudentHome = () => {
  const navigate = useNavigate();
  const { profile } = useStudentSession();
  const { data: courses = [] } = useStudentCourses();
  const nextCheckInCourseId = courses[0]?.courseId ?? "select";

  const tiles = [
    { title: "Kurslarım", desc: "Kayıtlı derslerini gör ve yönet", icon: BookOpen, to: "/student/courses", bg: "from-primary/15 to-primary/5" },
    { title: "Yoklamaya Katıl", desc: "Aktif oturuma katıl", icon: QrCode, to: `/student/check-in/${nextCheckInCourseId}`, bg: "from-blue-200/30 to-blue-50" },
    { title: "Ayarlar", desc: "Hesap & cihazlar", icon: Settings, to: "/student/settings", bg: "from-secondary/15 to-secondary/5" },
    { title: "Yardım", desc: "Nasıl çalışır?", icon: Compass, to: "/student/settings", bg: "from-muted to-transparent" },
  ];

  return (
    <div className="min-h-[calc(100vh-5rem)] grid place-items-center pb-safe-nav">
      <div className="w-full max-w-md mx-auto space-y-5 px-2">
        {/* Hero */}
        <Card className="p-5 overflow-hidden relative border border-slate-200 bg-white shadow-sm">
          <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-gradient-to-br from-sky-200/40 to-blue-100/40" />
          <div className="absolute -left-8 -bottom-12 w-48 h-48 rounded-full bg-gradient-to-br from-slate-100 to-sky-100/60" />
          <div className="relative">
            <h1 className="text-xl font-semibold">
              Merhaba{profile?.fullName ? `, ${profile.fullName}` : ""}
            </h1>
            <p className="text-sm text-muted-foreground mb-3">GTU Attend • Öğrenci</p>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-md bg-gradient-to-br from-sky-200/60 to-blue-100 grid place-items-center">
                <QrCode className="w-6 h-6" />
              </div>
              <p className="text-sm text-muted-foreground">
                Passkey ve konum doğrulamasıyla oturumlara güvenli katılım.
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
                className="p-4 hover:shadow-md transition-shadow cursor-pointer border border-slate-200 bg-white"
                onClick={() => navigate(t.to)}
              >
                <div className={`w-10 h-10 rounded-md bg-gradient-to-br ${t.bg} flex items-center justify-center mb-2`}>
                  <Icon className="w-5 h-5 text-foreground/80" />
                </div>
                <h3 className="font-semibold leading-tight text-slate-900">{t.title}</h3>
                <p className="text-xs text-muted-foreground mt-1">{t.desc}</p>
              </Card>
            );
          })}
        </div>

        <div className="text-center text-xs text-muted-foreground">
          Konum, yoklama sırasında yakınlığı doğrulamak için kullanılır.
        </div>
        <div className="text-center text-xs text-muted-foreground">
          © 2024 GTU Attend <br></br> Created By Yahya Kemal Kuyumcu 
          <br></br>
          <span className="mx-1"><a href="https://github.com/hotelinminsk" target="_blank" rel="noopener noreferrer">GitHub</a></span>
          </div>"

      </div>
    </div>
  );
};

export default StudentHome;
