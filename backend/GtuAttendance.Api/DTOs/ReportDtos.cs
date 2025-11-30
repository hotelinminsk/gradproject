using System;

namespace  GtuAttendance.Api.DTOs;

// public enum AttendanceDenominator
// {
//     Enrolled = 0,
//     Roster = 1,
// };

public record CourseReportOverviewResponse(
    Guid CourseId,
    DateTime FromUtc,
    DateTime ToUtc,
    int TotalSessions,
    int TotalCheckIns,
    int DenominatorCount,
    int AverageAttendancePct,
    LastSessionSummary? LastSession,
    IList<WeeklyBucket> Weekly);

public record LastSessionSummary(DateTime CreatedAtUtc, int CheckIns);

public record WeeklyBucket(int Year, int WeekIndex, int Count, double? ChangePctFromPrev);

public record CourseReportWeeklyResponse(
    Guid CourseId,
    DateTime FromUtc,
    DateTime ToUtc,
    int DenominatorCount,
    IList<SessionRow> Sessions
);

public record SessionRow(Guid SessionId, DateTime CreatedAtUtc, int CheckIns, int AttendancePct);

public record CourseReportMonthlyResponse(
    Guid CourseId,
    DateTime FromUtc,
    DateTime ToUtc,
    int DenominatorCount,
    IList<MonthBucket> Months
);


public record MonthBucket(int Year, int MonthIndex, int Count, int AttendancePct);



public record SessionAttendanceResponse(
    Guid CourseId,
    Guid SessionId,
    DateTime CreatedAtUtc,
    string Denominator,
    int PresentCount,
    int AbsentCount,
    IList<StudentPresentRow> Present,
    IList<StudentAbsentRow> Absent,
    IList<StudentPresentRow>? Invalid
);

public record StudentPresentRow(
    Guid StudentId,
    string FullName,
    string GtuStudentId,
    DateTime CheckInTimeUtc,
    string? DeviceName
);

public record StudentAbsentRow (
    Guid? StudentId,
    string FullName,
    string GtuStudentId
);










