import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Fingerprint, GraduationCap, ShieldAlert, KeyRound, Smartphone, CheckCircle2 } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { AuthResponse } from "@/types/auth";
import { toast } from "sonner";
import { useStudentSession } from "@/providers";
import { startAuthentication } from "@simplewebauthn/browser";
import { useBeginDeviceReset, useConfirmDeviceReset, useRegisterDevice, base64UrlToBase64 } from "@/hooks/auth";

export default function StudentLogin() {
  const navigate = useNavigate();
  const { login } = useStudentSession();

  // Login State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [deviceName, setDeviceName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Recovery State
  const [isRecoveryOpen, setIsRecoveryOpen] = useState(false);
  const [recoveryStep, setRecoveryStep] = useState<1 | 2 | 3>(1);
  const [recoveryUserId, setRecoveryUserId] = useState("");
  const [enrollToken, setEnrollToken] = useState("");
  const [otp, setOtp] = useState("");
  const [newDeviceName, setNewDeviceName] = useState("Yeni Cihazım");

  // Hooks
  const beginReset = useBeginDeviceReset();
  const confirmReset = useConfirmDeviceReset();
  const registerDevice = useRegisterDevice();

  const beginWebAuthnLogin = async () => {
    if (!email || !password) {
      toast.error("E-posta ve şifre gerekli.");
      return;
    }
    setIsLoading(true);
    try {
      // 1. Get Options
      const begin = await apiFetch<any>("/api/auth/login-webauthn/begin", {
        method: "POST",
        body: { email, password, deviceName },
      });

      const userId = begin.userId;

      // 2. Authenticate with Browser
      const asseResp = await startAuthentication(begin.options ?? begin);

      // 3. Complete Login
      const auth = await apiFetch<AuthResponse>("/api/auth/login-webauthn/complete", {
        method: "POST",
        body: {
          userId,
          id: asseResp.id,
          rawId: base64UrlToBase64(asseResp.rawId),
          type: asseResp.type,
          clientDataJSON: base64UrlToBase64(asseResp.response.clientDataJSON),
          authenticatorData: base64UrlToBase64(asseResp.response.authenticatorData),
          signature: base64UrlToBase64(asseResp.response.signature),
          userHandle: asseResp.response.userHandle ? base64UrlToBase64(asseResp.response.userHandle) : null,
          deviceName // optional
        },
      });

      // Store device name and Credential ID for UI if successful
      localStorage.setItem("student_device_name", deviceName || "Bu cihaz (passkey)");
      localStorage.setItem("student_credential_id", asseResp.id);

      login(auth);
      navigate("/student/home");
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message ?? "Giriş başarısız. Cihazınız kayıtlı mı?");
    } finally {
      setIsLoading(false);
    }
  };

  // --- Recovery Logic ---

  const handleRecoveryAuth = async () => {
    if (!email || !password) {
      toast.error("Lütfen önce E-posta ve Şifrenizi girin.");
      return;
    }
    try {
      // We use login-begin to validate credentials and get UserID
      // We catch the error because it might fail if no active credentials exist (which is fine for recovery!)
      // Wait, AuthController.BeginWebAuthnLogin checks password first.
      // If password is correct, it proceeds to check credentials.
      // It returns { userId, options }.
      // If NO credentials exist, does it fail?
      // Line 405: "var q = ... Where(c => c.IsActive)"
      // Line 415: "CreateAssertionOptions(allowed, ...)"
      // If allowed is empty, it might return empty options or throw depending on Fido2 implementation.
      // BUT it returns `userId` in the OK response (Line 418).
      // So even if options are empty, we get UserID! Perfect.

      const res = await apiFetch<any>("/api/auth/login-webauthn/begin", {
        method: "POST",
        body: { email, password }
      });

      const uid = res.userId;
      setRecoveryUserId(uid);

      // Now begin reset OTP flow
      beginReset.mutate({ userId: uid, gtuId: "RESET_REQUEST" }, {
        onSuccess: () => {
          setRecoveryStep(2);
          toast.info("Onay kodu gönderildi (Backend Konsol)");
        }
      });

    } catch (err: any) {
      // If it fails with "Invalid credentials", user typed wrong password.
      toast.error("Şifre hatalı veya kullanıcı bulunamadı.");
    }
  };

  const handleVerifyOTP = () => {
    confirmReset.mutate({ userId: recoveryUserId, otp }, {
      onSuccess: (data) => {
        setEnrollToken(data.enrollToken);
        setRecoveryStep(3);
        toast.success("Cihaz sıfırlandı!");
      }
    });
  };

  const handleRegisterNewDevice = () => {
    registerDevice.mutate({
      userId: recoveryUserId,
      deviceName: newDeviceName,
      enrollToken
    }, {
      onSuccess: () => {
        setIsRecoveryOpen(false);
        setRecoveryStep(1); // Reset
        toast.success("Yeni cihaz kaydedildi! Şimdi giriş yapabilirsiniz.", { duration: 5000 });
      }
    });
  };

  return (
    <div className="min-h-screen grid place-items-center bg-slate-50/50 sm:px-4 pb-safe-nav font-sans">
      <div className="w-full max-w-[420px]">
        {/* Brand Header */}
        <div className="mb-8 text-center space-y-2 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="w-14 h-14 bg-white border border-slate-100 rounded-2xl mx-auto flex items-center justify-center shadow-sm">
            <GraduationCap className="w-8 h-8 text-indigo-600" />
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
                className="h-11 bg-slate-50 border-slate-200 focus:bg-white focus:border-indigo-500 transition-all rounded-xl"
                placeholder="ogrenci@gtu.edu.tr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-slate-700 font-medium">Şifre</Label>
              </div>
              <Input
                id="password"
                type="password"
                className="h-11 bg-slate-50 border-slate-200 focus:bg-white focus:border-indigo-500 transition-all rounded-xl"
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
              <Label htmlFor="deviceName" className="text-slate-700 font-medium">Cihaz İsmi (İsteğe bağlı)</Label>
              <Input
                id="deviceName"
                className="h-11 bg-slate-50 border-slate-200 focus:bg-white focus:border-indigo-500 transition-all rounded-xl"
                placeholder="Örn: Telefonum"
                value={deviceName}
                onChange={(e) => setDeviceName(e.target.value)}
              />
            </div>

            <Button
              size="lg"
              className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-lg shadow-indigo-500/20 active:scale-[0.98] transition-all"
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

            <div className="text-center">
              <button
                type="button"
                onClick={() => setIsRecoveryOpen(true)}
                className="text-xs font-semibold text-rose-500 hover:text-rose-600 hover:underline flex items-center justify-center gap-1.5 mx-auto"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                Cihazıma erişemiyorum / Kaybettim
              </button>
            </div>
          </div>

          <div className="mt-8 text-center pt-4 border-t border-slate-50">
            <p className="text-sm text-slate-500">
              Hesabınız yok mu?
              <button
                type="button"
                onClick={() => navigate("/student/register")}
                className="ml-1 font-semibold text-indigo-600 hover:text-indigo-700 hover:underline transition-colors"
              >
                Şimdi Kaydol
              </button>
            </p>
          </div>
        </Card>
      </div>

      {/* RECOVERY DIALOG */}
      <Dialog open={isRecoveryOpen} onOpenChange={setIsRecoveryOpen}>
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <ShieldAlert className="w-5 h-5 text-rose-500" />
              Cihaz Kurtarma & Sıfırlama
            </DialogTitle>
            <DialogDescription>
              Eski cihazınıza erişemiyorsanız, buradan sıfırlayıp yeni cihazınızı tanımlayabilirsiniz.
            </DialogDescription>
          </DialogHeader>

          <div className="py-2">
            {recoveryStep === 1 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                <div className="p-3 bg-slate-50 rounded-lg text-sm text-slate-600 border border-slate-100">
                  <strong>1. Adım:</strong> Kimlik doğrulaması için e-posta ve şifrenizi ana ekranda doğru girdiğinizden emin olun.
                </div>
                <Button onClick={handleRecoveryAuth} disabled={beginReset.isPending} className="w-full bg-slate-900 text-white">
                  {beginReset.isPending ? "Kontrol Ediliyor..." : "Kimliğimi Doğrula ve Kod Gönder"}
                </Button>
              </div>
            )}

            {recoveryStep === 2 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                <Label>Onay Kodu (OTP)</Label>
                <Input
                  value={otp}
                  onChange={e => setOtp(e.target.value)}
                  placeholder="123456"
                  className="text-center font-mono text-lg tracking-widest"
                  maxLength={6}
                />
                <p className="text-xs text-slate-400 text-center">Backend konsolunu kontrol edin.</p>
                <Button onClick={handleVerifyOTP} disabled={confirmReset.isPending} className="w-full bg-rose-600 hover:bg-rose-700 text-white">
                  {confirmReset.isPending ? "Doğrulanıyor..." : "Kodu Doğrula ve Cihazı Sıfırla"}
                </Button>
              </div>
            )}

            {recoveryStep === 3 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 text-center">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-2">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-900">Sıfırlama Başarılı!</h3>
                <p className="text-sm text-slate-500 mb-4">
                  Şimdi bu cihazı hesabınıza tanımlayın.
                </p>

                <div className="text-left space-y-2">
                  <Label>Yeni Cihaz İsmi</Label>
                  <Input
                    value={newDeviceName}
                    onChange={e => setNewDeviceName(e.target.value)}
                    placeholder="Örn: Yeni Telefonum"
                  />
                </div>

                <Button onClick={handleRegisterNewDevice} disabled={registerDevice.isPending} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white mt-2">
                  {registerDevice.isPending ? "Kaydediliyor..." : "Bu Cihazı Kaydet"}
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
