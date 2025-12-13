import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Fingerprint, GraduationCap, ArrowRight } from "lucide-react";
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

  // Helper functions for WebAuthn logic (kept same as before)
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
    return btoa(binary);
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
      const begin = await apiFetch<any>("/api/auth/login-webauthn/begin", {
        method: "POST",
        body: { email, password, deviceName },
      });

      const userId = begin.userId;
      const publicKey = prepareAssertionOptions(begin.options ?? begin);

      const assertion = (await navigator.credentials.get({ publicKey })) as PublicKeyCredential;
      const res = assertion.response as AuthenticatorAssertionResponse;

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

      // Store credential ID for check-in
      localStorage.setItem('student_credential_id', assertion.id);

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
    <div className="min-h-screen grid place-items-center bg-slate-50/50 sm:px-4 pb-safe-nav font-sans">
      <div className="w-full max-w-[420px]">

        {/* Brand Header */}
        <div className="mb-8 text-center space-y-2 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="w-14 h-14 bg-white border border-slate-100 rounded-2xl mx-auto flex items-center justify-center shadow-sm">
            <GraduationCap className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Tekrar Hoşgeldiniz</h1>
          <p className="text-slate-500">Hesabınıza giriş yapın</p>
        </div>

        <Card className="border-0 sm:border sm:border-slate-100 sm:shadow-xl sm:shadow-slate-200/40 bg-white p-6 sm:p-10 rounded-none sm:rounded-3xl">
          <div className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-slate-700 font-medium">Email Adresi</Label>
              <Input
                id="email"
                type="email"
                className="h-11 bg-slate-50 border-slate-200 focus:bg-white focus:border-blue-500 transition-all rounded-xl"
                placeholder="ogrenci@gtu.edu.tr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-slate-700 font-medium">Şifre</Label>
                <span className="text-xs font-semibold text-blue-600 cursor-pointer hover:underline">Şifremi unuttum?</span>
              </div>
              <Input
                id="password"
                type="password"
                className="h-11 bg-slate-50 border-slate-200 focus:bg-white focus:border-blue-500 transition-all rounded-xl"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {/* Separator for Device Name / Passkey */}
            <div className="py-2 flex items-center gap-3">
              <div className="h-px bg-slate-100 flex-1" />
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Passkey Girişi</span>
              <div className="h-px bg-slate-100 flex-1" />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="deviceName" className="text-slate-700 font-medium">Cihaz İsmi (Varsa)</Label>
              <Input
                id="deviceName"
                className="h-11 bg-slate-50 border-slate-200 focus:bg-white focus:border-blue-500 transition-all rounded-xl"
                placeholder="Örn: Telefonum"
                value={deviceName}
                onChange={(e) => setDeviceName(e.target.value)}
              />
            </div>

            <Button
              size="lg"
              className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all"
              onClick={beginWebAuthnLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Doğrulanıyor...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Fingerprint className="w-5 h-5" />
                  Biometrik ile Giriş Yap
                </span>
              )}
            </Button>
          </div>

          <div className="mt-8 text-center pt-4 border-t border-slate-50">
            <p className="text-sm text-slate-500">
              Hesabınız yok mu?
              <button
                type="button"
                onClick={() => navigate("/student/register")}
                className="ml-1 font-semibold text-blue-600 hover:text-blue-700 hover:underline transition-colors"
              >
                Şimdi Kaydol
              </button>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
