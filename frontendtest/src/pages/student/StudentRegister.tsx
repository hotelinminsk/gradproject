import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Fingerprint } from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { authStore } from "@/lib/authStore";
import { AuthResponse } from "@/types/auth";

const StudentRegister = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    fullName: "",
    gtuStudentId: "",
    deviceName: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const toBase64 = (buffer: ArrayBuffer) => {
    const bytes = new Uint8Array(buffer);
    let binary = "";
    bytes.forEach((b) => (binary += String.fromCharCode(b)));
    return btoa(binary); // .NET byte[] binder expects standard base64
  };

  const fromBase64Url = (value: string) => {
    const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
    const pad = base64.length % 4 === 0 ? "" : "=".repeat(4 - (base64.length % 4));
    const raw = atob(base64 + pad);
    const buffer = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) buffer[i] = raw.charCodeAt(i);
    return buffer;
  };

  const preparePublicKeyOptions = (options: any) => {
    return {
      ...options,
      challenge: fromBase64Url(options.challenge),
      user: {
        ...options.user,
        id: fromBase64Url(options.user.id),
      },
      excludeCredentials: (options.excludeCredentials || []).map((cred: any) => ({
        ...cred,
        id: fromBase64Url(cred.id),
      })),
    };
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // 1) Create student account
      const auth = await apiFetch<AuthResponse>("/api/auth/register-student", {
        method: "POST",
        body: {
          email: formData.email.trim(),
          password: formData.password,
          fullName: formData.fullName.trim(),
          gtuStudentId: formData.gtuStudentId.trim(),
        },
      });
      authStore.setToken("student", auth.token);

      // 2) Begin WebAuthn
      const begin = await apiFetch<any>("/api/auth/register-webauthn/begin", {
        method: "POST",
        body: { userId: auth.userId, deviceName: formData.deviceName },
        audience: "student",
      });
      const publicKey = preparePublicKeyOptions(begin);

      // 3) navigator.credentials.create
      const credential = (await navigator.credentials.create({ publicKey })) as PublicKeyCredential;
      const att = credential.response as AuthenticatorAttestationResponse;

      // 4) Complete WebAuthn
      await apiFetch("/api/auth/register-webauthn/complete", {
        method: "POST",
        body: {
          userId: auth.userId,
          id: credential.id,
          type: credential.type,
          rawId: toBase64(credential.rawId),
          attestationObject: toBase64(att.attestationObject),
          clientDataJSON: toBase64(att.clientDataJSON),
          deviceName: formData.deviceName,
          transports: (att as any).getTransports?.() ?? undefined,
        },
        audience: "student",
      });

      toast.success("Kayıt ve passkey tamamlandı. Şimdi giriş yapabilirsiniz.");
      navigate("/student/login");
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message ?? "Kayıt başarısız");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center px-4 pb-safe-nav">
      <Card className="w-full max-w-md p-6 space-y-6 shadow-md">
        <form onSubmit={handleRegister} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="student@gtu.edu.tr"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              placeholder="John Doe"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="gtuStudentId">GTU Student ID</Label>
            <Input
              id="gtuStudentId"
              placeholder="123456789"
              value={formData.gtuStudentId}
              onChange={(e) => setFormData({ ...formData, gtuStudentId: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="deviceName">Device Name</Label>
            <Input
              id="deviceName"
              placeholder="My Phone"
              value={formData.deviceName}
              onChange={(e) => setFormData({ ...formData, deviceName: e.target.value })}
              required
            />
          </div>

          <Button type="submit" size="lg" className="w-full" variant="secondary" disabled={isSubmitting}>
            <Fingerprint className="mr-2" />
            {isSubmitting ? "Kaydediliyor…" : "Biometrik ile kayıt ol"}
          </Button>
        </form>
        <p className="text-xs text-center text-muted-foreground">
          Your device's biometric sensor will be used for secure authentication
        </p>
        <div className="flex items-center justify-between text-xs pt-2">
          <button
            type="button"
            onClick={() => navigate("/student")}
            className="px-0 text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent hover:underline"
          >
            Have an account? Sign in
          </button>
          <span className="text-muted-foreground">GTU Attendance</span>
        </div>
      </Card>
    </div>
  );
};

export default StudentRegister;
