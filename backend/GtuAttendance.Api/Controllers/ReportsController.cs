using System.Security.Claims;
using GtuAttendance.Api.DTOs;
using GtuAttendance.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using GtuAttendance.Infrastructure.Errors;




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
        var course = await _context.Courses.AsNoTracking().FirstOrDefaultAsync(c => c.CourseId == courseId && c.TeacherId == teacherId);
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
            if (teacherId is null) throw new Unauthorized($"course/{courseId}/overview : teacher id returned null.");
            if (!await TeacherOwnsCourse(teacherId.Value, courseId)) throw new TeacherDoesntOwnCourseException(teacherId.Value, courseId);
            var (fromUtc, toUtc) = NormalizeRange(from, to);

            //Filter records for range
            var recordsQ = _context.AttendanceRecords.AsNoTracking().Where(r => r.CourseId == courseId && r.IsWithinRange && r.CheckInTime >= fromUtc && r.CheckInTime < toUtc);


            var totalCheckins = await recordsQ.CountAsync();

            var totalSessions = await _context.AttendanceSessions.AsNoTracking().Where(s => s.CourseId == courseId && s.CreatedAt >= fromUtc && s.CreatedAt < toUtc).CountAsync();

            var weeklyRaw = await recordsQ.GroupBy(
                r => new
                {
                    Year = r.CheckInTime.Year,
                    WeekIndex = EF.Functions.DateDiffWeek(new DateTime(2000, 1, 3), r.CheckInTime)

                }
            ).Select(g => new { g.Key.Year, g.Key.WeekIndex, Count = g.Count() })
            .OrderBy(x => x.Year).ThenBy(z => z.WeekIndex).ToListAsync();

            var weekly = new List<WeeklyBucket>();

            WeeklyBucket? prev = null;
            foreach (var w in weeklyRaw)
            {
                double? change = null;
                if (prev is not null && prev.Count != 0)
                {
                    change = (w.Count - prev.Count) * 100.0 / prev.Count;
                }
                var curr = new WeeklyBucket(w.Year, w.WeekIndex, w.Count, change);
                weekly.Add(curr);
                prev = curr;
            }

            var LastSession = await _context.AttendanceSessions.AsNoTracking()
            .Where(r => r.CourseId == courseId)
            .OrderByDescending(s => s.CreatedAt)
            .FirstOrDefaultAsync();

            LastSessionSummary? last = null;

            if (LastSession != null)
            {
                var lastcount = await _context.AttendanceRecords.Where(r => r.SessionId == LastSession.SessionId && r.IsWithinRange).CountAsync();
                last = new LastSessionSummary(LastSession.CreatedAt, lastcount);

            }

            var denominator = await GetDenominatorAsync(courseId, denom);
            var avgPct = 0;
            if (denominator > 0 && totalSessions > 0)
            {
                avgPct = (int)Math.Round(100.0 * totalCheckins / (denominator * totalSessions));
            }

            var resp = new CourseReportOverviewResponse(
                CourseId: courseId,

                FromUtc: fromUtc,

                ToUtc: toUtc,

                TotalSessions: totalSessions,

                TotalCheckIns: totalCheckins,

                DenominatorCount: denominator,

                AverageAttendancePct: avgPct,

                LastSession: last,

                Weekly: weekly
            );

            return Ok(resp);

        }
        catch (System.Exception ex)
        {
            _logger.LogError(ex, ex.StackTrace);
            return BadRequest(new { error = ex.Message });
        }
    }

    [Authorize(Roles = "Teacher")]
    [HttpGet("course/{courseId:guid}/weekly")]
    public async Task<IActionResult> GetCourseReportWeekly(
        [FromRoute] Guid courseId,
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to,
        [FromQuery] AttendanceDenominator denominator = AttendanceDenominator.Enrolled
    )
    {
        try
        {
            var teacherId = GetUserId();
            if (teacherId is null) throw new Unauthorized($"Teacher is null in weekly report :course/{courseId}/weekly");

            if (!await TeacherOwnsCourse(teacherId: teacherId.Value, courseId: courseId)) throw new TeacherDoesntOwnCourseException(teacherId: teacherId.Value, courseId: courseId);

            var (fromUtc, toUtc) = NormalizeRange(from, to);

            var denom = await GetDenominatorAsync(courseId, denominator);
            denom = Math.Max(denom, 1);

            var sessions = await _context.AttendanceSessions.AsNoTracking()
            .Where(s => s.CourseId == courseId && s.CreatedAt >= fromUtc && s.CreatedAt < toUtc)
            .Select(s => new SessionRow(
                s.SessionId,
                s.CreatedAt,
                _context.AttendanceRecords.Count(r => r.SessionId == s.SessionId && r.IsWithinRange),
                0
            ))
            .OrderBy(x => x.CreatedAtUtc).ToListAsync();

            // var sessions = await _context.AttendanceSessions.Where(s => s.TeacherId == teacherId && s.CourseId == courseId)
            // .Select(s => new SessionRow(
            //     s.SessionId,
            //     s.CreatedAt,
            //     _context.AttendanceRecords.Where(r => r.SessionId == s.SessionId && r.IsWithinRange).Count(),
            //     0
            //   )).OrderBy(x => x.CreatedAtUtc).ToListAsync();

            var computed = sessions.Select(s => new SessionRow(
                s.SessionId,
                s.CreatedAtUtc,
                s.CheckIns,
                (int)Math.Round(100.0 * s.CheckIns / denom)
            )).ToList();


            var resp = new CourseReportWeeklyResponse(
                CourseId:courseId,

                FromUtc: fromUtc,

                ToUtc: toUtc,

                DenominatorCount: denom,

                Sessions: computed
            );


            return Ok(resp);

        }
        catch (System.Exception EX)
        {
            _logger.LogError(EX, EX.StackTrace);
            return BadRequest(new { error = EX.Message });
            throw;
        }

    }


    [Authorize(Roles = "Teacher")]
    [HttpGet("course/{courseId:guid}/monthly")]
    public async Task<IActionResult> GetCourseReportMonthly(
        [FromRoute] Guid courseId,
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to,
        [FromQuery] AttendanceDenominator denominator = AttendanceDenominator.Enrolled
    )
    {
        try
        {
            var teacherId = GetUserId();
            if (teacherId is null) throw new Unauthorized($"Teacher is null in monthly report :course/{courseId}/monthly");
            if (!await TeacherOwnsCourse(teacherId: teacherId.Value, courseId: courseId)) throw new TeacherDoesntOwnCourseException(teacherId: teacherId.Value, courseId: courseId);

            var (fromUtc, toUtc) = NormalizeRange(from, to);

            var denom = await GetDenominatorAsync(courseId, denominator);
            denom = Math.Max(denom, 1);

            var recordsQ = _context.AttendanceRecords.AsNoTracking()
            .Where(r => r.CourseId == courseId && r.IsWithinRange && r.CheckInTime >= fromUtc && r.CheckInTime < toUtc);

            var months = await recordsQ
            .GroupBy(
                r => new { r.CheckInTime.Year, r.CheckInTime.Month }
            )
            .Select(k => new MonthBucket(k.Key.Year, k.Key.Month, k.Count(), 0))
            .OrderBy(x => x.Year).ThenBy(x => x.MonthIndex).ToListAsync();

            var computed = months.Select(m => new MonthBucket(m.Year, m.MonthIndex, m.Count, (int)Math.Round(100.0 * m.Count / denom))).ToList();

            var resp = new CourseReportMonthlyResponse(
                CourseId: courseId,
                FromUtc: fromUtc,
                ToUtc: toUtc,
                DenominatorCount: denom,
                Months: computed
            );

            return Ok(resp);



        }
        catch (System.Exception EX)
        {
            _logger.LogError(EX, EX.StackTrace);
            return BadRequest(new { error = EX.Message });
        }
    }

    [Authorize(Roles = "Teacher")]
    [HttpGet("course/{courseId:guid}/sessions/{sessionId:guid}/attendance")]
    public async Task<IActionResult> GetSessionAttendance(
        [FromRoute] Guid courseId,
        [FromRoute] Guid sessionId,
        [FromQuery] AttendanceDenominator denominator = AttendanceDenominator.Enrolled,
        [FromQuery] bool includeInvalid = false
        )
    {
        try
        {
            var TeacherId = GetUserId();
            if (TeacherId is null) throw new Unauthorized($"course/{courseId:guid}/sessions/{sessionId:guid}/attendance");

            if (!await TeacherOwnsCourse(TeacherId.Value, courseId)) throw new TeacherDoesntOwnCourseException(TeacherId.Value, courseId);

            var session = await _context.AttendanceSessions.FirstOrDefaultAsync(s => s.SessionId == sessionId && s.CourseId == courseId);
            if (session is null) throw new SessionNotFoundException(sessionId, courseId, DateTime.UtcNow);

            var present = await _context.AttendanceRecords.AsNoTracking()
                .Where(r => r.SessionId == sessionId && r.IsWithinRange)
                .Join(_context.Users.AsNoTracking(), r => r.StudentId, u => u.UserId, (r, u) => new { r, u })
                .GroupJoin(_context.StudentProfiles.AsNoTracking(), ru => ru.u.UserId, sp => sp.UserId, (ru, sps) => new { ru.r, ru.u, sp = sps.FirstOrDefault() })
                .GroupJoin(_context.WebAuthnCredentials.AsNoTracking(), rus => rus.r.DeviceCredentialId, d => d.Id, (rus, ds) => new { rus.r, rus.u, rus.sp, dev = ds.FirstOrDefault() })
                .Select(x => new StudentPresentRow(
                    x.r.StudentId,
                    x.u.FullName,
                    x.sp != null ? x.sp.GtuStudentId : null,
                    x.r.CheckInTime,
                    x.dev != null ? x.dev.DeviceName : null
                ))
                .OrderBy(x => x.FullName)
                .ToListAsync();

            List<StudentPresentRow>? invalid = null;

            if (includeInvalid)
            {
                invalid = await _context.AttendanceRecords.AsNoTracking()
                    .Where(r => r.SessionId == sessionId && !r.IsWithinRange)
                    .Join(_context.Users.AsNoTracking(), r => r.StudentId, u => u.UserId, (r, u) => new { r, u })
                    .GroupJoin(_context.StudentProfiles.AsNoTracking(), ru => ru.u.UserId, sp => sp.UserId, (ru, sps) => new { ru.r, ru.u, sp = sps.FirstOrDefault() })
                    .GroupJoin(_context.WebAuthnCredentials.AsNoTracking(), rus => rus.r.DeviceCredentialId, d => d.Id, (rus, ds) => new { rus.r, rus.u, rus.sp, dev = ds.FirstOrDefault() })
                    .Select(x => new StudentPresentRow(
                        x.r.StudentId,
                        x.u.FullName,
                        x.sp != null ? x.sp.GtuStudentId : null,
                        x.r.CheckInTime,
                        x.dev != null ? x.dev.DeviceName : null
                    ))
                    .OrderBy(k => k.FullName)
                    .ToListAsync();

            }

            List<StudentAbsentRow> absent;

            if (denominator == AttendanceDenominator.Enrolled)
            {
                absent = await _context.CourseEnrollments.AsNoTracking()
                    .Where(e => e.CourseId == courseId)
                    .Join(_context.Users.AsNoTracking(), e => e.StudentId, u => u.UserId, (e, u) => new { e, u })
                    .GroupJoin(_context.StudentProfiles.AsNoTracking(), eu => eu.u.UserId, sp => sp.UserId, (eu, sps) => new { eu.e, eu.u, sp = sps.FirstOrDefault() })
                    .Where(x => !_context.AttendanceRecords.Any(r => r.SessionId == sessionId && r.IsWithinRange && r.StudentId == x.e.StudentId))
                    .Select(x => new StudentAbsentRow(
                        x.e.StudentId,
                        x.u.FullName,
                        x.sp != null ? x.sp.GtuStudentId : null
                    ))
                    .OrderBy(x => x.FullName)
                    .ToListAsync();

            }
            else
            {
                absent = await _context.CourseRosters.AsNoTracking()
                    .Where(r => r.CourseId == courseId)
                    .Where(r => !_context.AttendanceRecords
                        .Join(_context.StudentProfiles, ar => ar.StudentId, sp => sp.UserId, (ar, sp) => new { ar, sp })
                        .Any(t => t.ar.SessionId == sessionId && t.ar.IsWithinRange && t.sp.GtuStudentId == r.GtuStudentId))
                    .Select(r => new StudentAbsentRow(
                        null,
                        r.FullName,
                        r.GtuStudentId
                    ))
                    .OrderBy(x => x.FullName)
                    .ToListAsync();
            }


            var response = new SessionAttendanceResponse(
                CourseId: courseId,

                SessionId: sessionId,

                CreatedAtUtc: session.CreatedAt,

                Denominator: denominator.ToString(),

                PresentCount: present.Count,
                AbsentCount: absent.Count,
                Present: present,
                Absent: absent,
                Invalid: invalid
            );


            return Ok(response);

        }
        catch (Exception Ex)
        {
            _logger.LogError(Ex, Ex.StackTrace);
            return BadRequest(new { error = Ex.Message });
        }

    }

    

}
