import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, QrCode, CheckCircle2, XCircle, ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useBeginCheckIn, useCompleteCheckIn, useActiveSession } from "@/hooks/attendance";
import { useStudentCourses } from "@/hooks/student";

const StudentCheckIn = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [sessionCode, setSessionCode] = useState("");
  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [locationPermission, setLocationPermission] = useState<"granted" | "denied" | "prompt">("prompt");

  const { data: courses = [] } = useStudentCourses();
  const { data: activeSession, isLoading: loadingSession } = useActiveSession(courseId);
  const beginCheckIn = useBeginCheckIn();
  const completeCheckIn = useCompleteCheckIn();

  const course = courses.find((c) => c.courseId === courseId);

  useEffect(() => {
    // Auto-request location on mount
    requestLocationPermission();
  }, []);

  useEffect(() => {
    // Re-request location when permission is granted
    if (locationPermission === "granted" && !location) {
      getCurrentLocation();
    }
  }, [locationPermission]);

  const requestLocationPermission = async () => {
    try {
      // First check current permission state
      const result = await navigator.permissions.query({ name: "geolocation" });
      setLocationPermission(result.state);

      if (result.state === "granted") {
        getCurrentLocation();
      } else if (result.state === "prompt") {
        // Trigger the permission prompt by requesting location
        getCurrentLocation();
      }

      // Listen for permission changes
      result.addEventListener("change", () => {
        setLocationPermission(result.state);
        if (result.state === "granted") {
          getCurrentLocation();
        }
      });
    } catch (error) {
      console.error("Error checking location permission:", error);
      // Fallback: just try to get location
      getCurrentLocation();
    }
  };

  const getCurrentLocation = () => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        });
        setLocationPermission("granted");
        toast.success("Konum alındı");
      },
      (error) => {
        console.error("Error getting location:", error);
        if (error.code === error.PERMISSION_DENIED) {
          setLocationPermission("denied");
          toast.error("Konum izni reddedildi");
        } else {
          toast.error("Konum alınamadı: " + error.message);
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const handleCheckIn = async () => {
    if (!activeSession) {
      toast.error("Aktif oturum bulunamadı");
      return;
    }

    if (!sessionCode.trim()) {
      toast.error("Oturum kodu gerekli");
      return;
    }

    if (!location) {
      toast.error("Konum bilgisi gerekli");
      return;
    }

    const credentialId = localStorage.getItem("student_credential_id");
    if (!credentialId) {
      toast.error("Cihaz kimliği bulunamadı. Lütfen tekrar giriş yapın.");
      return;
    }

    try {
      // Step 1: Begin check-in to get nonce
      const { nonce } = await beginCheckIn.mutateAsync({
        sessionId: activeSession.sessionId,
      });

      // Step 2: Complete check-in
      await completeCheckIn.mutateAsync({
        sessionId: activeSession.sessionId,
        nonce,
        code: sessionCode.trim(),
        latitude: location.lat,
        longitude: location.lon,
        deviceCredentialId: credentialId,
      });

      // Success - navigate back
      setTimeout(() => {
        navigate(`/student/courses/${courseId}`);
      }, 1500);
    } catch (error) {
      // Error handling is done in the hooks
      console.error("Check-in error:", error);
    }
  };

  const isCheckingIn = beginCheckIn.isPending || completeCheckIn.isPending;

  return (
    <div className="min-h-screen bg-slate-50 pb-safe-nav text-slate-900 relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-br from-blue-50 via-indigo-50/50 to-slate-50 pointer-events-none" />
      <div className="absolute top-[-10%] right-[-10%] w-[400px] h-[400px] bg-blue-100/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-[10%] left-[-10%] w-[300px] h-[300px] bg-purple-100/40 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="relative px-6 pt-8 pb-4 z-10">
        <button
          className="flex items-center gap-2 p-2 -ml-2 rounded-full hover:bg-white/60 transition-colors mb-4"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="w-5 h-5 text-slate-600" />
          <span className="text-sm font-medium text-slate-600">Geri</span>
        </button>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Yoklama</h1>
        <p className="text-sm text-slate-500 font-medium mt-1">{course?.courseName || "Ders"}</p>
      </div>

      <div className="relative px-5 space-y-4 z-10">
        {/* Session Status */}
        {loadingSession ? (
          <Card className="p-6 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          </Card>
        ) : !activeSession ? (
          <Card className="p-6 text-center border-dashed">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <QrCode className="w-6 h-6 text-slate-400" />
            </div>
            <h3 className="font-semibold text-slate-900">Aktif Oturum Yok</h3>
            <p className="text-sm text-slate-500 mt-1">Öğretmeniniz henüz yoklama başlatmadı.</p>
          </Card>
        ) : (
          <>
            {/* Location Status */}
            <Card className="p-5 bg-white/80 backdrop-blur-sm border-slate-200">
              <h2 className="font-semibold mb-3 flex items-center text-slate-900">
                <MapPin className="w-4 h-4 mr-2 text-indigo-600" />
                Konum Durumu
              </h2>

              {locationPermission === "granted" && location ? (
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-700 font-medium">Konum alındı</span>
                </div>
              ) : locationPermission === "denied" ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <XCircle className="w-4 h-4 text-rose-600" />
                    <span className="text-rose-700 font-medium">Konum izni reddedildi</span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Yoklama için konum izni gereklidir. Lütfen tarayıcı ayarlarından izin verin.
                  </p>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-slate-600 mb-3">Konum izni gerekli</p>
                  <Button onClick={requestLocationPermission} variant="default" size="sm">
                    Konumu Etkinleştir
                  </Button>
                </div>
              )}
            </Card>

            {/* Check-in Code */}
            <Card className="p-5 bg-white/80 backdrop-blur-sm border-slate-200">
              <h2 className="font-semibold mb-3 flex items-center text-slate-900">
                <QrCode className="w-4 h-4 mr-2 text-indigo-600" />
                Oturum Kodu
              </h2>

              <div className="space-y-3">
                <Input
                  placeholder="Kodu buraya girin"
                  value={sessionCode}
                  onChange={(e) => setSessionCode(e.target.value)}
                  className="text-center text-lg tracking-wider font-mono h-12 bg-white border-slate-300 rounded-xl"
                />

                <Button
                  variant="outline"
                  className="w-full h-11 gap-2 rounded-xl"
                  onClick={() => toast.info("QR tarayıcı yakında eklenecek")}
                >
                  <QrCode className="w-4 h-4" />
                  QR Kodu Tara
                </Button>
              </div>
            </Card>

            {/* Check-in Button */}
            <Card className="p-6 bg-gradient-to-br from-indigo-600 to-blue-600 text-white border-0 shadow-xl">
              <Button
                onClick={handleCheckIn}
                disabled={!sessionCode || !location || isCheckingIn}
                size="lg"
                className="w-full h-12 bg-white text-indigo-700 hover:bg-indigo-50 font-bold rounded-xl shadow-lg"
              >
                {isCheckingIn ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Yoklama Veriliyor...
                  </>
                ) : (
                  "Yoklamayı Tamamla"
                )}
              </Button>

              <p className="text-xs text-center text-indigo-100 mt-3">
                Cihaz kimliğiniz güvenlik için doğrulanacak
              </p>
            </Card>

            {/* Requirements */}
            <Card className="p-4 border-l-4 border-l-indigo-500 bg-white/60 backdrop-blur-sm">
              <h3 className="font-semibold mb-2 text-sm text-slate-900">Gereksinimler</h3>
              <ul className="text-xs text-slate-600 space-y-1">
                <li>• Öğretmenin QR kodundan alınan geçerli kod</li>
                <li>• Oturum konumundan maksimum 50 metre mesafe</li>
                <li>• Kayıtlı cihaz kimliği</li>
                <li>• Derse kayıtlı olmak</li>
              </ul>
            </Card>
          </>
        )}
      </div>
    </div>
  );
};

export default StudentCheckIn;
