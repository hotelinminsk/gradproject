namespace GtuAttendance.Infrastructure.Errors;

public class InvalidFileException : Exception
{
    public InvalidFileException(string atroute) : base($"Invalid file exception at route {atroute}") { }

    public InvalidFileException() : base("Invalid file exception") { }

    public InvalidFileException(Exception ex) : base("Invalid file exception", ex) { }


    public InvalidFileException(string atroute, Exception ex) : base($"Invalid file exception at route {atroute}", ex) { }
}




