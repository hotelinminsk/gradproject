"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { QrCode, Clock, CheckCircle2 } from "lucide-react"
import { QRCodeSVG } from "qrcode.react"

interface AttendanceSessionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  courseId: string
  courseName: string
}

export function AttendanceSessionDialog({ open, onOpenChange, courseId, courseName }: AttendanceSessionDialogProps) {
  const [timeRemaining, setTimeRemaining] = useState(15 * 60) // 15 minutes in seconds
  const [attendedCount, setAttendedCount] = useState(0)
  const [sessionId] = useState(() => `session-${Date.now()}`)

  // Generate QR code data
  const qrData = JSON.stringify({
    sessionId,
    courseId,
    timestamp: Date.now(),
  })

  useEffect(() => {
    if (!open) {
      setTimeRemaining(15 * 60)
      setAttendedCount(0)
      return
    }

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 0) {
          clearInterval(interval)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    // Simulate students checking in
    const checkInInterval = setInterval(() => {
      setAttendedCount((prev) => prev + Math.floor(Math.random() * 3))
    }, 3000)

    return () => {
      clearInterval(interval)
      clearInterval(checkInInterval)
    }
  }, [open])

  const minutes = Math.floor(timeRemaining / 60)
  const seconds = timeRemaining % 60

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Attendance Session Active
          </DialogTitle>
          <DialogDescription>
            Students can scan this QR code to mark their attendance for {courseName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* QR Code */}
          <div className="flex justify-center p-6 bg-background rounded-lg border-2 border-dashed">
            <QRCodeSVG value={qrData} size={200} level="H" />
          </div>

          {/* Timer */}
          <div className="flex items-center justify-center gap-2">
            <Clock className="h-5 w-5 text-muted-foreground" />
            <div className="text-center">
              <div className="text-3xl font-bold tabular-nums">
                {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {timeRemaining > 0 ? "Time remaining" : "Session expired"}
              </p>
            </div>
          </div>

          {/* Status Badge */}
          <div className="flex justify-center">
            <Badge variant={timeRemaining > 0 ? "default" : "secondary"} className="text-sm px-4 py-2">
              {timeRemaining > 0 ? "Valid for 15 minutes" : "Session Ended"}
            </Badge>
          </div>

          {/* Attendance Counter */}
          <div className="flex items-center justify-center gap-3 p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              <div>
                <div className="text-2xl font-bold">{attendedCount}</div>
                <p className="text-xs text-muted-foreground">Students checked in</p>
              </div>
            </div>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            This QR code will automatically expire after 15 minutes
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
