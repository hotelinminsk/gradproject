import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Fingerprint } from "lucide-react";

export default function StudentLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [deviceName, setDeviceName] = useState("");

  const beginWebAuthnLogin = async () => {
    // TODO: wire to /api/auth/login-webauthn/begin and complete
    // 1) resolve userId by email (backend lookup)
    // 2) navigator.credentials.get()
    // 3) POST to /api/auth/login-webauthn/complete and store JWT
    // Temporary: simulate login so Home is accessible while wiring API
    localStorage.setItem("student_jwt", "dev-token");
    navigate("/student/home");
  };

  return (
    <div className="min-h-screen grid place-items-center px-6 pb-safe-nav">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 mx-auto grid place-items-center">
            <Fingerprint className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">Welcome Back</h1>
          <p className="text-sm text-muted-foreground">Enter your student email to sign in or register.</p>
        </div>

        <Card className="p-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Student Email</Label>
            <Input id="email" type="email" placeholder="name@university.edu" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <p className="text-xs text-muted-foreground">Use your fingerprint, face, or security key to continue.</p>

          <Button size="lg" className="w-full h-11" onClick={beginWebAuthnLogin}>
            <Fingerprint className="w-4 h-4 mr-2" />
            Continue with Passkey
          </Button>
        </Card>

        <div className="text-center">
          <button
            type="button"
            onClick={() => navigate("/student/register")}
            className="text-primary hover:underline font-medium"
          >
            Don’t have an account? Register
          </button>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Your information is protected with end-to-end encryption. We will never share your data.
        </p>
      </div>
    </div>
  );
}
