namespace GtuAttendance.Core.Entities;


public class Student : User
{

    protected Student() : base() {  }
    public Student(string email, string passhash, string fullname, string gtuid) : base(email, passhash, fullname, gtuid, "Student") { }

    public string GtuStudentId { get; set; } = string.Empty;

    public ICollection<CourseEnrollment> Enrollments { get; set; } = new List<CourseEnrollment>();
    public ICollection<AttendanceRecord> AttendanceRecords { get; set; } = new List<AttendanceRecord>();

}