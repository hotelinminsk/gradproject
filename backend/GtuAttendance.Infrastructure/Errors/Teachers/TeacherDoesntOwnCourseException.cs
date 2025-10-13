namespace GtuAttendance.Infrastructure.Errors;


public class TeacherDoesntOwnCourseException : Exception
{
    public TeacherDoesntOwnCourseException(Guid teacherId, Guid courseId) : base($"Teacher : {teacherId} doesnt own course : {courseId}") { }

    
}