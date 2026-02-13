// Models/RunResultEntity.cs
using System.ComponentModel.DataAnnotations;

namespace Hivefall_Api.Models;

public class RunResultEntity
{
    public int Id { get; set; }

    [MaxLength(32)]
    public string PlayerName { get; set; } = "Player";

    public bool Won { get; set; }

    public int MoveCount { get; set; }

    public int InfectedCount { get; set; }

    public DateTime FinishedAtUtc { get; set; } = DateTime.UtcNow;
}