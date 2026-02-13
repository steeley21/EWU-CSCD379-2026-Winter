namespace Hivefall_Api.Dto;

public record CreateReviewDto(
    string? Name,
    int Rating = 5,
    string? Comment = null
);