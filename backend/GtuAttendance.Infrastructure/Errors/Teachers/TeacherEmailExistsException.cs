
namespace GtuAttendance.Infrastructure.Errors.Teachers;

public class TeacherEmailExistsException : Exception
{
    public TeacherEmailExistsException() : base("Bu mail daha önce kullanılmış.") { }

    public TeacherEmailExistsException(Exception inner) : base("Bu mail daha önce kullanılmış.", inner) { }

    public TeacherEmailExistsException(string message) : base(message) { }

    public TeacherEmailExistsException(string message, Exception inner) : base(message, inner) { }
}