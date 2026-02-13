// /Hivefall-Api.Tests/HivefallApiFactory.cs 
using System.Net;
using System.Net.Http.Json;
using Hivefall_Api.Dto;
using Hivefall_Api.Tests.TestHelpers;
using Xunit;

namespace Hivefall_Api.Tests;

public class LeaderboardControllerTests
{
    private sealed record LeaderboardEnvelope(IReadOnlyList<RunResultDto> entries, DateTime serverTimeUtc);

    [Fact]
    public async Task Post_Then_Get_Returns_Inserted_Row()
    {
        using var factory = new HivefallApiFactory();
        using var client = factory.CreateClient();

        var post = await client.PostAsJsonAsync("/api/Leaderboard", new
        {
            playerName = "Kate",
            won = true,
            moveCount = 12,
            infectedCount = 3
        });

        Assert.Equal(HttpStatusCode.Created, post.StatusCode);

        var created = await post.Content.ReadFromJsonAsync<RunResultDto>();
        Assert.NotNull(created);
        Assert.True(created!.Id > 0);
        Assert.Equal("Kate", created.PlayerName);

        var get = await client.GetAsync("/api/Leaderboard?limit=25");
        Assert.Equal(HttpStatusCode.OK, get.StatusCode);

        var payload = await get.Content.ReadFromJsonAsync<LeaderboardEnvelope>();
        Assert.NotNull(payload);
        Assert.Contains(payload!.entries, e => e.Id == created.Id);
    }

    [Fact]
    public async Task Get_Respects_Limit()
    {
        using var factory = new HivefallApiFactory();
        using var client = factory.CreateClient();

        for (var i = 0; i < 3; i++)
        {
            var post = await client.PostAsJsonAsync("/api/Leaderboard", new
            {
                playerName = $"P{i}",
                won = true,
                moveCount = i,
                infectedCount = 0
            });

            Assert.Equal(HttpStatusCode.Created, post.StatusCode);
        }

        var get = await client.GetAsync("/api/Leaderboard?limit=2");
        Assert.Equal(HttpStatusCode.OK, get.StatusCode);

        var payload = await get.Content.ReadFromJsonAsync<LeaderboardEnvelope>();
        Assert.NotNull(payload);
        Assert.True(payload!.entries.Count <= 2);
    }
}
