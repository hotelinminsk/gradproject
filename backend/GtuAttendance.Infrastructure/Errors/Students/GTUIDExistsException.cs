using System;

namespace GtuAttendance.Infrastructure.Errors.Students;


public class GTUIDExistsException : Exception
{
    public GTUIDExistsException() : base("Bu GTU id daha önce kullanılmış.") {}

    public GTUIDExistsException(Exception inner) : base("Bu GTU id daha önce kullanılmış.", inner) { }
    public GTUIDExistsException(string message) : base(message) {}

    public GTUIDExistsException(string message, Exception inner) : base(message, inner) {}

}