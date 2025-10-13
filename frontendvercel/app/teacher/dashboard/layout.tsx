import type React from "react"
import { TeacherSidebar } from "@/components/teacher/teacher-sidebar"

export default function TeacherDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen">
      <TeacherSidebar />
      <main className="flex-1 p-6 lg:p-8 bg-[radial-gradient(1200px_600px_at_0%_0%,_rgba(118,159,205,0.12),_transparent),radial-gradient(1200px_600px_at_100%_100%,_rgba(185,215,234,0.15),_transparent)]">{children}</main>
    </div>
  )
}
