import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Fingerprint } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { AuthResponse } from "@/types/auth";
import { toast } from "sonner";
import { useStudentSession } from "@/providers";

export default function StudentLogin() {
  const navigate = useNavigate();
  const { login } = useStudentSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [deviceName, setDeviceName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const fromBase64Url = (value: string) => {
    const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
    const pad = base64.length % 4 === 0 ? "" : "=".repeat(4 - (base64.length % 4));
    const raw = atob(base64 + pad);
    const buffer = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) buffer[i] = raw.charCodeAt(i);
    return buffer;
  };

  const toBase64 = (buffer: ArrayBuffer) => {
    const bytes = new Uint8Array(buffer);
    let binary = "";
    bytes.forEach((b) => (binary += String.fromCharCode(b)));
    return btoa(binary); // standard base64 to match backend DTO byte[]
  };

  const prepareAssertionOptions = (options: any) => {
    const clone = { ...options };
    clone.challenge = fromBase64Url(clone.challenge);
    if (Array.isArray(clone.allowCredentials)) {
      clone.allowCredentials = clone.allowCredentials.map((cred: any) => ({
        ...cred,
        id: fromBase64Url(cred.id),
      }));
    }
    return clone;
  };

  const beginWebAuthnLogin = async () => {
    if (!email || !password) {
      toast.error("E-posta ve şifre gerekli.");
      return;
    }
    setIsLoading(true);
    try {
      // 1) Begin (now with email/password)
      const begin = await apiFetch<any>("/api/auth/login-webauthn/begin", {
        method: "POST",
        body: { email, password, deviceName },
      });

      const userId = begin.userId;
      const publicKey = prepareAssertionOptions(begin.options ?? begin);

      // 2) navigator.credentials.get
      const assertion = (await navigator.credentials.get({ publicKey })) as PublicKeyCredential;
      const res = assertion.response as AuthenticatorAssertionResponse;

      // 3) Complete
      const auth = await apiFetch<AuthResponse>("/api/auth/login-webauthn/complete", {
        method: "POST",
        body: {
          userId,
          id: assertion.id,
          type: assertion.type,
          deviceName,
          rawId: toBase64(assertion.rawId),
          authenticatorData: toBase64(res.authenticatorData),
          clientDataJSON: toBase64(res.clientDataJSON),
          signature: toBase64(res.signature),
          userHandle: res.userHandle ? toBase64(res.userHandle) : null,
        },
      });

      localStorage.setItem("student_device_name", deviceName || "Bu cihaz (passkey)");

      login(auth);
      toast.success("Giriş başarılı.");
      navigate("/student/home");
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message ?? "Giriş başarısız");
    } finally {
      setIsLoading(false);
    }
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
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="deviceName">Device Name (optional)</Label>
            <Input id="deviceName" placeholder="My Device" value={deviceName} onChange={(e) => setDeviceName(e.target.value)} />
          </div>
          <p className="text-xs text-muted-foreground">Use your fingerprint, face, or security key to continue.</p>

          <Button size="lg" className="w-full h-11" onClick={beginWebAuthnLogin} disabled={isLoading}>
            <Fingerprint className="w-4 h-4 mr-2" />
            {isLoading ? "Devam ediliyor…" : "Passkey ile devam et"}
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
