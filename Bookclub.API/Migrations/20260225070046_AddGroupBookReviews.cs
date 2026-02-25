using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BookClubApp.Migrations
{
    /// <inheritdoc />
    public partial class AddGroupBookReviews : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "GroupBookReviews",
                columns: table => new
                {
                    ReviewId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    GBID = table.Column<int>(type: "int", nullable: false),
                    UserID = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Rating = table.Column<decimal>(type: "decimal(4,2)", precision: 4, scale: 2, nullable: false),
                    Comment = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GroupBookReviews", x => x.ReviewId);
                    table.ForeignKey(
                        name: "FK_GroupBookReviews_AspNetUsers_UserID",
                        column: x => x.UserID,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_GroupBookReviews_GroupBooks_GBID",
                        column: x => x.GBID,
                        principalTable: "GroupBooks",
                        principalColumn: "GBID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_GroupBookReviews_GBID_UserID",
                table: "GroupBookReviews",
                columns: new[] { "GBID", "UserID" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_GroupBookReviews_UserID",
                table: "GroupBookReviews",
                column: "UserID");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "GroupBookReviews");
        }
    }
}
