import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { TeacherDashboardSummary} from "@/types/dashboard";

export function useTeacherDashboardSummary(){
    return useQuery({
        queryKey: ["teacher-dashboard-summary"],
        queryFn: () => 
            apiFetch<TeacherDashboardSummary>("/api/TeacherDashboard/summary", {
                audience: "teacher"
            }),
            staleTime: 1000 * 60
    });
}