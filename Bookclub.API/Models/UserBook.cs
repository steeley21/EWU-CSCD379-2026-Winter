using System.ComponentModel.DataAnnotations;

namespace BookClubApp.Models;

public enum ReadingStatus
{
    WantToRead = 0,
    Reading = 1,
    Finished = 2,
}

public class UserBook
{
    [Key]
    public int UBId { get; set; }

    [Required]
    public string UserID { get; set; } = string.Empty;

    [Required]
    public int BId { get; set; }

    public ReadingStatus Status { get; set; } = ReadingStatus.WantToRead;

    /// <summary>Personal rating 1–5, null if unrated.</summary>
    public decimal? Rating { get; set; }

    public DateTime AddedAt { get; set; } = DateTime.UtcNow;

    // ── Navigation ────────────────────────────────────────────
    public ApplicationUser User { get; set; } = null!;
    public Book Book { get; set; } = null!;
}