namespace GtuAttendance.Infrastructure.Errors;


public class CourseDataCantBeNullOrEmptyException : Exception
{
    public CourseDataCantBeNullOrEmptyException(string message) : base(message) { }

    public CourseDataCantBeNullOrEmptyException() : base("Course data cant be null or empty, check the request..") { }

    public CourseDataCantBeNullOrEmptyException(Exception ex) : base("Course data cant be null or empty, check the request..", ex) { }

    public CourseDataCantBeNullOrEmptyException(string message, Exception ex) : base(message, ex) { }

}

public class CourseIdOrTeacherIdMismatchException : Exception
{
    public CourseIdOrTeacherIdMismatchException(string message) : base(message) { }

    public CourseIdOrTeacherIdMismatchException() : base("Course id or teacher id mismatch") { }

    public CourseIdOrTeacherIdMismatchException(Exception ex) : base("Course id or teacher id mismatch", ex) { }



}


public class CourseNotFoundException : Exception
{
    public CourseNotFoundException(string message) : base(message) { }

    public CourseNotFoundException() : base("Course not found") { }

    public CourseNotFoundException(Exception ex) : base("Course not found", ex) { }

}


