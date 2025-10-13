using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AstraTradeAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddAdvertisementModerationFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "ModeratedByUserID",
                table: "Advertisements",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ModerationDate",
                table: "Advertisements",
                type: "datetime(6)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RejectionReason",
                table: "Advertisements",
                type: "varchar(500)",
                maxLength: 500,
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ModeratedByUserID",
                table: "Advertisements");

            migrationBuilder.DropColumn(
                name: "ModerationDate",
                table: "Advertisements");

            migrationBuilder.DropColumn(
                name: "RejectionReason",
                table: "Advertisements");
        }
    }
}
