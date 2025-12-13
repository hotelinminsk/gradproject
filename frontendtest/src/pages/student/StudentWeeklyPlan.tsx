import React, { useMemo } from "react";
import { useStudentCourses } from "@/hooks/student";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarClock, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import StudentBottomNav from "@/components/student/StudentBottomNav";

const DAYS = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];

export default function StudentWeeklyPlan() {
    const { data: courses = [], isLoading } = useStudentCourses();
    const navigate = useNavigate();

    const weeklySchedule = useMemo(() => {
        const schedule = Array.from({ length: 7 }, () => [] as {
            courseId: string;
            courseCode: string;
            courseName: string;
            teacherName?: string;
            startTime: string;
            endTime: string;
        }[]);

        courses.forEach(course => {
            course.schedules?.forEach(s => {
                if (s.dayOfWeek >= 0 && s.dayOfWeek <= 6) {
                    schedule[s.dayOfWeek].push({
                        courseId: course.courseId,
                        courseCode: course.courseCode,
                        courseName: course.courseName,
                        teacherName: course.teacherName,
                        startTime: s.startTime,
                        endTime: s.endTime
                    });
                }
            });
        });

        // Sort by start time
        schedule.forEach(day => {
            day.sort((a, b) => a.startTime.localeCompare(b.startTime));
        });

        return schedule;
    }, [courses]);

    // Adjust to start from Monday (1) to Sunday (0)
    const sortedDays = [1, 2, 3, 4, 5, 6, 0];

    return (
        <div className="min-h-screen bg-slate-50 pb-safe-nav text-slate-900 relative">
            {/* Background Gradients */}
            <div className="absolute top-0 left-0 right-0 h-[400px] bg-gradient-to-b from-indigo-50/80 to-slate-50 pointer-events-none" />
            <div className="absolute top-[-10%] right-[-5%] w-[300px] h-[300px] bg-blue-100/40 rounded-full blur-3xl pointer-events-none" />

            <div className="relative px-6 pt-12 pb-6 z-10">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">Haftalık Planım</h1>
                <p className="text-sm text-slate-500 font-medium mt-1">Bu dönemki ders programın</p>
            </div>

            <main className="px-5 py-6 space-y-8 max-w-lg mx-auto relative z-10">
                {isLoading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full rounded-3xl" />)}
                    </div>
                ) : (
                    <div className="space-y-8">
                        {sortedDays.map(dayIndex => {
                            const daySchedule = weeklySchedule[dayIndex];
                            const dayName = DAYS[dayIndex];
                            const isToday = new Date().getDay() === dayIndex;

                            if (daySchedule.length === 0) return null;

                            return (
                                <div key={dayIndex} className="relative group">
                                    <div className="flex items-center gap-3 mb-4 sticky top-20 z-0">
                                        <span className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold shadow-sm border ${isToday ? "bg-indigo-600 text-white border-indigo-500" : "bg-white text-slate-500 border-slate-200"}`}>
                                            {dayIndex === 0 ? "Pz" : dayIndex === 1 ? "Pt" : dayIndex === 2 ? "Sa" : dayIndex === 3 ? "Ça" : dayIndex === 4 ? "Pe" : dayIndex === 5 ? "Cu" : "Ct"}
                                        </span>
                                        <h2 className={`font-bold text-xl ${isToday ? "text-indigo-600" : "text-slate-700"}`}>{dayName}</h2>
                                        {isToday && <span className="text-[10px] font-bold uppercase bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full ml-auto">Bugün</span>}
                                    </div>

                                    <div className="space-y-4 pl-4 border-l-2 border-dashed border-slate-200 ml-4 pb-2">
                                        {daySchedule.map((item, idx) => (
                                            <Card
                                                key={idx}
                                                className="p-0 rounded-2xl border border-slate-100 shadow-sm bg-white hover:shadow-md transition-all active:scale-[0.99] cursor-pointer overflow-hidden group/card"
                                                onClick={() => navigate(`/student/courses/${item.courseId}`)}
                                            >
                                                <div className="flex">
                                                    <div className="w-1.5 bg-indigo-500/80" />
                                                    <div className="p-4 flex-1">
                                                        <div className="flex justify-between items-start mb-2">
                                                            <div className="flex flex-col">
                                                                <span className="font-bold text-slate-900 text-lg leading-none mb-1">{item.courseCode}</span>
                                                                <span className="text-xs text-slate-500 font-medium line-clamp-1">{item.courseName}</span>
                                                            </div>
                                                            <ArrowRight className="w-4 h-4 text-slate-300 group-hover/card:text-indigo-500 transition-colors" />
                                                        </div>

                                                        <div className="flex items-center gap-3 mt-3 pt-3 border-t border-slate-50">
                                                            <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md">
                                                                <CalendarClock className="w-3.5 h-3.5" />
                                                                {item.startTime.slice(0, 5)} - {item.endTime.slice(0, 5)}
                                                            </div>
                                                            <div className="text-xs text-slate-400 font-medium ml-auto">
                                                                {item.teacherName || "Öğr. Gör."}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </Card>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}

                        {weeklySchedule.every(d => d.length === 0) && (
                            <div className="flex flex-col items-center justify-center py-20 text-center opacity-60">
                                <div className="w-20 h-20 bg-white rounded-full shadow-sm border border-slate-100 flex items-center justify-center mb-4">
                                    <CalendarClock className="w-10 h-10 text-slate-300" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-900">Program Boş</h3>
                                <p className="text-sm text-slate-500 max-w-[200px]">Henüz kayıtlı olduğunuz derslerin programı eklenmemiş.</p>
                            </div>
                        )}
                    </div>
                )}
            </main>

            <StudentBottomNav />
        </div>
    );
}
