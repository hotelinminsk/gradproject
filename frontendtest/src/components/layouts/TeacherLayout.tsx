import { PropsWithChildren } from "react";
import { Outlet } from "react-router-dom";
import TeacherSidebar from "@/components/teacher/TeacherSidebar";

export default function TeacherLayout({ children }: PropsWithChildren) {
  return (
    <div className="min-h-screen grid lg:grid-cols-[260px_1fr] bg-background">
      <aside className="hidden lg:block">
        <TeacherSidebar />
      </aside>
      <main className="flex-1 container py-6">{children ?? <Outlet />}</main>
    </div>
  );
}
