export interface WeeklyBucket {
    year: number;
    weekIndex: number;
    count: number;
    changePctFromPrev?: number;
}

export interface LastSessionSummary {
    createdAtUtc: string;
    checkIns: number;
}

export interface CourseReportOverviewResponse {
    courseId: string;
    fromUtc: string;
    toUtc: string;
    totalSessions: number;
    totalCheckIns: number;
    denominatorCount: number;
    averageAttendancePct: number;
    lastSession?: LastSessionSummary;
    weekly: WeeklyBucket[];
}

export interface SessionRow {
    sessionId: string;
    createdAtUtc: string;
    checkIns: number;
    attendancePct: number;
}

export interface CourseReportWeeklyResponse {
    courseId: string;
    fromUtc: string;
    toUtc: string;
    denominatorCount: number;
    sessions: SessionRow[];
}

export interface MonthBucket {
    year: number;
    monthIndex: number;
    count: number;
    attendancePct: number;
}

export interface CourseReportMonthlyResponse {
    courseId: string;
    fromUtc: string;
    toUtc: string;
    denominatorCount: number;
    months: MonthBucket[];
}

export interface StudentReportRow {
    studentId: string;
    fullName: string;
    gtuStudentId: string;
    attendedCount: number;
    totalSessions: number;
    attendanceRate: number;
}

export interface CourseStudentStatisticsResponse {
    courseId: string;
    totalSessions: number;
    students: StudentReportRow[];
}
