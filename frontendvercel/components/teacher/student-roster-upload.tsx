"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2, Loader2 } from "lucide-react"

interface StudentRosterUploadProps {
  courseId: string
}

export function StudentRosterUpload({ courseId }: StudentRosterUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<"idle" | "success" | "error">("idle")
  const [message, setMessage] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      const validTypes = [
        "text/csv",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ]
      if (!validTypes.includes(file.type) && !file.name.match(/\.(csv|xlsx)$/i)) {
        setUploadStatus("error")
        setMessage("Please upload a CSV or XLSX file")
        return
      }

      setSelectedFile(file)
      setUploadStatus("idle")
      setMessage("")
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    setIsUploading(true)
    setUploadStatus("idle")

    try {
      // TODO: Implement actual file upload API call
      // const formData = new FormData()
      // formData.append('file', selectedFile)
      // formData.append('courseId', courseId)
      // const response = await fetch('/api/teacher/courses/roster/upload', {
      //   method: 'POST',
      //   body: formData,
      // })

      // Simulate upload
      await new Promise((resolve) => setTimeout(resolve, 2000))

      setUploadStatus("success")
      setMessage(`Successfully uploaded roster with ${Math.floor(Math.random() * 50) + 20} students`)
      setSelectedFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    } catch (err) {
      setUploadStatus("error")
      setMessage("Failed to upload roster. Please check the file format and try again.")
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="border-2 border-dashed border-border rounded-lg p-8 text-center space-y-4">
        <div className="flex justify-center">
          <div className="p-3 bg-muted rounded-lg">
            <FileSpreadsheet className="h-8 w-8 text-muted-foreground" />
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">Upload Student Roster</p>
          <p className="text-xs text-muted-foreground">CSV or XLSX file with NAME and GTUid columns</p>
        </div>

        <div className="flex flex-col items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx"
            onChange={handleFileSelect}
            className="hidden"
            id="roster-upload"
          />
          <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="gap-2">
            <Upload className="h-4 w-4" />
            Choose File
          </Button>
          {selectedFile && (
            <p className="text-xs text-muted-foreground">
              Selected: <span className="font-medium">{selectedFile.name}</span>
            </p>
          )}
        </div>
      </div>

      {selectedFile && !isUploading && uploadStatus === "idle" && (
        <Button onClick={handleUpload} className="w-full gap-2">
          <Upload className="h-4 w-4" />
          Upload Roster
        </Button>
      )}

      {isUploading && (
        <Alert>
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertDescription>Uploading and processing roster...</AlertDescription>
        </Alert>
      )}

      {uploadStatus === "success" && (
        <Alert className="border-green-500/50 bg-green-500/10">
          <CheckCircle2 className="h-4 w-4 text-green-500" />
          <AlertDescription className="text-green-500">{message}</AlertDescription>
        </Alert>
      )}

      {uploadStatus === "error" && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}

      <div className="text-xs text-muted-foreground space-y-1">
        <p className="font-medium">File Requirements:</p>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li>File format: CSV or XLSX</li>
          <li>Required columns: NAME, GTUid</li>
          <li>Example: "Ahmet Yılmaz", "190101001"</li>
        </ul>
      </div>
    </div>
  )
}
