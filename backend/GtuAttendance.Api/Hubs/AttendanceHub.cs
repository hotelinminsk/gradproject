using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using GtuAttendance.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace GtuAttendance.Api.Hubs
{
    [Authorize]
    public class AttendanceHub : Hub
    {
        private readonly AppDbContext _db;

        private bool IsTeacher => Context.User?.IsInRole("Teacher") == true;
        private bool IsStudent => Context.User?.IsInRole("Student") == true;


        public AttendanceHub(AppDbContext db)
        {
            _db = db;
        }

        private Guid? GetUserId()
        {
            var id = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value
                     ?? Context.User?.FindFirst("sub")?.Value;
            return Guid.TryParse(id, out var parsed) ? parsed : (Guid?)null;
        }

        private static string CourseGroup(Guid courseId) => $"course-{courseId}";

        public async Task JoinCourseGroup(Guid courseId)
        {
            if (!IsTeacher) return;
            var teacherId = GetUserId();
            if (teacherId is null) return;

            var owns = await _db.Courses
                .AsNoTracking()
                .AnyAsync(c => c.CourseId == courseId && c.TeacherId == teacherId && c.IsActive);

            if (owns)
                await Groups.AddToGroupAsync(Context.ConnectionId, CourseGroup(courseId));
        }

        public async Task LeaveCourseGroup(Guid courseId)
        {
            if (!IsTeacher) return;
            var teacherId = GetUserId();
            if (teacherId is null) return;
            var owns = await _db.Courses
                .AsNoTracking()
                .AnyAsync(c => c.CourseId == courseId && c.TeacherId == teacherId);

            if (owns)
                await Groups.RemoveFromGroupAsync(Context.ConnectionId, CourseGroup(courseId));
        }

        public async Task JoinCourseGroupAsStudent(Guid courseId)
        {
            var studentId = GetUserId();
            if (studentId is null || !IsStudent) return;

            var enrolled = await _db.CourseEnrollments
                .AsNoTracking()
                .AnyAsync(ce => ce.CourseId == courseId &&
                                ce.StudentId == studentId &&
                                ce.IsValidated &&
                                !ce.IsDropped);

            if (enrolled)
            {
                await Groups.AddToGroupAsync(Context.ConnectionId, CourseGroup(courseId));
            }
        }

        public async Task LeaveCourseGroupAsStudent(Guid courseId)
        {
            var studentId = GetUserId();
            if (studentId is null || !IsStudent) return;

            var enrolled = await _db.CourseEnrollments
                .AsNoTracking()
                .AnyAsync(ce => ce.CourseId == courseId &&
                                ce.StudentId == studentId &&
                                ce.IsValidated &&
                                !ce.IsDropped);

            if (enrolled)
            {
                await Groups.RemoveFromGroupAsync(Context.ConnectionId, CourseGroup(courseId));
            }
        }

        public override async Task OnConnectedAsync()
        {
            var userId = GetUserId();
            if (userId is null)
            {
                await base.OnConnectedAsync();
                return;
            }

            if (IsTeacher)
            {
                var courseIds = await _db.Courses
                    .Where(c => c.TeacherId == userId && c.IsActive)
                    .Select(c => c.CourseId)
                    .ToListAsync();

                foreach (var cid in courseIds)
                {
                    await Groups.AddToGroupAsync(Context.ConnectionId, CourseGroup(cid));
                }
            }
            else if (IsStudent)
            {
                var enrolledCourseIds = await _db.CourseEnrollments
                    .Where(e => e.StudentId == userId && e.IsValidated && !e.IsDropped)
                    .Select(e => e.CourseId)
                    .ToListAsync();

                foreach (var cid in enrolledCourseIds)
                {
                    await Groups.AddToGroupAsync(Context.ConnectionId, CourseGroup(cid));
                }
            }

            await base.OnConnectedAsync();
        }
    }
}
