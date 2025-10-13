"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2, Loader2, Plus } from "lucide-react"

interface ManualStudentAddProps {
  courseId: string
}

export function ManualStudentAdd({ courseId }: ManualStudentAddProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [addStatus, setAddStatus] = useState<"idle" | "success" | "error">("idle")
  const [message, setMessage] = useState("")
  const [formData, setFormData] = useState({
    name: "",
    gtuId: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsAdding(true)
    setAddStatus("idle")

    // Validate GTU ID format (basic validation)
    if (!/^\d{9}$/.test(formData.gtuId)) {
      setAddStatus("error")
      setMessage("GTU ID must be 9 digits")
      setIsAdding(false)
      return
    }

    try {
      // TODO: Implement actual API call
      // const response = await fetch('/api/teacher/courses/roster/add', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ ...formData, courseId }),
      // })

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      setAddStatus("success")
      setMessage(`Successfully added ${formData.name} to the roster`)
      setFormData({ name: "", gtuId: "" })
    } catch (err) {
      setAddStatus("error")
      setMessage("Failed to add student. Please try again.")
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="studentName">Student Name</Label>
            <Input
              id="studentName"
              placeholder="e.g., Ahmet Yılmaz"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="gtuId">GTU ID</Label>
            <Input
              id="gtuId"
              placeholder="e.g., 190101001"
              value={formData.gtuId}
              onChange={(e) => setFormData({ ...formData, gtuId: e.target.value })}
              required
              maxLength={9}
            />
          </div>
        </div>

        <Button type="submit" disabled={isAdding} className="gap-2">
          {isAdding ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Adding...
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" />
              Add Student
            </>
          )}
        </Button>
      </form>

      {addStatus === "success" && (
        <Alert className="border-green-500/50 bg-green-500/10">
          <CheckCircle2 className="h-4 w-4 text-green-500" />
          <AlertDescription className="text-green-500">{message}</AlertDescription>
        </Alert>
      )}

      {addStatus === "error" && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}
