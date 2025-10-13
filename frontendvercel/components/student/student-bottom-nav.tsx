"use client"

import { BookOpen, QrCode, FileText } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

export function StudentBottomNav() {
  const pathname = usePathname()

  const navItems = [
    {
      label: "Courses",
      icon: BookOpen,
      href: "/student/dashboard",
    },
    {
      label: "QR Reader",
      icon: QrCode,
      href: "/student/dashboard/qr",
    },
    {
      label: "Reports",
      icon: FileText,
      href: "/student/dashboard/reports",
    },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50">
      <div className="container max-w-2xl mx-auto">
        <div className="grid grid-cols-3 gap-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center py-3 px-2 transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="h-5 w-5 mb-1" />
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
