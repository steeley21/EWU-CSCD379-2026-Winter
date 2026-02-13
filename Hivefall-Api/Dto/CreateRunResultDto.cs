// Dto/CreateRunResultDto.cs
namespace Hivefall_Api.Dto;

public record CreateRunResultDto(
    string PlayerName,
    bool Won,
    int MoveCount,
    int InfectedCount
);