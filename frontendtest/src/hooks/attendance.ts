import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import type {
    BeginCheckInRequest,
    BeginCheckInResponse,
    CheckInRequest,
    CheckInResponse,
    ActiveSessionInfo,
} from "@/types/attendance";

export const apiFetch = async <T>(endpoint: string, options: RequestInit = {}): Promise<T> => {
    const headers = {
        "Content-Type": "application/json",
        ...options.headers,
    };

    const config = {
        ...options,
        headers,
        body: options.body instanceof FormData ? options.body : JSON.stringify(options.body),
    };

    const response = await fetch(endpoint, config);

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Something went wrong");
    }

    return response.json();
};

export function useBeginCheckIn() {
    return useMutation({
        mutationFn: async (request: BeginCheckInRequest) => {
            return apiFetch<BeginCheckInResponse>("/api/attendance/check-in/begin", {
                method: "POST",
                body: request as any,
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
                body: request as any,
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
