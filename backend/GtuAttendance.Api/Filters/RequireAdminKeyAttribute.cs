using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.AspNetCore.Mvc;


namespace GtuAttendance.Api.Filters;
public class RequireAdminKey : Attribute, IAuthorizationFilter
{
    public void OnAuthorization(AuthorizationFilterContext context)
    {
        //şuan configden alıyor, bunu prodda secretten aldırmamız lazım
        var cfg = context.HttpContext.RequestServices.GetRequiredService<IConfiguration>();
        var expected = cfg["Admin:Key"];
        var provided = context.HttpContext.Request.Headers["X-Admin-Key"].ToString();

        if (string.IsNullOrWhiteSpace(expected) || provided != expected)
        {
            context.Result = new UnauthorizedObjectResult(new { error = "Admin key invalid." });
        }
    }
}