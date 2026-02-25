using System.ComponentModel.DataAnnotations;

namespace BookClubApp.Models;

public class ForumReply
{
    [Key]
    public int FrId { get; set; }
    public int PostID { get; set; }
    public string UserID { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ForumPost Post { get; set; } = null!;
    public ApplicationUser User { get; set; } = null!;
}