using GtuAttendance.Infrastructure.Data;
using GtuAttendance.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using GtuAttendance.Core.Entities;

var builder = WebApplication.CreateBuilder(args);


// Controllers
builder.Services.AddControllers();
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

// Database
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// Services
builder.Services.AddScoped<JWTService>();
builder.Services.AddScoped<PasswordService>();
builder.Services.AddScoped<Fido2Service>();

builder.Services.AddHealthChecks();

builder.Services.AddMemoryCache();

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
    });

builder.Services.AddAuthorization();

builder.Services.AddAuthorization(o =>
{
    o.AddPolicy("AdminOnly", p => p.RequireRole("Admin"));
});


// CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:3000", "https://localhost:3000")
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
// Serve static files from wwwroot (for local test pages)
app.UseStaticFiles();
app.UseCors("AllowFrontend");

app.Use(async (ctx, next) =>
{
    if (ctx.Request.Path.StartsWithSegments("/api/admin", StringComparison.OrdinalIgnoreCase))
    {
        var keyHeader = ctx.Request.Headers["X-Admin-Key"].FirstOrDefault();
        var expected = builder.Configuration["Admin:Key"];
        var isAdmin = ctx.User?.IsInRole("Admin") ?? false;

        if (string.IsNullOrWhiteSpace(expected) || keyHeader != expected || !isAdmin)
        {
            ctx.Response.StatusCode = StatusCodes.Status401Unauthorized;
            await ctx.Response.WriteAsJsonAsync(new { error = "Admin authorization failed." });
            return;
        }

    }

    await next();
});


app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.MapHealthChecks("/health");
app.MapHealthChecks("/health/ready");
app.MapHealthChecks("/health/live");

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    if (!await db.Users.AnyAsync(u => u.Role == "Admin"))
    {
        var email = builder.Configuration["Admin:Email"] ?? "admin@gtu.edu.tr";
        var pass = builder.Configuration["Admin:Password"] ?? "changeme123";
        var hasher = scope.ServiceProvider.GetRequiredService<PasswordService>();
        db.Users.Add(new Teacher(email: email, passhash: hasher.HashPassword(pass), fullname: "Admin"));

        db.ChangeTracker.Entries<User>().Last().Entity.Role = "Admin";
        await db.SaveChangesAsync();
    }
}


app.Run();
