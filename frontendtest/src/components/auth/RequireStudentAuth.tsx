import { useStudentSession } from "@/providers";
import { PropsWithChildren, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function RequireStudentAuth({ children }: PropsWithChildren) {
  const navigate = useNavigate();
  const location = useLocation();
  const {profile, isLoading} = useStudentSession();


  useEffect(() => {
    if(isLoading) return;
    if(!profile ){
      navigate("/student/login", { replace: true, state: { from: location.pathname } });
    } 
  }, [profile, isLoading, location.pathname, navigate]);

  if(isLoading || !profile) return null;
  return <>{children}</>;
}

