using GtuAttendance.Core.Entities;
using Microsoft.EntityFrameworkCore;

namespace GtuAttendance.Infrastructure.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users { get; set; }
    public DbSet<StudentProfile> StudentProfiles { get; set; }
    public DbSet<TeacherProfile> TeacherProfiles { get; set; }
    public DbSet<WebAuthnCredential> WebAuthnCredentials { get; set; }
    public DbSet<Course> Courses { get; set; }
    public DbSet<CourseRoster> CourseRosters { get; set; }
    public DbSet<CourseEnrollment> CourseEnrollments { get; set; }
    public DbSet<AttendanceSession> AttendanceSessions { get; set; }
    public DbSet<AttendanceRecord> AttendanceRecords { get; set; }
    public DbSet<TeacherInvite> TeacherInvites { get; set; }
    public DbSet<CourseSchedule> CourseSchedules { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<User>(e =>
        {
            e.HasKey(x => x.UserId);
            e.HasIndex(x => x.Email).IsUnique();
            e.Property(x => x.Email).HasMaxLength(255).IsRequired();
            e.Property(x => x.PasswordHash).HasMaxLength(512).IsRequired();
            e.Property(x => x.FullName).HasMaxLength(255).IsRequired();
        });

        modelBuilder.Entity<StudentProfile>(e =>
        {
            e.HasKey(x => x.UserId);
            e.Property(x => x.GtuStudentId).HasMaxLength(50).IsRequired();
            e.HasIndex(x => x.GtuStudentId).IsUnique();
            e.HasOne(x => x.User)
            .WithOne()
            .HasForeignKey<StudentProfile>(x => x.UserId)
            .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<TeacherProfile>(e =>
        {
            e.HasKey(x => x.UserId);
            e.HasOne(x => x.User)
            .WithOne()
            .HasForeignKey<TeacherProfile>(x => x.UserId)
            .OnDelete(DeleteBehavior.Cascade);
        });

        // WebAuthnCredential → User
modelBuilder.Entity<WebAuthnCredential>(e =>
{
    e.HasKey(x => x.Id);
    e.Property(x => x.CredentialId).IsRequired();
    e.Property(x => x.PublicKey).IsRequired();
    e.Property(x => x.UserHandle).IsRequired();
    e.Property(x => x.DeviceName).HasMaxLength(255);
    e.Property(x => x.Transports).HasMaxLength(255);
    e.Property(x => x.CredentialType).HasMaxLength(255).IsRequired();

    e.HasOne(x => x.User)
     .WithMany(u => u.Credentials)
     .HasForeignKey(x => x.UserId)
     .OnDelete(DeleteBehavior.Cascade);

    e.HasIndex(x => x.CredentialId).IsUnique();
});

// Course → TeacherId (User FK)
modelBuilder.Entity<Course>(e =>
{
    e.HasKey(x => x.CourseId);
    e.HasIndex(x => x.InvitationToken).IsUnique();
    e.Property(x => x.CourseName).HasMaxLength(255).IsRequired();
    e.Property(x => x.CourseCode).HasMaxLength(50).IsRequired();
    e.Property(x => x.InvitationToken).HasMaxLength(128).IsRequired();

    // Navigation zorunlu değil; FK-only map
    e.HasOne(x => x.Teacher)
     .WithMany()
     .HasForeignKey(x => x.TeacherId)
     .OnDelete(DeleteBehavior.Restrict);
});

// CourseRoster (aynı)
modelBuilder.Entity<CourseRoster>(e =>
{
    e.HasKey(x => x.RosterId);
    e.HasIndex(x => new { x.CourseId, x.GtuStudentId }).IsUnique();
    e.Property(x => x.GtuStudentId).HasMaxLength(50).IsRequired();
    e.Property(x => x.FullName).HasMaxLength(255).IsRequired();

    e.HasOne(x => x.Course)
     .WithMany(c => c.Roster)
     .HasForeignKey(x => x.CourseId)
     .OnDelete(DeleteBehavior.Cascade);
});

// CourseEnrollment → StudentId (User FK)
modelBuilder.Entity<CourseEnrollment>(e =>
{
    e.HasKey(x => x.EnrollmentId);
    e.HasIndex(x => new { x.CourseId, x.StudentId }).IsUnique();

    e.HasOne(x => x.Course)
     .WithMany(c => c.Enrollments)
     .HasForeignKey(x => x.CourseId)
     .OnDelete(DeleteBehavior.Cascade);

    e.HasOne(x => x.Student)
     .WithMany()
     .HasForeignKey(x => x.StudentId)
     .OnDelete(DeleteBehavior.Cascade);
});

// AttendanceSession (aynı; TeacherId -> User)
modelBuilder.Entity<AttendanceSession>(e =>
{
    e.HasKey(x => x.SessionId);
    e.HasIndex(x => x.QRCodeToken).IsUnique();
    e.Property(x => x.QRCodeToken).HasMaxLength(128).IsRequired();
    e.Property(x => x.TeacherLatitude).HasPrecision(10, 8);
    e.Property(x => x.TeacherLongitude).HasPrecision(11, 8);
    e.Property(x => x.Secret).IsRequired();
    e.Property(x => x.CodeStepSeconds).HasDefaultValue(30);

    e.HasOne(x => x.Course)
     .WithMany(c => c.Sessions)
     .HasForeignKey(x => x.CourseId)
     .OnDelete(DeleteBehavior.Cascade);

    e.HasOne(x => x.Teacher)
     .WithMany()
     .HasForeignKey(x => x.TeacherId)
     .OnDelete(DeleteBehavior.Restrict);
});

// AttendanceRecord → StudentId (User FK)
modelBuilder.Entity<AttendanceRecord>(e =>
{
    e.HasKey(x => x.AttendanceId);
    e.HasIndex(x => new { x.SessionId, x.StudentId }).IsUnique();
    e.Property(x => x.StudentLatitude).HasPrecision(10, 8);
    e.Property(x => x.StudentLongitude).HasPrecision(11, 8);
    e.Property(x => x.DistanceFromTeacherMeters).HasPrecision(10, 2);

    e.HasOne(x => x.Session)
     .WithMany(s => s.AttendanceRecords)
     .HasForeignKey(x => x.SessionId)
     .OnDelete(DeleteBehavior.Cascade);

    e.HasOne(x => x.Course)
     .WithMany()
     .HasForeignKey(x => x.CourseId)
     .OnDelete(DeleteBehavior.Restrict);

    e.HasOne(x => x.Student)
     .WithMany()
     .HasForeignKey(x => x.StudentId)
     .OnDelete(DeleteBehavior.Restrict);

    e.HasOne(x => x.DeviceCredential)
     .WithMany()
     .HasForeignKey(x => x.DeviceCredentialId)
     .OnDelete(DeleteBehavior.Restrict);
});

// TeacherInvite (aynı)
    modelBuilder.Entity<TeacherInvite>(e =>
    {
        e.HasKey(x => x.Id);
        e.Property(x => x.Token).HasMaxLength(128).IsRequired();
        e.HasIndex(x => x.Token).IsUnique();
        e.Property(x => x.EmailDomain).HasMaxLength(255);
        e.Property(x => x.UsedCount).HasDefaultValue(0);
        e.Property(x => x.IsActive).HasDefaultValue(true);
        e.Property(x => x.IsActive).HasDefaultValue(true);
    });

    // CourseSchedule
    modelBuilder.Entity<CourseSchedule>(e =>
    {
        e.HasKey(x => x.Id);
        e.Property(x => x.StartTime).IsRequired();
        e.Property(x => x.EndTime).IsRequired();
        e.Property(x => x.DayOfWeek).IsRequired();

        e.HasOne(x => x.Course)
         .WithMany(c => c.Schedules)
         .HasForeignKey(x => x.CourseId)
         .OnDelete(DeleteBehavior.Cascade);
    });
    }
}
