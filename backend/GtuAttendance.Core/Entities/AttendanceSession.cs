using GtuAttendance.Core.Entities;

public class AttendanceSession
{
    public Guid SessionId { get; set; } = Guid.NewGuid();
    public Guid CourseId { get; set; }
    public Guid TeacherId { get; set; }
    public string QRCodeToken { get; set; } = string.Empty;

    public decimal TeacherLatitude { get; set; }
    public decimal TeacherLongitude { get; set; }

    public int MaxDistanceMeters { get; set; } = 50;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime ExpiresAt { get; set; }
    public bool IsActive { get; set; } = true;

    public Course Course { get; set; } = null!;
    public User Teacher { get; set; } = null!;
    public ICollection<AttendanceRecord> AttendanceRecords { get; set; } = new List<AttendanceRecord>();

    // New addition for extra validaiton of qr token

    public byte[] Secret { get; set; } = Array.Empty<byte>();

    public int CodeStepSeconds { get; set; } = 30;
}
