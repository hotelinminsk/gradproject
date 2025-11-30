namespace GtuAttendance.Core.Entities;

public class Course
{
    public Guid CourseId { get; set; } = Guid.NewGuid();
    public Guid TeacherId { get; set; }
    public string CourseName { get; set; } = string.Empty;
    public string CourseCode { get; set; } = string.Empty;
    public string InvitationToken { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public bool IsActive { get; set; } = true;

    // Navigation
    public User Teacher { get; set; } = null!;

    public ICollection<CourseRoster> Roster { get; set; } = new List<CourseRoster>();
    public ICollection<CourseEnrollment> Enrollments { get; set; } = new List<CourseEnrollment>();
    public ICollection<AttendanceSession> Sessions { get; set; } = new List<AttendanceSession>();
}