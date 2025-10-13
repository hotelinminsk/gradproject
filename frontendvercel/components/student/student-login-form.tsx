"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { GraduationCap, Mail, Lock } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export function StudentLoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // TODO: Implement actual authentication
    console.log("[v0] Student login:", { email, password })

    // Simulate API call
    setTimeout(() => {
      setIsLoading(false)
      router.push("/student/dashboard")
    }, 1000)
  }

  return (
    <div className="flex-1 flex flex-col justify-center px-6 py-12">
      <div className="space-y-8">
        <div className="flex flex-col items-center space-y-4 text-center">
          <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
            <GraduationCap className="h-10 w-10 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Welcome Back</h1>
            <p className="text-muted-foreground mt-2">Sign in to your GTU Attendance account</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-base">
              GTU Email
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3.5 h-5 w-5 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="student@gtu.edu.tr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-11 h-12 text-base"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-base">
              Password
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3.5 h-5 w-5 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-11 h-12 text-base"
                required
              />
            </div>
          </div>

          <Button type="submit" className="w-full h-12 text-base" disabled={isLoading}>
            {isLoading ? "Signing in..." : "Sign In"}
          </Button>

          <div className="text-center text-base">
            <span className="text-muted-foreground">Don't have an account? </span>
            <Link href="/student/register" className="text-primary hover:underline font-medium">
              Register
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
