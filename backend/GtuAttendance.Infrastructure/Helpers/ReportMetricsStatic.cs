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
        AppDbContext context, Guid courseId, AttendanceDenominator denominator
    )
    {
        if (denominator == AttendanceDenominator.Enrolled)
        {
            int val = await context.CourseEnrollments.AsNoTracking().Where(e => e.CourseId == courseId && e.IsValidated).CountAsync();
            return val;
        }
        else
        {
            return await context.CourseRosters.AsNoTracking().Where(r => r.CourseId == courseId).CountAsync();
        }
    }
}

