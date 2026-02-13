using System.ComponentModel.DataAnnotations;

namespace Hivefall_Api.Models;

public class ReviewEntity
{
    public int Id { get; set; }

    [MaxLength(32)]
    public string Name { get; set; } = "Anonymous";

    // Hivefall accepts 5-star reviews only 😄
    public int Rating { get; set; } = 5;

    [MaxLength(280)]
    public string? Comment { get; set; }

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
}