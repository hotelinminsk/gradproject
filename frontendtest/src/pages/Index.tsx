import { useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { GraduationCap, ShieldCheck, User } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const [active, setActive] = useState<"student" | "teacher">("student");

  const portal = useMemo(
    () =>
      active === "student"
        ? {
            title: "Öğrenci Portalı",
            desc: "Biometrik doğrulama ile derse hızlı katılım.",
            icon: <User className="w-12 h-12 text-primary" />,
            cta: "Öğrenci Girişi",
            to: "/student",
            accent: "from-sky-50 via-white to-blue-50",
            pill: "bg-sky-100 text-sky-900 border-sky-200",
          }
        : {
            title: "Öğretmen Portalı",
            desc: "Yoklama oturumu aç, gerçek zamanlı ilerlemeyi izle.",
            icon: <GraduationCap className="w-12 h-12 text-primary" />,
            cta: "Öğretmen Girişi",
            to: "/teacher/login",
            accent: "from-sky-50 via-white to-blue-50",
            pill: "bg-sky-100 text-sky-900 border-sky-200",
          },
    [active],
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-sky-50">
      <div className="mx-auto flex max-w-5xl flex-col gap-8 px-4 pb-12 pt-10 md:pt-14">
        <header className="text-center space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-sky-600">GTU Attend</p>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-slate-900">GTU Attend</h1>
          <p className="text-base md:text-lg text-slate-700 max-w-2xl mx-auto">
            Parolasız yoklama. Anlık oturum ve rapor.
          </p>
        </header>

        <div className="mx-auto flex w-full max-w-xl items-center justify-center rounded-full border border-slate-200 bg-white p-1.5 shadow-sm">
          <Button
            variant={active === "student" ? "default" : "ghost"}
            className={`flex-1 rounded-full text-sm font-semibold transition ${
              active === "student" ? "bg-sky-600 text-white hover:bg-sky-500" : "text-slate-700 hover:bg-slate-100"
            }`}
            onClick={() => setActive("student")}
          >
            Öğrenci
          </Button>
          <Button
            variant={active === "teacher" ? "default" : "ghost"}
            className={`flex-1 rounded-full text-sm font-semibold transition ${
              active === "teacher" ? "bg-indigo-600 text-white hover:bg-indigo-500" : "text-slate-700 hover:bg-slate-100"
            }`}
            onClick={() => setActive("teacher")}
          >
            Öğretmen
          </Button>
        </div>
        <p className="text-center text-xs text-slate-500">Kaydır / sürükle veya dokunarak portal değiştir.</p>

        <Card className="overflow-hidden border border-slate-200 bg-white shadow-xl shadow-sky-100/60">
          <div className={`bg-gradient-to-br ${portal.accent}`}>
            <div className="grid gap-6 p-6 sm:p-8 md:p-10 lg:grid-cols-[1.1fr_0.9fr] items-center">
              <div className="space-y-5">
                <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${portal.pill}`}>
                  <ShieldCheck className="h-4 w-4" />
                  WebAuthn • GPS kontrollü yoklama
                </span>
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-100 text-sky-700 shadow-sm">
                    {portal.icon}
                  </div>
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">{portal.title}</h2>
                    <p className="text-sm text-slate-600">{portal.desc}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 text-xs font-medium text-slate-700">
                  <span className="rounded-full bg-slate-100 px-3 py-1">Passkey & WebAuthn</span>
                  <span className="rounded-full bg-slate-100 px-3 py-1">Konum doğrulama</span>
                  <span className="rounded-full bg-slate-100 px-3 py-1">Gerçek zamanlı oturum</span>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    size="lg"
                    className="rounded-xl bg-sky-600 text-white shadow-lg shadow-sky-200 hover:bg-sky-500"
                    onClick={() => navigate(portal.to)}
                  >
                    {portal.cta}
                  </Button>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg shadow-sky-100">
                <p className="text-sm font-semibold text-slate-800 mb-3">Neler sunuyoruz?</p>
                <ul className="space-y-3 text-sm text-slate-700">
                  <li className="flex items-start gap-2">
                    <span className="mt-1 h-2 w-2 rounded-full bg-sky-500" />
                    Parolasız giriş ve cihaz kilidiyle güvenli doğrulama.
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1 h-2 w-2 rounded-full bg-blue-500" />
                    GPS eşiğiyle sınıf içi yoklama doğrulaması.
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1 h-2 w-2 rounded-full bg-indigo-500" />
                    Oturum ve yoklama güncellemeleri anlık bildirim olarak.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </Card>

        <div className="text-center text-slate-500 text-sm">
          Build by <span className="font-semibold text-slate-700">Yahya Kemal Kuyumcu</span>{" "}
          <a href="https://github.com/hotelinminsk" className="text-sky-600 hover:underline" target="_blank" rel="noreferrer">
            github.com/hotelinminsk
          </a>
        </div>
      </div>
    </div>
  );
};

export default Index;
