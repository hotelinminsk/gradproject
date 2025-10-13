"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { QrCode, Camera, CheckCircle2, XCircle } from "lucide-react"

export function QRScanner() {
  const [isScanning, setIsScanning] = useState(false)
  const [scanResult, setScanResult] = useState<"success" | "error" | null>(null)

  const handleStartScan = () => {
    setIsScanning(true)
    setScanResult(null)

    // TODO: Implement actual QR scanning
    console.log("[v0] Starting QR scan")

    // Simulate scan result
    setTimeout(() => {
      setIsScanning(false)
      setScanResult("success")
    }, 2000)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">QR Scanner</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Scan the QR code displayed by your instructor to mark attendance
        </p>
      </div>

      <Card>
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
              {scanResult === "success" ? (
                <CheckCircle2 className="h-10 w-10 text-primary" />
              ) : scanResult === "error" ? (
                <XCircle className="h-10 w-10 text-destructive" />
              ) : (
                <QrCode className="h-10 w-10 text-primary" />
              )}
            </div>
          </div>
          <CardTitle>
            {scanResult === "success" ? "Attendance Marked!" : scanResult === "error" ? "Scan Failed" : "Ready to Scan"}
          </CardTitle>
          <CardDescription>
            {scanResult === "success"
              ? "Your attendance has been successfully recorded"
              : scanResult === "error"
                ? "Please try again or contact your instructor"
                : "Position the QR code within the frame"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Scanner Frame */}
          <div className="aspect-square bg-muted rounded-lg border-2 border-dashed flex items-center justify-center relative overflow-hidden">
            {isScanning ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-full w-1 bg-primary animate-pulse" />
              </div>
            ) : (
              <Camera className="h-16 w-16 text-muted-foreground" />
            )}
          </div>

          <Button
            onClick={handleStartScan}
            className="w-full"
            disabled={isScanning}
            variant={scanResult === "success" ? "outline" : "default"}
          >
            {isScanning ? "Scanning..." : scanResult === "success" ? "Scan Again" : "Start Scanning"}
          </Button>

          {scanResult === "success" && (
            <div className="p-4 bg-primary/10 rounded-lg">
              <p className="text-sm font-medium">Computer Networks - CSE301</p>
              <p className="text-xs text-muted-foreground mt-1">Marked at {new Date().toLocaleTimeString()}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
