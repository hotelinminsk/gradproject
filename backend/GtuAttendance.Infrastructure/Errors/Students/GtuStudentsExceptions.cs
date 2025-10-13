namespace GtuAttendance.Infrastructure.Errors.Students;

public class GTUIDExistsException : Exception
{
    public GTUIDExistsException() : base("Bu GTU id daha önce kullanılmış.") { }

    public GTUIDExistsException(Exception inner) : base("Bu GTU id daha önce kullanılmış.", inner) { }
    public GTUIDExistsException(string message) : base(message) { }

    public GTUIDExistsException(string message, Exception inner) : base(message, inner) { }

}



public class RegistrationChallengeExpiredException : Exception
{
    public RegistrationChallengeExpiredException() : base("Registration challenge expired.") { }
    
    public RegistrationChallengeExpiredException(string message) : base(message) { }

    public RegistrationChallengeExpiredException(string message, Exception inner) : base(message, inner) { }
}



public class StudentAssertionChallengeExpiredException : Exception
{
    public StudentAssertionChallengeExpiredException() : base("Student assertion challenge expired.") { }
    public StudentAssertionChallengeExpiredException(string message) : base(message) { }

    public StudentAssertionChallengeExpiredException(string message, Exception inner) : base(message, inner) { }



}



public class WebAuthnLoginUserIsNullException : Exception
{
    public WebAuthnLoginUserIsNullException(Guid userid, int phase=1) : base($"Login web authn step {phase} user id matchlenmiyor.: {userid}") { }

    public WebAuthnLoginUserIsNullException(Guid userid,string message, int phase=1) : base($"Login web authn step {phase} user id matchlenmiyor.: {userid} additional message : {message}") { }

    public WebAuthnLoginUserIsNullException(Guid userid, string message, Exception inner, int phase = 1) : base($"Login web authn step {phase} user id matchlenmiyor.: {userid} additional message : {message}", inner) { }

    public WebAuthnLoginUserIsNullException(Guid userid, Exception inner, int phase=1) : base($"Login web authn step {phase} user id matchlenmiyor.: {userid}", inner) { }

}




public class WebAuthnRegisterUserIsNullException : Exception
{

    public WebAuthnRegisterUserIsNullException(Guid userid) : base($"Web authin 2. adımında gelen requestteki user idyle matchlenen user yok.: {userid}") { }

    public WebAuthnRegisterUserIsNullException(Guid userid, string message) : base($"Web authin 2. adımında gelen requestteki user idyle matchlenen user yok.: {userid} additional message : {message}") { }

    public WebAuthnRegisterUserIsNullException(Guid userid, string message, Exception inner) : base($"Web authin 2. adımında gelen requestteki user idyle matchlenen user yok.: {userid} additional message : {message}", inner) { }

    public WebAuthnRegisterUserIsNullException(Guid userid, Exception inner ) : base($"Web authin 2. adımında gelen requestteki user idyle matchlenen user yok.: {userid}", inner) {} 
}



public class WebAuthnCredIsNullException : Exception
{
    public WebAuthnCredIsNullException() : base($"") { }
    public WebAuthnCredIsNullException(string message) : base(message) { }

    public WebAuthnCredIsNullException(string message, Exception inner) : base(message, inner) { }

}

public class DeviceMismatchException : Exception
{

    public DeviceMismatchException() : base("Device mismatch exception happened, remove your allowed devices and try again or consult an admin.") { }

    public DeviceMismatchException(string message) : base(message) { }

    public DeviceMismatchException(string message, Exception inner) : base(message, inner) { }




}

public class DeviceAlreadyRegisteredException : Exception {

    public DeviceAlreadyRegisteredException() : base("Device already registered.") { }

    public DeviceAlreadyRegisteredException(string message) : base(message) { }

    public DeviceAlreadyRegisteredException(string message, Exception inner) : base(message, inner) { }

}


public class WebAuthnResetUserIsNullException : Exception
{
    public WebAuthnResetUserIsNullException(Guid userid, int phase = 1) : base($"User with id {userid} is returned null in phase {phase}.") { }

    public WebAuthnResetUserIsNullException(Guid userid, Exception inner, int phase = 1) : base($"User with id {userid} is returned null in phase {phase}.", inner) { }

}

public class WebAuthnOTPReturnedNullFromCacheException : Exception
{
    public WebAuthnOTPReturnedNullFromCacheException() : base("OTP returned null from cache.") { }

    public WebAuthnOTPReturnedNullFromCacheException(Exception ex) : base("OTP returned null from cache.", ex) { }


}

public class OTPMismatchedException : Exception
{ 
    public OTPMismatchedException() : base("OTP mismatch.") { }

    public OTPMismatchedException(Exception ex) : base("OTP mismatch.", ex) { }


}


public class RemoveDeviceAttemptsExceededException : Exception
{
    public RemoveDeviceAttemptsExceededException() : base("Remove device attempts exceeded.(Only 5 attempts allowed)") { }

    public RemoveDeviceAttemptsExceededException(Exception ex) : base("Remove device attempts exceeded.(Only 5 attempts allowed try again.)", ex) { }


}

public class EnrollRequestNullException : Exception
{
    public EnrollRequestNullException() : base("Enroll request cannot be null.") { }

    public EnrollRequestNullException(string message) : base(message) { }

    public EnrollRequestNullException(Exception ex) : base("Enroll request is null in enroll by invite.", ex) { }
}

public class StudentNotInRosterException : Exception
{
    public StudentNotInRosterException(string name, string gtuid) : base($"Student: {name} with GTU id: {gtuid} is not in roster.") { }

    public StudentNotInRosterException() : base("Student is not in roster.") { }

    public StudentNotInRosterException(string message) : base(message) { }

}