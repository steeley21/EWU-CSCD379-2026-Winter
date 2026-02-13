using Hivefall_Api.Data;
using Hivefall_Api.Dto;
using Hivefall_Api.Models;
using Microsoft.EntityFrameworkCore;

namespace Hivefall_Api.Services;

public class ReviewService : IReviewService
{
    private readonly HivefallDbContext _db;

    public ReviewService(HivefallDbContext db)
    {
        _db = db;
    }

    public async Task<ReviewDto> SubmitAsync(CreateReviewDto dto)
    {
        if (dto.Rating != 5)
        {
            throw new ArgumentException("Hivefall only accepts 5-star reviews.");
        }

        var name = string.IsNullOrWhiteSpace(dto.Name) ? "Anonymous" : dto.Name.Trim();
        if (name.Length > 32) name = name[..32];

        string? comment = null;
        if (!string.IsNullOrWhiteSpace(dto.Comment))
        {
            comment = dto.Comment.Trim();
            if (comment.Length > 280) comment = comment[..280];
            if (comment.Length == 0) comment = null;
        }

        var entity = new ReviewEntity
        {
            Name = name,
            Rating = 5,
            Comment = comment,
            CreatedAtUtc = DateTime.UtcNow
        };

        _db.Reviews.Add(entity);
        await _db.SaveChangesAsync();

        return new ReviewDto(entity.Id, entity.Name, entity.Rating, entity.Comment, entity.CreatedAtUtc);
    }

    public async Task<IReadOnlyList<ReviewDto>> GetTopAsync(int limit)
    {
        if (limit <= 0) limit = 5;
        if (limit > 100) limit = 100;

        var rows = await _db.Reviews
            .AsNoTracking()
            .OrderByDescending(r => r.Rating)
            .ThenByDescending(r => r.CreatedAtUtc)
            .ThenByDescending(r => r.Id)
            .Take(limit)
            .Select(r => new ReviewDto(r.Id, r.Name, r.Rating, r.Comment, r.CreatedAtUtc))
            .ToListAsync();

        return rows;
    }

    public Task<int> GetTotalCountAsync()
        => _db.Reviews.AsNoTracking().CountAsync();

    public async Task<double> GetAverageRatingAsync()
    {
        var count = await _db.Reviews.AsNoTracking().CountAsync();
        if (count == 0) return 0;

        return await _db.Reviews.AsNoTracking().AverageAsync(r => (double)r.Rating);
    }
}
