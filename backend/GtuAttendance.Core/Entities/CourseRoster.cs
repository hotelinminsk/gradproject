using  GtuAttendance.Core.Entities;

public class CourseRoster
{
    public Guid RosterId { get; set; } = Guid.NewGuid();
    public Guid CourseId { get; set; }
    public string GtuStudentId { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public DateTime ImportedAt { get; set; } = DateTime.UtcNow;

    public Course Course { get; set; } = null!;
}