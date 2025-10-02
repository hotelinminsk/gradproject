namespace GtuAttendance.Core.Entities;

public class User {
	public Guid UserId {get; set;} = Guid.NewGuid();
	public string Email {get; set;} = string.Empty;
	public string PasswordHash { get; set;} = string.Empty;
	public string FullName {get; set;} = string.Empty;
	public string? GtuStudentId {get; set;}
	public string Role {get; set;} = string.Empty; // "Student" or "Teacher"
	public DateTime CreatedAt {get;set;} = DateTime.UtcNow;
	public bool IsActive {get;set;} = true;



	public ICollection<WebAuthnCredential> Credentials { get; set; } = new List<WebAuthnCredential>();

	//public ICollection<WebAuthnCredential> Credentials {get; set;} = new List<WebAuthnCredential>();
	//public ICollection<Course> CreatedCourses { get; set; } = new List<Course>();
	//public ICollection<CourseEnrollment> Enrollments { get; set; } = new List<CourseEnrollment>();

	//public ICollection<AttendanceRecord> AttendanceRecords { get; set; } = new List<AttendanceRecord>();


}