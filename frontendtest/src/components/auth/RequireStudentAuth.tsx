import { PropsWithChildren, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function RequireStudentAuth({ children }: PropsWithChildren) {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem("student_jwt");
    if (!token) {
      navigate("/student/login", { replace: true, state: { from: location.pathname } });
    }
  }, [location.pathname, navigate]);

  return <>{children}</>;
}

