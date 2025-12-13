import { useMutation, useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import type {
    BeginCheckInRequest,
    BeginCheckInResponse,
    CheckInRequest,
    CheckInResponse,
    ActiveSessionInfo,
} from "@/types/attendance";

export function useBeginCheckIn() {
    return useMutation({
        mutationFn: async (request: BeginCheckInRequest) => {
            return apiFetch<BeginCheckInResponse>("/api/attendance/check-in/begin", {
                method: "POST",
                body: request,
            });
        },
        onError: (error: any) => {
            toast.error(error.message || "Yoklama başlatılamadı");
        },
    });
}

export function useCompleteCheckIn() {
    return useMutation({
        mutationFn: async (request: CheckInRequest) => {
            return apiFetch<CheckInResponse>("/api/attendance/check-in/complete", {
                method: "POST",
                body: request,
            });
        },
        onSuccess: (data) => {
            if (data.status === "Present") {
                toast.success("Yoklama başarılı!");
            } else if (data.status === "OutOfRange") {
                toast.warning(`Mesafe çok uzak: ${data.distanceFromTeacherMeters.toFixed(0)}m`);
            } else if (data.status === "AlreadyCheckedIn") {
                toast.info("Zaten yoklama verdiniz");
            } else if (data.status === "Expired") {
                toast.error("Oturum süresi doldu");
            }
        },
        onError: (error: any) => {
            toast.error(error.message || "Yoklama kaydedilemedi");
        },
    });
}

export function useActiveSession(courseId?: string) {
    return useQuery({
        queryKey: ["active-session", courseId],
        queryFn: async () => {
            if (!courseId) throw new Error("Course ID required");
            return apiFetch<ActiveSessionInfo>(`/api/attendance/courses/${courseId}/active-session`);
        },
        enabled: !!courseId,
        retry: false,
    });
}
