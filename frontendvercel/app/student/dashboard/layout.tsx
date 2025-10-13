import type React from "react"
import { StudentBottomNav } from "@/components/student/student-bottom-nav"

export default function StudentDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen pb-20 bg-background">
      <div className="container max-w-2xl mx-auto px-4 py-6">{children}</div>
      <StudentBottomNav />
    </div>
  )
}
