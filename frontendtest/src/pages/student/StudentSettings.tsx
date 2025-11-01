import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Smartphone, LogOut, Key, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import StudentBottomNav from "@/components/student/StudentBottomNav";
import StudentPageHeader from "@/components/student/StudentPageHeader";

const StudentSettings = () => {
  const navigate = useNavigate();
  const [otpCode, setOtpCode] = useState("");

  // Mock user data
  const userData = {
    fullName: "John Doe",
    email: "john.doe@gtu.edu.tr",
    gtuId: "123456789",
    devices: [
      { id: 1, name: "iPhone 13", registered: "2024-01-15", active: true },
      { id: 2, name: "My Laptop", registered: "2024-02-20", active: false },
    ],
  };

  const handleDeviceReset = () => {
    console.log("Requesting device reset OTP");
    // POST /api/otp/reset/begin
    toast.success("OTP sent to your email");
  };

  const handleConfirmOTP = () => {
    console.log("Confirming OTP:", otpCode);
    // POST /api/otp/reset/confirm
    toast.success("Device reset authorized. Please re-register your device.");
    navigate("/student/register");
  };

  const handleLogout = () => {
    toast.success("Logged out successfully");
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="px-4 pt-2">
        <StudentPageHeader title="Settings" subtitle="Manage your account and devices" />
      </div>

      <div className="px-4 space-y-4">
        {/* Profile Info */}
        <Card className="p-4">
          <h2 className="font-semibold mb-4 flex items-center">
            <User className="w-4 h-4 mr-2" />
            Profile Information
          </h2>
          
          <div className="space-y-3">
            <div>
              <Label className="text-xs text-muted-foreground">Full Name</Label>
              <p className="font-medium">{userData.fullName}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Email</Label>
              <p className="font-medium">{userData.email}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">GTU Student ID</Label>
              <p className="font-medium">{userData.gtuId}</p>
            </div>
          </div>
        </Card>

        {/* Registered Devices */}
        <Card className="p-4">
          <h2 className="font-semibold mb-4 flex items-center">
            <Smartphone className="w-4 h-4 mr-2" />
            Registered Devices
          </h2>
          
          <div className="space-y-2">
            {userData.devices.map((device) => (
              <div
                key={device.id}
                className="flex items-center justify-between p-3 bg-muted rounded-lg"
              >
                <div>
                  <p className="font-medium">{device.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Registered: {device.registered}
                  </p>
                </div>
                {device.active && (
                  <span className="text-xs bg-success text-success-foreground px-2 py-1 rounded">
                    Active
                  </span>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* Device Reset */}
        <Card className="p-4 border-l-4 border-l-warning">
          <h2 className="font-semibold mb-3 flex items-center">
            <Key className="w-4 h-4 mr-2" />
            Reset Device Credentials
          </h2>
          
          <p className="text-sm text-muted-foreground mb-4">
            Lost your device? Reset credentials to register a new one.
          </p>

          <div className="space-y-3">
            <Button
              onClick={handleDeviceReset}
              variant="warning"
              className="w-full"
            >
              Request Reset OTP
            </Button>

            <div className="space-y-2">
              <Label htmlFor="otp">Enter OTP Code</Label>
              <Input
                id="otp"
                placeholder="Enter 6-digit OTP"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                maxLength={6}
                className="text-center tracking-wider"
              />
              <Button
                onClick={handleConfirmOTP}
                disabled={otpCode.length !== 6}
                className="w-full"
              >
                Confirm Reset
              </Button>
            </div>
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
          Logout
        </Button>
      </div>

      {/* Bottom nav comes from StudentLayout */}
    </div>
  );
};

export default StudentSettings;
