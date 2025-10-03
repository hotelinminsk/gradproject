namespace GtuAttendance.Core.Entities;

public class CourseEnrollment
{
    public Guid EnrollmentId { get; set; } = Guid.NewGuid();
    public Guid CourseId { get; set; }
    public Guid StudentId { get; set; }
    public DateTime EnrolledAt { get; set; } = DateTime.UtcNow;
    public bool IsValidated { get; set; } = true;

    // Navigation
    public Course Course { get; set; } = null!;
    public Student Student { get; set; } = null!;
}