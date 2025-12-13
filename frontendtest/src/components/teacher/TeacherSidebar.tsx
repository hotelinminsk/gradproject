import { useNavigate, useLocation } from "react-router-dom";
import { Home, BookOpen, QrCode, FileText, LogOut, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useTeacherSession } from "@/providers";

const TeacherSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { path: "/teacher/dashboard", icon: Home, label: "Dashboard" },
    { path: "/teacher/courses", icon: BookOpen, label: "Courses" },
    { path: "/teacher/students", icon: Users, label: "Students" },
    { path: "/teacher/sessions", icon: QrCode, label: "Sessions" },
    { path: "/teacher/reports", icon: FileText, label: "Reports" },
  ];

  const { profile, isLoading, logout } = useTeacherSession();
  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully");
    navigate("/teacher/login");
  };



  return (
    <aside className="w-[280px] min-h-screen bg-white border-r border-slate-200 shadow-sm flex flex-col font-sans">
      {/* Account header */}
      <div className="p-6 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 grid place-items-center text-sm font-semibold border border-emerald-200 shadow-sm">
            {profile?.fullName?.[0] ?? 'P'}
          </div>
          <div className="overflow-hidden">
            <div className="text-sm font-medium text-slate-900 truncate">{profile?.fullName}</div>
            {profile?.email && <div className="text-xs text-slate-500 truncate">{profile?.email}</div>}
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
        <div className="px-3 pb-3 pt-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Öğretmen Paneli</div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname.startsWith(item.path);

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                isActive
                  ? "bg-emerald-50 text-emerald-700 font-medium shadow-sm ring-1 ring-emerald-100"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <Icon className={cn("w-5 h-5 transition-colors", isActive ? "text-emerald-600" : "text-slate-400 group-hover:text-slate-600")} />
              <span className="text-sm">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-100 bg-slate-50/50">
        <Button
          onClick={handleLogout}
          variant="ghost"
          className="w-full justify-start text-slate-500 hover:text-red-600 hover:bg-red-50 hover:border-red-100 border border-transparent transition-all"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Oturumu Kapat
        </Button>
      </div>
    </aside>
  );
};

export default TeacherSidebar;
