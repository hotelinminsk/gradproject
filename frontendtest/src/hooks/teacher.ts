import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import {
  TeacherCourseSummary,
  type RosterStudentRow,
  type TeacherCourseDetail,
  type CreateSessionPayload,
  type CreateSessionResponse,
} from "@/types/course";
import { type SessionDetail, type SessionQrPoll, type SessionSummary, type ActiveSessionInfo } from "@/types/attendance";
import { toast } from "sonner";
import type { TeacherDashboardSummary } from "@/types/dashboard";


  

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

export function useCreateCourse(){
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload: {courseName: string; courseCode: string; description?: string}) =>
            apiFetch<{courseId: string}>("/api/Course", {
                method: "POST",
                body: payload,
                audience: "teacher",
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ["teacher-dashboard-summary"]});
            queryClient.invalidateQueries({queryKey: ["teacher-courses"]});
        },
    });
}

type UploadRosterPayload =
  | RosterStudentRow[]
  | {
      students: RosterStudentRow[];
      replaceExisting?: boolean;
    };

export function useUploadRosterBulk(courseId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UploadRosterPayload) => {
      if (!courseId) throw new Error("Course ID missing");
      const payload = Array.isArray(input)
        ? { students: input }
        : { students: input.students, replaceExisting: input.replaceExisting ?? false };
      return apiFetch(`/api/Course/${courseId}/roster/bulk`, {
        method: "POST",
        body: payload,
        audience: "teacher",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teacher-courses"] });
      if (courseId) {
        queryClient.invalidateQueries({ queryKey: ["teacher-course", courseId] });
      }
      toast.success("Roster uploaded successfully!");
    },
  });
}
// course/mine/courses/teacher
export const useTeacherCourses = () => 
    useQuery({
        queryKey: ["teacher-courses"],
        queryFn: () => 
            apiFetch<TeacherCourseSummary[]>("/api/course/mine/courses/teacher", {audience: "teacher"}),
        staleTime: 60 * 1000,
    });


export const useTeacherCourse = (courseId?: string) =>
  useQuery({
    queryKey: ["teacher-course", courseId],
    enabled: !!courseId,
    queryFn: () => {
      if (!courseId) throw new Error("Course id is required");
      return apiFetch<TeacherCourseDetail>(`/api/Course/${courseId}/manage-detail`, {
        audience: "teacher",
      });
    },
    staleTime: 60 * 1000,
  });

export const useCreateSession = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateSessionPayload) =>
      apiFetch<CreateSessionResponse>("/api/Attendance/createsession", {
        method: "POST",
        body: { ...payload },
        audience: "teacher",
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["teacher-course", variables.courseId] });
      queryClient.invalidateQueries({ queryKey: ["active-session", variables.courseId] });
      queryClient.invalidateQueries({ queryKey: ["teacher-sessions"] });
      toast.success("Attendance session created.");
    },
    onError: (err) => toast.error(err.message ?? "Failed to create session"),
  });
};

export const useSessionDetail = (sessionId?: string) =>
  useQuery({
    queryKey: ["session-detail", sessionId],
    enabled: !!sessionId,
    refetchInterval: 4000,
    queryFn: () =>
      apiFetch<SessionDetail>(`/api/Attendance/sessions/${sessionId}`, {
        audience: "teacher",
      }),
  });

export const useSessionQrPoll = (sessionId?: string, enabled = true) =>
  useQuery({
    queryKey: ["session-qr", sessionId],
    enabled: !!sessionId && enabled,
    refetchInterval: 1000,
    queryFn: () =>
      apiFetch<SessionQrPoll>(`/api/Attendance/sessions/${sessionId}/qr-poll`, {
        audience: "teacher",
      }),
  });

export const useCloseSession = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sessionId: string) =>
      apiFetch<{ msg: string; sessionId: string }>(`/api/Attendance/sessions/${sessionId}/close`, {
        method: "POST",
        audience: "teacher",
      }),
    onSuccess: (_, sessionId) => {
      queryClient.invalidateQueries({ queryKey: ["session-detail", sessionId] });
      queryClient.invalidateQueries({ queryKey: ["session-qr", sessionId] });
      toast.success("Session ended.");
    },
    onError: (err) => toast.error(err.message ?? "Failed to end session"),
  });
};

export const useTeacherSessions = () =>
  useQuery({
    queryKey: ["teacher-sessions"],
    queryFn: () =>
      apiFetch<SessionSummary[]>("/api/Attendance/sessions", {
        audience: "teacher",
      }),
    staleTime: 10 * 1000,
  });

export const useTeacherSessionsByCourse = (courseId?: string) =>
  useQuery({
    queryKey: ["teacher-sessions", courseId],
    enabled: !!courseId,
    queryFn: () =>
      apiFetch<SessionSummary[]>(`/api/Attendance/sessions${courseId ? `?courseId=${courseId}` : ""}`, {
        audience: "teacher",
      }),
    staleTime: 10 * 1000,
  });

export const useActiveSession = (courseId?: string) =>
  useQuery<ActiveSessionInfo | null>({
    queryKey: ["active-session", courseId],
    enabled: !!courseId,
    retry: false,
    refetchInterval: 8000,
    queryFn: async () => {
      try {
        return await apiFetch<ActiveSessionInfo>(`/api/Attendance/courses/${courseId}/active-session`, {
          audience: "teacher",
        });
      } catch (err: any) {
        // Treat 404/not found as "no active session"
        const msg = err?.message?.toLowerCase?.() ?? "";
        if (msg.includes("not found") || msg.includes("404")) return null;
        throw err;
      }
    },
  });

    export const useBulkDeleteCourses = () => {
        const qc = useQueryClient();
        return useMutation({
            mutationFn: (ids: string[]) =>
                apiFetch<{removed: number; skipped: number}>("/api/Course", {
                    method: "DELETE",
                    body: {courseIds: ids},
                    audience: "teacher",
                }),
                onSuccess: (_, ids) => {
                    qc.invalidateQueries({queryKey: ["teacher-courses"]});
                    qc.invalidateQueries({queryKey: ["teacher-dashboard-summary"]});
                    toast.success(`Removed ${ids.length} course(s).`);

                },
                onError: (err) => toast.error(err.message ?? "Delete failed."),
        });
    };
