
namespace GtuAttendance.Infrastructure.Errors;

public class Unauthorized : Exception
{
    public Unauthorized(string controllerroute) : base("Unauthorized acces tried to " + controllerroute + ".") { }
    
    public Unauthorized() : base("Unauthorized acces.") { }

}