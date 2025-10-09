namespace GtuAttendance.Api.DTOs;

public record BeginDeviceResetRequest(
    Guid userId,
    string GTUId

);

public record ConfirmDeviceResetRequest
(
    Guid userId,
    string OTP

);