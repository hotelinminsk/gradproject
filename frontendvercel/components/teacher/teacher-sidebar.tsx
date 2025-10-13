"use client"

import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { GraduationCap, BookOpen, Users, FileText, LogOut } from "lucide-react"
import { cn } from "@/lib/utils"

const navigation = [
  {
    name: "My Courses",
    href: "/teacher/dashboard/courses",
    icon: BookOpen,
  },
  {
    name: "My Students",
    href: "/teacher/dashboard/students",
    icon: Users,
  },
  {
    name: "Reports",
    href: "/teacher/dashboard/reports",
    icon: FileText,
  },
]

export function TeacherSidebar() {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = () => {
    // TODO: Implement actual logout logic
    router.push("/teacher/login")
  }

  return (
    <div className="flex flex-col w-64 border-r border-border bg-sidebar">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <GraduationCap className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold text-card-foreground">GTU Attendance</h2>
            <p className="text-xs text-muted-foreground">Teacher Portal</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Button
              key={item.name}
              variant={isActive ? "outline" : "ghost"}
              className={cn(
                "w-full justify-start gap-3",
                isActive && "bg-primary/15 text-foreground border-primary/30",
              )}
              onClick={() => router.push(item.href)}
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </Button>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-border">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  )
}
