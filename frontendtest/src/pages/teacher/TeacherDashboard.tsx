import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Users, Calendar, TrendingUp, Plus } from "lucide-react";
const TeacherDashboard = () => {
  const navigate = useNavigate();

  const stats = [
    { label: "Active Courses", value: "5", icon: BookOpen, color: "text-primary" },
    { label: "Total Students", value: "142", icon: Users, color: "text-secondary" },
    { label: "Sessions This Week", value: "12", icon: Calendar, color: "text-accent" },
    { label: "Avg Attendance", value: "87%", icon: TrendingUp, color: "text-success" },
  ];

  const recentCourses = [
    { id: 1, name: "Advanced Web Technologies", code: "CSE401", students: 45, nextSession: "Today, 10:00 AM" },
    { id: 2, name: "Mobile App Development", code: "CSE305", students: 38, nextSession: "Tomorrow, 2:00 PM" },
    { id: 3, name: "Database Systems", code: "CSE302", students: 42, nextSession: "Wed, 9:00 AM" },
  ];

  return (
    <div className="space-y-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Dashboard</h1>
              <p className="text-muted-foreground">Welcome back, Professor</p>
            </div>
            <Button onClick={() => navigate("/teacher/courses/new")}>
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
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">Next Session</p>
                    <p className="text-sm text-muted-foreground">{course.nextSession}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
    </div>
  );
};

export default TeacherDashboard;
