import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Fingerprint, GraduationCap, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { AuthResponse } from "@/types/auth";
import { useStudentSession } from "@/providers";

const StudentRegister = () => {
  const navigate = useNavigate();
  const { login } = useStudentSession();
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
    return btoa(binary);
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
      const auth = await apiFetch<AuthResponse>("/api/auth/register-student", {
        method: "POST",
        body: {
          email: formData.email.trim(),
          password: formData.password,
          fullName: formData.fullName.trim(),
          gtuStudentId: formData.gtuStudentId.trim(),
        },
      });
      login(auth);

      const begin = await apiFetch<any>("/api/auth/register-webauthn/begin", {
        method: "POST",
        body: { userId: auth.userId, deviceName: formData.deviceName },
        audience: "student",
      });
      const publicKey = preparePublicKeyOptions(begin);

      const credential = (await navigator.credentials.create({ publicKey })) as PublicKeyCredential;
      const att = credential.response as AuthenticatorAttestationResponse;

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

      localStorage.setItem("student_device_name", formData.deviceName || "Bu cihaz (passkey)");

      toast.success("Kayıt ve passkey tamamlandı.");
      navigate("/student/home");
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message ?? "Kayıt başarısız");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center bg-slate-50/50 sm:px-4 pb-safe-nav font-sans">
      <div className="w-full max-w-[480px]">
        {/* Brand Header */}
        <div className="mb-8 text-center space-y-2 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="w-14 h-14 bg-blue-600 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-blue-200">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Hesap Oluştur</h1>
          <p className="text-slate-500">GTU Attend öğrenci portalına katılın.</p>
        </div>

        <Card className="border-0 sm:border sm:border-slate-100 sm:shadow-xl sm:shadow-slate-200/40 bg-white p-6 sm:p-10 rounded-none sm:rounded-3xl">
          <form onSubmit={handleRegister} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="fullName" className="text-slate-700 font-medium">Ad Soyad</Label>
                <Input
                  id="fullName"
                  className="h-11 bg-slate-50 border-slate-200 focus:bg-white focus:border-blue-500 transition-all rounded-xl"
                  placeholder="Ali Yılmaz"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="gtuStudentId" className="text-slate-700 font-medium">Öğrenci No</Label>
                <Input
                  id="gtuStudentId"
                  className="h-11 bg-slate-50 border-slate-200 focus:bg-white focus:border-blue-500 transition-all rounded-xl"
                  placeholder="210..."
                  value={formData.gtuStudentId}
                  onChange={(e) => setFormData({ ...formData, gtuStudentId: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-slate-700 font-medium">Email Adresi</Label>
              <Input
                id="email"
                type="email"
                className="h-11 bg-slate-50 border-slate-200 focus:bg-white focus:border-blue-500 transition-all rounded-xl"
                placeholder="ogrenci@gtu.edu.tr"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-slate-700 font-medium">Şifre</Label>
              <Input
                id="password"
                type="password"
                className="h-11 bg-slate-50 border-slate-200 focus:bg-white focus:border-blue-500 transition-all rounded-xl"
                placeholder="En az 8 karakter"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
            </div>

            {/* Separator for Biometrics */}
            <div className="py-2 flex items-center gap-3">
              <div className="h-px bg-slate-100 flex-1" />
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Passkey Kurulumu</span>
              <div className="h-px bg-slate-100 flex-1" />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="deviceName" className="text-slate-700 font-medium">Cihaz İsmi</Label>
              <p className="text-xs text-slate-500 mb-1.5">Bu cihazı tanımamız için bir isim verin (Örn: iPhone 13, Laptop)</p>
              <Input
                id="deviceName"
                className="h-11 bg-slate-50 border-slate-200 focus:bg-white focus:border-blue-500 transition-all rounded-xl"
                placeholder="Örn: Telefonum"
                value={formData.deviceName}
                onChange={(e) => setFormData({ ...formData, deviceName: e.target.value })}
                required
              />
            </div>


            <Button type="submit" className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all" disabled={isSubmitting}>
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Kaydediliyor...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Fingerprint className="w-5 h-5" />
                  Biometrik ile Kayıt Ol
                </span>
              )}
            </Button>
          </form>

          <p className="mt-8 text-center text-sm text-slate-500">
            Zaten hesabınız var mı?
            <button
              type="button"
              onClick={() => navigate("/student")}
              className="ml-1 font-semibold text-blue-600 hover:text-blue-700 hover:underline transition-colors"
            >
              Giriş Yap
            </button>
          </p>

          <div className="mt-8 text-center">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-50 text-[10px] font-medium text-slate-400">
              <ShieldCheckIcon className="w-3 h-3" />
              Uçtan uca şifreli & güvenli
            </span>
          </div>

        </Card>
      </div>
    </div>
  );
};

const ShieldCheckIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
)

export default StudentRegister;
