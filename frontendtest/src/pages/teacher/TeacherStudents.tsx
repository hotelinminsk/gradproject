import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Search, Users, ShieldCheck } from "lucide-react";

const mockStudents = [
  { id: 1, fullName: "Ayşe Yıldız", gtuId: "150120110", email: "ayse.yildiz@gtu.edu.tr", course: "CSE401" },
  { id: 2, fullName: "Mert Erdem", gtuId: "150118056", email: "mert.erdem@gtu.edu.tr", course: "CSE305" },
  { id: 3, fullName: "Selin Acar", gtuId: "150117042", email: "selin.acar@gtu.edu.tr", course: "CSE303" },
];

export default function TeacherStudents() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-6">
        <div>
          <h1 className="text-3xl font-bold">Students</h1>
          <p className="text-muted-foreground">
            View enrolled students across your courses. (Placeholder data until API wiring is done.)
          </p>
        </div>

        <Card className="p-4 flex flex-col gap-3 md:flex-row md:items-end">
          <div className="flex-1 space-y-2">
            <Label htmlFor="search">Search students</Label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
              <Input id="search" placeholder="Search by name, GTU ID, or email" className="pl-9" />
            </div>
          </div>
          <Button className="w-full md:w-auto">Filter</Button>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          {mockStudents.map((student) => (
            <Card key={student.id} className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">{student.fullName}</h3>
                  <p className="text-sm text-muted-foreground">{student.email}</p>
                </div>
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div className="text-sm text-muted-foreground">
                <p>GTU ID: {student.gtuId}</p>
                <p>Course: {student.course}</p>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <ShieldCheck className="w-4 h-4 text-success" />
                WebAuthn verified device on record
              </div>
            </Card>
          ))}
        </div>
    </div>
  );
}
