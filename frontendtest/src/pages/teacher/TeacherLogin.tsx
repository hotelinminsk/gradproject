import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GraduationCap } from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { AuthResponse } from "@/types/auth";
import { useTeacherSession } from "@/providers";

const TeacherLogin = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const { login } = useTeacherSession();
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try{
      const data = await apiFetch<AuthResponse>("/api/Auth/login-teacher",
        {method: "POST",
        body: formData,
        }
      );

      if(data) toast.success("Login successfull!");
      login(data);

      navigate("/teacher/dasboard");

    }catch(err){
      toast.error((err as Error) .message);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center px-6">
      <div className="w-full max-w-md space-y-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 grid place-items-center">
            <GraduationCap className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold leading-tight">University</h1>
          </div>
        </div>

        <div className="flex gap-6 text-sm">
          <span className="font-semibold">Login</span>
          <button
            type="button"
            className="text-muted-foreground hover:text-foreground"
            onClick={() => navigate("/teacher/register")}
          >
            Register
          </button>
        </div>

        <Card className="p-6 space-y-4">
          <div className="space-y-1">
            <h2 className="text-xl font-bold">Welcome Back</h2>
            <p className="text-sm text-muted-foreground">Enter your institutional credentials.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Institutional Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="teacher@gtu.edu.tr"
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

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 text-muted-foreground">
                <input type="checkbox" className="accent-primary" /> Remember me
              </label>
              <button type="button" className="text-primary hover:underline">Forgot Password?</button>
            </div>

            <Button type="submit" size="lg" className="w-full h-12 rounded-full">
              Log In
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default TeacherLogin;

