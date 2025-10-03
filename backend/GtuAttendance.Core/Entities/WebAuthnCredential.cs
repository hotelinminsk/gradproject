using GtuAttendance.Core.Entities;

public class WebAuthnCredential
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    // Fido2'den gelen CredentialId
    public byte[] CredentialId { get; set; } = Array.Empty<byte>();

    // Public Key
    public byte[] PublicKey { get; set; } = Array.Empty<byte>();

    // Counter (replay attack önleme)
    public long SignatureCounter { get; set; }

    // Kullanıcı kimliği (UserHandle) – byte[]
    public byte[] UserHandle { get; set; } = Array.Empty<byte>();

    // Opsiyonel metadata
    public string? DeviceName { get; set; }
    public string CredentialType { get; set; } = "public-key";
    public string? Transports { get; set; }

    // Tarihler
    public DateTime RegisteredAt { get; set; } = DateTime.UtcNow;
    public DateTime LastUsedAt { get; set; } = DateTime.UtcNow;

    public bool IsActive { get; set; } = true;
}