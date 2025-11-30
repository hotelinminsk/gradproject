using GtuAttendance.Api.DTOs;
using GtuAttendance.Core.Entities;
using GtuAttendance.Infrastructure.Data;
using GtuAttendance.Infrastructure.Errors.Common;
using GtuAttendance.Infrastructure.Errors.Students;
using GtuAttendance.Infrastructure.Services;

using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

using System.Security.Cryptography;

using Microsoft.Extensions.Caching.Memory;


namespace GtuAttendance.Api.Controllers;



[ApiController]
[Route("api/[controller]")]
public class OTPController : ControllerBase
{
    private readonly IMemoryCache _memoryCache;
    private readonly ILogger<OTPController> _logger;

    private readonly AppDbContext _context;

    public OTPController(
        IMemoryCache memoryCache,
        ILogger<OTPController> logger,
        AppDbContext context
    )
    {
        _memoryCache = memoryCache;
        _logger = logger;
        _context = context;

    }


    private string GENERATE_OTP(int num)
    {
        string k = "";
        while (num > 0)
        {
            k += RandomNumberGenerator.GetInt32(0, 10);
            num--;
        }

        Console.WriteLine("OTP: " + k);
        return k;
    }

    [HttpPost("reset/begin")]
    public async Task<IActionResult> BeginReset([FromBody] BeginDeviceResetRequest request)
    {
        try
        {
            if (request == null) throw new ArgumentNullException("BeginDeviceResetRequest is null.");

            if (request.userId == Guid.Empty) throw new ArgumentNullException("BeginDeviceResetRequest userId is null.");

            var user = await _context.Users.FirstOrDefaultAsync(u => u.UserId == request.userId && u.Role == "Student");
            if (user is null) throw new WebAuthnResetUserIsNullException(request.userId);

            var OTP = GENERATE_OTP(6);

            _memoryCache.Set($"webauthn:reset:{request.userId}", OTP, TimeSpan.FromMinutes(10));
            _memoryCache.Set($"webauthn:reset:attempts:{request.userId}", 0, TimeSpan.FromMinutes(15));

           // Console.WriteLine($"WEBAUTHN RESET OTP : {OTP}");
            // change this to email service afterwards

            _logger.LogInformation($"WEBAUTHN RESET OTP for {request.userId}: {OTP}");


            return Ok(new { userId = request.userId });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, ex.StackTrace);
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPost("reset/confirm")]
    public async Task<IActionResult> ConfirmReset([FromBody] ConfirmDeviceResetRequest request)
    {
        try
        {
            if (request == null) throw new ArgumentNullException("ConfirmDeviceResetRequest is null.");
            if (request.userId == Guid.Empty) throw new ArgumentNullException("ConfirmDeviceResetRequest userId is null.");

            var user = await _context.Users.FirstOrDefaultAsync(u => u.UserId == request.userId && u.Role == "Student");

            if (user is null) throw new WebAuthnResetUserIsNullException(request.userId, 2);
            if (!_memoryCache.TryGetValue($"webauthn:reset:{request.userId}", out string? otp) || otp is null)
            {
                throw new WebAuthnOTPReturnedNullFromCacheException();
            }

            var attempts = _memoryCache.GetOrCreate($"webauthn:reset:attempts:{request.userId}", entry =>
            {
                entry.AbsoluteExpiration = DateTime.UtcNow.AddMinutes(15);
                return 0;
            } );

            attempts++;
            _memoryCache.Set($"webauthn:reset:attempts:{request.userId}", attempts, TimeSpan.FromMinutes(15));


            if (attempts > 5)
            {
                _memoryCache.Remove($"webauthn:reset:{request.userId}");
                _memoryCache.Remove($"webauthn:reset:attempts:{request.userId}");
                throw new RemoveDeviceAttemptsExceededException();
            }

            

            if (otp == request.OTP)
            {
                var creds = await _context.WebAuthnCredentials.Where(c => c.UserId == request.userId && c.IsActive).ToListAsync();
                foreach (var c in creds) { c.IsActive = false; c.LastUsedAt = DateTime.UtcNow; }
                await _context.SaveChangesAsync();
                _memoryCache.Remove($"webauthn:reset:{request.userId}");
                _memoryCache.Remove($"webauthn:reset:attempts:{request.userId}");

                var enrollToken = Convert.ToBase64String(RandomNumberGenerator.GetBytes(32));
                _memoryCache.Set($"webauthn:enroll:{request.userId}", enrollToken, TimeSpan.FromMinutes(15));


                return Ok(new { success = true, enrollToken });
            }
            else
            {
                throw new OTPMismatchedException();
            }

        }
        catch (Exception ex)
        {
            _logger.LogError(ex, ex.StackTrace);
            return BadRequest(new { error = ex.Message });
        }
    }


}
