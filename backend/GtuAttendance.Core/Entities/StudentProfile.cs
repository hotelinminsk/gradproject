
namespace GtuAttendance.Core.Entities;

public class StudentProfile
{
    public Guid UserId { get; set; }

    public string GtuStudentId { get; set; } = default;

    public User User { get; set; } = default;
}