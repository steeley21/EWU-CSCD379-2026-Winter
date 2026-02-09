using Hivefall_Api.Dto;

namespace Hivefall_Api.Services;

public interface ILeaderboardService
{
    Task<RunResultDto> SubmitAsync(CreateRunResultDto dto);
    Task<IReadOnlyList<RunResultDto>> GetTopAsync(int limit);
}