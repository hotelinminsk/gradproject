using GtuAttendance.Api.DTOs;
using GtuAttendance.Core.Entities;
using GtuAttendance.Infrastructure.Data;
using GtuAttendance.Infrastructure.Errors.Common;
using GtuAttendance.Infrastructure.Errors.Students;
using GtuAttendance.Infrastructure.Services;

using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace GtuAttendance.Api.Controllers;


[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly JWTService _JWTService;
    private readonly PasswordService _passwordService;
    private readonly ILogger<AuthController> _logger;
    public AuthController(
        AppDbContext context,
        JWTService service,
        PasswordService passwordService,
        ILogger<AuthController> logger
        )
    {
        _context = context;
        _JWTService = service;
        _passwordService = passwordService;
        _logger = logger;
    }

    //Teacher registration
    [HttpPost("register-teacher")]
    public async Task<IActionResult> RegisterTeacher([FromBody] RegisterTeacherRequest request)
    {
        try
        {
            if (request == null) throw new ArgumentNullException("RegisterTeacher: RegisterTeacherRequest is null!");

            var teacher = new Teacher
            {
                Email = request.Email,
                PasswordHash = _passwordService.HashPassword(request.Password),
                FullName = request.FullName
            };

            _context.Teachers.Add(teacher);
            await _context.SaveChangesAsync();

            var token = _JWTService.GenerateToken(
                userid: teacher.UserId,
                email: teacher.Email,
                usertype: "Teacher"
                );

            return Ok(new AuthResponse
            (
                Token:token,
                UserId:teacher.UserId,
                UserType:"Teacher",
                FullName:teacher.FullName,
                Email:teacher.Email,
                GtuStudentId:null,
                RequiresWebAuthn:false
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
        try {
            if (request == null) throw new ArgumentNullException("LoginTeacher: TeacherLoginRequest is null.");

            var teacher = await _context.Teachers.FirstOrDefaultAsync(t => t.Email == request.Email);
    
            if (teacher == null) 
            {
                throw new BadHttpRequestException("Invalid credentials for teacher account.");
            }

            if(!_passwordService.VerifyPassword(request.Password, teacher.PasswordHash))
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
        catch(Exception ex)
        {
            _logger.LogError(ex.Message, ex.StackTrace);

            return BadRequest(new { error = ex.Message });
        }
    }



    //Student Kayýt

    [HttpPost("register-student")]
    public async Task<IActionResult> RegisterStudent([FromBody] RegisterStudentRequest request)
    {
        try
        {
            if (request == null) throw new ArgumentNullException("RegisterStudent: RegisterStudentRequest is null.");

            if (await _context.Users.AnyAsync(u => u.Email == request.Email)) {
                throw new InvalidCredentialsError("The email is exists.");
            }

            if( await _context.Students.AnyAsync(u => u.GtuStudentId == request.GtuStudentId){

                throw new GTUIDExistsException();
            }

            var student = new Student(
                email: request.Email,
                passhash: _passwordService.HashPassword(request.Password),
                fullname: request.FullName,
                gtuid: request.GtuStudentId
                );
            
            _context.Students.Add(student);

            await _context.SaveChangesAsync();

            var token = _JWTService.GenerateToken(student.UserId, student.Email, "Student");

            return Ok(new AuthResponse(
                Token: token,
                UserId: student.UserId,
                UserType: "Student",
                FullName: student.FullName,
                Email: student.Email,
                GtuStudentId: student.GtuStudentId,
                RequiresWebAuthn: true
                ));


        }catch(Exception ex)
        {

            _logger.LogError(ex.Message, ex.StackTrace);
            return BadRequest(new {error = ex.Message});
        }
    }


    //Student kayit ikinci adým device lock
    [HttpPost("register-webauthn")]
    public async Task<IActionResult> DeviceLockStep()
    {

    }


}