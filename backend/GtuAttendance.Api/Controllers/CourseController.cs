using GtuAttendance.Api.DTOs;
using GtuAttendance.Infrastructure.Errors;
using GtuAttendance.Infrastructure.Errors.Students;

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

using GtuAttendance.Infrastructure.Helpers;
using GtuAttendance.Api.Extensions;
using Microsoft.Identity.Client;
using Microsoft.EntityFrameworkCore.Query.SqlExpressions;


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

    private static string NewInviteToken()
    {
        Span<byte> bytes = stackalloc byte[16];
        RandomNumberGenerator.Fill(bytes);
        return WebEncoders.Base64UrlEncode(bytes);
    }

    private static string NormalizeName(string s) => string.Join(' ', (s ?? string.Empty).Trim().Split(' ', StringSplitOptions.RemoveEmptyEntries)).ToUpperInvariant();


    [Authorize(Roles = "Teacher")]
    [HttpDelete]
    public async Task<IActionResult> DeleteCourses([FromBody] DeleteCoursesRequest request)
    {
        try
        {
            if(request is null || request.CourseIds?.Any() == false)
            {
                throw new ArgumentNullException("You can't call delete with empty request.");
            } 

            var teacherId = User.GetUserId();

            if (teacherId is null) throw new UnauthorizedAccessException("Unauthorized acces in delete course, teacher id is null");

            // delete courses

            var toBeDeleted = await _context.Courses.Where(c => c.TeacherId == teacherId && c.IsActive && request.CourseIds.Contains(c.CourseId)).ToListAsync();
            int removed=0, skipped =0;

            removed = toBeDeleted.Count;
            var payloadIds = request.CourseIds.Distinct().ToHashSet();
            
            skipped = payloadIds.Count - removed;
            _context.Courses.RemoveRange(toBeDeleted);
            await _context.SaveChangesAsync();

            

            return Ok(new {removed, skipped});

        }catch(System.Exception ex)
        {
            _logger.LogError(ex, ex.StackTrace);
            return BadRequest(new { error = ex.Message});
        }
    }

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

            var teacher = User.GetUserId();

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
            var teacherId = User.GetUserId();

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
            var teacherId = User.GetUserId();
            if (teacherId is null) throw new Unauthorized();
            if (rosterfile is null || rosterfile.Length == 0) throw new InvalidFileException(atroute: "upload-roster");
            var course = await _context.Courses.FirstOrDefaultAsync(c => c.CourseId == courseId && c.TeacherId == teacherId);
            if (course is null) throw new CourseNotFoundException();

            var added = 0;

            try
            {
                if (rosterfile.ContentType.Contains("excel", StringComparison.OrdinalIgnoreCase)
                || Path.GetExtension(rosterfile.FileName).Equals(".xlsx", StringComparison.OrdinalIgnoreCase))
                {
                    using var stream = rosterfile.OpenReadStream();
                    ExcelPackage.License.SetNonCommercialOrganization("GtuAttendance");
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

    [Authorize(Roles = "Teacher")]
    [HttpPost("{courseId:guid}/roster/bulk")]
    public async Task<IActionResult> UploadRosterBulk([FromRoute] Guid courseId, [FromBody] BulkRosterUploadRequest payload)
    {
        try
        {
            var teacherId = User.GetUserId();
            if (teacherId is null) throw new Unauthorized();
            if (payload?.Students is null || payload.Students.Count == 0)
                throw new InvalidFileException(atroute: "upload-roster-bulk");

            var course = await _context.Courses
                .Include(c => c.Roster)
                .FirstOrDefaultAsync(c => c.CourseId == courseId && c.TeacherId == teacherId);
            if (course is null) throw new CourseNotFoundException();

            if (payload.ReplaceExisting && course.Roster.Any())
            {
                _context.CourseRosters.RemoveRange(course.Roster);
                await _context.SaveChangesAsync();
            }

            var added = 0;
            foreach (var row in payload.Students)
            {
                if (string.IsNullOrWhiteSpace(row.FullName) || string.IsNullOrWhiteSpace(row.GtuStudentId))
                    continue;

                _context.CourseRosters.Add(new CourseRoster
                {
                    CourseId = course.CourseId,
                    FullName = row.FullName.Trim(),
                    GtuStudentId = row.GtuStudentId.Trim()
                });
                added++;
            }

            await _context.SaveChangesAsync();
            return Ok(new { courseId, added });
        }
        catch (DbUpdateException ex)
        {
            _logger.LogWarning(ex, "Roster bulk insert: duplicates skipped");
            return Ok(new { courseId, added = "Partial (duplicates skipped)" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, ex.StackTrace);
            return BadRequest(new { error = ex.Message });
        }
    }

    [Authorize(Roles = "Student")]
    [HttpPost("enroll-by-invite")]
    public async Task<IActionResult> EnrollByInvite([FromBody] EnrollByInviteRequest request)
    {
        try
        {
            if (request is null || string.IsNullOrWhiteSpace(request.invitationToken)) throw new EnrollRequestNullException();
            var sub = User?.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User?.FindFirst("sub")?.Value;
            if (!Guid.TryParse(sub, out var studentId)) throw new Unauthorized("enroll-by-invite");

            var studentRow = await _context.Users
                .Where(u => u.UserId == studentId && u.Role == "Student")
                .Select(u => new { u.UserId, u.FullName })
                .FirstOrDefaultAsync();
            if (studentRow is null) throw new Unauthorized("Student is null in enroll by invite");

            var course = await _context.Courses.FirstOrDefaultAsync(c => c.InvitationToken == request.invitationToken);
            if (course is null) throw new CourseNotFoundException($"Course not found in enroll by invite by givin token: {request.invitationToken}");

            var studentProfile = await _context.StudentProfiles.AsNoTracking().FirstOrDefaultAsync(p => p.UserId == studentId);
            var inRoster = studentProfile != null && await _context.CourseRosters
                .AnyAsync(r => r.CourseId == course.CourseId && r.GtuStudentId == studentProfile.GtuStudentId);

            if (!inRoster) throw new StudentNotInRosterException(studentRow.FullName, studentProfile?.GtuStudentId ?? "");

            var exists = await _context.CourseEnrollments.AnyAsync(e => e.CourseId == course.CourseId && e.StudentId == studentId && !e.IsDropped);

            if (!exists)
            {
                _context.CourseEnrollments.Add(new CourseEnrollment
                {
                    CourseId = course.CourseId,
                    StudentId = studentId,
                });


                await _context.SaveChangesAsync();

                return Ok(new { succes = true, course.CourseId, course.CourseName, course.CourseCode });
            }
            else
            {
                return BadRequest(new { message = "Student:" + studentRow.FullName + " already enrolled to this class " });
            }


        }
        catch (Exception ex)
        {
            _logger.LogError(ex, ex.StackTrace);
            return BadRequest(new { error = ex.Message });
        }
    }

    [Authorize(Roles = "Teacher")]
    [HttpGet("mine/courses/teacher")]
    public async Task<IActionResult> GetMyCoursesTeacher()
    {
        try
        {
            var sub = User?.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User?.FindFirst("sub")?.Value;
            if (!Guid.TryParse(sub, out var teacherGuid)) throw new Unauthorized("mine/courses/teacher");

            var courses = await _context.Courses.Where(c => c.TeacherId == teacherGuid)
            .OrderByDescending(c => c.CreatedAt)
            .Select(c => new
            {
                c.CourseId,
                c.CourseName,
                c.CreatedAt,
                c.IsActive,
                EnrollmentCount = c.Enrollments.Count(e => !e.IsDropped),
                LastSession = c.Sessions.OrderByDescending(s => s.CreatedAt)
                .Select(s => new
                {
                    s.SessionId,
                    s.CreatedAt,
                    ExpiresAtUtc = s.ExpiresAt,
                    s.IsActive
                })
                .FirstOrDefault(),
                InviteLink = $"{Request.Scheme}://{Request.Host}/enroll/{c.InvitationToken}"

            })
            .AsNoTracking()
            .ToListAsync();
            
            // var list = _context.Courses.Where(c => c.TeacherId == teacherGuid).OrderByDescending(c => c.CreatedAt)
            // .Select(c => new { c.CourseId, c.CourseName, c.CourseCode, c.CreatedAt, c.IsActive })
            // .AsNoTracking()
            // .ToListAsync();

            return Ok(courses);

        }
        catch (System.Exception EX)
        {
            _logger.LogError(EX, EX.StackTrace);
            return BadRequest(new { error = EX.Message });
        }

    }

    [Authorize(Roles = "Student")]
    [HttpGet("mine/courses/student")]
    public async Task<IActionResult> GetMyCoursesStudent()
    {
        try
        {
            var studentId = User.GetUserId();
            if (studentId is null ) throw new Unauthorized("mine/courses/student");

            var list = await _context.CourseEnrollments.Where(cr => cr.StudentId == studentId && !cr.IsDropped)
            .Select(e => new { e.Course.CourseId, e.Course.CourseName, e.Course.CourseCode })
            .ToListAsync();

            return Ok(list);
        }
        catch (System.Exception EX)
        {
            _logger.LogError(EX, EX.StackTrace);
            return BadRequest(new { error = EX.Message });
        }
    }


    [Authorize(Roles = "Teacher")]
    [HttpPost("{courseId:guid}/students/{studentId:guid}/drop")]
    public async Task<IActionResult>DropStudent([FromRoute] Guid CourseId, [FromRoute] Guid StudentId)
    {
        try{
            var teacherId = User.GetUserId();
            if(teacherId is null) return Unauthorized("Teacherid is null, in DropStudent");

            var ownsCourse = await _context.Courses.AsNoTracking()
            .AnyAsync(c => c.CourseId == CourseId && c.TeacherId == teacherId);
            if(!ownsCourse) return Forbid();

            var enrollment = await _context.CourseEnrollments
            .FirstOrDefaultAsync(e => e.CourseId == CourseId && e.StudentId == StudentId);

            if(enrollment is null) return NotFound($"Not found any enrollment for {StudentId} in course {CourseId}.");
            if(enrollment.IsDropped) return Conflict($"Already dropped for this student {StudentId}");

            enrollment.IsDropped = true;
            enrollment.DroppedAtUtc = DateTime.UtcNow;
            enrollment.DroppedByTeacherId = teacherId;

            await _context.SaveChangesAsync();
            return Ok(new {dropped = 1});
        }catch(Exception ex)
        {
            _logger.LogError(ex,ex.StackTrace);
            return BadRequest(new {error = ex.Message});
        }
    }

    [Authorize(Roles = "Student")]
    [HttpPost("{CourseId:guid}/student/dropself/{StudentId:guid}")]
    public async Task<IActionResult> DropMyEnrollment([FromRoute] Guid CourseId , [FromRoute] Guid StudentId)
    {
        try{
            var studentId = User.GetUserId();
            if(studentId is null) return Unauthorized("Student id is null, in DropMyEnrollment");
            if(studentId != StudentId) return Forbid("You can drop only your own enrollment.");

            var enrollment = await _context.CourseEnrollments
            .FirstOrDefaultAsync(e => e.CourseId == CourseId && e.StudentId == StudentId);

            if(enrollment is null) return NotFound($"Not found any enrollment for {StudentId} in course {CourseId}.");
            if(enrollment.IsDropped) return Conflict($"Already dropped for this student {StudentId}");

            enrollment.IsDropped = true;
            enrollment.DroppedAtUtc = DateTime.UtcNow;
            enrollment.DroppedByTeacherId = null;

            await _context.SaveChangesAsync();

            return  Ok(new {dropped = 1});
        }
        catch(Exception ex)
        {
            _logger.LogError(ex,ex.StackTrace);
            return BadRequest(new {error = ex.Message});
        }
    }


    [Authorize(Roles = "Teacher")]
    [HttpGet("{courseId:guid}/manage-detail")]
    public async Task<IActionResult> GetCourseDetailsManagePage([FromRoute] Guid CourseId)
    {
        try
        {
            var teacherId = User.GetUserId();
            if(teacherId is null) return Unauthorized("Teacher id is null. in course detail.");

            var course = await _context.Courses
            .Where(c => c.CourseId == CourseId && c.TeacherId == teacherId && c.IsActive)
            .Select(c => new
            {
                c.CourseId,
                c.CourseName,
                c.CourseCode,
                c.InvitationToken,
                c.CreatedAt,
                c.IsActive,
                Roster = c.Roster.ToList(),
                Enrollments = c.Enrollments.Where(e => !e.IsDropped).ToList(),
                Sessions = c.Sessions
                .OrderByDescending(s => s.CreatedAt)
                .Take(10)
                .ToList(),
                CourseStudents = c.Enrollments
                .Where(e => e.IsValidated && !e.IsDropped)
                .Select(e => new CourseStudent(
                    e.StudentId,
                    e.Student.Email,
                    e.Student.FullName,
                    e.Student.GtuStudentId,
                    true
                ))
                .ToList()
            })
            .FirstOrDefaultAsync();

            if(course is null) return NotFound();

            var response = new CourseDetailsResponse(
                course.CourseId,
                course.CourseName,
                course.CourseCode,
                CourseInvitationToken: $"{Request.Scheme}://{Request.Host}/enroll/{course.InvitationToken}",
                course.CreatedAt,
                course.IsActive,
                course.Roster,
                course.Enrollments,
                course.Sessions,
                course.CourseStudents
            );

            

            return Ok(response);

        }
        catch(System.Exception ex)
        {
            _logger.LogError(ex, ex.StackTrace);
            return BadRequest(new { error = ex.Message });

        } 
    }

}
