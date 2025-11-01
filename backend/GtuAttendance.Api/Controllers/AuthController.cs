using GtuAttendance.Api.DTOs;
using GtuAttendance.Core.Entities;
using GtuAttendance.Infrastructure.Data;
using GtuAttendance.Infrastructure.Errors.Common;
using GtuAttendance.Infrastructure.Errors.Students;
using GtuAttendance.Infrastructure.Services;

using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

using GtuAttendance.Infrastructure.Errors.Teachers;
using Microsoft.Extensions.Caching.Memory;
using System.IO.Compression;
using Fido2NetLib.Objects;
using Fido2NetLib;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using System.ComponentModel.DataAnnotations;
using System.Security.Claims;
using System.Security.Cryptography.X509Certificates;
using Microsoft.AspNetCore.Components.Forms;


namespace GtuAttendance.Api.Controllers;


[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly JWTService _JWTService;
    private readonly PasswordService _passwordService;
    private readonly ILogger<AuthController> _logger;

    private readonly Fido2Service _fido2Service;
    private readonly IMemoryCache _memoryCache;

    public AuthController(
        AppDbContext context,
        JWTService service,
        PasswordService passwordService,
        ILogger<AuthController> logger,
        Fido2Service fido2Service,
        IMemoryCache memoryCache
        )
    {
        _context = context;
        _JWTService = service;
        _passwordService = passwordService;
        _logger = logger;
        _fido2Service = fido2Service;
        _memoryCache = memoryCache;
    }

    private bool IsStudentAuthenticated(Guid userId)
    {
        if (!(User?.Identity?.IsAuthenticated ?? false)) return false;

        var sub = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value;
        if (!Guid.TryParse(sub, out var sid) || sid != userId) return false;


        var role = User?.FindFirst(ClaimTypes.Role)?.Value ?? User?.FindFirst("UserType")?.Value;

        return string.Equals(role, "Student", StringComparison.OrdinalIgnoreCase);

    }

    private bool HasEnrollToken(Guid userId, string? token)
    {
        if (string.IsNullOrWhiteSpace(token)) return false;
        return _memoryCache.TryGetValue($"webauthn:enroll:{userId}", out string? posib) && posib == token;
    }

    //Teacher registration
    [HttpPost("register-teacher")]
    public async Task<IActionResult> RegisterTeacher([FromBody] RegisterTeacherRequest request)
    {
        try
        {
            if (request == null) throw new ArgumentNullException("RegisterTeacher: RegisterTeacherRequest is null!");

            // Validate teacher invite token (simple server-side gate)
            var invite = await _context.Set<TeacherInvite>()
                .FirstOrDefaultAsync(t => t.Token == request.InviteToken && t.IsActive);
            if (invite is null)
                return Unauthorized(new { error = "Invalid teacher invite token." });
            if (invite.ExpiresAt <= DateTime.UtcNow)
                return Unauthorized(new { error = "Teacher invite token expired." });
            if (invite.MaxUses.HasValue && invite.UsedCount >= invite.MaxUses.Value)
                return Unauthorized(new { error = "Teacher invite token usage exceeded." });
            if (!string.IsNullOrWhiteSpace(invite.EmailDomain) && !request.Email.EndsWith("@" + invite.EmailDomain, StringComparison.OrdinalIgnoreCase))
                return Unauthorized(new { error = $"Teacher invite restricted to @{invite.EmailDomain}." });

            // HOW CAN I RESTRICT STUDENTS FROM CREATING TEACHER ACCOUNTS?
            // MAYBE DOESNT ALLOW ANYBODY TO CREATE TEACHER ACCOUNT?
            // PROVIDE THEM ACCOUNTS

            if (await _context.Users.AnyAsync(e => e.Email == request.Email))
            {
                throw new TeacherEmailExistsException();
            }

            var teacherUser = new User(
                email: request.Email,
                passwordhash: _passwordService.HashPassword(request.Password),
                fullname: request.FullName,
                gtuid: null,
                role: "Teacher"
            );

            _context.Users.Add(teacherUser);
            // optional profile row for future teacher-specific fields
            _context.Set<TeacherProfile>().Add(new TeacherProfile { UserId = teacherUser.UserId });
            await _context.SaveChangesAsync();

            // consume invite (increment usage)
            invite.UsedCount++;
            await _context.SaveChangesAsync();

            var token = _JWTService.GenerateToken(
                userid: teacherUser.UserId,
                email: teacherUser.Email,
                usertype: "Teacher"
                );

            return Ok(new AuthResponse
            (
                Token: token,
                UserId: teacherUser.UserId,
                UserType: "Teacher",
                FullName: teacherUser.FullName,
                Email: teacherUser.Email,
                GtuStudentId: null,
                RequiresWebAuthn: false
            )
            );


        }
        catch (Exception ex)
        {
            _logger.LogError(ex, ex.Message);

            return BadRequest(new { error = ex.Message });
        }


    }

    //Teacher login

    [HttpPost("login-teacher")]
    public async Task<IActionResult> LoginTeacher([FromBody] TeacherLoginRequest request)
    {
        try
        {
            if (request == null) throw new ArgumentNullException("LoginTeacher: TeacherLoginRequest is null.");

            var teacher = await _context.Users.FirstOrDefaultAsync(t => t.Email == request.Email && t.Role == "Teacher");

            if (teacher == null)
            {
                throw new BadHttpRequestException("Invalid credentials for teacher account.");
            }

            if (!_passwordService.VerifyPassword(request.Password, teacher.PasswordHash))
            {
                throw new ArgumentException("Password hash doesn't match.");

            }

            var token = _JWTService.GenerateToken(teacher.UserId, teacher.Email, "Teacher");

            return Ok(new AuthResponse(
                Token: token,
                UserId: teacher.UserId,
                UserType: "Teacher",
                FullName: teacher.FullName,
                Email: teacher.Email,
                GtuStudentId: null,
                RequiresWebAuthn: false
                ));




        }
        catch (Exception ex)
        {
            _logger.LogError(ex.Message, ex.StackTrace);

            return BadRequest(new { error = ex.Message });
        }
    }



    //Student Kay�t

    [HttpPost("register-student")]
    public async Task<IActionResult> RegisterStudent([FromBody] RegisterStudentRequest request)
    {
        try
        {
            if (request == null) throw new ArgumentNullException("RegisterStudent: RegisterStudentRequest is null.");

            if (await _context.Users.AnyAsync(u => u.Email == request.Email))
            {
                throw new InvalidCredentialsError("The email is exists.");
            }

            if (await _context.StudentProfiles.AnyAsync(u => u.GtuStudentId == request.GtuStudentId))
            {
                throw new GTUIDExistsException();

            }


            var studentUser = new User(
                email: request.Email,
                passwordhash: _passwordService.HashPassword(request.Password),
                fullname: request.FullName,
                gtuid: null,
                role: "Student"
                );

            _context.Users.Add(studentUser);
            _context.Set<StudentProfile>().Add(new StudentProfile { UserId = studentUser.UserId, GtuStudentId = request.GtuStudentId });

            await _context.SaveChangesAsync();

            var token = _JWTService.GenerateToken(studentUser.UserId, studentUser.Email, "Student");

            return Ok(new AuthResponse(
                Token: token,
                UserId: studentUser.UserId,
                UserType: "Student",
                FullName: studentUser.FullName,
                Email: studentUser.Email,
                GtuStudentId: request.GtuStudentId,
                RequiresWebAuthn: true
                ));


        }
        catch (Exception ex)
        {

            _logger.LogError(ex.Message, ex.StackTrace);
            return BadRequest(new { error = ex.Message });
        }
    }


    // //Student kayit ikinci ad�m device lock
    // [HttpPost("register-webauthn")]
    // public async Task<IActionResult> DeviceLockStep()
    // {

    // }

    [HttpPost("register-webauthn/begin")]
    public async Task<IActionResult> BeginWebAuthnRegister([FromBody] BeginWebAuthnRegisterRequest request)
    {
        try
        {
            if (!IsStudentAuthenticated(request.UserId) && !HasEnrollToken(request.UserId, request.EnrollToken))
            {
                throw new UnauthorizedAccessException("You have to be signed in to create a webauthn pass.");
            }

            var user = await _context.Users.FirstOrDefaultAsync(u => u.UserId == request.UserId);
            if (user is null) throw new WebAuthnRegisterUserIsNullException(request.UserId);

            var exclude = await _context.WebAuthnCredentials
            .Where(c => c.UserId == request.UserId && c.IsActive)
            .Select(c => new PublicKeyCredentialDescriptor(c.CredentialId))
            .ToListAsync();

            var options = _fido2Service.CreateCredentialOptions(
                userId: request.UserId,
                username: user.Email,
                displayName: user.FullName,
                excludeCredentials: exclude
            );

            _memoryCache.Set($"webauthn:reg:{user.UserId}", options, TimeSpan.FromMinutes(10));

            if (!string.IsNullOrWhiteSpace(request.DeviceName))
            {
                _memoryCache.Set($"webauthn:reg:devicename:{user.UserId}", request.DeviceName, TimeSpan.FromMinutes(10));
            }

            return Ok(options);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, ex.StackTrace);
            return BadRequest(new { error = ex.Message });
        }
    }


    [HttpPost("register-webauthn/complete")]
    public async Task<IActionResult> CompleteWebAuthnRegister([FromBody] CompleteWebAuthnRegisterRequest request)
    {
        try
        {
            if (!IsStudentAuthenticated(request.UserId) && !HasEnrollToken(request.UserId, request.EnrollToken))
            {
                throw new UnauthorizedAccessException("You have to be signed in to create a webauthn pass.");
            }
            var user = await _context.Users.FirstOrDefaultAsync(u => u.UserId == request.UserId && u.Role == "Student");
            if (user is null) throw new WebAuthnRegisterUserIsNullException(request.UserId);

            if (!_memoryCache.TryGetValue($"webauthn:reg:{user.UserId}", out CredentialCreateOptions? options) || options is null)
            {
                throw new RegistrationChallengeExpiredException();
            }

            string? deviceName = _memoryCache.TryGetValue($"webauthn:reg:devicename:{user.UserId}", out string? devicename) ? devicename : request.DeviceName;

            var attestation = new AuthenticatorAttestationRawResponse
            {
                Id = request.Id,
                RawId = request.RawId,
                Type = request.Type.Equals("public-key") ? PublicKeyCredentialType.PublicKey : PublicKeyCredentialType.Invalid,
                Response = new AuthenticatorAttestationRawResponse.AttestationResponse
                {
                    ClientDataJson = request.ClientDataJSON,
                    AttestationObject = request.AttestationObject
                },
            };

            IsCredentialIdUniqueToUserAsyncDelegate uniqueCheck = async (args, cancelToken) =>
            {
                var exists = await _context.WebAuthnCredentials.AnyAsync(c => c.UserId == user.UserId && c.CredentialId == args.CredentialId);
                return !exists;
            };

            if (await _context.WebAuthnCredentials.AnyAsync(c => c.UserId == user.UserId && c.IsActive))
            {
                throw new DeviceAlreadyRegisteredException();
            }
            var result = await _fido2Service.VerifyAttestationAsync(attestation, options, uniqueCheck);

            //Passkey backup var mı diye kontrol ediyor, bunu soft bir şeye çevirebilirim
            if (result.IsBackedUp == true || result.IsBackupEligible == true)
            {
                return BadRequest(new { error = "Synced passkeys are not allowed." });
            }

            var cred = new WebAuthnCredential
            {
                UserId = user.UserId,
                CredentialId = result.Id,
                PublicKey = result.PublicKey,
                SignatureCounter = (long)result.SignCount,
                UserHandle = options.User.Id,
                DeviceName = deviceName,
                CredentialType = "public-key", // emin değilim
                Transports = result.Transports is null ? null : string.Join(',', result.Transports),
                RegisteredAt = DateTime.UtcNow,
                LastUsedAt = DateTime.UtcNow,
                IsActive = true

            };

            _context.WebAuthnCredentials.Add(cred);
            await _context.SaveChangesAsync();


            //not really sure about these
            _memoryCache.Remove($"webauthn:reg:{user.UserId}");
            _memoryCache.Remove($"webauthn:reg:devicename:{user.UserId}");

            return Ok(new { succes = true });

        }
        catch (Exception ex)
        {
            _logger.LogError(ex, ex.StackTrace);
            return BadRequest(new { error = ex.Message });

        }
    }


    [HttpPost("login-webauthn/begin")]
    public async Task<IActionResult> BeginWebAuthnLogin([FromBody] BeginWebAuthnLoginRequest request)
    {
        try
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.UserId == request.UserId && u.Role == "Student");
            if (user is null) throw new WebAuthnLoginUserIsNullException(request.UserId);

            var q = _context.WebAuthnCredentials.Where(c => c.UserId == user.UserId && c.IsActive);
            if (!string.IsNullOrWhiteSpace(request.DeviceName)) q = q.Where(c => c.DeviceName == request.DeviceName);

            var allowed = await q.Select(c => new PublicKeyCredentialDescriptor(c.CredentialId)).ToListAsync();
           
           
            // var allowed = await _context.WebAuthnCredentials
            // .Where(c => c.UserId == user.UserId && c.IsActive)
            // .Select(c => new PublicKeyCredentialDescriptor(c.CredentialId))
            // .ToListAsync();

            var options = _fido2Service.CreateAssertionOptions(allowed, UserVerificationRequirement.Required);
            _memoryCache.Set($"webauthn:assert:{user.UserId}", options, TimeSpan.FromMinutes(10));

            return Ok(options);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, ex.StackTrace);
            return BadRequest(new { error = ex.Message });
        }
    }



    [HttpPost("login-webauthn/complete")]
    public async Task<IActionResult> CompleteWebAuthnLogin([FromBody] CompleteWebAuthnLoginRequest request)
    {
        try
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.UserId == request.UserId && u.Role == "Student");
            if (user is null) throw new WebAuthnLoginUserIsNullException(phase: 2, userid: request.UserId);


            if (!_memoryCache.TryGetValue($"webauthn:assert:{user.UserId}", out AssertionOptions? options) || options is null)
            {
                throw new StudentAssertionChallengeExpiredException();
            }

        
            var assertation = new AuthenticatorAssertionRawResponse
            {
                Id = request.Id,
                RawId = request.RawId,
                Type = PublicKeyCredentialType.PublicKey,
                Response = new AuthenticatorAssertionRawResponse.AssertionResponse
                {
                    ClientDataJson = request.ClientDataJSON,
                    AuthenticatorData = request.AuthenticatorData,
                    Signature = request.Signature,
                    UserHandle = request.UserHandle
                }
            };

            var cred = await _context.WebAuthnCredentials
            .FirstOrDefaultAsync(c => c.UserId == user.UserId && c.CredentialId == request.RawId);
            if (cred is null) throw new WebAuthnCredIsNullException();

            Console.WriteLine("Cred device name : " + cred.DeviceName);
            Console.WriteLine("Request device name : " + request.DeviceName);
           
            if (cred.PublicKey is null || cred.PublicKey.Length == 0)
            return BadRequest(new { error = "Stored public key is missing." });


            if (cred.DeviceName != null && cred.DeviceName != request.DeviceName)
            {
                throw new DeviceMismatchException();
            }

            Console.WriteLine("Assertation: " + assertation);
            Console.WriteLine("Options " + options);
            Console.WriteLine("Cred: " + cred);
            Console.WriteLine("Cred public key :" + cred.PublicKey);
            Console.WriteLine("Cred sign count : " + (uint)(cred.SignatureCounter));

            IsUserHandleOwnerOfCredentialIdAsync ownerCheck = async (p, cancel) =>
            {
                if (p.UserHandle is null || p.UserHandle.Length == 0) return true;

                var dbCred = await _context.WebAuthnCredentials
                .AsNoTracking()
                .FirstOrDefaultAsync(c => c.CredentialId == p.CredentialId, cancel);

                if (dbCred is null) return false;

                return dbCred.UserHandle is not null && dbCred.UserHandle.AsSpan().SequenceEqual(p.UserHandle);
            };

            var result = await _fido2Service.VerifyAssertionAsync(
                assertation,

                options,

                cred.PublicKey,

                (uint)cred.SignatureCounter,

                ownerCheck

            );

            
            // var result = await _fido2Service.VerifyAssertionAsync(assertation, options, cred.PublicKey, (uint)cred.SignatureCounter);

            cred.SignatureCounter = (long)result.SignCount;
            cred.LastUsedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            _memoryCache.Remove($"webauthn:assert:{user.UserId}");

            var token = _JWTService.GenerateToken(user.UserId, user.Email, "Student");

            return Ok(new AuthResponse(token, user.UserId, user.Role, user.FullName,
            user.Email, user.GtuStudentId, false));
        }
        catch (Exception ex)
        {
            Console.WriteLine(ex.ToString());
            _logger.LogError(ex, ex.StackTrace);
            return BadRequest(new { error = ex.Message });
        }
    }
    

}
