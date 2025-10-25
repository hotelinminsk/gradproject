using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using GtuAttendance.Infrastructure.Data;
using GtuAttendance.Core.Entities;
using GtuAttendance.Api.DTOs;
using GtuAttendance.Infrastructure.Errors;
using Microsoft.IdentityModel.Protocols.OpenIdConnect;

namespace GtuAttendance.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AttendanceController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IMemoryCache _cache;
    private readonly ILogger<AttendanceController> _logger;

    public AttendanceController(AppDbContext context, IMemoryCache cache, ILogger<AttendanceController> logger)
    {
        _context = context;
        _cache = cache;
        _logger = logger;
    }

    private Guid? GetUserId()
    {
        var sub = User?.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User?.FindFirst("sub")?.Value;
        return Guid.TryParse(sub, out var userId) ? userId : null;
    }

    private static string NewToken()
    {
        Span<byte> b = stackalloc byte[16];
        RandomNumberGenerator.Fill(b);
        return WebEncoders.Base64UrlEncode(b);
    }

    private static void EnsureLatLon(decimal lat, decimal lon)
    {
        if (lat < -90 || lat > 90) throw new ArgumentOutOfRangeException(nameof(lat), "Latitude must be between -90 and 90.");
        if (lon < -180 || lon > 180) throw new ArgumentOutOfRangeException(nameof(lon), "Longitude must be between -180 and 180.");
    }

    private static decimal HaversineMeters(decimal lat1, decimal lon1, decimal lat2, decimal lon2)
    {
        const double R = 6371000d; // Radius of the Earth in meters
        double dLat = (double)(lat2 - lat1) * Math.PI / 180.0;
        double dLon = (double)(lon2 - lon1) * Math.PI / 180.0;
        double a =
            Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
            Math.Cos((double)lat1 * Math.PI / 180.0) * Math.Cos((double)lat2 * Math.PI / 180.0) *
            Math.Sin(dLon / 2) * Math.Sin(dLon / 2);
        double c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
        return (decimal)(R * c);
    }

    //Rotating the q code
    private static string ComputeCode(byte[] secret, long step)
    {
        using var hmac = new HMACSHA256(secret);
        var bytes = BitConverter.GetBytes(step);
        if (BitConverter.IsLittleEndian) Array.Reverse(bytes);
        var hash = hmac.ComputeHash(bytes);

        return WebEncoders.Base64UrlEncode(hash.AsSpan(0, 8));
    }

    private static long CurrentStep(int stepSeconds) => (long)(DateTimeOffset.UtcNow.ToUnixTimeSeconds() / stepSeconds);

    [Authorize(Roles = "Teacher")]
    [HttpPost("createsession")]
    public async Task<IActionResult> CreateSession([FromBody] CreateSessionRequest request)
    {
        try
        {
            var teacherId = GetUserId();
            if (teacherId == null) throw new Unauthorized("createsession : teacherId is null");

            EnsureLatLon(request.TeacherLatitude, request.TeacherLongitude);
            if (request.MaxDistanceMeters <= 0) throw new ArgumentOutOfRangeException("MaxDistanceMeters", "MaxDistanceMeters must be greater than 0 ");
            if (request.ExpiresAtUtc <= DateTime.UtcNow) throw new CreateSessionRequestExpiredException($"createsession request from teacher: {teacherId} and courseid: {request.CourseId}");
            var course = await _context.Courses.AsNoTracking().FirstOrDefaultAsync(c => c.CourseId == request.CourseId && c.TeacherId == teacherId);
            if (course == null) throw new TeacherDoesntOwnCourseException(teacherId.Value, request.CourseId);


            byte[] secret = RandomNumberGenerator.GetBytes(32);

            var session = new AttendanceSession
            {
                CourseId = request.CourseId,
                TeacherId = teacherId.Value,
                QRCodeToken = NewToken(),
                TeacherLatitude = request.TeacherLatitude,
                TeacherLongitude = request.TeacherLongitude,
                MaxDistanceMeters = request.MaxDistanceMeters,
                ExpiresAt = request.ExpiresAtUtc,
                IsActive = true,
                Secret = secret,
                CodeStepSeconds = 30
            };

            _context.AttendanceSessions.Add(session);
            await _context.SaveChangesAsync();

            return Ok(new CreateSessionResponse(session.SessionId, session.QRCodeToken, session.ExpiresAt));

        }
        catch (Exception EX)
        {
            _logger.LogError(EX, EX.StackTrace);
            return BadRequest(new { error = EX.Message });
        }
    }

    // Teacher UI polls this to render QR that auto-refreshes
    [Authorize(Roles = "Teacher")]
    [HttpGet("sessions/{sessionId:guid}/qr-poll")]
    public async Task<IActionResult> GetQrCode([FromRoute] Guid sessionId)
    {
        try
        {
            var teacherId = GetUserId();
            if (teacherId == null) throw new Unauthorized("sessions/{sessionId}/qr-poll : teacherId is null");

            var session = await _context.AttendanceSessions.AsNoTracking()
            .FirstOrDefaultAsync(s => s.SessionId == sessionId && s.TeacherId == teacherId);

            if (session is null) throw new SessionDoesNotExistException(teacherId.Value, sessionId);
            if (!session.IsActive || session.ExpiresAt <= DateTime.UtcNow) throw new SessionExpiredException(session.SessionId);

            var step = CurrentStep(session.CodeStepSeconds);
            var code = ComputeCode(session.Secret, step);

            var nextStepIn = (int)(session.CodeStepSeconds - (DateTimeOffset.UtcNow.ToUnixTimeSeconds() % session.CodeStepSeconds));

            return Ok(new GetQrCodeResponse(session.SessionId, code, nextStepIn));
        }
        catch (System.Exception EX)
        {
            _logger.LogError(EX, EX.StackTrace);
            return BadRequest(new { error = EX.Message });
        }


    }

    [Authorize(Roles = "Student")]
    [HttpPost("check-in/begin")]
    public async Task<IActionResult> BeginCheckIn([FromBody] BeginCheckInRequest request)
    {
        try
        {
            var studentId = GetUserId();
            if (studentId is null) throw new Unauthorized("check-in/begin : studentId is null");


            var session = await _context.AttendanceSessions.AsNoTracking()
            .FirstOrDefaultAsync(ar => ar.SessionId == request.SessionId);

            if (session is null) throw new SessionDoesNotExistException(studentId.Value, request.SessionId);

            if (!session.IsActive || session.ExpiresAt <= DateTime.UtcNow) throw new SessionExpiredException(session.SessionId);

            var nonce_bytes = RandomNumberGenerator.GetBytes(16);

            var nonce = WebEncoders.Base64UrlEncode(nonce_bytes);

            var cachekey = $"checkin:nonce:{studentId}:{request.SessionId}:{nonce}";

            _cache.Set(cachekey, true, TimeSpan.FromMinutes(2));

            return Ok(new BeginCheckInResponse(nonce));
        }
        catch (System.Exception EX)
        {
            _logger.LogError(EX, EX.StackTrace);
            return BadRequest(new { error = EX.Message });
        }


    }

    [Authorize(Roles = "Student")]
    [HttpPost("check-in/complete")]
    public async Task<IActionResult> CheckIn([FromBody] CheckInRequest checkInRequest)
    {
        try
        {
            var studentId = GetUserId();
            if (studentId is null) throw new Unauthorized("check-in/complete : studentId is null");

            var session = await _context.AttendanceSessions.AsNoTracking()
            .FirstOrDefaultAsync(ar => ar.SessionId == checkInRequest.SessionId);

            if(session is null) throw new SessionDoesNotExistException(studentId.Value, checkInRequest.SessionId);


            if (! session.IsActive || session.ExpiresAt <= DateTime.UtcNow) return Ok(new CheckInResponse("Expired", 0, false, DateTime.UtcNow));

            // Enrollment check

            var enrolled = await _context.CourseEnrollments.AsNoTracking()
            .AnyAsync(e => e.StudentId == studentId.Value && e.CourseId == session.CourseId && e.IsValidated);
            if (!enrolled) throw new StudentNotEnrolledException(studentId.Value, session.CourseId);


            var deviceOk = await _context.WebAuthnCredentials.AsNoTracking()
            .AnyAsync(c => c.Id == checkInRequest.DeviceCredentialId && c.UserId == studentId.Value && c.IsActive);

            if (!deviceOk) throw new DeviceIsNotValidException(
                new deviceNotValidDTO
                {
                    SessionId = session.SessionId,
                    Code = checkInRequest.Code,
                    nonce = checkInRequest.Nonce,
                    Latitude = checkInRequest.Latitude,
                    Longitude = checkInRequest.Longitude
                },

                studentId.Value
             );

            // Consume nonce

            var noncekey = $"checkin:nonce:{studentId}:{checkInRequest.SessionId}:{checkInRequest.Nonce}";

            if (!_cache.TryGetValue(noncekey, out bool _)) throw new NonceIsNotValidException(noncekey, studentId.Value);

            _cache.Remove(noncekey);

            var stepnow = CurrentStep(session.CodeStepSeconds);
            var valid = checkInRequest.Code == ComputeCode(session.Secret, stepnow) || checkInRequest.Code == ComputeCode(session.Secret, stepnow - 1);

            if (!valid) throw new CodeStepIsNotValidException(checkInRequest.Code, stepnow, session.Secret, studentId.Value);

            EnsureLatLon(checkInRequest.Latitude, checkInRequest.Longitude);

            var distance = HaversineMeters(session.TeacherLatitude, session.TeacherLongitude, checkInRequest.Latitude, checkInRequest.Longitude);

            var within = distance <= session.MaxDistanceMeters;

            var record = new AttendanceRecord
            {
                SessionId = session.SessionId,
                CourseId = session.CourseId,
                StudentId = studentId.Value,
                StudentLatitude = checkInRequest.Latitude,
                StudentLongitude = checkInRequest.Longitude,
                DistanceFromTeacherMeters = Math.Round(distance, 2),
                IsWithinRange = within,
                DeviceCredentialId = checkInRequest.DeviceCredentialId,
                CheckInTime = DateTime.UtcNow,
                SyncedAt = DateTime.UtcNow

            };

            _context.AttendanceRecords.Add(record);
            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateException ex)
            {
                return Ok(new CheckInResponse("AlreadyCheckedIn", record.DistanceFromTeacherMeters, record.IsWithinRange, record.CheckInTime));

            }

            var status = within ? "Present" : "OutOfRange";

            return Ok(new CheckInResponse(status, record.DistanceFromTeacherMeters, record.IsWithinRange, record.CheckInTime));


        }
        catch (System.Exception EX)
        {
            _logger.LogError(EX, EX.StackTrace);
            return BadRequest(new { error = EX.Message });
        }
    }

    [Authorize(Roles = "Teacher")]
    [HttpPost("sessions/{sessionId:guid}/close")]
    public async Task<IActionResult> CloseAttendanceSession([FromRoute] Guid sessionId)
    {
        try
        {

            var teacherId = GetUserId();
            if (teacherId is null) throw new Unauthorized("sessions/{sessionId}/close : teacherId is null");

            var session = await _context.AttendanceSessions.FirstOrDefaultAsync(e => e.SessionId == sessionId && e.TeacherId == teacherId.Value);

            if (session is null) throw new SessionDoesNotExistException(teacherId.Value, sessionId);

            if(session.IsActive == false)
            {
                return Ok(new { msg = $"Session with session id : {sessionId} is already closed", sessionId });
            }
            session.IsActive = false;

            await _context.SaveChangesAsync();

            return Ok(new { msg = $"Session with session id : {sessionId} closed", sessionId });

        }
        catch (System.Exception EX)
        {
            _logger.LogError(EX, EX.StackTrace);
            return BadRequest(new { error = EX.Message });
        }
    }

    [Authorize(Roles = "Teacher")]
    [HttpGet("courses/{courseId:guid}/active-session")]
    public async Task<IActionResult> GetActiveSession([FromRoute] Guid courseId)
    {
        try
        {
            var teacherId = GetUserId();
            if (teacherId is null) throw new Unauthorized("courses/{courseId}/active-session : teacherId is null");

            var session = await _context.AttendanceSessions.AsNoTracking().Where(c => c.CourseId == courseId && c.TeacherId == teacherId.Value && c.IsActive && c.ExpiresAt > DateTime.UtcNow)
            .OrderByDescending(s => s.CreatedAt)
            .FirstOrDefaultAsync();


            if (session is null) return BadRequest(new { msg = $"There is no valid session for course : {courseId} and teacher : {teacherId}" });

            

            return Ok(new { session.SessionId, session.ExpiresAt });

        }
        catch(System.Exception EX)
        {
            _logger.LogError(EX, EX.StackTrace);
            return BadRequest(new { error = EX.Message });
        }
    }

}