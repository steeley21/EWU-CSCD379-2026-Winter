// /Dto/RunResultDto.cs
namespace Hivefall_Api.Dto;

public record RunResultDto(
    int Id,
    string PlayerName,
    bool Won,
    int MoveCount,
    int InfectedCount,
    DateTime FinishedAtUtc
);