namespace GtuAttendance.Api.DTOs;

public record CreateSessionRequest(
    Guid CourseId,
    decimal TeacherLatitude,
    decimal TeacherLongitude,
    int MaxDistanceMeters,
    DateTime ExpiresAtUtc,
    int? QrCodeValiditySeconds
);  

public record CreateSessionResponse(
    Guid SessionId,
    string QrToken,
    DateTime ExpiresAtUtc
);

public record GetQrCodeResponse(
    Guid SessionId,
    string Code,
    int ExpiresInSeconds
);

public record BeginCheckInRequest(Guid SessionId);
public record BeginCheckInResponse(string Nonce);

public record CheckInRequest(
    Guid SessionId,
    string Code,

string Nonce,
decimal Latitude,
decimal Longitude,
Guid DeviceCredentialId
);

public record CheckInResponse(
    string Status,
    decimal DistanceMeters,
    bool IsWithinRange,
    DateTime CheckInTimeUtc
);


public record SessionAttendeeDto(
    string FullName,
    string GtuStudentId,
    DateTime CheckInAtUtc,
    decimal? DistanceMeters
);

public record SessionDetailResponse(
    Guid SessionId,
    Guid CourseId,
    string CourseName,
    string CourseCode,
    DateTime CreatedAt,
    DateTime ExpiresAt,
    bool IsActive,
    decimal Latitude,
    decimal Longitude,
    IEnumerable<SessionAttendeeDto> Attendees
);


public record SessionSummaryDto(
Guid SessionId,
Guid CourseId,
string CourseName,
string CourseCode,
DateTime CreatedAt,
DateTime ExpiresAt,
bool IsActive,
int AttendeeCount
);
