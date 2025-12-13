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
      <div className="flex min-h-[60vh] items-center justify-center text-slate-500">
        Please sign in as a teacher to view the dashboard.
      </div>
    );
  }

  if (isLoading || !data) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center gap-3">
        <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
        <span className="text-sm font-medium text-slate-600">Loading dashboard...</span>
      </div>
    );
  }

  const stats = [
    { label: "Active Courses", value: data?.activeCourseCount ?? 0, icon: BookOpen, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Total Students", value: data?.totalStudentCount ?? 0, icon: Users, color: "text-violet-600", bg: "bg-violet-50" },
    { label: "Sessions This Week", value: data?.sessionsThisWeek ?? 0, icon: Calendar, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "Avg Attendance", value: `${data?.averageAttendancePCT ?? 0}%`, icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50" },
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
      nextSession: nextSession ? formatRelative(new Date(nextSession), new Date()) : "No upcoming session",
      activeSessionId: courseId ? activeByCourse.get(courseId) : undefined,
    };
  }).filter((course) => Boolean(course.id));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">Welcome back, {profile.fullName}</p>
        </div>
        <Button
          onClick={() => navigate("/teacher/create-course")}
          className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Course
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="p-5 bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow rounded-xl">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                  <p className="text-3xl font-semibold text-slate-900 mt-2 tracking-tight">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-xl ${stat.bg}`}>
                  <Icon className={`w-5 h-5 ${stat.color}`} />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Recent Courses */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Your Courses</h2>
          <Button variant="ghost" size="sm" onClick={() => navigate("/teacher/courses")} className="text-slate-500 hover:text-slate-900">
            View All
          </Button>
        </div>

        <Card className="border border-slate-200 shadow-sm bg-white rounded-xl overflow-hidden">
          {recentCourses.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>No courses found. Create one to get started.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentCourses.map((course) => (
                <div
                  key={course.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 hover:bg-slate-50/80 cursor-pointer transition-colors group"
                  onClick={() => navigate(`/teacher/courses/${course.id}`)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                      <span className="text-xs font-bold">{course.code.substring(0, 3)}</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">{course.name}</h3>
                      <div className="flex items-center gap-2 text-sm text-slate-500 mt-0.5">
                        <span className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">{course.code}</span>
                        <span>•</span>
                        <span>{course.students} students</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 sm:mt-0 flex items-center justify-between sm:justify-end gap-6 min-w-[200px]">
                    {course.activeSessionId ? (
                      <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        <span className="text-xs font-bold uppercase tracking-wide">Live Session</span>
                      </div>
                    ) : (
                      <div className="text-right">
                        <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Next Session</p>
                        <p className="text-sm font-medium text-slate-700">{course.nextSession}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default TeacherDashboard;
