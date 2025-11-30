namespace GtuAttendance.Core.Entities;

public class CourseEnrollment
{
    public Guid EnrollmentId { get; set; } = Guid.NewGuid();
    public Guid CourseId { get; set; }
    public Guid StudentId { get; set; }
    public DateTime EnrolledAt { get; set; } = DateTime.UtcNow;
    public bool IsValidated { get; set; } = true;
    public bool IsDropped {get;set;} = false;
    public DateTime? DroppedAtUtc {get;set;}
    public Guid? DroppedByTeacherId {get;set;}

    // Navigation
    public Course Course { get; set; } = null!;
    public User Student { get; set; } = null!;
}
