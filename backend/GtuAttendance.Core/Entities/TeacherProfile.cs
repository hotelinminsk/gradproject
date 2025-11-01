namespace GtuAttendance.Core.Entities;

public class TeacherProfile
{
    public Guid UserId { get; set; }

    public User User { get; set; } = default;
}

