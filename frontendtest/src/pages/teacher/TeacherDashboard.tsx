import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BookOpen, Users, Calendar, TrendingUp, Plus } from "lucide-react";
import { useTeacherSession } from "@/providers";
import { useTeacherDashboardSummary, useTeacherSessions } from "@/hooks/teacher";
import { formatRelative } from "date-fns";
const TeacherDashboard = () => {
  const navigate = useNavigate();

  const { profile } = useTeacherSession();
  const { data, isLoading } = useTeacherDashboardSummary();
  const { data: sessions = [] } = useTeacherSessions();

  if (!profile || !profile.fullName) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-muted-foreground">
        Please sign in as a teacher to view the dashboard.
      </div>
    );
  }
  if(isLoading || !data){
    return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <span className="ml-2 text-sm text-muted-foreground">Loading dashboard…</span>
    </div>
  );
  }
  
  const stats = [
    { label: "Active Courses", value: data?.activeCourseCount, icon: BookOpen, color: "text-primary" },
    { label: "Total Students", value: data?.totalStudentCount, icon: Users, color: "text-secondary" },
    { label: "Sessions This Week", value: data?.sessionsThisWeek, icon: Calendar, color: "text-accent" },
    { label: "Avg Attendance", value: data?.averageAttendancePCT, icon: TrendingUp, color: "text-success" },
  ];
  


  const activeByCourse = new Map<string, string>();
  sessions.forEach((s) => {
    if (s.isActive) activeByCourse.set(s.courseId, s.sessionId);
  });

  const recentCourses = (data?.upcomingCourses ?? []).map((course) => {
    const courseId = course.courseId ?? course.courseID;
    const nextSession = course.nextSessionTimeUtc ?? course.nextSessionTimeUTC;
    return {
      id: courseId,
      name: course.courseName,
      code: course.courseCode,
      students: course.studentCount,
      nextSession: nextSession ? formatRelative(new Date(nextSession), new Date()) : "No session scheduled.",
      activeSessionId: courseId ? activeByCourse.get(courseId) : undefined,
    };
  }).filter((course) => Boolean(course.id));

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">Welcome back, {profile.fullName}</p>
          </div>
          <Button onClick={() => navigate("/teacher/create-course")}>
            <Plus className="w-4 h-4 mr-2" />
            New Course
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label} className="p-5 hover:shadow-sm transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-semibold">{stat.value}</p>
                  </div>
                  <Icon className={`w-7 h-7 ${stat.color}`} />
                </div>
              </Card>
            );
          })}
        </div>

        {/* Recent Courses */}
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Your Courses</h2>
            <Button variant="outline" onClick={() => navigate("/teacher/courses")}>
              View All
            </Button>
          </div>

          <div className="space-y-3">
            {recentCourses.map((course) => (
              <div
                key={course.id}
                className="flex items-center justify-between p-4 bg-muted rounded-lg hover:bg-muted/80 cursor-pointer transition-colors"
                onClick={() => navigate(`/teacher/courses/${course.id}`)}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{course.name}</h3>
                    <p className="text-sm text-muted-foreground">{course.code} • {course.students} students</p>
                    {course.activeSessionId && (
                      <p className="text-xs text-primary mt-1">Active session live</p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">
                    {course.activeSessionId ? "Active session" : "Next Session"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {course.activeSessionId ? "Tap to view" : course.nextSession}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
    </div>
  );
};

export default TeacherDashboard;
