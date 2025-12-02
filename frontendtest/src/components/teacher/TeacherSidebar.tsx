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

  const {profile, isLoading, logout} = useTeacherSession();
  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully");
    navigate("/teacher/login");
  };



  return (
    <aside className="w-64 min-h-screen bg-sidebar border-r shadow-sm flex flex-col">
      {/* Account header */}
      <div className="p-6 border-b">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sidebar-primary/25 to-sidebar-accent/40 grid place-items-center text-sm font-semibold">
            {profile?.fullName?.[0] ?? 'P'}
          </div>
          <div>
            <div className="text-sm font-medium">{profile?.fullName}</div>
            {profile?.email && <div className="text-xs text-muted-foreground">{profile?.email}</div>}
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        <div className="px-2 pb-2 text-xs uppercase tracking-wide text-muted-foreground/70">Teacher Portal</div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname.startsWith(item.path);

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50"
              )}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t mt-auto">
        <Button
          onClick={handleLogout}
          variant="outline"
          className="w-full"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </Button>
      </div>
    </aside>
  );
};

export default TeacherSidebar;
