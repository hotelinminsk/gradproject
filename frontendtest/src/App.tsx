import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

import StudentLayout from "@/components/layouts/StudentLayout";
import RequireStudentAuth from "@/components/auth/RequireStudentAuth";
import TeacherLayout from "@/components/layouts/TeacherLayout";

// Student pages
import StudentHome from "./pages/student/StudentHome";
import StudentRegister from "./pages/student/StudentRegister";
  import StudentCourses from "./pages/student/StudentCourses";
  import StudentCheckIn from "./pages/student/StudentCheckIn";
  import StudentSettings from "./pages/student/StudentSettings";
  import StudentLogin from "./pages/student/StudentLogin";
  import StudentCourseDetails from "./pages/student/StudentCourseDetails";

// Teacher pages
import TeacherLogin from "./pages/teacher/TeacherLogin";
import TeacherRegister from "./pages/teacher/TeacherRegister";
import TeacherDashboard from "./pages/teacher/TeacherDashboard";
import TeacherCourses from "./pages/teacher/TeacherCourses";
import TeacherSession from "./pages/teacher/TeacherSession";
import TeacherReports from "./pages/teacher/TeacherReports";
import TeacherCourseDetails from "./pages/teacher/TeacherCourseDetails";
import TeacherStudents from "./pages/teacher/TeacherStudents";
import { TeacherSessionProvider } from "./providers";

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <TeacherSessionProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Routes>
            <Route path="/" element={<Index />} />

            {/* Student auth screens (no layout) */}
            <Route path="/student" element={<StudentLogin />} />
            <Route path="/student/login" element={<StudentLogin />} />
            <Route path="/student/register" element={<StudentRegister />} />

            {/* Student protected routes under layout */}
            <Route element={<StudentLayout />}>
              <Route
                path="/student/home"
                element={
                  <RequireStudentAuth>
                    <StudentHome />
                  </RequireStudentAuth>
                }
              />
              <Route
                path="/student/courses"
                element={
                  <RequireStudentAuth>
                    <StudentCourses />
                  </RequireStudentAuth>
                }
              />
              <Route
                path="/student/courses/:courseId"
                element={
                  <RequireStudentAuth>
                    <StudentCourseDetails />
                  </RequireStudentAuth>
                }
              />
              <Route
                path="/student/check-in/:courseId"
                element={
                  <RequireStudentAuth>
                    <StudentCheckIn />
                  </RequireStudentAuth>
                }
              />
              <Route
                path="/student/settings"
                element={
                  <RequireStudentAuth>
                    <StudentSettings />
                  </RequireStudentAuth>
                }
              />
            </Route>
            {/* Teacher routes (protected) */}
            <Route element={<TeacherLayout />}>
              <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
              <Route path="/teacher/courses" element={<TeacherCourses />} />
              <Route path="/teacher/courses/:courseId" element={<TeacherCourseDetails />} />
              <Route path="/teacher/students" element={<TeacherStudents />} />
              <Route path="/teacher/session" element={<TeacherSession />} />
              <Route path="/teacher/session/:sessionId" element={<TeacherSession />} />
              <Route path="/teacher/reports" element={<TeacherReports />} />
            </Route>

            {/* Teacher auth routes (no provider) */}
            <Route path="/teacher/login" element={<TeacherLogin />} />
            <Route path="/teacher/register" element={<TeacherRegister />} />
            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </TooltipProvider>
        </TeacherSessionProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
