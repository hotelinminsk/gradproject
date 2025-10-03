using System;
namespace GtuAttendance.Infrastructure.Errors.Common;
public class InvalidCredentialsError: Exception
{
    public InvalidCredentialsError(): base ("Invalid credentilas.") { }

    public InvalidCredentialsError(string message) : base(message) { }

    public InvalidCredentialsError(string message, Exception inner) :base(message, inner) { }
}