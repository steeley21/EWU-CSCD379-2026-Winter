using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Hivefall_Api.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "RunResults",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    PlayerName = table.Column<string>(type: "TEXT", maxLength: 32, nullable: false),
                    Won = table.Column<bool>(type: "INTEGER", nullable: false),
                    MoveCount = table.Column<int>(type: "INTEGER", nullable: false),
                    InfectedCount = table.Column<int>(type: "INTEGER", nullable: false),
                    FinishedAtUtc = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RunResults", x => x.Id);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "RunResults");
        }
    }
}
