import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { TeacherCourseSummary, type RosterStudentRow, type TeacherCourseDetail } from "@/types/course";
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
    staleTime: 30 * 1000,
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
