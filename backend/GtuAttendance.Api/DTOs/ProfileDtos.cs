namespace GtuAttendance.Api.DTOs;

public record TeacherProfileResponse(
    Guid UserId,
    string FullName,
    string Email,
    DateTime CreatedAt,
    int CourseCount
);

public record StudentProfileResponse(
    Guid UserId,
    string FullName,
    string Email,
    string? GtuStudentId,
    DateTime CreatedAt,
    int EnrolledCourseCount
);
