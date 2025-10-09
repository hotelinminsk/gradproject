using GtuAttendance.Api.DTOs;
using GtuAttendance.Infrastructure.Errors; 

using System.Security.Claims;
using System.Security.Cryptography;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.EntityFrameworkCore;
using OfficeOpenXml;
using GtuAttendance.Infrastructure.Data;
using GtuAttendance.Core.Entities;
using GtuAttendance.Infrastructure.Services;
using System.IO.Compression;


namespace GtuAttendance.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CourseController : ControllerBase
{
    private readonly ILogger<CourseController> _logger;
    private readonly AppDbContext _context;

    private readonly PasswordService _passwordService;


    public CourseController(
        ILogger<CourseController> logger,
        AppDbContext context,
        PasswordService passwordService
    )
    {
        _logger = logger;

        _context = context;

        _passwordService = passwordService;
    }

    private Guid? GetUserId() => Guid.TryParse(User?.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User?.FindFirst("sub")?.Value, out var g) ? g : null;

    private static string NewInviteToken()
    {
        Span<byte> bytes = stackalloc byte[16];
        RandomNumberGenerator.Fill(bytes);
        return WebEncoders.Base64UrlEncode(bytes);
    }

    private static string NormalizeName(string s) => string.Join(' ', (s ?? string.Empty).Trim().Split(' ', StringSplitOptions.RemoveEmptyEntries)).ToUpperInvariant();

    [Authorize(Roles = "Teacher")]
    [HttpPost]
    public async Task<IActionResult> CreateCourse([FromBody] CreateCourseRequest request)
    {
        try
        {
            if (request is null || string.IsNullOrWhiteSpace(request.CourseName) || string.IsNullOrWhiteSpace(request.CourseCode))
            {
                throw new CourseDataCantBeNullOrEmptyException();
            }

            var teacher = GetUserId();

            if (teacher is null) throw new UnauthorizedAccessException("Unauthorized acces in create course, teacher id is null");

            var course = new Course
            {
                TeacherId = teacher.Value,
                CourseName = NormalizeName(request.CourseName),
                CourseCode = NormalizeName(request.CourseCode),
                InvitationToken = NewInviteToken(),
                IsActive = true,
            };

            _context.Courses.Add(course);
            await _context.SaveChangesAsync();
            return Ok(new { course.CourseId, course.CourseName, course.CourseCode, course.InvitationToken });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, ex.StackTrace);
            return BadRequest(new { error = ex.Message });
        }

    }


    [Authorize(Roles = "Teacher")]
    [HttpGet("{courseId:guid}/invite-link")]
    public async Task<IActionResult> GetInviteLink([FromRoute] Guid courseId)
    {

        try
        {
            var teacherId = GetUserId();

            if (teacherId is null) throw new Unauthorized();

            var course = await _context.Courses.FirstOrDefaultAsync(c => c.CourseId == courseId && c.TeacherId == teacherId);
            if (course is null) return NotFound(new { error = "Course not found" });

            //Construct a full URL on the frontend

            return Ok(new { course.CourseId, course.InvitationToken });
        }

        catch (Exception EX)
        {
            _logger.LogError(EX, EX.StackTrace);
            return BadRequest(new { error = EX.Message });
        }
    }

    [Authorize(Roles = "Teacher")]
    [HttpPost("{courseId:guid}/upload-roster")]
    public async Task<IActionResult> UploadCourseRoster([FromRoute] Guid courseId, IFormFile rosterfile)
    {

        try
        {
            var teacherId = GetUserId();
            if (teacherId is null) throw new Unauthorized();
            if (rosterfile is null || rosterfile.Length == 0) throw new InvalidFileException(atroute: "upload-roster");
            var course = await _context.Courses.FirstOrDefaultAsync(c => c.CourseId == courseId && c.TeacherId == teacherId);
            if (course is null) throw new CourseNotFoundException();

            var added = 0;

            try
            {
                if (rosterfile.ContentType.Contains('excel', StringComparison.OrdinalIgnoreCase)
                || Path.GetExtension(rosterfile.FileName).Equals('.xlsx', StringComparison.OrdinalIgnoreCase))
                {
                    using var stream = rosterfile.OpenReadStream();
                    using var package = new ExcelPackage(stream);
                    var ws = package.Workbook.Worksheets[0];

                    var row = 2;  // assume headers on row 1

                    while (ws.Cells[row, 1].Value is not null || ws.Cells[row, 2].Value is not null)
                    {
                        var fullname = ws.Cells[row, 1].Text?.Trim();
                        var gtuid = ws.Cells[row, 2].Text?.Trim();

                        if (!(string.IsNullOrWhiteSpace(fullname) || string.IsNullOrWhiteSpace(gtuid)))
                        {
                            _context.CourseRosters.Add(new CourseRoster
                            {
                                CourseId = course.CourseId,
                                FullName = fullname,
                                GtuStudentId = gtuid
                            });
                            added++;
                        }
                        row++;
                    }
                }
                else
                {
                    using var reader = new StreamReader(rosterfile.OpenReadStream());
                    var header = await reader.ReadLineAsync(); //skip header
                    while (!reader.EndOfStream)
                    {
                        var line = await reader.ReadLineAsync();
                        if (string.IsNullOrWhiteSpace(line)) continue;
                        var parts = line.Split(',', StringSplitOptions.TrimEntries);
                        if (parts.Length < 2) continue;
                        var fullname = parts[0];
                        var gtuid = parts[1];
                        _context.CourseRosters.Add(new CourseRoster
                        {
                            CourseId = courseId,
                            FullName = fullname,
                            GtuStudentId = gtuid

                        });
                        added++;
                    }
                }

                await _context.SaveChangesAsync();
                return Ok(new { courseId, added });


            }
            catch (DbUpdateException ex)
            {
                _logger.LogWarning(ex, "Roster upsert: duplicates ignored by unique index.");
                // Some rows may be duplicates; re-run SaveChanges with conflict-safe approach if needed.
                return Ok(new { course.CourseId, added = "Partial (duplicates skipped)" });
            }
        }
        catch (System.Exception EX)
        {
            _logger.LogError(EX, EX.Message);
            return BadRequest(new { error = EX.Message });
        }

        

    }
        
}