import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import {
    CourseReportOverviewResponse,
    CourseReportWeeklyResponse,
    CourseReportMonthlyResponse,
    CourseStudentStatisticsResponse
} from "@/types/reports";

export function useCourseReportOverview(courseId: string | undefined, from?: Date, to?: Date) {
    const queryParams = new URLSearchParams();
    if (from) queryParams.append("from", from.toISOString());
    if (to) queryParams.append("to", to.toISOString());

    const queryString = queryParams.toString();
    const url = `/api/Reports/course/${courseId}/overview${queryString ? `?${queryString}` : ""}`;

    return useQuery({
        queryKey: ["course-report-overview", courseId, from, to],
        enabled: !!courseId,
        queryFn: () =>
            apiFetch<CourseReportOverviewResponse>(
                url,
                { audience: "teacher" }
            ),
    });
}

export function useCourseReportWeekly(courseId: string | undefined, from?: Date, to?: Date) {
    const queryParams = new URLSearchParams();
    if (from) queryParams.append("from", from.toISOString());
    if (to) queryParams.append("to", to.toISOString());

    const queryString = queryParams.toString();
    const url = `/api/Reports/course/${courseId}/weekly${queryString ? `?${queryString}` : ""}`;

    return useQuery({
        queryKey: ["course-report-weekly", courseId, from, to],
        enabled: !!courseId,
        queryFn: () =>
            apiFetch<CourseReportWeeklyResponse>(
                url,
                { audience: "teacher" }
            ),
    });
}

export function useCourseReportMonthly(courseId: string | undefined, from?: Date, to?: Date) {
    const queryParams = new URLSearchParams();
    if (from) queryParams.append("from", from.toISOString());
    if (to) queryParams.append("to", to.toISOString());

    const queryString = queryParams.toString();
    const url = `/api/Reports/course/${courseId}/monthly${queryString ? `?${queryString}` : ""}`;

    return useQuery({
        queryKey: ["course-report-monthly", courseId, from, to],
        enabled: !!courseId,
        queryFn: () =>
            apiFetch<CourseReportMonthlyResponse>(
                url,
                { audience: "teacher" }
            ),
    });
}

export function useCourseStudentStatistics(courseId: string | undefined, from?: Date, to?: Date) {
    const queryParams = new URLSearchParams();
    if (from) queryParams.append("from", from.toISOString());
    if (to) queryParams.append("to", to.toISOString());

    const queryString = queryParams.toString();
    const url = `/api/Reports/course/${courseId}/students${queryString ? `?${queryString}` : ""}`;

    return useQuery({
        queryKey: ["course-report-students", courseId, from, to],
        enabled: !!courseId,
        queryFn: () =>
            apiFetch<CourseStudentStatisticsResponse>(
                url,
                { audience: "teacher" }
            ),
    });
}
