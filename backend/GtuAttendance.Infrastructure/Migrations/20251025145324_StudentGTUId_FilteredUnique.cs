using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GtuAttendance.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class StudentGTUId_FilteredUnique : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Users_GtuStudentId",
                table: "Users");

            migrationBuilder.AlterColumn<string>(
                name: "GtuStudentId",
                table: "Users",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(50)",
                oldMaxLength: 50);

            migrationBuilder.CreateIndex(
                name: "IX_Users_GtuStudentId",
                table: "Users",
                column: "GtuStudentId",
                unique: true,
                filter: "[UserType] = 'Student' AND [GtuStudentId] IS NOT NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Users_GtuStudentId",
                table: "Users");

            migrationBuilder.AlterColumn<string>(
                name: "GtuStudentId",
                table: "Users",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "nvarchar(50)",
                oldMaxLength: 50,
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Users_GtuStudentId",
                table: "Users",
                column: "GtuStudentId",
                unique: true);
        }
    }
}
