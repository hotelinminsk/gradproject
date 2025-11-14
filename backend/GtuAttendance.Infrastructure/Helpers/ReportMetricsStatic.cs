using System.IO.Compression;
using GtuAttendance.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;


namespace GtuAttendance.Infrastructure.Helpers;

public enum AttendanceDenominator
{
    Enrolled = 0,
    Roster = 1,
};


public static class ReportMetrics
{
    public static async Task<int> GetEnrollmentDenominatorAsync(AppDbContext context, Guid courseId)
    {
        return await context.CourseEnrollments.CountAsync(e => e.CourseId == courseId && e.IsValidated);
    }


    public static async Task<int> CalculateCourseAttendancePctAsync(
        AppDbContext context, Guid courseId, AttendanceDenominator denominator, DateTime since
    )
    {

        var denom = denominator == AttendanceDenominator.Enrolled
        ? await context.CourseEnrollments
            .AsNoTracking()
            .CountAsync(e => e.CourseId == courseId && e.IsValidated)
            : await context.CourseRosters
            .AsNoTracking()
            .CountAsync(r => r.CourseId == courseId);

        if (denom == 0) return 0;

        var CheckIns = await context.AttendanceRecords
        .AsNoTracking()
        .CountAsync(r =>
            r.CourseId == courseId &&
            r.IsWithinRange && 
            r.CheckInTime >= since
            );
        
        return (int)Math.Round(100.0 * CheckIns / denom);
    }
}

