namespace GtuAttendance.Core.Entities;

public class TeacherInvite
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Token { get; set; } = string.Empty; // base64url random
    public DateTime ExpiresAt { get; set; } = DateTime.UtcNow.AddDays(7);
    public int? MaxUses { get; set; } // null = unlimited until expiry
    public int UsedCount { get; set; } = 0;
    public string? EmailDomain { get; set; } // e.g., gtu.edu.tr
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

