using GtuAttendance.Core.Entities;

namespace GtuAttendance.Api.DTOs;


public record ScheduleDto(
    int DayOfWeek,
    TimeSpan StartTime,
    TimeSpan EndTime
);

public record CreateCourseRequest(
    string CourseName,
    string CourseCode,
    string Description,
    List<ScheduleDto>? Schedules = null,
    DateTime? FirstSessionAt = null
);



public record CourseSessionDto(
    Guid SessionId,
    DateTime CreatedAt,
    DateTime ExpiresAt,
    bool IsActive
);

public record CourseStudent(
    Guid CourseStudentId,
    string? Email,
    string FullName,
    string? GtuStudentId,
    bool IsVerifiedEnrollment
);

public record RosterUploadRow(
    string FullName,
    string GtuStudentId
);

public record BulkRosterUploadRequest(
    List<RosterUploadRow> Students,
    bool ReplaceExisting
);

public record EnrollByInviteRequest(
    string invitationToken
);

public record DeleteCoursesRequest(
    List<Guid> CourseIds
);

public record CourseDetailsResponse
(
    Guid CourseId,
    string CourseName,
    string CourseCode,
    string Description,
    string InviteToken,
    DateTime createdAt,
    DateTime? FirstSessionAt,
    bool IsActive,
    ICollection<CourseRoster> Roster,
    ICollection<CourseEnrollment> Enrollments,
    ICollection<CourseSessionDto> Sessions,
    CourseSessionDto? ActiveSession,
    ICollection<CourseStudent> CourseStudents,
    ICollection<ScheduleDto> Schedules
);
    

public record StudentCourseStatus(
    string CourseCode,
    string CourseName,
    string Status // "rostered" | "enrolled" | "dropped"
);

public record TeacherStudentGroupDto(
    string Id, // GtuStudentId as key
    string FullName,
    string GtuStudentId,
    string Email,
    List<StudentCourseStatus> Courses
);
