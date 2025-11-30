using GtuAttendance.Core.Entities;

namespace GtuAttendance.Api.DTOs;


public record CreateCourseRequest(
    string CourseName,
    string CourseCode
);

public record DeleteCoursesRequest(
    IEnumerable<Guid> CourseIds
);

public record EnrollByInviteRequest(
    string invitationToken
);

public record BulkRosterUploadRequest(
    IList<RosterStudentRow> Students,
    bool ReplaceExisting = false
);

public record RosterStudentRow(
    string FullName,
    string GtuStudentId
);



public record CourseStudent
(
    Guid CourseStudentId,
    string email,
    string fullname,
    string gtustudentid,
    bool isVerifiedEnrollment
);

public record CourseDetailsResponse
(
    Guid CourseId,
    string CourseName,
    string CourseCode,
    string CourseInvitationToken,
    DateTime createdAt,
    bool IsActive,
    ICollection<CourseRoster> Roster,
    ICollection<CourseEnrollment> Enrollments,
    ICollection<AttendanceSession> Sessions,
    ICollection<CourseStudent> CourseStudents
);
    
