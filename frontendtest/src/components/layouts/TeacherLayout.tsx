import { PropsWithChildren } from "react";
import { Outlet } from "react-router-dom";
import TeacherSidebar from "@/components/teacher/TeacherSidebar";

export default function TeacherLayout({ children }: PropsWithChildren) {
  return (
    <div className="min-h-screen grid lg:grid-cols-[280px_1fr] bg-slate-50">
      <aside className="hidden lg:block sticky top-0 h-screen">
        <TeacherSidebar />
      </aside>
      <main className="flex-1 min-h-screen bg-background overflow-x-hidden">
        {children ?? <Outlet />}
      </main>
    </div>
  );
}
