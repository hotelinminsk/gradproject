using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using GtuAttendance.Api.Filters;
using GtuAttendance.Infrastructure.Data;
using GtuAttendance.Infrastructure.Services;
using GtuAttendance.Api.DTOs;
using GtuAttendance.Infrastructure.Errors;

namespace GtuAttendance.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AdminController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly JWTService _jwt;

    private readonly PasswordService _psw;

    private readonly ILogger<AdminController> _logger;

    private readonly IConfiguration _cfg;


    public AdminController(AppDbContext context, JWTService jwt, PasswordService psw, ILogger<AdminController> logger, IConfiguration cfg)
    {
        _db = context; _jwt = jwt; _psw = psw; _logger = logger; _cfg = cfg;
    }

    [HttpPost("auth/login")]
    [AllowAnonymous]
    [RequireAdminKey]
    public async Task<IActionResult> Login([FromBody] AdminLoginRequest REQUEST)
    {
        try
        {
            if (REQUEST is null || string.IsNullOrWhiteSpace(REQUEST.Email) || string.IsNullOrWhiteSpace(REQUEST.Password))
            {
                return BadRequest(new { error = "Email and password are required." });
            }

            var row = await _db.Users
            .Where(u => u.Role == "Admin" && u.Email == REQUEST.Email)
            .Select(u => new { u.UserId, u.Email, u.FullName, u.PasswordHash })
            .SingleOrDefaultAsync();


            if (row is null)
                return Unauthorized(new { error = "Invalid admin credentials." });

            if (!_psw.VerifyPassword(REQUEST.Password, row.PasswordHash))
            {
                throw new Unauthorized("admin/auth/login: Passwords are not matching.");
            }

            var token = _jwt.GenerateToken(row.UserId, row.Email
            , "Admin");

            return Ok(new AuthResponse(
                Token: token,

                UserId: row.UserId,

                UserType: "Admin",

                FullName: row.FullName,

                Email: row.Email,

                GtuStudentId: null,

                RequiresWebAuthn: false
            ));


        }
        catch (Exception EX)
        {
            _logger.LogError(EX, EX.StackTrace);
            return BadRequest(new { error = EX.Message });
        }
    }

    [HttpGet("info")]
    public IActionResult Info() => Ok(new
    {
        Version = typeof(Program).Assembly.GetName().Version?.ToString(),
        Environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT"),
        UtcNow = DateTime.UtcNow
    });

    // //     [HttpGet("users")]
    // //     public async Task<IActionResult> Users([FromQuery] string? role, [FromQuery] string? email)
    // //     {
    // //         var q = _context.Users.AsNoTracking().AsQueryable();
    // //         if (!string.IsNullOrWhiteSpace(role)) q = q.Where(u => u.Role == role);
    // //         if (!string.IsNullOrWhiteSpace(email)) q = q.Where(u => u.Email == email);
    // //         var list = await q.OrderByDescending(u => u.CreatedAt)
    // //                     .Select(u => new { u.UserId, u.FullName, u.Email, u.Role, u.IsActive, u.CreatedAt })
    // //                     .Take(200).ToListAsync();

    // //         return Ok(list);
    // //     }

    [HttpGet("users")]
    public async Task<IActionResult> Users([FromQuery] string? role, [FromQuery] string? email)
    {
        var q = _db.Users.AsNoTracking().AsQueryable();
        if (!string.IsNullOrWhiteSpace(role)) q = q.Where(u => u.Role == role);
        if (!string.IsNullOrWhiteSpace(email)) q = q.Where(c => c.Email == email);
        var list = await q.OrderByDescending(u => u.CreatedAt)
            .Select(u => new { u.UserId, u.FullName, u.Email, u.Role, u.IsActive, u.CreatedAt })
            .Take(200).ToListAsync();

        return Ok(list);
    }

    // //     [HttpGet("sessions")]
    // //    public  async Task<IActionResult> Sessions([FromQuery] Guid? courseId, [FromQuery] bool activeOnly = false)
    // //     {
    // //         var q = _context.AttendanceSessions.AsNoTracking().AsQueryable();
    // //         if (courseId.HasValue) q = q.Where(s => s.CourseId == courseId.Value);
    // //         if (activeOnly) q = q.Where(s => s.IsActive && s.ExpiresAt > DateTime.UtcNow);
    // //         var list = await q.OrderByDescending(s => s.CreatedAt)
    // //                         .Select(s => new { s.SessionId, s.CourseId, s.TeacherId, s.CreatedAt, s.ExpiresAt, s.IsActive, s.MaxDistanceMeters })
    // //                         .Take(200).ToListAsync();
    // //         return Ok(list);
    // //     }
    // // }

    [HttpGet("sessions")]
    public async Task<IActionResult> Sessions([FromBody] Guid? courseid, [FromQuery] bool activeOnly = false)
    {
        var q = _db.AttendanceSessions.AsNoTracking().AsQueryable();
        if (courseid.HasValue) q = q.Where(c => c.CourseId == courseid);
        if (activeOnly) q = q.Where(a => a.IsActive && a.ExpiresAt > DateTime.UtcNow);

        var list = await q.OrderByDescending(s => s.CreatedAt)
        .Select(s => new { s.SessionId, s.CourseId, s.TeacherId, s.CreatedAt, s.ExpiresAt, s.IsActive, s.MaxDistanceMeters })
        .Take(200).ToListAsync();

        return Ok(list);
    }
}




