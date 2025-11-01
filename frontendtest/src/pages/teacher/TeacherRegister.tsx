import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { KeyRound, User } from "lucide-react";
import { toast } from "sonner";

export default function TeacherRegister() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: "", email: "", password: "", inviteToken: "" });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    // POST /api/auth/register-teacher with inviteToken
    console.log("Teacher register", form);
    toast.success("Registered. Please login.");
    navigate("/teacher/login");
  };

  return (
    <div className="min-h-screen grid place-items-center px-6">
      <div className="w-full max-w-md space-y-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 grid place-items-center">
            <User className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold leading-tight">University</h1>
          </div>
        </div>

        <div className="flex gap-6 text-sm">
          <button type="button" className="text-muted-foreground hover:text-foreground" onClick={()=>navigate('/teacher/login')}>Login</button>
          <span className="font-semibold">Register</span>
        </div>

        <Card className="p-6 space-y-4">
          <div className="space-y-1">
            <h2 className="text-xl font-bold">Create a New Teacher</h2>
            <p className="text-sm text-muted-foreground">Invite token is required to prevent misuse.</p>
          </div>

        <form className="space-y-4" onSubmit={submit}>
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input id="fullName" value={form.fullName} onChange={(e)=>setForm({...form, fullName: e.target.value})} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={form.email} onChange={(e)=>setForm({...form, email: e.target.value})} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" value={form.password} onChange={(e)=>setForm({...form, password: e.target.value})} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="token">Invite Token</Label>
            <div className="flex gap-2">
              <Input id="token" placeholder="Paste token" value={form.inviteToken} onChange={(e)=>setForm({...form, inviteToken: e.target.value})} required />
              <div className="w-10 h-10 rounded-lg bg-primary/10 grid place-items-center">
                <KeyRound className="w-4 h-4" />
              </div>
            </div>
          </div>
          <Button type="submit" className="w-full h-12 rounded-full" size="lg">Create Account</Button>
        </form>
        </Card>
      </div>
    </div>
  );
}
