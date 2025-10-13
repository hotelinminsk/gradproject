import { WebAuthnSetup } from "@/components/student/webauthn-setup"

export default function WebAuthnPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <WebAuthnSetup />
    </div>
  )
}
