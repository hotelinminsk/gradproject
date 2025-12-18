namespace GtuAttendance.Core.Entities;

public class CourseSchedule
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid CourseId { get; set; }
    
    // Day of week: 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    public int DayOfWeek { get; set; }
    
    // Stored as TimeSpan 
    public TimeSpan StartTime { get; set; }
    public TimeSpan EndTime { get; set; }

    public Course Course { get; set; } = null!;
}
