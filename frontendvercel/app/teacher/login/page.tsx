import { TeacherLoginForm } from "@/components/teacher/teacher-login-form"
import { GraduationCap } from "lucide-react"

export default function TeacherLoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <GraduationCap className="h-10 w-10 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-balance">GTU Attendance</h1>
          <p className="text-muted-foreground text-balance">Teacher Sign In</p>
        </div>

        <TeacherLoginForm />

        <p className="text-center text-sm text-muted-foreground">
          Don't have an account?{" "}
          <a href="/teacher/register" className="text-primary hover:underline font-medium">
            Register
          </a>
        </p>
      </div>
    </div>
  )
}
