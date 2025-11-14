export interface UpcomingCourseRow {
    courseId: string;
    courseName: string;
    courseCode: string;
    studentCount: number;
    nextSessionTimeUtc: string | null;
}

export interface TeacherDashboardSummary {
    activeCourseCount: number;
    totalStudentCount: number;
    sessionsThisWeek: number;
    averageAttendancePCT: number;
    upcomingCourses: UpcomingCourseRow[];
}