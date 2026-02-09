using Hivefall_Api.Data;
using Hivefall_Api.Dto;
using Hivefall_Api.Models;
using Hivefall_Api.Services;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace Hivefall_Api.Tests;

public class LeaderboardServiceTests
{
    private static (SqliteConnection conn, HivefallDbContext db) CreateDb()
    {
        var conn = new SqliteConnection("DataSource=:memory:");
        conn.Open();

        var options = new DbContextOptionsBuilder<HivefallDbContext>()
            .UseSqlite(conn)
            .Options;

        var db = new HivefallDbContext(options);
        db.Database.EnsureCreated();

        return (conn, db);
    }

    [Fact]
    public async Task SubmitAsync_Normalizes_Name_And_Clamps_Counts()
    {
        var (conn, db) = CreateDb();
        await using var _ = conn;
        await using var __ = db;

        var svc = new LeaderboardService(db);

        var dto = new CreateRunResultDto(
            PlayerName: "   Kate Steele Kate Steele Kate Steele   ",
            Won: true,
            MoveCount: -5,
            InfectedCount: -1
        );

        var created = await svc.SubmitAsync(dto);

        Assert.True(created.Id > 0);
        Assert.True(created.Won);

        Assert.Equal(0, created.MoveCount);
        Assert.Equal(0, created.InfectedCount);

        Assert.Equal(created.PlayerName.Trim(), created.PlayerName);
        Assert.True(created.PlayerName.Length <= 32);
    }

    [Fact]
    public async Task SubmitAsync_Defaults_Blank_Name_To_Player()
    {
        var (conn, db) = CreateDb();
        await using var _ = conn;
        await using var __ = db;

        var svc = new LeaderboardService(db);

        var dto = new CreateRunResultDto(
            PlayerName: "   ",
            Won: false,
            MoveCount: 3,
            InfectedCount: 2
        );

        var created = await svc.SubmitAsync(dto);

        Assert.Equal("Player", created.PlayerName);
        Assert.False(created.Won);
    }

    [Fact]
    public async Task GetTopAsync_Clamps_Limit_To_100()
    {
        var (conn, db) = CreateDb();
        await using var _ = conn;
        await using var __ = db;

        for (var i = 0; i < 110; i++)
        {
            db.RunResults.Add(new RunResultEntity
            {
                PlayerName = "P",
                Won = (i % 2 == 0),
                MoveCount = i,
                InfectedCount = 0,
                FinishedAtUtc = DateTime.UtcNow.AddMinutes(-i),
            });
        }

        await db.SaveChangesAsync();

        var svc = new LeaderboardService(db);
        var rows = await svc.GetTopAsync(1000);

        Assert.Equal(100, rows.Count);
    }

    [Fact]
    public async Task GetTopAsync_Sorts_Wins_First_Then_Lower_Moves_Then_Recent()
    {
        var (conn, db) = CreateDb();
        await using var _ = conn;
        await using var __ = db;

        // Winner but worse moves (should come after better winner)
        db.RunResults.Add(new RunResultEntity
        {
            PlayerName = "WinnerSlow",
            Won = true,
            MoveCount = 50,
            InfectedCount = 1,
            FinishedAtUtc = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc),
        });

        // Winner better moves (should be #1)
        db.RunResults.Add(new RunResultEntity
        {
            PlayerName = "WinnerFast",
            Won = true,
            MoveCount = 10,
            InfectedCount = 1,
            FinishedAtUtc = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc),
        });

        // Loser (should be after winners)
        db.RunResults.Add(new RunResultEntity
        {
            PlayerName = "Loser",
            Won = false,
            MoveCount = 1,
            InfectedCount = 1,
            FinishedAtUtc = new DateTime(2026, 2, 1, 0, 0, 0, DateTimeKind.Utc),
        });

        await db.SaveChangesAsync();

        var svc = new LeaderboardService(db);
        var rows = await svc.GetTopAsync(25);

        Assert.Equal("WinnerFast", rows[0].PlayerName);
        Assert.Equal("WinnerSlow", rows[1].PlayerName);
        Assert.Equal("Loser", rows[2].PlayerName);
    }
}
