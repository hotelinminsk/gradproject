import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, TrendingUp, Users, Filter, BarChart3, LineChart, FileDown } from "lucide-react";
import { useTeacherCourses } from "@/hooks/teacher";
import { useCourseReportOverview, useCourseReportWeekly, useCourseReportMonthly, useCourseStudentStatistics } from "@/hooks/reports";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  Legend
} from "recharts";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { utils, writeFile } from "xlsx";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const TeacherReports = () => {
  const { data: courses = [] } = useTeacherCourses();
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [reportType, setReportType] = useState<string>("overview");

  // Select first course by default when loaded
  if (!selectedCourse && courses.length > 0) {
    setSelectedCourse(courses[0].courseId);
  }

  const { data: overview, isLoading: overviewLoading } = useCourseReportOverview(selectedCourse);
  const { data: weekly, isLoading: weeklyLoading } = useCourseReportWeekly(selectedCourse);
  const { data: monthly, isLoading: monthlyLoading } = useCourseReportMonthly(selectedCourse);
  const { data: studentsData, isLoading: studentsLoading } = useCourseStudentStatistics(selectedCourse);

  const handleExport = () => {
    if (!studentsData?.students) return;

    const exportData = studentsData.students.map(s => ({
      "Öğrenci Adı": s.fullName,
      "Öğrenci No": s.gtuStudentId,
      "Katılım Sayısı": s.attendedCount,
      "Toplam Oturum": s.totalSessions,
      "Katılım Oranı (%)": s.attendanceRate
    }));

    const ws = utils.json_to_sheet(exportData);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, "Öğrenci Katılım");
    writeFile(wb, `Katilim_Raporu_${courses.find(c => c.courseId === selectedCourse)?.courseCode || 'Ders'}.xlsx`);
  };

  const stats = [
    {
      label: "Toplam Öğrenci", // Using TotalCheckIns as proxy for now or use Denom which is Enrolled count
      value: overview?.denominatorCount ?? 0,
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-50",
      subtext: "Kayıtlı öğrenci",
      subcolor: "text-slate-500"
    },
    {
      label: "Toplam Oturum",
      value: overview?.totalSessions ?? 0,
      icon: Calendar,
      color: "text-purple-600",
      bg: "bg-purple-50",
      subtext: overview?.lastSession ? `Son: ${new Date(overview.lastSession.createdAtUtc).toLocaleDateString('tr-TR')}` : "Henüz oturum yok",
      subcolor: "text-slate-500"
    },
    {
      label: "Ortalama Katılım",
      value: `%${overview?.averageAttendancePct ?? 0}`,
      icon: TrendingUp,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      subtext: "Genel ortalama",
      subcolor: "text-emerald-600"
    }
  ];

  // Transform Weekly Data for Chart
  const weeklyChartData = (weekly?.sessions ?? []).map(s => ({
    date: new Date(s.createdAtUtc).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }),
    Katılım: s.attendancePct,
    CheckIn: s.checkIns
  }));

  // Transform Monthly Data for Chart
  const monthlyChartData = (monthly?.months ?? []).map(m => {
    const date = new Date(m.year, m.monthIndex - 1);
    return {
      name: date.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' }),
      Katılım: m.attendancePct,
    };
  });


  return (
    <div className="min-h-screen bg-slate-50/50 pb-20 font-sans text-slate-900">
      {/* Sticky Header */}
      <div className="bg-white/90 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50 transition-all duration-200 h-[88px] flex items-center">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Raporlar</h1>
            <p className="text-sm text-slate-500 hidden sm:block">Ders katılım analizleri ve istatistikler</p>
          </div>
          <Button onClick={handleExport} variant="outline" className="gap-2 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 border-slate-200">
            <FileDown className="w-4 h-4" />
            <span className="hidden sm:inline">Excel İndir</span>
          </Button>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* Filters */}
        <Card className="p-4 border border-slate-200 shadow-sm rounded-xl bg-white sticky top-[100px] z-40">
          <div className="flex flex-col md:flex-row gap-4 items-end md:items-center">
            <div className="flex-1 space-y-1 w-full">
              <label className="text-xs font-medium text-slate-500 ml-1">Ders Seçimi</label>
              <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                <SelectTrigger className="bg-slate-50 border-slate-200 focus:ring-1 focus:ring-slate-300">
                  <SelectValue placeholder="Ders seçin" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((course) => (
                    <SelectItem key={course.courseId} value={course.courseId}>
                      {course.courseName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="w-full md:w-[200px] space-y-1">
              <label className="text-xs font-medium text-slate-500 ml-1">Rapor Türü</label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger className="bg-slate-50 border-slate-200 focus:ring-1 focus:ring-slate-300">
                  <div className="flex items-center gap-2">
                    <Filter className="w-3.5 h-3.5 text-slate-400" />
                    <SelectValue placeholder="Rapor türü" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="overview">Genel Bakış</SelectItem>
                  <SelectItem value="charts">Grafikler</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {stats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <Card key={idx} className={`p-5 border border-slate-200 shadow-sm rounded-xl bg-white flex flex-col justify-between hover:shadow-md transition-shadow group`}>
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                    <h3 className="text-3xl font-semibold text-slate-900 mt-1">{stat.value}</h3>
                  </div>
                  <div className={`p-2 rounded-lg ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform`}>
                    <Icon className="w-5 h-5" />
                  </div>
                </div>
                <div className={`text-xs ${stat.subcolor} font-medium`}>
                  {stat.subtext}
                </div>
              </Card>
            );
          })}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Recent Sessions Chart */}
          <Card className="p-6 border border-slate-200 shadow-sm rounded-xl bg-white flex flex-col h-[400px]">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Oturum Bazlı Katılım</h3>
                <p className="text-sm text-slate-500">Son oturumların katılım oranları</p>
              </div>
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <BarChart3 className="w-5 h-5" />
              </div>
            </div>
            <div className="flex-1 w-full min-h-0">
              {weeklyLoading ? (
                <div className="h-full flex items-center justify-center text-slate-400">Yükleniyor...</div>
              ) : weeklyChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={weeklyChartData}>
                    <defs>
                      <linearGradient id="colorPv" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} domain={[0, 100]} />
                    <Tooltip
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      cursor={{ stroke: '#cbd5e1', strokeWidth: 1 }}
                    />
                    <Area type="monotone" dataKey="Katılım" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorPv)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400 text-sm">Veri bulunamadı</div>
              )}
            </div>
          </Card>

          {/* Monthly Trend Chart */}
          <Card className="p-6 border border-slate-200 shadow-sm rounded-xl bg-white flex flex-col h-[400px]">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Aylık Trend</h3>
                <p className="text-sm text-slate-500">Aylık ortalama katılım değişimi</p>
              </div>
              <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                <LineChart className="w-5 h-5" />
              </div>
            </div>
            <div className="flex-1 w-full min-h-0">
              {monthlyLoading ? (
                <div className="h-full flex items-center justify-center text-slate-400">Yükleniyor...</div>
              ) : monthlyChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyChartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} domain={[0, 100]} />
                    <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Bar dataKey="Katılım" fill="#8b5cf6" radius={[4, 4, 0, 0]} maxBarSize={50} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400 text-sm">Veri bulunamadı</div>
              )}
            </div>
          </Card>

        </div>

        {/* Student Statistics Table */}
        <Card className="p-6 border border-slate-200 shadow-sm rounded-xl bg-white flex flex-col">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Öğrenci Katılım Detayları</h3>
              <p className="text-sm text-slate-500">Öğrenci bazlı katılım istatistikleri</p>
            </div>
          </div>

          <div className="border rounded-lg border-slate-200">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 hover:bg-slate-50">
                  <TableHead className="py-3 px-4 text-slate-600 font-medium">Öğrenci Adı</TableHead>
                  <TableHead className="py-3 px-4 text-slate-600 font-medium">Öğrenci No</TableHead>
                  <TableHead className="py-3 px-4 text-slate-600 font-medium text-center">Katılım</TableHead>
                  <TableHead className="py-3 px-4 text-slate-600 font-medium text-center">Oran</TableHead>
                  <TableHead className="py-3 px-4 text-slate-600 font-medium text-right">Durum</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {studentsLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-slate-500">Yükleniyor...</TableCell>
                  </TableRow>
                ) : (studentsData?.students || []).length > 0 ? (
                  (studentsData?.students || []).map((student) => (
                    <TableRow key={student.studentId} className="hover:bg-slate-50/50">
                      <TableCell className="font-medium text-slate-900 py-3 px-4">{student.fullName}</TableCell>
                      <TableCell className="text-slate-500 py-3 px-4">{student.gtuStudentId}</TableCell>
                      <TableCell className="text-center py-3 px-4">
                        <span className="font-medium text-slate-700">{student.attendedCount}</span>
                        <span className="text-slate-400 text-xs ml-1">/ {student.totalSessions}</span>
                      </TableCell>
                      <TableCell className="text-center py-3 px-4 font-semibold text-slate-700">
                        %{student.attendanceRate}
                      </TableCell>
                      <TableCell className="text-right py-3 px-4">
                        <Badge variant="outline" className={`
                                ${student.attendanceRate >= 70 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            student.attendanceRate >= 50 ? 'bg-amber-50 text-amber-700 border-amber-200' :
                              'bg-red-50 text-red-700 border-red-200'}
                            `}>
                          {student.attendanceRate >= 70 ? 'Yüksek' :
                            student.attendanceRate >= 50 ? 'Orta' : 'Düşük'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-slate-500">Öğrenci verisi bulunamadı</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default TeacherReports;
