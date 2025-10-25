namespace GtuAttendance.Infrastructure.Errors;


public class SessionNotFoundException : Exception
{
    public SessionNotFoundException(Guid sessionId, Guid courseId, DateTime? Test) :
    base($"Session with sessionid: {sessionId} and courseid: {courseId} not found : {Test ?? DateTime.UtcNow}") {}
}