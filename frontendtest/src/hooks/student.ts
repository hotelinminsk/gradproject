import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { StudentCourseSummary } from "@/types/course";
import { toast } from "sonner";
import { useStudentSession } from "@/providers";


export const useStudentCourses = () =>
  useQuery({
    queryKey: ["student-courses"],
    queryFn: () =>
      apiFetch<StudentCourseSummary[]>("/api/course/mine/courses/student", {
        audience: "student",
      }),
    staleTime: 5_000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

export const useEnrollByInvite = () => {
  const queryClient = useQueryClient();
  const { hub } = useStudentSession();
  return useMutation({
    mutationFn: async (invitationToken: string) => {
      const res = await apiFetch<{ courseId: string }>("/api/course/enroll-by-invite", {
        method: "POST",
        body: { invitationToken },
        audience: "student",
      });
      // yeni kurs grubu için huba bağlan
      if (res?.courseId && hub) {
        try {
          await hub.invoke("JoinCourseGroupAsStudent", res.courseId);
        } catch {
          // sessiz geç
        }
      }
      return res;
    },
    onSuccess: () => {
      toast.success("Kursa kayıt başarılı.");
      queryClient.invalidateQueries({ queryKey: ["student-courses"] });
    },
    onError: (err: any) => toast.error(err?.message ?? "Kursa kayıt başarısız"),
  });
};
