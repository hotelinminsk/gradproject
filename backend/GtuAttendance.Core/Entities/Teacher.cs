namespace GtuAttendance.Core.Entities;



public class Teacher : User
{
    public ICollection<Course> CreatedCourses { get; set; } = new List<Course>();
    public ICollection<AttendanceSession> AttendanceSessions { get; set; } = new List<AttendanceSession>();
}