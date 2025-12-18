using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GtuAttendance.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddFirstSessionAt : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "FirstSessionAt",
                table: "Courses",
                type: "datetime2",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "FirstSessionAt",
                table: "Courses");
        }
    }
}
