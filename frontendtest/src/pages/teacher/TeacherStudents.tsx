import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useTeacherCourses } from "@/hooks/teacher";
import { Search, Eye, BookOpen } from "lucide-react";

type StudentRow = {
  id: string;
  fullName: string;
  gtuId: string;
  email: string;
  courseCode: string;
  status: "rostered" | "enrolled" | "dropped";
};

// Mock data until backend wiring
const mockStudents: StudentRow[] = [
  { id: "r1", fullName: "Ayşe Yıldız", gtuId: "150120110", email: "ayse.yildiz@gtu.edu.tr", courseCode: "CSE401", status: "rostered" },
  { id: "r2", fullName: "Mert Erdem", gtuId: "150118056", email: "mert.erdem@gtu.edu.tr", courseCode: "CSE305", status: "rostered" },
  { id: "e1", fullName: "Selin Acar", gtuId: "150117042", email: "selin.acar@gtu.edu.tr", courseCode: "CSE303", status: "enrolled" },
  { id: "e2", fullName: "Kerem Çetin", gtuId: "150119078", email: "kerem.cetin@gtu.edu.tr", courseCode: "CSE305", status: "enrolled" },
  { id: "d1", fullName: "Bora Ak", gtuId: "150116011", email: "bora.ak@gtu.edu.tr", courseCode: "CSE401", status: "dropped" },
];

const statusBadge = (status: StudentRow["status"]) => {
  if (status === "enrolled") return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">Kayıtlı</Badge>;
  if (status === "rostered") return <Badge variant="outline">Roster</Badge>;
  if (status === "dropped") return <Badge className="bg-destructive/10 text-destructive">Bıraktı</Badge>;
  return null;
};

type TableProps = {
  title: string;
  data: StudentRow[];
  emptyText: string;
  pageSize?: number;
};

const StudentTable = ({ title, data, emptyText, pageSize = 10 }: TableProps) => {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(data.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const slice = data.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{title}</h2>
        <Badge variant="secondary">{data.length}</Badge>
      </div>
      {data.length === 0 ? (
        <p className="text-sm text-muted-foreground">{emptyText}</p>
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>İsim</TableHead>
                  <TableHead>GTÜ ID</TableHead>
                  <TableHead>E-posta</TableHead>
                  <TableHead>Ders</TableHead>
                  <TableHead className="text-center">Durum</TableHead>
                  <TableHead className="text-right">Profil</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {slice.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium">{student.fullName}</TableCell>
                    <TableCell className="text-muted-foreground">{student.gtuId}</TableCell>
                    <TableCell className="text-muted-foreground">{student.email}</TableCell>
                    <TableCell className="text-muted-foreground">{student.courseCode}</TableCell>
                    <TableCell className="text-center">{statusBadge(student.status)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" className="gap-2">
                        <Eye className="h-4 w-4" />
                        Profil
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              Sayfa {currentPage} / {totalPages}
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                Önceki
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
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
  const [search, setSearch] = useState("");
  const [courseFilter, setCourseFilter] = useState<string>("all");

  const courseNamesByCode = useMemo(() => {
    const map = new Map<string, string>();
    courses.forEach((c) => {
      if (c.courseCode) map.set(c.courseCode, c.courseName ?? c.courseCode);
    });
    mockStudents.forEach((s) => {
      if (!map.has(s.courseCode)) map.set(s.courseCode, s.courseCode);
    });
    return map;
  }, [courses]);

  const courseOptions = useMemo(
    () => [{ code: "all", name: "Tümü" }, ...Array.from(courseNamesByCode.entries()).map(([code, name]) => ({ code, name }))],
    [courseNamesByCode],
  );

  const filtered = useMemo(() => {
    const term = search.toLowerCase();
    return mockStudents
      .filter((s) => {
        const matchesSearch =
          !term ||
          s.fullName.toLowerCase().includes(term) ||
          s.gtuId.toLowerCase().includes(term) ||
          s.email.toLowerCase().includes(term);
        const matchesCourse = courseFilter === "all" || s.courseCode === courseFilter;
        return matchesSearch && matchesCourse;
      })
      .sort((a, b) => a.fullName.localeCompare(b.fullName, "tr"));
  }, [search, courseFilter]);

  const rostered = filtered.filter((s) => s.status === "rostered");
  const enrolled = filtered.filter((s) => s.status === "enrolled");
  const dropped = filtered.filter((s) => s.status === "dropped");

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Öğrenciler</h1>
          <p className="text-muted-foreground">
            Roster ve kayıtlı öğrencileri tablo görünümünde, hızlı filtreler ve sayfalama ile görüntüleyin. (Şimdilik mock veriler.)
          </p>
        </div>
      </div>

      <Card className="p-4 gap-4 grid grid-cols-1 lg:grid-cols-[260px,1fr]">
        <div className="space-y-3 border-r pr-0 lg:pr-4">
          <Label htmlFor="search">Öğrenci ara</Label>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
            <Input
              id="search"
              placeholder="İsim, GTÜ ID veya e-posta"
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Ders filtresi (code)</Label>
            <div className="flex flex-wrap gap-2">
              {courseOptions.map((course) => (
                <Button
                  key={course.code}
                  type="button"
                  variant={courseFilter === course.code ? "default" : "outline"}
                  className="text-sm justify-start"
                  onClick={() => setCourseFilter(course.code)}
                >
                  <BookOpen className="mr-2 h-4 w-4" />
                  {course.code === "all" ? course.name : `${course.code}${course.name ? ` • ${course.name}` : ""}`}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <Tabs defaultValue="rostered" className="space-y-4">
            <TabsList>
              <TabsTrigger value="rostered">Roster</TabsTrigger>
              <TabsTrigger value="enrolled">Kayıtlı</TabsTrigger>
              <TabsTrigger value="dropped">Bırakanlar</TabsTrigger>
            </TabsList>

            <TabsContent value="rostered">
              <StudentTable title="Roster" data={rostered} emptyText="Roster'a ekli öğrenci yok." />
            </TabsContent>
            <TabsContent value="enrolled">
              <StudentTable title="Kayıtlı öğrenciler" data={enrolled} emptyText="Kayıtlı öğrenci yok." />
            </TabsContent>
            <TabsContent value="dropped">
              <StudentTable title="Bırakan öğrenciler" data={dropped} emptyText="Bırakan öğrenci yok." />
            </TabsContent>
          </Tabs>
        </div>
      </Card>
    </div>
  );
}
