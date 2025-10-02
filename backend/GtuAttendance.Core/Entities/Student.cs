namespace GtuAttendance.Core.Entities;


public class Student : User
{

    public string GtuStudentId { get; set; } = string.Empty;

    public ICollection<CourseEnrollment> Enrollments { get; set; } = new List<CourseEnrollment>();
    public ICollection<AttendanceRecord> AttendanceRecords { get; set; } = new List<AttendanceRecord>();

}