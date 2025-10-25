using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using GtuAttendance.Infrastructure.Data;

namespace GtuAttendance.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Policy = "AdminOnly")]
public class AdminController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ILogger<AdminController> _logger;

    public AdminController(AppDbContext context, ILogger<AdminController> logger)
    {
        _context = context; _logger = logger;

    }


    [HttpGet("info")]
    public IActionResult Info() => Ok(new
    {
        Version = typeof(Program).Assembly.GetName().Version?.ToString(),
        Environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT"),
        UtcNow = DateTime.UtcNow
    });

    [HttpGet("users")]
    public async Task<IActionResult> Users([FromQuery] string? role, [FromQuery] string? email)
    {
        var q = _context.Users.AsNoTracking().AsQueryable();
        if (!string.IsNullOrWhiteSpace(role)) q = q.Where(u => u.Role == role);
        if (!string.IsNullOrWhiteSpace(email)) q = q.Where(u => u.Email == email);
        var list = await q.OrderByDescending(u => u.CreatedAt)
                    .Select(u => new { u.UserId, u.FullName, u.Email, u.Role, u.IsActive, u.CreatedAt })
                    .Take(200).ToListAsync();

        return Ok(list);
    }

    [HttpGet("sessions")]
    public async Task<IActionResult> Sessions([FromQuery] Guid? courseId, [FromQuery] bool activeOnly = false)
    {
        var q = _context.AttendanceSessions.AsNoTracking().AsQueryable();
        if (courseId.HasValue) q = q.Where(s => s.CourseId == courseId.Value);
        if (activeOnly) q = q.Where(s => s.IsActive && s.ExpiresAt > DateTime.UtcNow);
        var list = await q.OrderByDescending(s => s.CreatedAt)
                        .Select(s => new { s.SessionId, s.CourseId, s.TeacherId, s.CreatedAt, s.ExpiresAt, s.IsActive, s.MaxDistanceMeters })
                        .Take(200).ToListAsync();
        return Ok(list);
    }
}