namespace GtuAttendance.Api.DTOs;


public record AdminLoginRequest(
    string Email,

    string Password
);