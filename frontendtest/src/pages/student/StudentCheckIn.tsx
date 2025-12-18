import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { MapPin, QrCode, CheckCircle2, XCircle, ArrowLeft, Loader2, Camera } from "lucide-react";
import { toast } from "sonner";
import { useBeginCheckIn, useCompleteCheckIn, useActiveSession } from "@/hooks/attendance";
import { useStudentCourses } from "@/hooks/student";
import { useQueryClient } from "@tanstack/react-query";
import { Html5QrcodeScanner } from "html5-qrcode";

const StudentCheckIn = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [sessionCode, setSessionCode] = useState("");
  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [locationPermission, setLocationPermission] = useState<"granted" | "denied" | "prompt">("prompt");
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  const { data: courses = [] } = useStudentCourses();
  const { data: activeSession, isLoading: loadingSession } = useActiveSession(courseId);
  const beginCheckIn = useBeginCheckIn();
  const completeCheckIn = useCompleteCheckIn();

  const course = courses.find((c) => c.courseId === courseId);

  useEffect(() => {
    requestLocationPermission();
  }, []);

  useEffect(() => {
    if (locationPermission === "granted" && !location) {
      getCurrentLocation();
    }
  }, [locationPermission]);

  useEffect(() => {
    let scanner: Html5QrcodeScanner | null = null;
    if (isScannerOpen) {
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        const config = { fps: 10, qrbox: { width: 250, height: 250 } };
        scanner = new Html5QrcodeScanner("reader", config, /* verbose= */ false);
        scanner.render(
          (decodedText) => {
            // Success
            setSessionCode(decodedText);
            setIsScannerOpen(false);
            toast.success("QR Kod okundu!");
            scanner?.clear();
          },
          (errorMessage) => {
            // parse error, ignore
          }
        );
        scannerRef.current = scanner;
      }, 100);
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(err => console.warn("Failed to clear scanner", err));
      }
    }
  }, [isScannerOpen]);

  const requestLocationPermission = async () => {
    try {
      const result = await navigator.permissions.query({ name: "geolocation" });
      setLocationPermission(result.state);
      if (result.state === "granted" || result.state === "prompt") {
        getCurrentLocation();
      }
      result.addEventListener("change", () => {
        setLocationPermission(result.state);
        if (result.state === "granted") getCurrentLocation();
      });
    } catch {
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
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          setLocationPermission("denied");
          toast.error("Konum izni reddedildi");
        } else {
          console.error(error);
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleCheckIn = async () => {
    if (!activeSession) return toast.error("Aktif oturum bulunamadı");
    if (!sessionCode.trim()) return toast.error("Oturum kodu gerekli");
    if (!location) {
      requestLocationPermission();
      return toast.error("Konum bilgisi gerekli.");
    }

    const credentialId = localStorage.getItem("student_credential_id");
    if (!credentialId) {
      return toast.error("Cihaz kimliği bulunamadı. Lütfen çıkış yapıp tekrar giriş yapın.");
    }

    try {
      const beginResponse = await beginCheckIn.mutateAsync({
        sessionId: activeSession.sessionId,
      });

      if (!beginResponse?.nonce) throw new Error("Sunucudan güvenlik anahtarı alınamadı.");

      await completeCheckIn.mutateAsync({
        sessionId: activeSession.sessionId,
        nonce: beginResponse.nonce,
        code: sessionCode.trim(),
        latitude: location.lat,
        longitude: location.lon,
        deviceCredentialId: credentialId,
      });

      await queryClient.invalidateQueries({ queryKey: ["student-courses"], refetchType: "all" });
      setTimeout(() => navigate(`/student/courses/${courseId}`), 2000);
    } catch (error: any) {
      if (!beginCheckIn.isError && !completeCheckIn.isError) {
        toast.error("Hata: " + (error?.message || "Bilinmiyor"));
      }
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

      <div className="relative px-5 space-y-4 z-10 pb-20">
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
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-slate-600 mb-3">Konum izni gerekli</p>
                  <Button onClick={requestLocationPermission} variant="default" size="sm">
                    Konumu Etkinleştir
                  </Button>
                </div>
              )}
            </Card>

            <Card className="p-5 bg-white/80 backdrop-blur-sm border-slate-200">
              <h2 className="font-semibold mb-3 flex items-center text-slate-900">
                <QrCode className="w-4 h-4 mr-2 text-indigo-600" />
                Oturum Kodu
              </h2>
              <div className="space-y-3">
                <Input
                  placeholder="Kodu girin"
                  value={sessionCode}
                  onChange={(e) => setSessionCode(e.target.value)}
                  className="text-center text-lg tracking-wider font-mono h-12 bg-white border-slate-300 rounded-xl"
                />
                <Dialog open={isScannerOpen} onOpenChange={setIsScannerOpen}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full h-11 gap-2 rounded-xl"
                    >
                      <Camera className="w-4 h-4" />
                      QR Kodu Tara
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-black border-slate-800">
                    <div id="reader" className="w-full h-[400px] bg-black text-white" />
                    <div className="absolute top-4 right-4 z-50">
                      <Button variant="ghost" size="sm" onClick={() => setIsScannerOpen(false)} className="bg-black/50 text-white hover:bg-black/70">
                        Kapat
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </Card>

            <Button
              onClick={handleCheckIn}
              disabled={!sessionCode || !location || isCheckingIn}
              size="lg"
              className="w-full h-14 text-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-xl shadow-indigo-500/20"
            >
              {isCheckingIn ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Yoklama Veriliyor...
                </>
              ) : (
                "Yoklamayı Tamamla"
              )}
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default StudentCheckIn;
