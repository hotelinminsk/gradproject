import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { User, Smartphone, LogOut, ShieldAlert, RefreshCw, Plus, Fingerprint } from "lucide-react";
import { useStudentSession } from "@/providers";
import { useBeginDeviceReset, useConfirmDeviceReset, useRegisterDevice } from "@/hooks/auth";
import { toast } from "sonner";

const StudentSettings = () => {
  const navigate = useNavigate();
  const { profile, isLoading, logout } = useStudentSession();
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [otp, setOtp] = useState("");

  // Hooks
  const beginReset = useBeginDeviceReset();
  const confirmReset = useConfirmDeviceReset();
  const registerDevice = useRegisterDevice();

  const storedDeviceName = useMemo(
    () => localStorage.getItem("student_device_name"),
    []
  );

  // Check if we effectively have a device registered (locally known)
  // Logic: If user is logged in, they technically have a device registered backend-side 
  // unless they just reset it. We use localStorage as a hint, but the real truth is 
  // if the backend allows registration.
  // Ideally we would fetch "hasActiveCredential" from backend, but for now we manage state carefully.
  const [hasLocalCredential, setHasLocalCredential] = useState(!!storedDeviceName);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleStartReset = () => {
    if (!profile?.userId) return;
    beginReset.mutate({ userId: profile.userId, gtuId: profile.gtuStudentId }, {
      onSuccess: () => {
        setResetDialogOpen(true);
        // OTP is in backend console for now
        toast.info("Sıfırlama kodu gönderildi (Simülasyon)");
      }
    });
  };

  const handleConfirmReset = () => {
    if (!profile?.userId || !otp) return;
    confirmReset.mutate({ userId: profile.userId, otp }, {
      onSuccess: (data) => {
        setResetDialogOpen(false);
        setHasLocalCredential(false);
        localStorage.removeItem("student_device_name");
        localStorage.removeItem("student_credential_id");
        // We can immediately trigger registration if we have the token, 
        // but let's let the user click "Register" to be explicit.
        // We might want to store the enrollToken temporarily if needed, 
        // but the register hook allows passing it.
        // For simplicity in this flow, assuming backend allows logged-in user to register 
        // without token if they rely on session. 
        // BUT wait, confirmReset deactivated the credential. 
        // The user is still logged in with JWT. 
        // So they can call register-begin purely based on JWT session?
        // YES, AuthController.cs Check: IsStudentAuthenticated(request.UserId) -> returns true.
        // So we don't strictly need the enrollToken if we are already logged in!
      }
    });
  };

  const handleRegisterDevice = () => {
    if (!profile?.userId) return;

    // Prompt for device name or just use a default
    const deviceName = prompt("Cihazınıza bir isim verin:", "Telefonum") || "Yeni Cihaz";

    registerDevice.mutate({ userId: profile.userId, deviceName }, {
      onSuccess: () => {
        setHasLocalCredential(true);
        localStorage.setItem("student_device_name", deviceName);
        toast.success("Cihaz başarıyla eklendi.");
      }
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-safe-nav text-slate-900 relative">
      {/* Background Gradients */}
      <div className="absolute top-0 left-0 right-0 h-[400px] bg-gradient-to-br from-indigo-50 via-purple-50/50 to-slate-50 pointer-events-none" />

      <div className="relative px-6 pt-12 pb-6 z-10">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Ayarlar</h1>
        <p className="text-sm text-slate-500 font-medium mt-1">Hesap ve güvenlik işlemleri</p>
      </div>

      <div className="px-5 space-y-6 relative z-10 pb-20">
        {/* Profile Info */}
        <Card className="p-5 border-slate-100 shadow-sm bg-white/80 backdrop-blur-md rounded-2xl">
          <h2 className="font-bold mb-4 flex items-center text-slate-800">
            <User className="w-5 h-5 mr-2 text-indigo-600" />
            Profil Bilgileri
          </h2>
          {isLoading ? (
            <div className="space-y-3 animate-pulse">
              <div className="h-4 bg-slate-100 rounded w-1/2"></div>
              <div className="h-4 bg-slate-100 rounded w-3/4"></div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-2 text-sm">
                <span className="text-slate-400 font-medium col-span-1">Ad Soyad</span>
                <span className="text-slate-900 font-semibold col-span-2 text-right">{profile?.fullName ?? "—"}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <span className="text-slate-400 font-medium col-span-1">E-posta</span>
                <span className="text-slate-900 font-semibold col-span-2 text-right truncate">{profile?.email ?? "—"}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <span className="text-slate-400 font-medium col-span-1">Öğrenci No</span>
                <span className="text-slate-900 font-semibold col-span-2 text-right">{profile?.gtuStudentId ?? "—"}</span>
              </div>
            </div>
          )}
        </Card>

        {/* Registered Devices */}
        <Card className="p-5 border-slate-100 shadow-sm bg-white/80 backdrop-blur-md rounded-2xl">
          <h2 className="font-bold mb-4 flex items-center text-slate-800">
            <Smartphone className="w-5 h-5 mr-2 text-indigo-600" />
            Cihaz Yönetimi
          </h2>

          {hasLocalCredential ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-indigo-50/50 border border-indigo-100 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-indigo-600">
                    <Fingerprint className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 text-sm">{storedDeviceName || "Kayıtlı Cihaz"}</p>
                    <p className="text-xs text-indigo-600 font-medium">Aktif</p>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <p className="text-xs text-slate-500 mb-3">
                  Başka bir cihazdan giriş yapmak için mevcut cihaz kaydını sıfırlamanız gerekir.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700 h-10 rounded-xl font-semibold"
                  onClick={handleStartReset}
                  disabled={beginReset.isPending}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Cihazı Sıfırla
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 px-2">
              <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 mb-1">Cihaz Kaydı Yok</h3>
              <p className="text-xs text-slate-500 mb-4 max-w-[200px] mx-auto">
                Hesabınıza giriş yapabilmek için bu cihazı kaydetmelisiniz.
              </p>
              <Button
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-200 h-11 font-semibold"
                onClick={handleRegisterDevice}
                disabled={registerDevice.isPending}
              >
                <Plus className="w-4 h-4 mr-2" />
                Bu Cihazı Kaydet
              </Button>
            </div>
          )}
        </Card>

        {/* Logout */}
        <Button
          onClick={handleLogout}
          variant="ghost"
          className="w-full h-12 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl font-semibold"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Oturumu Kapat
        </Button>
      </div>

      {/* Reset Confirmation Dialog */}
      <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Cihaz Sıfırlama</DialogTitle>
            <DialogDescription>
              Güvenlik için, üretilen onay kodunu (OTP) giriniz.
              <br />
              <span className="text-xs text-slate-400">(Geliştirme modu: Kodu backend konsolundan alınız)</span>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Onay Kodu</Label>
              <Input
                value={otp}
                onChange={e => setOtp(e.target.value)}
                placeholder="123456"
                className="text-center text-lg tracking-widest font-mono"
                maxLength={6}
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setResetDialogOpen(false)}>İptal</Button>
            <Button onClick={handleConfirmReset} disabled={confirmReset.isPending} className="bg-rose-600 hover:bg-rose-700 text-white">
              {confirmReset.isPending ? "Sıfırlanıyor..." : "Onayla ve Sıfırla"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StudentSettings;
