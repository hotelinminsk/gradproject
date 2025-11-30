using GtuAttendance.Api.DTOs;
using GtuAttendance.Api.Extensions;
using GtuAttendance.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
namespace GtuAttendance.Api.Controllers.Student;


[ApiController]
[Route("api/student")]
public class StudentProfileController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ILogger<StudentProfileController> _logger;


    public StudentProfileController(
        AppDbContext context,
        ILogger<StudentProfileController> logger
    )
    {
        _context = context;
        _logger = logger;
    }

    [Authorize(Roles = "Student")]
    [HttpGet("profile")]
    public async Task<ActionResult<StudentProfileResponse>> GetProfile()
    {
        var studentId = User.GetUserId();

        if (studentId is null)
        {
            _logger.LogWarning("Student profile requested but no valid user id was found in claims.");
            return Unauthorized();
        }

        var profile = await _context.Users
        .AsNoTracking()
        .Where(u => u.UserId == studentId && u.Role == "Student")
        .Select(u => new StudentProfileResponse(
            u.UserId,

            u.FullName,

            u.Email,

            u.GtuStudentId,

            u.CreatedAt,

            _context.CourseEnrollments.Count(ce => ce.StudentId == u.UserId && ce.IsValidated && !ce.IsDropped)

        )).FirstOrDefaultAsync();

        if (profile is null)
        {
            _logger.LogWarning("Student profile request failed for user {StudentId}", studentId);
            return NotFound();
        }

        return Ok(profile);
    }


}
