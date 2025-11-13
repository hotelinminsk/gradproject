namespace GtuAttendance.Infrastructure.Errors;


public class ProfileNotFoundException : Exception
{
    public ProfileNotFoundException(Guid id, string role) : base($"Profile not found for user : {id} with role : {role}")
    {
        
    }
}