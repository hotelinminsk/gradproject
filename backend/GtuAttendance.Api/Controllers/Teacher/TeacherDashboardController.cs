
using GtuAttendance.Api.Extensions;
using GtuAttendance.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

using GtuAttendance.Api.DTOs;
using System.IO.Compression;
using GtuAttendance.Infrastructure.Helpers;


namespace GtuAttendance.Api.Controllers.Teacher;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Teacher")]
public class TeacherDashboardController: ControllerBase
{
    private readonly AppDbContext _dbContext;
    public TeacherDashboardController(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpGet("summary")]
    public async Task<ActionResult<TeacherDashboardSummaryResponse>> GetSummary()
    {
        var teacherId = User.GetUserId();
        if (teacherId is null) return Unauthorized();

        var activeCourseCount = await _dbContext.Courses.CountAsync(ce => ce.IsActive && ce.TeacherId == teacherId);
        var totalStudentCount = await _dbContext.CourseEnrollments.CountAsync(ce => ce.Course.TeacherId == teacherId && ce.IsValidated && !ce.IsDropped);

        var weekAgo = DateTime.UtcNow.Date.AddDays(-7);
        var sessionsThisWeek = await _dbContext.AttendanceSessions.CountAsync(se => se.TeacherId == teacherId && se.CreatedAt >= weekAgo);

        var courseIds = await _dbContext.Courses.AsNoTracking().Where(c => c.TeacherId == teacherId).Select(c => c.CourseId).ToListAsync();
        
        
        double avgSums = 0.0;
        double steps = 0.0;
        foreach(var courseId in courseIds)
        {
            var avgpct = await ReportMetrics.CalculateCourseAttendancePctAsync(_dbContext, courseId,AttendanceDenominator.Enrolled,weekAgo); // 0 MEANS ENROLLED,
            avgSums += avgpct;
            steps++;
        }

        var avgAttendancePCT = steps == 0 ? 0 : (int)Math.Round(avgSums / steps);
        var upcoming = await _dbContext.Courses
        .Where(c => c.TeacherId == teacherId)
        .OrderByDescending(c => c.Enrollments.Count(e => e.IsValidated && !e.IsDropped))
        .Select(c => new UpcomingCourseRow(
            c.CourseId,

            c.CourseName,

            c.CourseCode,

            c.Enrollments.Count(e => e.IsValidated && !e.IsDropped),

            null
        ))
        .Take(3)
        .ToListAsync();

        var response = new TeacherDashboardSummaryResponse(
            activeCourseCount,

            totalStudentCount,

            sessionsThisWeek,

            avgAttendancePCT,

            upcoming
        );

        return Ok(response);
    }
}
