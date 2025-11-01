import { PropsWithChildren } from "react";
import { Outlet } from "react-router-dom";
import StudentBottomNav from "@/components/student/StudentBottomNav";

export default function StudentLayout({ children }: PropsWithChildren) {
  return (
    <div className="min-h-screen bg-background">
      <main className="px-4 py-4 pb-safe-nav">{children ?? <Outlet />}</main>
      {/* Bottom nav is fixed; main gets extra bottom padding to avoid overlap */}
      <StudentBottomNav />
    </div>
  );
}
