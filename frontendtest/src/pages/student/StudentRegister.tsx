import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Fingerprint } from "lucide-react";
import { toast } from "sonner";

const StudentRegister = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    fullName: "",
    gtuStudentId: "",
    deviceName: "",
  });

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simulated WebAuthn registration flow
    console.log("Starting WebAuthn registration...", formData);
    
    // In production:
    // 1. POST to /api/auth/register-student (Email, Password, FullName, GtuStudentId)
    // 2. POST to /api/auth/register-webauthn/begin (UserId from response, DeviceName)
    // 3. Call navigator.credentials.create()
    // 4. POST to /api/auth/register-webauthn/complete
    
    toast.success("Registration successful! Please authenticate with your device");
    
    setTimeout(() => {
      navigate("/student/login");
    }, 1200);
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

          <Button type="submit" size="lg" className="w-full" variant="secondary">
            <Fingerprint className="mr-2" />
            Register with Biometrics
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
