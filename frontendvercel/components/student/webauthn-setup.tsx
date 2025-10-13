"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Fingerprint, Smartphone, CheckCircle2 } from "lucide-react"
import { useRouter } from "next/navigation"

export function WebAuthnSetup() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isSetup, setIsSetup] = useState(false)

  const handleSetupWebAuthn = async () => {
    setIsLoading(true)

    // TODO: Implement actual WebAuthn setup
    console.log("[v0] Setting up WebAuthn")

    // Simulate WebAuthn setup
    setTimeout(() => {
      setIsLoading(false)
      setIsSetup(true)
    }, 2000)
  }

  const handleContinue = () => {
    router.push("/student/dashboard")
  }

  const handleSkip = () => {
    router.push("/student/dashboard")
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-4 text-center">
        <div className="flex justify-center">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
            {isSetup ? (
              <CheckCircle2 className="h-8 w-8 text-primary" />
            ) : (
              <Fingerprint className="h-8 w-8 text-primary" />
            )}
          </div>
        </div>
        <div>
          <CardTitle className="text-2xl">
            {isSetup ? "WebAuthn Setup Complete" : "Setup Biometric Authentication"}
          </CardTitle>
          <CardDescription>
            {isSetup
              ? "You can now use biometric authentication for quick attendance"
              : "Use your fingerprint or face ID for quick and secure attendance marking"}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {!isSetup ? (
          <>
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 rounded-lg bg-muted">
                <Smartphone className="h-5 w-5 text-primary mt-0.5" />
                <div className="space-y-1">
                  <p className="font-medium text-sm">Fast Attendance</p>
                  <p className="text-xs text-muted-foreground">
                    Mark your attendance in seconds using biometric authentication
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-lg bg-muted">
                <Fingerprint className="h-5 w-5 text-primary mt-0.5" />
                <div className="space-y-1">
                  <p className="font-medium text-sm">Secure & Private</p>
                  <p className="text-xs text-muted-foreground">Your biometric data never leaves your device</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Button onClick={handleSetupWebAuthn} className="w-full" disabled={isLoading}>
                {isLoading ? "Setting up..." : "Setup Biometric Authentication"}
              </Button>
              <Button onClick={handleSkip} variant="ghost" className="w-full">
                Skip for now
              </Button>
            </div>
          </>
        ) : (
          <Button onClick={handleContinue} className="w-full">
            Continue to Dashboard
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
