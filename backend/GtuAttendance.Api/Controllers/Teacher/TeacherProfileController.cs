using GtuAttendance.Api.DTOs;
using GtuAttendance.Api.Extensions;
using GtuAttendance.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace GtuAttendance.Api.Controllers.Teacher;

[ApiController]
[Route("api/teacher")]
public class TeacherProfileController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ILogger<TeacherProfileController> _logger;

    public TeacherProfileController(
        AppDbContext context,
        ILogger<TeacherProfileController> logger
    )
    {
        _context = context;
        _logger = logger;
    }

    [Authorize(Roles = "Teacher")]
    [HttpGet("profile")]
    public async Task<ActionResult<TeacherProfileResponse>> GetProfile()
    {
        var teacherId = User.GetUserId();
        if (teacherId is null)
        {
            _logger.LogWarning("Teacher profile requested but no valid user id was found in claims.");
            return Unauthorized();
        }

        var profile = await _context.Users
            .AsNoTracking()
            .Where(u => u.UserId == teacherId && u.Role == "Teacher")
            .Select(u => new TeacherProfileResponse(
                u.UserId,
                u.FullName,
                u.Email,
                u.CreatedAt,
                _context.Courses.Count(c => c.TeacherId == u.UserId)
            ))
            .FirstOrDefaultAsync();

        if (profile is null)
        {
            _logger.LogWarning("Teacher profile request failed for user {TeacherId}", teacherId);
            return NotFound();
        }

        return Ok(profile);
    }
}
