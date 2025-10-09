using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GtuAttendance.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class UpdateWebAuthnCredentials : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_AttendanceRecords_WebAuthnCredentials_DeviceCredentialId",
                table: "AttendanceRecords");

            migrationBuilder.DropPrimaryKey(
                name: "PK_WebAuthnCredentials",
                table: "WebAuthnCredentials");

            migrationBuilder.RenameColumn(
                name: "CredentialIdBytes",
                table: "WebAuthnCredentials",
                newName: "UserHandle");

            migrationBuilder.AlterColumn<byte[]>(
                name: "CredentialId",
                table: "WebAuthnCredentials",
                type: "varbinary(900)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(450)");

            migrationBuilder.AddColumn<Guid>(
                name: "Id",
                table: "WebAuthnCredentials",
                type: "uniqueidentifier",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<string>(
                name: "CredentialType",
                table: "WebAuthnCredentials",
                type: "nvarchar(255)",
                maxLength: 255,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Transports",
                table: "WebAuthnCredentials",
                type: "nvarchar(255)",
                maxLength: 255,
                nullable: true);

            migrationBuilder.AlterColumn<Guid>(
                name: "DeviceCredentialId",
                table: "AttendanceRecords",
                type: "uniqueidentifier",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(450)");

            migrationBuilder.AddPrimaryKey(
                name: "PK_WebAuthnCredentials",
                table: "WebAuthnCredentials",
                column: "Id");

            migrationBuilder.CreateIndex(
                name: "IX_WebAuthnCredentials_CredentialId",
                table: "WebAuthnCredentials",
                column: "CredentialId",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_AttendanceRecords_WebAuthnCredentials_DeviceCredentialId",
                table: "AttendanceRecords",
                column: "DeviceCredentialId",
                principalTable: "WebAuthnCredentials",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_AttendanceRecords_WebAuthnCredentials_DeviceCredentialId",
                table: "AttendanceRecords");

            migrationBuilder.DropPrimaryKey(
                name: "PK_WebAuthnCredentials",
                table: "WebAuthnCredentials");

            migrationBuilder.DropIndex(
                name: "IX_WebAuthnCredentials_CredentialId",
                table: "WebAuthnCredentials");

            migrationBuilder.DropColumn(
                name: "Id",
                table: "WebAuthnCredentials");

            migrationBuilder.DropColumn(
                name: "CredentialType",
                table: "WebAuthnCredentials");

            migrationBuilder.DropColumn(
                name: "Transports",
                table: "WebAuthnCredentials");

            migrationBuilder.RenameColumn(
                name: "UserHandle",
                table: "WebAuthnCredentials",
                newName: "CredentialIdBytes");

            migrationBuilder.AlterColumn<string>(
                name: "CredentialId",
                table: "WebAuthnCredentials",
                type: "nvarchar(450)",
                nullable: false,
                oldClrType: typeof(byte[]),
                oldType: "varbinary(900)");

            migrationBuilder.AlterColumn<string>(
                name: "DeviceCredentialId",
                table: "AttendanceRecords",
                type: "nvarchar(450)",
                nullable: false,
                oldClrType: typeof(Guid),
                oldType: "uniqueidentifier");

            migrationBuilder.AddPrimaryKey(
                name: "PK_WebAuthnCredentials",
                table: "WebAuthnCredentials",
                column: "CredentialId");

            migrationBuilder.AddForeignKey(
                name: "FK_AttendanceRecords_WebAuthnCredentials_DeviceCredentialId",
                table: "AttendanceRecords",
                column: "DeviceCredentialId",
                principalTable: "WebAuthnCredentials",
                principalColumn: "CredentialId",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
