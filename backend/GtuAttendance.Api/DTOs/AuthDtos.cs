

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

public record RegisterWebAuthnRequest(
    Guid UserId,
    byte[] CredentialId,
    byte[] PublicKey,
    long Counter,
    string? DeviceName
    );

public record TeacherLoginRequest(
    string Email,
    string Password
    );

public record WebAuthnLoginRequest(
    Guid UserId,
    byte[] CredentilaId,
    byte[] AuthenticatorData,
    byte[] ClientDataJSON,
    byte[] Signature
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

