namespace GtuAttendance.Api.DTOs;


public record CreateCourseRequest(
    string CourseName,
    string CourseCode
);

public record EnrollByInviteRequest(
    string invitationToken
);