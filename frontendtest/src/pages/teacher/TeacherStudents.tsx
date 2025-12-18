import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useTeacherCourses, useTeacherStudents, type TeacherStudent } from "@/hooks/teacher";
import { Search, Eye, Filter, UserRound, GraduationCap, XCircle, CheckCircle2 } from "lucide-react";

// mockData removed

const statusBadge = (status: "rostered" | "enrolled" | "dropped", courseCode: string) => {
  if (status === "enrolled") return <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 shadow-none font-medium text-xs px-2 py-0.5"><CheckCircle2 className="w-3 h-3 mr-1" /> {courseCode}</Badge>;
  if (status === "rostered") return <Badge variant="secondary" className="bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200 font-medium text-xs px-2 py-0.5">{courseCode}</Badge>;
  if (status === "dropped") return <Badge className="bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 shadow-none font-medium text-xs px-2 py-0.5"><XCircle className="w-3 h-3 mr-1" /> {courseCode} (Bıraktı)</Badge>;
  return null;
};

type TableProps = {
  title: string;
  description: string;
  data: TeacherStudent[];
  emptyText: string;
  pageSize?: number;
};

const StudentTable = ({ title, description, data, emptyText, pageSize = 10 }: TableProps) => {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(data.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const slice = data.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <Card className="border border-slate-200 shadow-sm rounded-xl overflow-hidden bg-white">
      <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900">{title}</h2>
          <p className="text-sm text-slate-500">{description}</p>
        </div>
        <Badge variant="outline" className="w-fit bg-white text-slate-600 border-slate-200 shadow-sm">
          Toplam {data.length}
        </Badge>
      </div>


      {data.length === 0 ? (
        <div className="p-12 text-center text-slate-500">
          <UserRound className="w-12 h-12 mx-auto text-slate-200 mb-3" />
          <p>{emptyText}</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow className="hover:bg-slate-50">
                  <TableHead className="w-[30%] font-semibold text-slate-600">Öğrenci Adı</TableHead>
                  <TableHead className="w-[15%] font-semibold text-slate-600">GTÜ ID</TableHead>
                  <TableHead className="w-[20%] font-semibold text-slate-600">E-posta</TableHead>
                  <TableHead className="w-[30%] font-semibold text-slate-600">Dersler</TableHead>
                  <TableHead className="w-[5%] text-right font-semibold text-slate-600">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {slice.map((student) => (
                  <TableRow key={student.id} className="hover:bg-slate-50/60 transition-colors border-slate-100">
                    <TableCell className="font-medium text-slate-900">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-semibold text-slate-500 shrink-0">
                          {student.fullName.charAt(0)}
                        </div>
                        <span className="truncate">{student.fullName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-500 font-mono text-xs">{student.gtuStudentId}</TableCell>
                    <TableCell className="text-slate-500 truncate max-w-[200px]">{student.email || "-"}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1.5">
                        {student.courses.map((c) => (
                          <div key={c.courseCode} className="inline-flex items-center">
                            {statusBadge(c.status, c.courseCode)}
                          </div>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400 hover:text-[#1a73e8]">
                        <Eye className="h-4 w-4" />
                        <span className="sr-only">Detay</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="flex items-center justify-between p-4 border-t border-slate-100 bg-slate-50/30">
            <p className="text-xs text-slate-500">
              Gösterilen: {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, data.length)} / {data.length}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="h-8 text-xs border-slate-200"
              >
                Önceki
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="h-8 text-xs border-slate-200"
              >
                Sonraki
              </Button>
            </div>
          </div>
        </>
      )}

    </Card>
  );
};

export default function TeacherStudents() {
  const { data: courses = [] } = useTeacherCourses();
  const { data: students = [], isLoading } = useTeacherStudents();
  const [search, setSearch] = useState("");
  const [courseFilter, setCourseFilter] = useState<string>("all");

  const courseNamesByCode = useMemo(() => {
    const map = new Map<string, string>();
    courses.forEach((c) => {
      if (c.courseCode) map.set(c.courseCode, c.courseName ?? c.courseCode);
    });
    // With grouped data, students have multiple courses. We can iterate them.
    students.forEach((s) => {
      s.courses.forEach(c => {
        if (!map.has(c.courseCode)) map.set(c.courseCode, c.courseName || c.courseCode);
      });
    });
    return map;
  }, [courses, students]);

  const courseOptions = useMemo(
    () => [{ code: "all", name: "Tümü" }, ...Array.from(courseNamesByCode.entries()).map(([code, name]) => ({ code, name }))],
    [courseNamesByCode],
  );

  const filtered = useMemo(() => {
    const term = search.toLowerCase();
    return students
      .filter((s) => {
        const matchesSearch =
          !term ||
          s.fullName.toLowerCase().includes(term) ||
          s.gtuStudentId.toLowerCase().includes(term) ||
          s.email.toLowerCase().includes(term);

        // Check if ANY of the student's courses match the filter
        const matchesCourse = courseFilter === "all" || s.courses.some(c => c.courseCode === courseFilter);

        return matchesSearch && matchesCourse;
      })
      .sort((a, b) => a.fullName.localeCompare(b.fullName, "tr"));
  }, [search, courseFilter, students]);

  // Filter for specific tabs (if we still want to separate tabs by ANY status match)
  // "rostered" tab -> Students who have at least one rostered course?
  // "enrolled" tab -> Students who have at least one enrolled course?
  // "dropped" tab -> Students who have at least one dropped course?

  const rostered = filtered.filter((s) => s.courses.some(c => c.status === "rostered"));
  const enrolled = filtered.filter((s) => s.courses.some(c => c.status === "enrolled"));
  const dropped = filtered.filter((s) => s.courses.some(c => c.status === "dropped"));

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20 font-sans text-slate-900">
      {/* Sticky Header */}
      <div className="bg-white/90 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50 transition-all duration-200 h-[88px] flex items-center">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-normal tracking-tight text-slate-900">Öğrenciler</h1>
            <p className="text-xs text-muted-foreground hidden sm:block">Ders kayıtları ve öğrenci listeleri</p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* Filters Card */}
        <Card className="p-4 border border-slate-200 shadow-sm rounded-xl bg-white sticky top-[100px] z-40">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <Input
                placeholder="İsim, GTÜ ID veya e-posta ile ara..."
                className="pl-9 bg-slate-50 border-slate-200 focus-visible:ring-1 focus-visible:ring-slate-300"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
              <Filter className="w-4 h-4 text-slate-400 shrink-0" />
              {courseOptions.map((course) => (
                <Button
                  key={course.code}
                  type="button"
                  variant={courseFilter === course.code ? "default" : "outline"}
                  size="sm"
                  className={`text-xs h-9 rounded-lg ${courseFilter === course.code ? 'bg-slate-800 hover:bg-slate-700' : 'border-slate-200 text-slate-600 hover:text-slate-900'}`}
                  onClick={() => setCourseFilter(course.code)}
                >
                  {course.code === "all" ? course.name : <span className="font-mono">{course.code}</span>}
                </Button>
              ))}
            </div>
          </div>
        </Card>

        {/* Content Tabs */}
        <Tabs defaultValue="rostered" className="space-y-6">
          <TabsList className="bg-white border border-slate-200 shadow-sm p-1 h-12 w-full justify-start rounded-xl overflow-x-auto">
            <TabsTrigger value="rostered" className="data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900 text-slate-500 h-10 px-6 rounded-lg">Roster Listesi</TabsTrigger>
            <TabsTrigger value="enrolled" className="data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700 text-slate-500 h-10 px-6 rounded-lg">Kayıtlılar</TabsTrigger>
            <TabsTrigger value="dropped" className="data-[state=active]:bg-red-50 data-[state=active]:text-red-700 text-slate-500 h-10 px-6 rounded-lg">Dersi Bırakanlar</TabsTrigger>
          </TabsList>

          <TabsContent value="rostered" className="focus-visible:outline-none">
            <StudentTable
              title="Roster Listesi"
              description="Sisteme önceden yüklenen öğrenci listesi (Roster)."
              data={rostered}
              emptyText="Bu filtreye uygun roster kaydı bulunamadı."
            />
          </TabsContent>
          <TabsContent value="enrolled" className="focus-visible:outline-none">
            <StudentTable
              title="Kayıtlı Öğrenciler"
              description="Derse aktif olarak kayıtlı ve onaylanmış öğrenciler."
              data={enrolled}
              emptyText="Bu filtreye uygun kayıtlı öğrenci bulunamadı."
            />
          </TabsContent>
          <TabsContent value="dropped" className="focus-visible:outline-none">
            <StudentTable
              title="Dersi Bırakanlar"
              description="Dersten çekilmiş veya kaydı silinmiş öğrenciler."
              data={dropped}
              emptyText="Bırakan öğrenci bulunamadı."
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
