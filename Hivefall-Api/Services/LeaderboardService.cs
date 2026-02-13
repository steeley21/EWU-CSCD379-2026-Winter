// Services/LeaderboardService.cs
using Hivefall_Api.Data;
using Hivefall_Api.Dto;
using Hivefall_Api.Models;
using Microsoft.EntityFrameworkCore;

namespace Hivefall_Api.Services;

public class LeaderboardService : ILeaderboardService
{
    private readonly HivefallDbContext _db;

    public LeaderboardService(HivefallDbContext db)
    {
        _db = db;
    }

    public async Task<RunResultDto> SubmitAsync(CreateRunResultDto dto)
    {
        // Minimal validation / normalization
        var name = string.IsNullOrWhiteSpace(dto.PlayerName) ? "Player" : dto.PlayerName.Trim();
        if (name.Length > 32) name = name[..32];

        var moveCount = Math.Max(0, dto.MoveCount);
        var infectedCount = Math.Max(0, dto.InfectedCount);

        var entity = new RunResultEntity
        {
            PlayerName = name,
            Won = dto.Won,
            MoveCount = moveCount,
            InfectedCount = infectedCount,
            FinishedAtUtc = DateTime.UtcNow
        };

        _db.RunResults.Add(entity);
        await _db.SaveChangesAsync();

        return new RunResultDto(
            entity.Id,
            entity.PlayerName,
            entity.Won,
            entity.MoveCount,
            entity.InfectedCount,
            entity.FinishedAtUtc
        );
    }

    public async Task<IReadOnlyList<RunResultDto>> GetTopAsync(int limit)
    {
        if (limit <= 0) limit = 25;
        if (limit > 100) limit = 100;

        // Simple scoring rule for now:
        // wins first, then lower moveCount is better, then most recent
        var rows = await _db.RunResults
            .AsNoTracking()
            .OrderByDescending(r => r.Won)
            .ThenBy(r => r.MoveCount)
            .ThenByDescending(r => r.FinishedAtUtc)
            .Take(limit)
            .Select(r => new RunResultDto(
                r.Id,
                r.PlayerName,
                r.Won,
                r.MoveCount,
                r.InfectedCount,
                r.FinishedAtUtc
            ))
            .ToListAsync();

        return rows;
    }
}
