"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { GraduationCap, Mail, Lock, User, Award as IdCard } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export function StudentRegisterForm() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: "",
    lastname: "",
    gtuId: "",
    email: "",
    password: "",
    confirmPassword: "",
  })
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Validate GTU email
    if (!formData.email.endsWith("@gtu.edu.tr")) {
      alert("Please use a valid @gtu.edu.tr email address")
      setIsLoading(false)
      return
    }

    // Validate password match
    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match")
      setIsLoading(false)
      return
    }

    // TODO: Implement actual registration
    console.log("[v0] Student registration:", formData)

    // Simulate API call
    setTimeout(() => {
      setIsLoading(false)
      router.push("/student/webauthn")
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
            <h1 className="text-3xl font-bold tracking-tight">Create Account</h1>
            <p className="text-muted-foreground mt-2">Join GTU Attendance today</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-base">
                Name
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-3.5 h-5 w-5 text-muted-foreground" />
                <Input
                  id="name"
                  placeholder="John"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="pl-11 h-12 text-base"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastname" className="text-base">
                Lastname
              </Label>
              <Input
                id="lastname"
                placeholder="Doe"
                value={formData.lastname}
                onChange={(e) => setFormData({ ...formData, lastname: e.target.value })}
                className="h-12 text-base"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="gtuId" className="text-base">
              GTU ID
            </Label>
            <div className="relative">
              <IdCard className="absolute left-3 top-3.5 h-5 w-5 text-muted-foreground" />
              <Input
                id="gtuId"
                placeholder="123456789"
                value={formData.gtuId}
                onChange={(e) => setFormData({ ...formData, gtuId: e.target.value })}
                className="pl-11 h-12 text-base"
                required
              />
            </div>
          </div>

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
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
                placeholder="Create a password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="pl-11 h-12 text-base"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-base">
              Confirm Password
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3.5 h-5 w-5 text-muted-foreground" />
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className="pl-11 h-12 text-base"
                required
              />
            </div>
          </div>

          <Button type="submit" className="w-full h-12 text-base" disabled={isLoading}>
            {isLoading ? "Creating account..." : "Create Account"}
          </Button>

          <div className="text-center text-base">
            <span className="text-muted-foreground">Already have an account? </span>
            <Link href="/student/login" className="text-primary hover:underline font-medium">
              Sign in
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
