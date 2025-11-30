public record UpcomingCourseRow(Guid CourseID, string CourseName, string CourseCode, int StudentCount, DateTime? NextSessionTimeUTC);

public record TeacherDashboardSummaryResponse(
    int ActiveCourseCount,

    int TotalStudentCount,

    int SessionsThisWeek,

    int AverageAttendancePCT,

    IList<UpcomingCourseRow> UpcomingCourses
);

