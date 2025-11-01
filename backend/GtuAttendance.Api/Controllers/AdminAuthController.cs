// using System.Text.RegularExpressions;
// using GtuAttendance.Api.DTOs;
// using GtuAttendance.Core.Entities;
// using GtuAttendance.Infrastructure.Data;
// using GtuAttendance.Infrastructure.Errors;
// using GtuAttendance.Infrastructure.Services;
// using Microsoft.AspNetCore.Mvc;
// using Microsoft.EntityFrameworkCore;
// namespace GtuAttendance.Api.Controllers;


// [ApiController]
// [Route("api/[controller]")]
// public class AdminAuthController : ControllerBase
// {
//     private readonly AppDbContext _context;

//     private readonly string passhash;
//     private readonly PasswordService _passWordService;

//     private readonly JWTService _jwtService;
//     private readonly ILogger<AdminAuthController> _logger;

//     public AdminAuthController(JWTService jwtService,PasswordService passwordService, IConfiguration config, AppDbContext context, ILogger<AdminAuthController> logger)
//     {
//         _jwtService = jwtService;
//         _passWordService = passwordService;
//         _context = context;
//         _logger = logger;

//     }

//     private bool IsPasswordsMatching(string requestpass, string dbhash)
//     {
//         bool matching = false;

//         if (string.IsNullOrWhiteSpace(requestpass) || string.IsNullOrWhiteSpace(dbhash))
//             return matching;

        
//         matching = _passWordService.VerifyPassword(requestpass, dbhash);

//         return matching;
//     }

//     [HttpPost("/login")]
//     public async Task<IActionResult> LoginAdmin([FromBody] AdminLoginRequest request)
//     {
//         try
//         {
//             Console.WriteLine($"Request : {request}, request email : {request.Email}, request password: {request.Password}");
//             if (request == null) throw new ArgumentNullException("The admin login request is null.");

//             var user = await _context.Teachers.Where(u => u.Email == request.Email && u.Role == "Admin").FirstOrDefaultAsync();

//             if (user == null) throw new Unauthorized("admin/auth/login : invalid admin credentials.");

//             if (!IsPasswordsMatching(request.Password, user.PasswordHash))
//             {
//                 throw new Unauthorized($"Unauthorized access to admin/auth/login -> email: {request.Email} && pass: {request.Password}");

//             }
//             ;

//             var token = _jwtService.GenerateToken(user.UserId, user.Email, "Admin");

//             return Ok(new AuthResponse(
//                 Token: token,

//                 UserId: user.UserId,

//                 FullName: user.FullName,

//                 Email: user.Email,
//                 UserType: "Admin",

//                 GtuStudentId: null,

//                 RequiresWebAuthn: false

//             ));


//         }
//         catch (System.Exception Ex)
//         {

//             _logger.LogError(Ex, Ex.StackTrace);
//             return BadRequest(new { error = Ex.Message });
//         }
//     }
// }