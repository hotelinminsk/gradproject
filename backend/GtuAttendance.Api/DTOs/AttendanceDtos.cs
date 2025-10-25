namespace GtuAttendance.Api.DTOs;

public record CreateSessionRequest(
    Guid CourseId,
    decimal TeacherLatitude,
    decimal TeacherLongitude,
    int MaxDistanceMeters,
    DateTime ExpiresAtUtc
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

