using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BookClubApp.Models;

public class GroupBookReview
{
    [Key]
    public int ReviewId { get; set; }

    [Required]
    public int GBID { get; set; }

    [Required]
    public string UserID { get; set; } = string.Empty;

    public decimal Rating { get; set; } // validate in controller: 0..5

    [MaxLength(2000)]
    public string? Comment { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    [ForeignKey(nameof(GBID))]
    public GroupBook GroupBook { get; set; } = null!;

    [ForeignKey(nameof(UserID))]
    public ApplicationUser User { get; set; } = null!;
}