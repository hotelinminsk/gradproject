using System.Security.Cryptography;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.EntityFrameworkCore;
using GtuAttendance.Infrastructure.Data;
using GtuAttendance.Core.Entities;

namespace GtuAttendance.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TeacherInvitesController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IConfiguration _config;
    private readonly ILogger<TeacherInvitesController> _logger;
    public TeacherInvitesController(AppDbContext context, IConfiguration config, ILogger<TeacherInvitesController> logger)
    {
        _context = context;
        _config = config;
        _logger = logger;
    }

    private static string NewToken(int bytes = 24)
    {
        var b = RandomNumberGenerator.GetBytes(bytes);
        return WebEncoders.Base64UrlEncode(b);
    }

    public record CreateInviteRequest(DateTime? ExpiresAtUtc, int? MaxUses, string? EmailDomain);
    public record CreateInviteResponse(Guid Id, string Token, DateTime ExpiresAtUtc, int? MaxUses, string? EmailDomain);

    // Simple admin-key protected endpoint; replace with real admin auth later.
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateInviteRequest req, [FromHeader(Name = "X-Admin-Key")] string? adminKey)
    {
        try
        {
            var expected = _config["Admin:Key"];
            if (string.IsNullOrWhiteSpace(expected) || adminKey != expected)
                return Unauthorized(new { error = "Invalid admin key" });

            var token = NewToken();
            var invite = new TeacherInvite
            {
                Token = token,
                ExpiresAt = req.ExpiresAtUtc ?? DateTime.UtcNow.AddDays(7),
                MaxUses = req.MaxUses,
                EmailDomain = string.IsNullOrWhiteSpace(req.EmailDomain) ? null : req.EmailDomain,
                IsActive = true
            };
            _context.TeacherInvites.Add(invite);
            await _context.SaveChangesAsync();

            return Ok(new CreateInviteResponse(invite.Id, invite.Token, invite.ExpiresAt, invite.MaxUses, invite.EmailDomain));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, ex.Message);
            return BadRequest(new { error = ex.Message });
        }
    }
}

