using System.Security.Claims;
using GtuAttendance.Api.DTOs;
using GtuAttendance.Core.Entities;
using GtuAttendance.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using GtuAttendance.Infrastructure.Errors.Common;
using GtuAttendance.Infrastructure.Errors.Students;
using GtuAttendance.Infrastructure.Errors.Teachers;



namespace GtuAttendance.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ReportsController : ControllerBase
{
    private readonly ILogger<ReportsController> _logger;
    private readonly AppDbContext _context;
    public ReportsController(
        ILogger<ReportsController> logger,
        AppDbContext context
    )
    {
        _logger = logger;
        _context = context;
    }

    private Guid? GetUserId()
    {
        var sub = User?.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User?.FindFirst("sub")?.Value;
        if (!Guid.TryParse(sub, out var g)) return null;
        return g;
    }

    private async Task<bool> TeacherOwnsCourse(Guid teacherId, Guid courseId)
    {
        var course = await _context.Courses.FirstOrDefaultAsync(c => c.CourseId == courseId && c.TeacherId == teacherId);
        return course is not null;
    }

    private static (DateTime FromUtc, DateTime ToUtc) NormalizeRange(DateTime? from, DateTime? to)
    {
        var f = (from?.ToUniversalTime() ?? DateTime.UnixEpoch);
        var t = (to?.ToUniversalTime() ?? DateTime.UtcNow);
        return (f, t);
    }

    private async Task<int> GetDenominatorAsync(Guid courseId, AttendanceDenominator denominator)
    {
        if(denominator == AttendanceDenominator.Enrolled)
        {
            int val = await _context.CourseEnrollments.Where(e => e.CourseId == courseId && e.IsValidated).CountAsync();

            return val;
        }else
        {
            return await _context.CourseRosters.Where(r => r.CourseId == courseId).CountAsync();
        }
    }

    [Authorize(Roles = "Teacher")]
    [HttpGet("course/{courseId:guid}/overview")]
    public async Task<IActionResult> GetCourseReportOverview(
        [FromRoute] Guid courseId,
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to,
        [FromQuery] AttendanceDenominator denom = AttendanceDenominator.Enrolled
    )
    {
        try
        {
            var teacherId = GetUserId();
            if (teacherId is null) throw new Unauthrozied();
        }
        catch (System.Exception)
        {
            
            throw;
        }
    }
    

}
