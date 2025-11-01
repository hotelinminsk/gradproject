import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { GraduationCap, User } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-dark flex items-center justify-center p-4 animate-fade-in">
      <div className="max-w-4xl w-full space-y-10">
        <div className="text-center space-y-4 animate-slide-up">
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-primary bg-clip-text text-transparent drop-shadow-lg">
            GTU Attendance System
          </h1>
          <p className="text-lg md:text-xl text-foreground/80 font-light">
            Secure, biometric-powered attendance tracking
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Student Card */}
          <Card 
            className="p-10 hover:shadow-glow cursor-pointer group backdrop-blur-sm bg-gradient-card border-primary/20 hover:border-primary/60 transition-all duration-500 hover:scale-[1.02] animate-scale-in" 
            onClick={() => navigate("/student")}
          >
            <div className="text-center space-y-6">
              <div className="mx-auto w-24 h-24 bg-gradient-primary rounded-3xl flex items-center justify-center shadow-glow group-hover:shadow-glow-accent transition-all duration-500 group-hover:scale-110">
                <User className="w-12 h-12 text-primary-foreground" />
              </div>
              <h2 className="text-3xl font-bold tracking-tight">Student Portal</h2>
              <p className="text-muted-foreground font-light leading-relaxed">
                Check in to classes with secure biometric authentication
              </p>
              <Button size="lg" className="w-full text-base" variant="secondary">
                Student Login
              </Button>
            </div>
          </Card>

          {/* Teacher Card */}
          <Card 
            className="p-10 hover:shadow-glow cursor-pointer group backdrop-blur-sm bg-gradient-card border-accent/20 hover:border-accent/60 transition-all duration-500 hover:scale-[1.02] animate-scale-in" 
            onClick={() => navigate("/teacher/login")}
            style={{ animationDelay: '0.1s' }}
          >
            <div className="text-center space-y-6">
              <div className="mx-auto w-24 h-24 bg-gradient-primary rounded-3xl flex items-center justify-center shadow-glow group-hover:shadow-glow-accent transition-all duration-500 group-hover:scale-110">
                <GraduationCap className="w-12 h-12 text-primary-foreground" />
              </div>
              <h2 className="text-3xl font-bold tracking-tight">Teacher Portal</h2>
              <p className="text-muted-foreground font-light leading-relaxed">
                Manage courses, track attendance, and generate reports
              </p>
              <Button size="lg" className="w-full text-base">
                Teacher Login
              </Button>
            </div>
          </Card>
        </div>

        <div className="text-center text-muted-foreground text-sm font-light animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <p>Powered by WebAuthn for secure, password-free authentication</p>
        </div>
      </div>
    </div>
  );
};

export default Index;