// using Microsoft.AspNetCore.Authorization;
// using Microsoft.AspNetCore.Mvc;
// using Microsoft.EntityFrameworkCore;
// using GtuAttendance.Api.Filters;
// using GtuAttendance.Infrastructure.Data;
// using GtuAttendance.Infrastructure.Services;
// using GtuAttendance.Api.DTOs;

// namespace GtuAttendance.Api.Controllers;


// [ApiController]
// [Route("api/admin")]
// public class AdminController : ControllerBase
// {
//     private readonly AppDbContext _context;
//     private readonly PasswordService _pass_service;

//     private readonly JWTService _jwt_service;

//     private readonly ILogger<AdminController> _logger;

//     private readonly IConfiguration _config;


//     public AdminController(AppDbContext context, PasswordService passwser, JWTService jwtser, ILogger<AdminController> logger, IConfiguration config)
//     {
//         _config = config; _logger = logger; _jwt_service = jwtser; _pass_service = passwser; _context = context;
//     }

//     [HttpPost("auth/login")]
//     [AllowAnonymous]
//     [RequireAdminKey]
//     public async Task<IActionResult> Login([FromBody] AdminLoginRequest request)
//     {
//         try
//         {
//             if (request is null || string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
//             {
//                 return BadRequest(new { error = "Email and password are required." });
//             }
            
//             var row = await _context.Users
//             .Where(u => EF.Property<string>(u, "UserType"))
//         }
//         catch (System.Exception)
//         {
            
//             throw;
//         }
//     } 
// }



// // [ApiController]
// // [Route("api/[controller]")]
// // [Authorize(Policy = "AdminOnly")]
// // public class AdminController : ControllerBase
// // {
// //     private readonly AppDbContext _context;
// //     private readonly ILogger<AdminController> _logger;

// //     public AdminController(AppDbContext context, ILogger<AdminController> logger)
// //     {
// //         _context = context; _logger = logger;

// //     }


// //     [HttpGet("info")]
// //     public IActionResult Info() => Ok(new
// //     {
// //         Version = typeof(Program).Assembly.GetName().Version?.ToString(),
// //         Environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT"),
// //         UtcNow = DateTime.UtcNow
// //     });

// //     [HttpGet("users")]
// //     public async Task<IActionResult> Users([FromQuery] string? role, [FromQuery] string? email)
// //     {
// //         var q = _context.Users.AsNoTracking().AsQueryable();
// //         if (!string.IsNullOrWhiteSpace(role)) q = q.Where(u => u.Role == role);
// //         if (!string.IsNullOrWhiteSpace(email)) q = q.Where(u => u.Email == email);
// //         var list = await q.OrderByDescending(u => u.CreatedAt)
// //                     .Select(u => new { u.UserId, u.FullName, u.Email, u.Role, u.IsActive, u.CreatedAt })
// //                     .Take(200).ToListAsync();

// //         return Ok(list);
// //     }

// //     [HttpGet("sessions")]
// //    public  async Task<IActionResult> Sessions([FromQuery] Guid? courseId, [FromQuery] bool activeOnly = false)
// //     {
// //         var q = _context.AttendanceSessions.AsNoTracking().AsQueryable();
// //         if (courseId.HasValue) q = q.Where(s => s.CourseId == courseId.Value);
// //         if (activeOnly) q = q.Where(s => s.IsActive && s.ExpiresAt > DateTime.UtcNow);
// //         var list = await q.OrderByDescending(s => s.CreatedAt)
// //                         .Select(s => new { s.SessionId, s.CourseId, s.TeacherId, s.CreatedAt, s.ExpiresAt, s.IsActive, s.MaxDistanceMeters })
// //                         .Take(200).ToListAsync();
// //         return Ok(list);
// //     }
// // }