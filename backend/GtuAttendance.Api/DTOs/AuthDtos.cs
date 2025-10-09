

namespace GtuAttendance.Api.DTOs;





public record RegisterTeacherRequest(
    string Email,
    string Password,
    string FullName
    );


public record RegisterStudentRequest(
    string Email,
    string Password,
    string FullName,
    string GtuStudentId
    );
public record TeacherLoginRequest(
    string Email,
    string Password
    );


public record BeginWebAuthnRegisterRequest(Guid UserId, string? DeviceName, string? EnrollToken);

public record CompleteWebAuthnRegisterRequest(
    Guid UserId,
    string Id,
    string Type,    
    byte[] RawId,
    byte[] AttestationObject,
    byte[] ClientDataJSON,
    string? DeviceName,
    string[]? Transports,
    string? EnrollToken
);

public record BeginWebAuthnLoginRequest(Guid UserId, string? DeviceName);

public record CompleteWebAuthnLoginRequest(
    Guid UserId,
    string Id,
    byte[] RawId,
    byte[] AuthenticatorData,
    byte[] ClientDataJSON,
    byte[] Signature,
    byte[]? UserHandle,
    string? DeviceName
);



public record AuthResponse(
    string Token,
    Guid UserId,
    string UserType,
    string FullName,
    string Email,
    string? GtuStudentId,
    bool RequiresWebAuthn
    );

