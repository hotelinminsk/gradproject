namespace GtuAttendance.Core.Entities;



public class Teacher : User
{
    protected Teacher() : base() {}
    public Teacher(string email, string passhash, string fullname) :base(email:email, passwordhash: passhash, fullname: fullname,gtuid:null,role:"Teacher") {}
    public ICollection<Course> CreatedCourses { get; set; } = new List<Course>();
    public ICollection<AttendanceSession> AttendanceSessions { get; set; } = new List<AttendanceSession>();
}