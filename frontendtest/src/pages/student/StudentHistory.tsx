import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Search, Filter, History, CalendarDays } from "lucide-react";
import { apiFetch } from "@/hooks/attendance";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

interface StudentHistoryItem {
    sessionId: string;
    courseId: string;
    courseName: string;
    courseCode: string;
    sessionDate: string;
    attendedAt: string;
}

const formatDateTr = (value: string) => {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return new Intl.DateTimeFormat("tr-TR", {
        dateStyle: "long",
        timeStyle: "short",
    }).format(date);
};

export default function StudentHistory() {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCourseId, setSelectedCourseId] = useState<string>("all");

    const { data: history = [], isLoading } = useQuery({
        queryKey: ["student-history"],
        queryFn: async () => {
            return apiFetch<StudentHistoryItem[]>("/api/attendance/student/history");
        },
        staleTime: 5 * 60 * 1000, // 5 minutes cache
        retry: 1,
    });

    // Extract unique courses for filter
    const uniqueCourses = useMemo(() => {
        const courses = new Map();
        history.forEach(item => {
            if (!courses.has(item.courseId)) {
                courses.set(item.courseId, { id: item.courseId, name: item.courseName, code: item.courseCode });
            }
        });
        return Array.from(courses.values());
    }, [history]);

    // Filter items
    const filteredHistory = useMemo(() => {
        return history.filter(item => {
            const matchesSearch = item.courseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.courseCode.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCourse = selectedCourseId === "all" || item.courseId === selectedCourseId;

            return matchesSearch && matchesCourse;
        });
    }, [history, searchTerm, selectedCourseId]);

    return (
        <div className="min-h-screen bg-slate-50 pb-safe-nav font-sans text-slate-900 relative overflow-hidden">
            {/* Background Gradients */}
            <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-br from-indigo-50 via-purple-50/50 to-slate-50 pointer-events-none" />
            <div className="absolute top-[-10%] right-[-10%] w-[400px] h-[400px] bg-indigo-100/40 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute top-[10%] left-[-10%] w-[300px] h-[300px] bg-emerald-100/40 rounded-full blur-3xl pointer-events-none" />

            {/* Header */}
            <div className="relative z-20 px-6 pt-10 pb-6">
                <div className="flex items-center gap-3 mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                            Yoklama Geçmişi
                        </h1>
                        <p className="text-xs text-slate-500 font-medium">Katıldığınız tüm dersler</p>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                            placeholder="Ders ara..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 h-11 rounded-2xl bg-white/80 backdrop-blur-md border-white/40 focus:bg-white transition-all shadow-sm focus:ring-2 focus:ring-indigo-100 hover:bg-white/90"
                        />
                    </div>
                    <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
                        <SelectTrigger className="w-[80px] h-11 rounded-2xl bg-white/80 backdrop-blur-md border-white/40 text-slate-600 font-medium shadow-sm hover:bg-white/90 px-0 justify-center">
                            <Filter className="w-5 h-5 text-indigo-600" />
                        </SelectTrigger>
                        <SelectContent align="end" className="rounded-2xl min-w-[150px]">
                            <SelectItem value="all">Tüm Dersler</SelectItem>
                            {uniqueCourses.map(c => (
                                <SelectItem key={c.id} value={c.id}>{c.code}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <main className="relative z-10 px-5 pb-6 space-y-4">
                {isLoading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="flex gap-4 p-4 rounded-3xl bg-white border border-slate-100 shadow-sm opacity-80">
                            <Skeleton className="h-12 w-12 rounded-2xl shrink-0" />
                            <div className="flex-1 space-y-2">
                                <Skeleton className="h-4 w-3/4 rounded-full" />
                                <Skeleton className="h-3 w-1/2 rounded-full" />
                            </div>
                        </div>
                    ))
                ) : filteredHistory.length > 0 ? (
                    <div className="grid gap-4">
                        {filteredHistory.map((item) => (
                            <div
                                key={item.sessionId}
                                className="group relative bg-white/90 backdrop-blur-sm p-4 rounded-3xl border border-white/50 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.05)] hover:shadow-lg transition-all active:scale-[0.98] overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-emerald-50/50 to-transparent rounded-bl-full -mr-6 -mt-6 pointer-events-none" />

                                <div className="flex items-start gap-4 relative">
                                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100/50 shadow-sm group-hover:bg-emerald-100 transition-colors">
                                        <CheckCircle2 className="w-6 h-6" />
                                    </div>

                                    <div className="flex-1 min-w-0 pt-0.5">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100 uppercase tracking-wide">
                                                {item.courseCode}
                                            </span>
                                            <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                                                <CalendarDays className="w-3 h-3" />
                                                {formatDateTr(item.sessionDate).split(" ")[0]}
                                            </span>
                                        </div>

                                        <h3 className="font-bold text-slate-900 truncate leading-tight mb-1.5">
                                            {item.courseName}
                                        </h3>

                                        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium bg-slate-50/80 inline-flex px-2 py-1 rounded-md">
                                            <History className="w-3 h-3" />
                                            {formatDateTr(item.sessionDate).split(" ").slice(1).join(" ")} {"'de katıldınız"}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in zoom-in duration-500">
                        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm border border-slate-100">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center">
                                <History className="w-8 h-8 text-slate-300" />
                            </div>
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-1">Kayıt Bulunamadı</h3>
                        <p className="text-sm text-slate-500 max-w-[200px] leading-relaxed">
                            {searchTerm ? "Arama kriterlerine uygun yoklama geçmişi yok." : "Henüz hiçbir yoklamaya katılım sağlamadınız."}
                        </p>
                    </div>
                )}
            </main>
        </div>
    );
}
