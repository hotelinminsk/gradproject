using GtuAttendance.Core.Entities;
using Microsoft.EntityFrameworkCore;

namespace GtuAttendance.Infrastructure.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users { get; set; }
    public DbSet<Student> Students { get; set; }
    public DbSet<Teacher> Teachers { get; set; }
    public DbSet<WebAuthnCredential> WebAuthnCredentials { get; set; }
    public DbSet<Course> Courses { get; set; }
    public DbSet<CourseRoster> CourseRosters { get; set; }
    public DbSet<CourseEnrollment> CourseEnrollments { get; set; }
    public DbSet<AttendanceSession> AttendanceSessions { get; set; }
    public DbSet<AttendanceRecord> AttendanceRecords { get; set; }
    public DbSet<TeacherInvite> TeacherInvites { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // User inheritance (TPH - Table Per Hierarchy)
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.UserId);
            entity.HasIndex(e => e.Email).IsUnique();
            entity.Property(e => e.Email).HasMaxLength(255).IsRequired();
            entity.Property(e => e.PasswordHash).HasMaxLength(512).IsRequired();
            entity.Property(e => e.FullName).HasMaxLength(255).IsRequired();

            // Discriminator for inheritance
            entity.HasDiscriminator<string>("UserType")
                .HasValue<Student>("Student")
                .HasValue<Teacher>("Teacher");

            entity.Property(x => x.GtuStudentId).HasMaxLength(50).IsRequired(false);
        });

        // Student specific
        modelBuilder.Entity<Student>(entity =>
        {
            entity.HasIndex(e => e.GtuStudentId).IsUnique();
            entity.Property(e => e.GtuStudentId).HasMaxLength(50).IsRequired();
        });


        modelBuilder.Entity<WebAuthnCredential>(entity =>
        {

            entity.HasKey(e => e.Id);
            entity.Property(e => e.CredentialId).IsRequired();
            entity.Property(e => e.PublicKey).IsRequired();
            entity.Property(e => e.UserHandle).IsRequired();
            entity.Property(e => e.DeviceName).HasMaxLength(255);
            entity.Property(e => e.Transports).HasMaxLength(255);
            entity.Property(e => e.CredentialType).HasMaxLength(255).IsRequired();

            entity.HasOne(e => e.User).
                WithMany(u => u.Credentials).
                HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(e => e.CredentialId).IsUnique();


        });
        
        // Course
        modelBuilder.Entity<Course>(entity =>
        {
            entity.HasKey(e => e.CourseId);
            entity.HasIndex(e => e.InvitationToken).IsUnique();
            entity.Property(e => e.CourseName).HasMaxLength(255).IsRequired();
            entity.Property(e => e.CourseCode).HasMaxLength(50).IsRequired();
            entity.Property(e => e.InvitationToken).HasMaxLength(128).IsRequired();

            entity.HasOne(e => e.Teacher)
                .WithMany(t => t.CreatedCourses)
                .HasForeignKey(e => e.TeacherId)
                .OnDelete(DeleteBehavior.Restrict);

        });

        // CourseRoster
        modelBuilder.Entity<CourseRoster>(entity =>
        {
            entity.HasKey(e => e.RosterId);
            entity.HasIndex(e => new { e.CourseId, e.GtuStudentId }).IsUnique();
            entity.Property(e => e.GtuStudentId).HasMaxLength(50).IsRequired();
            entity.Property(e => e.FullName).HasMaxLength(255).IsRequired();

            entity.HasOne(e => e.Course)
                .WithMany(c => c.Roster)
                .HasForeignKey(e => e.CourseId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // CourseEnrollment
        modelBuilder.Entity<CourseEnrollment>(entity =>
        {
            entity.HasKey(e => e.EnrollmentId);
            entity.HasIndex(e => new { e.CourseId, e.StudentId }).IsUnique();

            entity.HasOne(e => e.Course)
                .WithMany(c => c.Enrollments)
                .HasForeignKey(e => e.CourseId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Student)
                .WithMany(s => s.Enrollments)
                .HasForeignKey(e => e.StudentId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // AttendanceSession
        modelBuilder.Entity<AttendanceSession>(entity =>
        {
            entity.HasKey(e => e.SessionId);
            entity.HasIndex(e => e.QRCodeToken).IsUnique();
            entity.Property(e => e.QRCodeToken).HasMaxLength(128).IsRequired();
            entity.Property(e => e.TeacherLatitude).HasPrecision(10, 8);
            entity.Property(e => e.TeacherLongitude).HasPrecision(11, 8);
            entity.Property(e => e.Secret).IsRequired();
            entity.Property(e => e.CodeStepSeconds).HasDefaultValue(30);

            entity.HasOne(e => e.Course)
                .WithMany(c => c.Sessions)
                .HasForeignKey(e => e.CourseId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Teacher)
                .WithMany(t => t.AttendanceSessions)
                .HasForeignKey(e => e.TeacherId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // AttendanceRecord
        modelBuilder.Entity<AttendanceRecord>(entity =>
        {
            entity.HasKey(e => e.AttendanceId);
            entity.HasIndex(e => new { e.SessionId, e.StudentId }).IsUnique();
            entity.Property(e => e.StudentLatitude).HasPrecision(10, 8);
            entity.Property(e => e.StudentLongitude).HasPrecision(11, 8);
            entity.Property(e => e.DistanceFromTeacherMeters).HasPrecision(10, 2);

            entity.HasOne(e => e.Session)
                .WithMany(s => s.AttendanceRecords)
                .HasForeignKey(e => e.SessionId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Course)
                .WithMany()
                .HasForeignKey(e => e.CourseId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.Student)
                .WithMany(s => s.AttendanceRecords)
                .HasForeignKey(e => e.StudentId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.DeviceCredential)
                .WithMany()
                .HasForeignKey(e => e.DeviceCredentialId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // TeacherInvite
        modelBuilder.Entity<TeacherInvite>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Token).HasMaxLength(128).IsRequired();
            entity.HasIndex(e => e.Token).IsUnique();
            entity.Property(e => e.EmailDomain).HasMaxLength(255);
            entity.Property(e => e.UsedCount).HasDefaultValue(0);
            entity.Property(e => e.IsActive).HasDefaultValue(true);
        });
    }
}
