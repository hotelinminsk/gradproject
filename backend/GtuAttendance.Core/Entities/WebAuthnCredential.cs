using GtuAttendance.Core.Entities;

public class WebAuthnCredential
{
    public string CredentialId { get; set; } = string.Empty;
    public Guid UserId { get; set; }

    public byte[] CredentialIdBytes { get; set; } = Array.Empty<byte>();
    public byte[] PublicKey { get; set; } = Array.Empty<byte>();

    public long SignatureCounter { get; set; }
    public string? DeviceName { get; set; }

    public DateTime RegisteredAt { get; set; } = DateTime.UtcNow;
    public DateTime LastUsedAt { get; set; } = DateTime.UtcNow;
    
    public bool IsActive { get; set; } = true;


    public User User { get; set; } = null;
}