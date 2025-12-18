import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, QrCode, Settings, Compass, Clock, History, Users } from "lucide-react";
import { useStudentSession } from "@/providers";
import { useStudentCourses } from "@/hooks/student";

const StudentHome = () => {
  const navigate = useNavigate();
  const { profile } = useStudentSession();
  const { data: courses = [] } = useStudentCourses();

  // Find the first active session across all courses
  const activeCourse = courses.find(
    (c) => c.latestSession && c.latestSession.sessionIsActive
  );
  // Determine today's classes
  const today = new Date().getDay(); // 0=Sunday, 1=Monday...
  const todaysClasses = courses
    .filter(c => c.schedules?.some(s => s.dayOfWeek === today))
    .map(c => {
      const schedule = c.schedules!.find(s => s.dayOfWeek === today)!;
      return { ...c, schedule };
    })
    .sort((a, b) => a.schedule.startTime.localeCompare(b.schedule.startTime));

  return (
    <div className="min-h-screen bg-slate-50 pb-safe-nav font-sans text-slate-900 relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-br from-blue-50 via-indigo-50/50 to-slate-50 pointer-events-none" />
      <div className="absolute top-[-10%] right-[-10%] w-[400px] h-[400px] bg-blue-100/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-[10%] left-[-10%] w-[300px] h-[300px] bg-purple-100/40 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="relative px-6 pt-12 pb-6 z-10">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1 block">Hoşgeldin,</span>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              {profile?.fullName?.split(" ")[0] || "Öğrenci"} 👋
            </h1>
          </div>
          <div
            className="w-10 h-10 rounded-full bg-white/80 backdrop-blur-md border border-slate-200/60 shadow-sm flex items-center justify-center cursor-pointer hover:bg-white transition-colors"
            onClick={() => navigate("/student/settings")}
          >
            <Settings className="w-5 h-5 text-slate-600" />
          </div>
        </div>
      </div>

      <div className="relative px-5 pb-6 space-y-8 z-10">
        {/* Active Session Card */}
        {activeCourse ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-sm font-semibold text-slate-900 mb-3 px-1 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse ring-4 ring-emerald-500/20" />
              Aktif Oturum
            </h2>
            <Card className="overflow-hidden border-0 shadow-xl shadow-emerald-500/20 bg-gradient-to-br from-emerald-600 to-teal-700 text-white relative">
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-12 -mt-12 blur-2xl" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/10 rounded-full -ml-10 -mb-10 blur-xl" />

              <div className="p-6 relative z-10">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-white/20 text-white backdrop-blur-md border border-white/10 shadow-sm">
                      {activeCourse.courseCode}
                    </span>
                    <h3 className="text-2xl font-bold mt-3 leading-tight tracking-tight">
                      {activeCourse.courseName}
                    </h3>
                    <p className="text-emerald-50 text-sm mt-1.5 flex items-center gap-1.5 font-medium">
                      <Clock className="w-3.5 h-3.5" />
                      Oturum şu an aktif
                    </p>
                  </div>
                  <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md border border-white/10 shadow-sm">
                    <QrCode className="w-7 h-7 text-white" />
                  </div>
                </div>

                <Button
                  onClick={() => navigate(`/student/check-in/${activeCourse.courseId}`)}
                  className="w-full bg-white text-emerald-700 hover:bg-emerald-50 font-bold border-none shadow-lg h-12 rounded-xl text-base items-center gap-2"
                >
                  <QrCode className="w-4 h-4" />
                  Yoklamaya Katıl
                </Button>
              </div>
            </Card>
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="p-6 rounded-3xl bg-white/60 backdrop-blur-lg border border-white/50 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">Aktif yoklaman yok</h3>
                  <p className="text-sm text-slate-500">İyi dinlenmeler!</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Today's Classes */}
        <div className="animate-in fade-in slide-in-from-bottom-5 duration-700">
          <h2 className="text-sm font-bold text-slate-900 mb-4 px-1 flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-600" />
            Bugünkü Dersler
          </h2>

          {todaysClasses.length > 0 ? (
            <div className="flex overflow-x-auto gap-4 pb-2 -mx-5 px-5 snap-x scrollbar-hide">
              {todaysClasses.map((course) => (
                <div
                  key={course.courseId}
                  onClick={() => navigate(`/student/courses/${course.courseId}`)}
                  className="snap-start shrink-0 min-w-[240px] p-4 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all active:scale-[0.98] group relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-50 rounded-bl-full -mr-4 -mt-4 transition-colors group-hover:bg-indigo-100" />

                  <div className="relative">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-600 border border-indigo-100">
                        {course.schedule.startTime.slice(0, 5)}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
                        {course.courseCode}
                      </span>
                    </div>

                    <h3 className="font-bold text-slate-900 leading-tight mb-1">{course.courseName}</h3>
                    <p className="text-xs text-slate-500 truncate">{course.teacherName || "Öğretim Üyesi"}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 rounded-2xl bg-slate-50/50 border border-slate-100 border-dashed text-center">
              <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-indigo-50 text-indigo-400 mb-3">
                <Compass className="w-5 h-5" />
              </span>
              <p className="text-sm font-semibold text-slate-900">Bugün dersin yok!</p>
              <p className="text-xs text-slate-500 mt-1">Günün tadını çıkar, iyi dinlenmeler. 🎉</p>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-sm font-bold text-slate-900 mb-4 px-1">Hızlı İşlemler</h2>
          <div className="grid grid-cols-2 gap-4">
            {[
              {
                title: "Derslerim",
                icon: BookOpen,
                to: "/student/courses",
                color: "text-blue-600",
                bg: "bg-blue-50",
                border: "border-blue-100"
              },
              {
                title: "Geçmiş",
                icon: History,
                to: "/student/history",
                color: "text-violet-600",
                bg: "bg-violet-50",
                border: "border-violet-100"
              },
              {
                title: "Profil",
                icon: Users,
                to: "/student/settings",
                color: "text-amber-600",
                bg: "bg-amber-50",
                border: "border-amber-100"
              },
              {
                title: "Yardım",
                icon: Compass,
                to: "#",
                onClick: () => window.open("/guide.pdf", "_blank"),
                color: "text-slate-600",
                bg: "bg-slate-50",
                border: "border-slate-100"
              },
            ].map((action, idx) => {
              const Icon = action.icon;
              return (
                <button
                  key={idx}
                  onClick={() => action.onClick ? action.onClick() : navigate(action.to)}
                  className="group relative p-4 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200 transition-all active:scale-[0.98] text-left overflow-hidden"
                >
                  <div className={`absolute top-0 right-0 w-16 h-16 opacity-5 rounded-bl-full ${action.bg.replace("50", "500")}`} />
                  <div className={`mb-3 w-10 h-10 rounded-xl ${action.bg} ${action.color} flex items-center justify-center`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="font-semibold text-slate-700 text-sm block group-hover:text-slate-900 transition-colors">{action.title}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Recent Courses (Horizontal Scroll) */}
        {courses.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4 px-1">
              <h2 className="text-sm font-bold text-slate-900">Son Dersler</h2>
              <button onClick={() => navigate("/student/courses")} className="text-xs font-semibold text-blue-600 hover:text-blue-700 px-2 py-1 rounded-md hover:bg-blue-50 transition-colors">Tümünü gör</button>
            </div>

            <div className="flex overflow-x-auto pb-6 -mx-5 px-5 gap-4 snap-x scrollbar-hide">
              {courses.slice(0, 5).map(course => (
                <div
                  key={course.courseId}
                  onClick={() => navigate(`/student/courses/${course.courseId}`)}
                  className="snap-start shrink-0 w-64 p-5 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all active:scale-[0.98] relative overflow-hidden group"
                >
                  <div className="absolute top-0 right-0 w-20 h-20 bg-slate-50 rounded-bl-full -mr-4 -mt-4 z-0 group-hover:bg-slate-100 transition-colors" />
                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-3">
                      <span className="text-[10px] font-bold px-2 py-1 rounded bg-slate-100 text-slate-600 border border-slate-200 uppercase tracking-wide">
                        {course.courseCode}
                      </span>
                      {course.latestSession?.isAttended && (
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-100" />
                      )}
                    </div>
                    <h3 className="font-bold text-slate-900 text-base leading-snug line-clamp-2 h-10">{course.courseName}</h3>
                    <p className="text-xs text-slate-500 mt-2 font-medium">{course.teacherName || "Öğretim Üyesi"}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentHome;
