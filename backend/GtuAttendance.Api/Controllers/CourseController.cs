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
using Microsoft.AspNetCore.SignalR;
using GtuAttendance.Api.Hubs;


namespace GtuAttendance.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CourseController : ControllerBase
{
    private readonly ILogger<CourseController> _logger;
    private readonly AppDbContext _context;

    private readonly PasswordService _passwordService;
    private readonly IHubContext<GtuAttendance.Api.Hubs.AttendanceHub> _attendanceHub;


    public CourseController(
        ILogger<CourseController> logger,
        AppDbContext context,
        PasswordService passwordService,
        IHubContext<GtuAttendance.Api.Hubs.AttendanceHub> attendanceHub
    )
    {
        _logger = logger;

        _context = context;

        _passwordService = passwordService;
        _attendanceHub = attendanceHub;
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
                Description = request.Description,
                InvitationToken = NewInviteToken(),
                IsActive = true,
                FirstSessionAt = request.FirstSessionAt
            };

            if (request.Schedules != null && request.Schedules.Any())
            {
                foreach (var s in request.Schedules)
                {
                    course.Schedules.Add(new CourseSchedule
                    {
                        DayOfWeek = s.DayOfWeek,
                        StartTime = s.StartTime,
                        EndTime = s.EndTime
                    });
                }
            }

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

                await _attendanceHub.Clients.Group($"course-{course.CourseId}")
                    .SendAsync("EnrollmentUpdated", new
                    {
                        courseId = course.CourseId,
                        studentId,
                        fullName = studentRow.FullName,
                        gtuStudentId = studentProfile?.GtuStudentId
                    });

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
                c.CourseCode,
                c.Description,
                c.CreatedAt,
                c.FirstSessionAt,
                c.IsActive,
                EnrollmentCount = c.Enrollments.Count(e => !e.IsDropped),
                SessionCount = c.Sessions.Count(),
                LastSession = c.Sessions.OrderByDescending(s => s.CreatedAt)
                .Select(s => new
                {
                    s.SessionId,
                    s.CreatedAt,
                    ExpiresAtUtc = s.ExpiresAt,
                    IsActive = s.IsActive && s.ExpiresAt > DateTime.UtcNow
                })
                .FirstOrDefault(),
                // Return raw token; frontend can display/copy token as needed.
                InviteToken = c.InvitationToken

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

            var courses = await _context.CourseEnrollments.Where(cr => cr.StudentId == studentId && !cr.IsDropped)
            .Select(e => new {
                courseId = e.Course.CourseId,
                courseName = e.Course.CourseName,
                courseCode = e.Course.CourseCode,
                description = e.Course.Description,
                firstSessionAt = e.Course.FirstSessionAt,
                teacherName = e.Course.Teacher.FullName,
                schedules = e.Course.Schedules.Select(s => new {
                    dayOfWeek = s.DayOfWeek,
                    startTime = s.StartTime,
                    endTime = s.EndTime
                }),
                latestSession = e.Course.Sessions
                    .OrderByDescending(s => s.CreatedAt)
                    .Select(s => new
                    {
                        sessionId = s.SessionId,
                        sessionCreatedAt = s.CreatedAt,
                        sessionExpiredAt = s.ExpiresAt,
                        sessionIsActive = s.IsActive && s.ExpiresAt > DateTime.UtcNow,
                        isAttended = s.AttendanceRecords.Any(ar => ar.StudentId == studentId)
                    })
                    .FirstOrDefault()
                
            }).ToListAsync();  

            

