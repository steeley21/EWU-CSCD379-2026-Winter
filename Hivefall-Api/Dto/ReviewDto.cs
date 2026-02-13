namespace Hivefall_Api.Dto;

public record ReviewDto(
    int Id,
    string Name,
    int Rating,
    string? Comment,
    DateTime CreatedAtUtc
);