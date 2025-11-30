using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GtuAttendance.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddEnrollmentDropFieldsNew : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "DroppedAtUtc",
                table: "CourseEnrollments",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "DroppedByTeacherId",
                table: "CourseEnrollments",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsDropped",
                table: "CourseEnrollments",
                type: "bit",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DroppedAtUtc",
                table: "CourseEnrollments");

            migrationBuilder.DropColumn(
                name: "DroppedByTeacherId",
                table: "CourseEnrollments");

            migrationBuilder.DropColumn(
                name: "IsDropped",
                table: "CourseEnrollments");
        }
    }
}
