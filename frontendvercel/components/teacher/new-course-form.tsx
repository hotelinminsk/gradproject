"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Loader2, BookOpen, Calendar, Clock, Upload, FileSpreadsheet, X } from "lucide-react"

const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

export function NewCourseForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [rosterFile, setRosterFile] = useState<File | null>(null)
  const [formData, setFormData] = useState({
    courseName: "",
    courseCode: "",
    weekday: "",
    startTime: "",
    endTime: "",
  })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const validTypes = [
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-excel",
        "text/csv",
      ]
      if (validTypes.includes(file.type)) {
        setRosterFile(file)
        setError("")
      } else {
        setError("Please upload a valid CSV or XLSX file")
        e.target.value = ""
      }
    }
  }

  const removeFile = () => {
    setRosterFile(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    // Validate all fields
    if (!formData.courseName || !formData.courseCode || !formData.weekday || !formData.startTime || !formData.endTime) {
      setError("Please fill in all fields")
      setIsLoading(false)
      return
    }

    // Validate time format
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
    if (!timeRegex.test(formData.startTime) || !timeRegex.test(formData.endTime)) {
      setError("Please enter valid time in HH:MM format")
      setIsLoading(false)
      return
    }

    try {
      // TODO: Implement actual API call with roster file
      // const formDataToSend = new FormData()
      // Object.entries(formData).forEach(([key, value]) => {
      //   formDataToSend.append(key, value)
      // })
      // if (rosterFile) {
      //   formDataToSend.append('roster', rosterFile)
      // }

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Redirect to courses list
      router.push("/teacher/dashboard/courses")
    } catch (err) {
      setError("Failed to create course. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
          <BookOpen className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-3xl font-bold text-balance mb-2">Create New Course</h1>
        <p className="text-muted-foreground text-pretty">Set up a new course and start managing student attendance</p>
      </div>

      <Card className="border shadow-md">
        <CardHeader className="space-y-1 pb-6">
          <CardTitle className="text-2xl">Course Information</CardTitle>
          <CardDescription>Fill in the details for your new course</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-8">
            {error && (
              <Alert variant="destructive" className="border-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="courseName" className="text-base font-semibold flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-primary" />
                  Course Name
                </Label>
                <Input
                  id="courseName"
                  placeholder="e.g., Computer Networks"
                  value={formData.courseName}
                  onChange={(e) => setFormData({ ...formData, courseName: e.target.value })}
                  className="h-12 text-base focus-visible:ring-2"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="courseCode" className="text-base font-semibold flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-primary" />
                  Course Code
                </Label>
                <Input
                  id="courseCode"
                  placeholder="e.g., CSE301"
                  value={formData.courseCode}
                  onChange={(e) => setFormData({ ...formData, courseCode: e.target.value })}
                  className="h-12 text-base focus-visible:ring-2 font-mono"
                  required
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="weekday" className="text-base font-semibold flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  Weekday
                </Label>
                <Select value={formData.weekday} onValueChange={(value) => setFormData({ ...formData, weekday: value })}>
                  <SelectTrigger id="weekday" className="h-12 text-base">
                    <SelectValue placeholder="Select a day" />
                  </SelectTrigger>
                  <SelectContent>
                    {weekdays.map((day) => (
                      <SelectItem key={day} value={day} className="text-base">
                        {day}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-base font-semibold flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" />
                  Course Hours
                </Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startTime" className="text-sm text-muted-foreground">
                      Start Time
                    </Label>
                    <Input
                      id="startTime"
                      type="time"
                      placeholder="09:00"
                      value={formData.startTime}
                      onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                      className="h-12 text-base focus-visible:ring-2"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endTime" className="text-sm text-muted-foreground">
                      End Time
                    </Label>
                    <Input
                      id="endTime"
                      type="time"
                      placeholder="12:00"
                      value={formData.endTime}
                      onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                      className="h-12 text-base focus-visible:ring-2"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-4 border-t">
              <Label className="text-base font-semibold flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-primary" />
                Student Roster (Optional)
              </Label>
              <p className="text-sm text-muted-foreground mb-3">
                Upload a CSV or XLSX file with "NAME" and "GTUid" columns to pre-populate the course roster
              </p>

              {!rosterFile ? (
                <div className="relative">
                  <input
                    type="file"
                    id="roster-upload"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <Label
                    htmlFor="roster-upload"
                    className="flex flex-col items-center justify-center w-full h-32 border border-dashed rounded-lg cursor-pointer hover:bg-accent/50 transition-colors"
                  >
                    <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                    <span className="text-sm font-medium">Click to upload roster file</span>
                    <span className="text-xs text-muted-foreground mt-1">CSV or XLSX format</span>
                  </Label>
                </div>
              ) : (
                <div className="flex items-center gap-3 p-4 bg-accent/50 rounded-lg border">
                  <FileSpreadsheet className="w-8 h-8 text-primary flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{rosterFile.name}</p>
                    <p className="text-xs text-muted-foreground">{(rosterFile.size / 1024).toFixed(2)} KB</p>
                  </div>
                  <Button type="button" variant="ghost" size="icon" onClick={removeFile} className="flex-shrink-0">
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>

            <div className="flex gap-4 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                className="flex-1 h-12 text-base"
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1 h-12 text-base font-semibold" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Creating Course...
                  </>
                ) : (
                  "Create Course"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
