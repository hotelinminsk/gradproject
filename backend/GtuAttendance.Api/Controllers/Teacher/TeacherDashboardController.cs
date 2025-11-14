
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
        var totalStudentCount = await _dbContext.CourseEnrollments.CountAsync(ce => ce.Course.TeacherId == teacherId && ce.IsValidated);

        var weekAgo = DateTime.UtcNow.Date.AddDays(-7);
        var sessionsThisWeek = await _dbContext.AttendanceSessions.CountAsync(se => se.TeacherId == teacherId && se.CreatedAt >= weekAgo);


        var denom = await ReportMetrics.GetEnrollmentDenominatorAsync(_dbContext, courseId);
        var avgAttendancePct = await ReportMetrics.CalculateCourseAttendancePctAsync()

        var upcoming = await _dbContext.Courses
        .Where(c => c.TeacherId == teacherId)
        .OrderByDescending(c => c.Enrollments.Count(e => e.IsValidated))
        .Select(c => new UpcomingCourseRow(
            c.CourseId,

            c.CourseName,

            c.CourseCode,

            c.Enrollments.Count(e => e.IsValidated),

            null
        ))
        .Take(3)
        .ToListAsync();

        var response = new TeacherDashboardSummaryResponse(
            activeCourseCount,

            totalStudentCount,

            sessionsThisWeek,

            avgAttendancePct,

            upcoming
        );

        return Ok(response);
    }
}