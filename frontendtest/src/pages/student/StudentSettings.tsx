import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { User, Smartphone, LogOut } from "lucide-react";
import StudentPageHeader from "@/components/student/StudentPageHeader";
import { useStudentSession } from "@/providers";

const StudentSettings = () => {
  const navigate = useNavigate();
  const { profile, isLoading, logout } = useStudentSession();

  const storedDeviceName = useMemo(
    () => localStorage.getItem("student_device_name") || "Bu cihaz (passkey)",
    []
  );

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="px-4 pt-2">
        <StudentPageHeader title="Ayarlar" subtitle="Hesap ve cihaz bilgileri" />
      </div>

      <div className="px-4 space-y-4">
        {/* Profile Info */}
        <Card className="p-4">
          <h2 className="font-semibold mb-4 flex items-center text-lg">
            <User className="w-4 h-4 mr-2" />
            Profil Bilgileri
          </h2>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Yükleniyor…</p>
          ) : (
            <div className="space-y-3">
              <div>
                <Label className="text-xs text-muted-foreground">Ad Soyad</Label>
                <p className="font-medium">{profile?.fullName ?? "—"}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">E-posta</Label>
                <p className="font-medium">{profile?.email ?? "—"}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">GTÜ Öğrenci No</Label>
                <p className="font-medium">{profile?.gtuStudentId ?? "—"}</p>
              </div>
            </div>
          )}
        </Card>

        {/* Registered Devices */}
        <Card className="p-4">
          <h2 className="font-semibold mb-4 flex items-center text-lg">
            <Smartphone className="w-4 h-4 mr-2" />
            Kayıtlı Cihaz
          </h2>
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div>
              <p className="font-medium">{storedDeviceName}</p>
              <p className="text-xs text-muted-foreground">Passkey kayıtlı cihaz</p>
            </div>
            <span className="text-xs bg-success/10 text-success px-2 py-1 rounded-full">Aktif</span>
          </div>
        </Card>

        {/* Logout */}
        <Button
          onClick={handleLogout}
          variant="destructive"
          className="w-full"
          size="lg"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Çıkış yap
        </Button>
      </div>

      {/* Bottom nav comes from StudentLayout */}
    </div>
  );
};

export default StudentSettings;
