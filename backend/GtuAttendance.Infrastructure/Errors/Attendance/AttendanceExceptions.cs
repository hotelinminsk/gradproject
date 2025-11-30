


namespace GtuAttendance.Infrastructure.Errors;


public class CreateSessionRequestExpiredException : Exception
{
    public CreateSessionRequestExpiredException(string controllerroute) : base($"Create session request expired. Controller route : {controllerroute} ") { }

    public CreateSessionRequestExpiredException() : base("Create session request expired.") { }



}
public class SessionExpiredException : Exception
{
    public SessionExpiredException(Guid sessionId) : base($"Session {sessionId} expired.") { }

}
public class SessionDoesNotExistException : Exception
{
    public SessionDoesNotExistException(Guid userId, Guid sessionId) : base($"The session {sessionId}  does not exist for teacher {userId}.") { }




}

public class StudentNotEnrolledException : Exception
{
    public StudentNotEnrolledException(Guid studentID, Guid courseID) : base(

        $"Student {studentID} is not enrolled in course {courseID}"
      )
    { }
}

public  struct deviceNotValidDTO
{

    public  Guid  SessionId;
    public string Code;
    public  string nonce;
    public decimal Latitude;
    public  decimal Longitude;
    public Guid DeviceCredentialId;
}

public class DeviceIsNotValidException : Exception
{


    public DeviceIsNotValidException(deviceNotValidDTO dstruct, Guid USERID) : base(

        $"""    
        Checkin request : 
        SessionId: {dstruct.SessionId}
        Code: {dstruct.Code}
        nonce: {dstruct.nonce},
        Latitude: {dstruct.Latitude},
        Longitude: {dstruct.Longitude},
        User ID: {USERID}
        ... Device is not valid.
        """
     )
    { }
}



public class NonceIsNotValidException : Exception
{

    public NonceIsNotValidException(string nonce, Guid userid) : base($"Nonce : {nonce} is not valid for userid : {userid}") { }


}

public class CodeStepIsNotValidException : Exception
{
    public CodeStepIsNotValidException(string code, long currentstep, byte[] sessionsecret, Guid userid) : base($"User with {userid} code step: {currentstep} is not valid, session secret : {sessionsecret}.") { }
}


