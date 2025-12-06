import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { StudentCourseSummary } from "@/types/course";
import { toast } from "sonner";


export const useStudentCourses = () =>
  useQuery({
    queryKey: ["student-courses"],
    queryFn: () =>
      apiFetch<StudentCourseSummary[]>("/api/course/mine/courses/student", {
        audience: "student",
      }),
    staleTime: 30_000,
  });

export const useEnrollByInvite = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (invitationToken: string) =>
      apiFetch("/api/course/enroll-by-invite", {
        method: "POST",
        body: { invitationToken },
        audience: "student",
      }),
    onSuccess: () => {
      toast.success("Kursa kayıt başarılı.");
      queryClient.invalidateQueries({ queryKey: ["student-courses"] });
    },
    onError: (err: any) => toast.error(err?.message ?? "Kursa kayıt başarısız"),
  });
};
