using GtuAttendance.Infrastructure.Data;
using GtuAttendance.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using GtuAttendance.Core.Entities;
using Microsoft.Data.SqlClient;

var builder = WebApplication.CreateBuilder(args);


// Controllers (enforce HTTPS at MVC level too)
builder.Services.AddControllers(options =>
{
    options.Filters.Add(new Microsoft.AspNetCore.Mvc.RequireHttpsAttribute());
});
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { Title = "GT� Attendance API", Version = "v1" });

    // JWT Authentication i�in Swagger ayarlar�
    c.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Example: \"Bearer {token}\"",
        Name = "Authorization",
        In = Microsoft.OpenApi.Models.ParameterLocation.Header,
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    c.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
    {
        {
            new Microsoft.OpenApi.Models.OpenApiSecurityScheme
            {
                Reference = new Microsoft.OpenApi.Models.OpenApiReference
                {
                    Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

// Database // ADDED RETRIES FOR DATABASE CONNECTION BUILDER
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection"), sql => sql.EnableRetryOnFailure(5,TimeSpan.FromSeconds(2), null)));

// Services
builder.Services.AddScoped<JWTService>();
builder.Services.AddScoped<PasswordService>();
builder.Services.AddScoped<Fido2Service>();


builder.Services.AddHealthChecks();

builder.Services.AddMemoryCache();

// Explicit HTTPS redirection port (helps when behind compose)
builder.Services.AddHttpsRedirection(o =>
{
    var httpsPort = Environment.GetEnvironmentVariable("ASPNETCORE_HTTPS_PORT");
    if (int.TryParse(httpsPort, out var port)) o.HttpsPort = port; else o.HttpsPort = 8443;
});

// JWT Authentication
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Secret"]!)),
            ClockSkew = TimeSpan.Zero
        };
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = ctx =>
            {
                var accessToken = ctx.Request.Query["access_token"];
                var path =ctx.HttpContext.Request.Path;
                if(!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs/attendance"))
                {
                    ctx.Token = accessToken;
                }
                return Task.CompletedTask;
            }
        };
    });

 builder.Services.AddAuthorization();

 builder.Services.AddAuthorization(o =>
 {
     o.AddPolicy("AdminOnly", p => p.RequireRole("Admin"));
 });

 builder.Services.AddSignalR();


// CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:3000",
                "https://localhost:3000",
                "http://127.0.0.1:5173",
                "http://localhost:5173",
                "https://localhost:5173")
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
    });
});

var app = builder.Build();

// Middleware
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
// Use HSTS in non-development
if (!app.Environment.IsDevelopment())
{
    app.UseHsts();
}
// Serve static files from wwwroot (for local test pages)
app.UseStaticFiles();
app.UseCors("AllowFrontend");

// Admin protection is handled via [Authorize(Policy = "AdminOnly")] and [RequireAdminKey] attributes


app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapHub<GtuAttendance.Api.Hubs.AttendanceHub>("/hubs/attendance");

app.MapHealthChecks("/health");
app.MapHealthChecks("/health/ready");
app.MapHealthChecks("/health/live");

using (var scope = app.Services.CreateScope())
{
     var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    for (var attempt = 1; attempt <= 10; attempt++)
    {
        try
        {
            await db.Database.MigrateAsync();
            break;
        }
        catch (SqlException ex) when (ex.Number is 1801 or 4060 or 18456) // already exists / cannot open DB / login
        {
            await Task.Delay(2000);
            if (attempt == 10) throw;
        }
    }
    if (!await db.Users.AnyAsync(u => u.Role == "Admin"))
    {
        var email = builder.Configuration["Admin:Email"] ?? "admin@gtu.edu.tr";
        var pass = builder.Configuration["Admin:Password"] ?? "changeme123";
        var hasher = scope.ServiceProvider.GetRequiredService<PasswordService>();
        var admin = new User(email: email, passwordhash: hasher.HashPassword(pass), fullname: "Admin", gtuid: null, role: "Admin");
        db.Users.Add(admin);
        await db.SaveChangesAsync();
    }
}


app.Run();
