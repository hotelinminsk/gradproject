namespace GtuAttendance.Core.Entities;

public class AttendanceRecord
{
    public Guid AttendanceId { get; set; } = Guid.NewGuid();
    public Guid SessionId { get; set; }
    public Guid CourseId { get; set; }
    public Guid StudentId { get; set; }
    public DateTime CheckInTime { get; set; } = DateTime.UtcNow;
    public decimal StudentLatitude { get; set; }
    public decimal StudentLongitude { get; set; }
    public decimal DistanceFromTeacherMeters { get; set; }
    public bool IsWithinRange { get; set; }
    public Guid DeviceCredentialId { get; set; }
    public DateTime? SyncedAt { get; set; }

    // Navigation
    public AttendanceSession Session { get; set; } = null!;
    public Course Course { get; set; } = null!;
    public Student Student { get; set; } = null!;
    public WebAuthnCredential DeviceCredential { get; set; } = null!;
}