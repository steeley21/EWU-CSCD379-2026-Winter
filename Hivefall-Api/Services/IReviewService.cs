using Hivefall_Api.Dto;

namespace Hivefall_Api.Services;

public interface IReviewService
{
    Task<ReviewDto> SubmitAsync(CreateReviewDto dto);
    Task<IReadOnlyList<ReviewDto>> GetTopAsync(int limit);
    Task<int> GetTotalCountAsync();
    Task<double> GetAverageRatingAsync();
}