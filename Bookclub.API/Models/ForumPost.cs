using System.ComponentModel.DataAnnotations;

namespace BookClubApp.Models;

public class ForumPost
{
    [Key]
    public int FpId { get; set; }
    public int GroupID { get; set; }
    public string UserID { get; set; } = string.Empty;  
    public string Category { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Group Group { get; set; } = null!;
    public ApplicationUser User { get; set; } = null!;
    public ICollection<ForumReply> Replies { get; set; } = new List<ForumReply>();
}