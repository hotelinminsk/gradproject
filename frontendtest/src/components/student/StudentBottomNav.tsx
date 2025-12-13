import { useNavigate, useLocation } from "react-router-dom";
import { Home, BookOpen, Settings, CalendarClock } from "lucide-react";
import { cn } from "@/lib/utils";

const StudentBottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { path: "/student/home", icon: Home, label: "Ana sayfa" },
    { path: "/student/courses", icon: BookOpen, label: "Dersler" },
    { path: "/student/weekly-plan", icon: CalendarClock, label: "Program" },
    { path: "/student/settings", icon: Settings, label: "Ayarlar" },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-card border-t shadow-lg"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex justify-around items-center h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname.startsWith(item.path);

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path === "/student/check-in" ? "/student/check-in/1" : item.path)}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full space-y-1 transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default StudentBottomNav;