            return Ok(courses);
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
                c.Description,
                c.InvitationToken,
                c.CreatedAt,
                c.FirstSessionAt,
                c.IsActive,
                Roster = c.Roster.ToList(),
                Enrollments = c.Enrollments.Where(e => !e.IsDropped).ToList(),
                Sessions = _context.AttendanceSessions
                    .AsNoTracking()
                    .Where(s => s.CourseId == CourseId && s.TeacherId == teacherId)
                    .OrderByDescending(s => s.CreatedAt)
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
                .ToList(),
                Schedules = c.Schedules.Select(s => new ScheduleDto(s.DayOfWeek, s.StartTime, s.EndTime)).ToList()
            })
            .FirstOrDefaultAsync();

            if(course is null) return NotFound();

            var now = DateTime.UtcNow;
            var sessionsComputed = course.Sessions
                .Select(s => new CourseSessionDto(
                    s.SessionId,
                    s.CreatedAt,
                    s.ExpiresAt,
                    s.IsActive && s.ExpiresAt > now
                ))
                .ToList();
            var activeSessionDto = sessionsComputed.FirstOrDefault(s => s.IsActive);

            var response = new CourseDetailsResponse(
                course.CourseId,
                course.CourseName,
                course.CourseCode,
                course.Description,
                InviteToken: course.InvitationToken,
                course.CreatedAt,
                course.FirstSessionAt,
                course.IsActive,
                course.Roster,
                course.Enrollments,
                sessionsComputed,
                activeSessionDto,
                course.CourseStudents,
                course.Schedules
            );

            

            return Ok(response);

        }
        catch(System.Exception ex)
        {
            _logger.LogError(ex, ex.StackTrace);
            return BadRequest(new { error = ex.Message });

        } 
    }


    [Authorize(Roles = "Teacher")]
    [HttpGet("mine/students")]
    public async Task<IActionResult> GetMyStudents()
    {
        try
        {
            var teacherId = User.GetUserId();
            if (teacherId is null) return Unauthorized("Teacher id is null.");

            // 1. Fetch all courses with Roster and Enrollments
            var courses = await _context.Courses
                .AsNoTracking()
                .Where(c => c.TeacherId == teacherId && c.IsActive)
                .Include(c => c.Roster)
                .Include(c => c.Enrollments)
                    .ThenInclude(e => e.Student)
                .ToListAsync();

            // 2. Fetch Student Profiles to map GtuStudentId -> Email/Name for Roster entries
            // We only need profiles for students who might be in the roster.
            // For efficiency, we could filter, but fetching all student profiles might be okay if not huge.
            // Better: Get all users who are Students.
            var studentProfiles = await _context.StudentProfiles
                .Include(sp => sp.User)
                .AsNoTracking()
                .ToDictionaryAsync(sp => sp.GtuStudentId, sp => new { sp.User.Email, sp.User.FullName });

            // Flattened list before grouping
            var flatList = new List<(string GtuStudentId, string FullName, string Email, string CourseCode, string CourseName, string Status)>();

            foreach (var course in courses)
            {
                // Enrolled
                foreach (var e in course.Enrollments.Where(e => !e.IsDropped && e.IsValidated))
                {
                    flatList.Add((
                        e.Student.GtuStudentId ?? "",
                        e.Student.FullName,
                        e.Student.Email ?? "",
                        course.CourseCode,
                        course.CourseName,
                        "enrolled"
                    ));
                }

                // Dropped
                foreach (var e in course.Enrollments.Where(e => e.IsDropped))
                {
                    flatList.Add((
                        e.Student.GtuStudentId ?? "",
                        e.Student.FullName,
                        e.Student.Email ?? "",
                        course.CourseCode,
                        course.CourseName,
                        "dropped"
                    ));
                }

                // Roster
                foreach (var r in course.Roster)
                {
                    // Check if we have profile info for this roster student
                    var email = "";
                    var fullName = r.FullName;
                    
                    if (studentProfiles.TryGetValue(r.GtuStudentId, out var profile))
                    {
                        email = profile.Email;
                        // usage of profile.FullName is optional, roster name is usually accurate enough, 
                        // but profile name is what they registered with. Let's prefer roster name for now as it's what teacher uploaded.
                    }

                    flatList.Add((
                        r.GtuStudentId,
                        fullName,
                        email,
                        course.CourseCode,
                        course.CourseName,
                        "rostered"
                    ));
                }
            }

            // Group by GtuStudentId
            var grouped = flatList
                .Where(x => !string.IsNullOrWhiteSpace(x.GtuStudentId))
                .GroupBy(x => x.GtuStudentId)
                .Select(g => 
                {
                    // Pick the best display name (prefer one from Enrollment/Profile if available, else first)
                    var bestName = g.FirstOrDefault(x => x.Status == "enrolled").FullName;
                    if (string.IsNullOrEmpty(bestName)) bestName = g.First().FullName;

                    // Pick the best email (any non-empty)
                    var bestEmail = g.FirstOrDefault(x => !string.IsNullOrEmpty(x.Email)).Email ?? "";

                    // Unique courses
                    // Priority: Enrolled > Dropped > Rostered
                    // If a student is Enrolled in CSE101 and Rostered in CSE101, show Enrolled.
                    var courses = g
                        .GroupBy(x => x.CourseCode)
                        .Select(cg => 
                        {
                            var status = "rostered";
                            if (cg.Any(x => x.Status == "enrolled")) status = "enrolled";
                            else if (cg.Any(x => x.Status == "dropped")) status = "dropped";
                            
                            return new StudentCourseStatus(
                                cg.Key,
                                cg.First().CourseName,
                                status
                            );
                        })
                        .OrderBy(c => c.CourseCode)
                        .ToList();

                    return new TeacherStudentGroupDto(
                        g.Key,
                        bestName,
                        g.Key,
                        bestEmail,
                        courses
                    );
                })
                .OrderBy(s => s.FullName)
                .ToList();

            return Ok(grouped);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, ex.StackTrace);
            return BadRequest(new { error = ex.Message });
        }
    }

}
